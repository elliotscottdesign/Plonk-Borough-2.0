#!/usr/bin/env python3
"""Recipes sprint (till lane, 8 Sep 2026).

Converts the costing sheet's machine-readable RECIPES (src/ops/data/costing.js:
ingredient ids + pours in ml + sell prices) into the bar costing engine's
shape: bar_menu_items + bar_recipe_lines, with every line joined to a REAL
bar_products row (verbatim seed names, same matcher as the cost feed).

Outputs:
  • supabase/bar_recipes_seed.sql   — idempotent seed, applied on founder token
  • src/till/data/recipesDraft.json — the review sheet shown in the till's
                                      Catalogue view (founder eyeballs drafts)

Honesty rules:
  • a recipe is only READY if every non-garnish ingredient matched a stock
    product — a partial recipe would show a flattering GP, which is worse
    than none. Unmatched-core recipes are SKIPPED with the reason shown.
  • trivially-omittable garnish (lime wedge, salt rim, egg white…) may be
    dropped from a recipe but is always listed on the review sheet.
  • menu item names are aligned to the LIVE TILL's names where they match, so
    GP lights up in the catalogue with no extra mapping.
"""
import json, re, unicodedata
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))
from costProposals import parse_seed, parse_ingredients, norm, ALIASES

ROOT = Path(__file__).resolve().parent.parent
COSTING = ROOT / "src/ops/data/costing.js"
LIVETILL = ROOT / "src/till/data/liveTill.json"
SQL_OUT = ROOT / "supabase/bar_recipes_seed.sql"
JSON_OUT = ROOT / "src/till/data/recipesDraft.json"

# soda-gun water and peels cost pennies a serve — omitting them is honest,
# unlike omitting juice or syrup, which cost real money and become preps.
OMITTABLE = re.compile(r"wedge|twist|slice|zest|peel|garnish|rim|cube|egg white|tajin|tajín|mint sprig|cocktail cherry|maraschino cherry|olive brine|sprig|post-mix soda|soda water", re.I)

# The data comes from Node importing costing.js directly (scripts step below) —
# exact values, no regex archaeology. Regenerate the dump with:
#   node -e "import('./src/ops/data/costing.js').then(async m => { const fs =
#   await import('fs'); fs.writeFileSync('<dump>', JSON.stringify({INGREDIENTS:
#   m.INGREDIENTS, RECIPES: m.RECIPES})) })"
DUMP = Path("/private/tmp/claude-501/-Users-elliotscott-Sites-nodice-Plonk-Borough-2-0/cf64080f-11d4-4ece-a8d8-9ec56ee503bf/scratchpad/costing.json")

def load_costing():
    d = json.load(open(DUMP))
    ing_names = {k: v.get("name", k) for k, v in d["INGREDIENTS"].items()}
    recipes = [{"id": r["id"], "category": r.get("category", ""), "name": r["name"],
                "sell": float(r.get("sellPrice") or 0),
                "ings": [{"id": i["id"], "ml": float(i.get("ml") or 0)} for i in r.get("ingredients", [])]}
               for r in d["RECIPES"]]
    return ing_names, recipes

def main():
    seed = parse_seed()                       # norm(name) -> product row
    # The three "made" prep products the seed SQL creates (real cost via
    # bar_prep_recipes: limes -> juice, lemons -> juice, sugar -> syrup).
    for prep in ("Fresh lime juice", "Fresh lemon juice", "Sugar syrup 1:1"):
        seed[norm(prep)] = {"name": prep, "base_unit": "ml", "order_unit": "batch", "order_to_base": 1000}
    ing_names, recipes = load_costing()
    # pack sizes from the costing sheet (packMl per ingredient) — the honest
    # divisor for pours of each-counted products (a carton is 1000ml, not 330).
    packml = {norm(i["name"]): i["packMl"] for i in parse_ingredients()}
    live = json.load(open(LIVETILL))
    live_names = {}                           # norm -> live till product name
    live_prices = {}                          # norm -> set of live serve prices
    for pg in live["pages"]:
        for p in pg["products"]:
            live_names.setdefault(norm(p["name"]), p["name"])
            live_prices.setdefault(norm(p["name"]), set()).update(
                s["price"] for s in p.get("serves", []) if s.get("price"))

    def match_product(ing_id):
        nm = ing_names.get(ing_id)
        if not nm: return None
        n = norm(nm)
        if n in seed: return seed[n]
        if n in ALIASES and norm(ALIASES[n]) in seed: return seed[norm(ALIASES[n])]
        hits = [v for k, v in seed.items() if n and (n in k or k in n)]
        return hits[0] if len(hits) == 1 else None

    # The costing sheet costs hot drinks as fractions of a crisps pack — a
    # placeholder hack, not a recipe. Never seed a cost we know is fiction.
    def is_placeholder(r):
        return all("crisps" in norm(ing_names.get(i["id"], "")) for i in r["ings"]) \
               and "crisps" not in norm(r["name"]) and bool(r["ings"])

    drafts, raw_items = [], []
    for r in recipes:
        lines, omitted, missing = [], [], []
        if is_placeholder(r):
            drafts.append({"name": r["name"], "costing_name": r["name"], "category": r["category"],
                           "sell": r["sell"], "lines": [], "omitted": [],
                           "missing": ["costing sheet has placeholder data, not a recipe"], "ready": False})
            continue
        for ing in r["ings"]:
            nm = ing_names.get(ing["id"], ing["id"])
            # garnish first: a "grapefruit slice" must never match the fruit
            # and cost a whole grapefruit.
            if OMITTABLE.search(nm):
                omitted.append(nm); continue
            prod = match_product(ing["id"])
            if prod and ing["ml"]:
                # qty_base is in the PRODUCT'S base unit: ml products take the
                # pour in ml; each-counted products take units of THEIR pack
                # size (from the costing sheet) — a 440ml pour of a 440ml can
                # is 1 can, a 50ml splash of a 330ml bottle is 0.15 bottles.
                if prod["base_unit"] == "each":
                    pack = packml.get(norm(nm)) or 330
                    units = ing["ml"] / pack
                    qty = max(1, round(units)) if units >= 0.75 else round(units, 2)
                    disp = f"{qty:g} × unit"
                else:
                    qty = round(ing["ml"], 1)
                    disp = f"{qty:g}ml"
                # two ingredients can resolve to the SAME product (e.g. house
                # syrup twice) — the engine allows one line per product, so merge.
                dup = next((l for l in lines if l["product"] == prod["name"]), None)
                if dup:
                    dup["qty"] = round(dup["qty"] + qty, 2)
                    dup["disp"] = f"{dup['qty']:g}ml" if prod["base_unit"] != "each" else f"{dup['qty']:g} × unit"
                else:
                    lines.append({"product": prod["name"], "qty": qty, "disp": disp})
            else:
                missing.append(nm)
        # till-aligned display name (so catalogue GP joins with zero mapping)
        base = re.sub(r"\s+—\s+.*$", "", r["name"])
        till_name = live_names.get(norm(r["name"])) or live_names.get(norm(base)) or r["name"]
        ready = bool(lines) and not missing
        d = {"name": till_name, "costing_name": r["name"], "category": r["category"],
             "sell": r["sell"], "lines": lines, "omitted": omitted,
             "missing": missing, "ready": ready}
        drafts.append(d)
        if ready:
            raw_items.append(d)

    # Two serve sizes of one product (Pint/Half, flute/bottle) can align to the
    # SAME live-till name — one row would silently swallow the other. The serve
    # whose price matches the live button keeps the till name; the rest keep
    # their costing-sheet name (— Pint / — Bottle …).
    by_name = {}
    for d in raw_items:
        by_name.setdefault(d["name"], []).append(d)
    for name, group in by_name.items():
        if len(group) == 1: continue
        prices = live_prices.get(norm(name), set())
        keeper = next((d for d in group if d["sell"] in prices), group[0])
        for d in group:
            if d is not keeper:
                d["name"] = d["costing_name"]
    sql_items = [(d["name"], d["sell"], d["category"], d["lines"]) for d in raw_items]

    # ── idempotent SQL ───────────────────────────────────────────────────────
    def q(s): return s.replace("'", "''")
    sql = ["-- Recipes seed (generated by scripts/recipesSeed.py — 8 Sep 2026).",
           "-- Menu items + recipe lines for the bar costing engine, from the",
           "-- costing sheet's machine-readable recipes. Idempotent: re-running",
           "-- refreshes prices and replaces each item's lines.", "begin;",
           "-- clean up rows an earlier run seeded from placeholder data",
           *[f"delete from bar_recipe_lines where menu_item_id in (select id from bar_menu_items where lower(name) = lower('{d['costing_name'].replace(chr(39), chr(39)*2)}'));\n"
             f"delete from bar_menu_items where lower(name) = lower('{d['costing_name'].replace(chr(39), chr(39)*2)}');"
             for d in drafts if not d["ready"] and d["missing"] and "placeholder" in d["missing"][0]],
           "-- Three MADE prep products (the mechanism bar_prep_recipes exists for):",
           "-- their cost derives from what goes into a batch, never typed.",
           "insert into bar_products (name, kind, category, source, base_unit, order_unit, order_to_base, count_unit, count_to_base, count_area, counted) values",
           "  ('Fresh lime juice', 'prep', 'Prep', 'made', 'ml', 'batch', 1000, 'ml', 1, 'Back bar', false) on conflict ((lower(name))) do nothing;",
           "insert into bar_products (name, kind, category, source, base_unit, order_unit, order_to_base, count_unit, count_to_base, count_area, counted) values",
           "  ('Fresh lemon juice', 'prep', 'Prep', 'made', 'ml', 'batch', 1000, 'ml', 1, 'Back bar', false) on conflict ((lower(name))) do nothing;",
           "insert into bar_products (name, kind, category, source, base_unit, order_unit, order_to_base, count_unit, count_to_base, count_area, counted) values",
           "  ('Sugar syrup 1:1', 'prep', 'Prep', 'made', 'ml', 'batch', 750, 'ml', 1, 'Back bar', false) on conflict ((lower(name))) do nothing;",
           "-- batch definitions: ~30ml juice per lime, ~35ml per lemon, 500g sugar -> 750ml syrup",
           "insert into bar_prep_recipes (product_id, input_product_id, qty_base, makes_base)",
           "  select p.id, i.id, 1, 30 from bar_products p, bar_products i where lower(p.name)='fresh lime juice' and lower(i.name)='limes'",
           "  on conflict do nothing;",
           "insert into bar_prep_recipes (product_id, input_product_id, qty_base, makes_base)",
           "  select p.id, i.id, 1, 35 from bar_products p, bar_products i where lower(p.name)='fresh lemon juice' and lower(i.name)='lemons'",
           "  on conflict do nothing;",
           "insert into bar_prep_recipes (product_id, input_product_id, qty_base, makes_base)",
           "  select p.id, i.id, 500, 750 from bar_products p, bar_products i where lower(p.name)='sugar syrup 1:1' and lower(i.name)='sugar (for house syrup)'",
           "  on conflict do nothing;"]
    for name, sell, cat, lines in sql_items:
        sql.append(
            f"insert into bar_menu_items (name, category, sell_price) values ('{q(name)}', '{q(cat)}', {sell})\n"
            f"  on conflict ((lower(name))) do update set sell_price = excluded.sell_price, category = excluded.category, active = true;")
    for name, sell, cat, lines in sql_items:
        sql.append(f"delete from bar_recipe_lines where menu_item_id = (select id from bar_menu_items where lower(name) = lower('{q(name)}'));")
        for l in lines:
            sql.append(
                "insert into bar_recipe_lines (menu_item_id, product_id, qty_base)\n"
                f"  select m.id, p.id, {l['qty']} from bar_menu_items m, bar_products p\n"
                f"  where lower(m.name) = lower('{q(name)}') and lower(p.name) = lower('{q(l['product'])}');")
    sql.append("commit;")
    SQL_OUT.write_text("\n".join(sql) + "\n")

    JSON_OUT.write_text(json.dumps({
        "generated": "8 Sep 2026 · from src/ops/data/costing.js recipes",
        "drafts": drafts,
    }, ensure_ascii=False, indent=1))

    ready = sum(1 for d in drafts if d["ready"])
    print(f"recipes={len(drafts)} ready={ready} skipped={len(drafts)-ready}")
    for d in drafts:
        if not d["ready"]:
            print(f"  SKIP {d['costing_name']}: missing {', '.join(d['missing']) or '(no lines)'}")

if __name__ == "__main__":
    main()

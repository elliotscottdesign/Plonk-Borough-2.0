#!/usr/bin/env python3
"""Build src/till/data/liveTill.json from the K Series items export.

Input:  data/hackney_till_products_2026-08-20.csv  (Back Office → Menu management
        → Items → Export — the LIVE Hackney till: screens, buttons, prices, serve
        sizes in ml)
Output: src/till/data/liveTill.json — pages → products → serves, each product
        carrying its join into the bar stock engine (stock = bar_products name,
        recipe = bar_menu_items name, noStock = sells time not stock).

Re-run whenever the founder drops a fresh export. The join ALIASES below are the
hand-maintained part — the marriage of the till's names to the stock system's
names, kept in one place on purpose.

House rules honoured here:
  • never invent a price — £0-priced sellable rows are excluded and REPORTED
  • bottle/1l rows priced £0 are stock-management shadows, not buttons
  • unmatched products stay honestly unjoined ("no stock record" on screen)
"""
import csv, json, re, unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data/hackney_till_products_2026-08-20.csv"
OUT = ROOT / "src/till/data/liveTill.json"
LS2025 = ROOT / "src/till/data/lightspeedLayout.json"

# ── Serve labels by SKU segment ──────────────────────────────────────────────
SEG_LABEL = {
    "25ml": "Single", "50ml": "Double", "125ml": "125ml", "MIX": "Mixer",
    "GLS": "Glass", "HLF": "Half pint", "PNT": "Pint", "4PNT": "Pitcher",
    "BOT": "Bottle", "BTL": "Bottle", "1l": "1L",
}
SKU_RE = re.compile(r"^([A-Z][A-Z.]*?)\.(25ml|50ml|125ml|MIX|GLS|HLF|PNT|4PNT|BOT|BTL|1l|CBO|GRP)\.(\w+)$")

# Name-based serve tokens for numeric-SKU rows ("25ml Hanbury spiced cranberry Gin")
NAME_SERVE = [
    (re.compile(r"^25ml\s+", re.I), "Single"), (re.compile(r"^50ml\s+", re.I), "Double"),
    (re.compile(r"^125ml\s+", re.I), "125ml"), (re.compile(r"\s+700ml$", re.I), "Bottle"),
    (re.compile(r"\s+[Bb]tl\.?$"), "Bottle"), (re.compile(r"\s+Half\s*[Pp]int$"), "Half pint"),
    (re.compile(r"\s+Half\s*P\.?$"), "Half pint"), (re.compile(r"\s+-\s*Half$"), "Half pint"),
    (re.compile(r"\s+Pint$"), "Pint"), (re.compile(r"\s+Pitcher$"), "Pitcher"),
    (re.compile(r"\s+-\s*Mixer$"), "Mixer"), (re.compile(r"\s+Gls$"), "Glass"),
    (re.compile(r"\s+Can$"), "Can"), (re.compile(r"\s+[Bb]ottle$"), "Bottle"),
]

# ── Page mapping: Menu/Screen → catalogue page (keeps the till's own order) ──
PAGE_ORDER = [
    "Deals", "Beer & Cider", "Cocktails & Warmers", "Mocktails", "Shots",
    "Spirits — Gin", "Spirits — Vodka", "Spirits — Tequila & Mezcal", "Spirits — Rum",
    "Spirits — Whisk(e)y", "Spirits — Brandy & Cognac", "Spirits — Liqueur",
    "Spirits — Aperitif & Vermouth", "Wines & Prosecco", "Softs & Hot Drinks",
    "Snacks & Food", "Games", "More",
]
FOOD_HINT = re.compile(r"combo|chips|burger|bun|dog|fries|nachos|taco|pizza|sauce|halloumi|shroom", re.I)
DEAL_HINT = re.compile(r"happy hour|2 for|3 for|shooters|deal|£\d", re.I)
def page_for(screen, statgroup):
    s = screen or ""
    if "Mocktails" in s or statgroup == "Drinks/Mocktails": return "Mocktails"
    if "Deals" in s: return "Deals"
    if "Beer & Cider" in s: return "Beer & Cider"
    if "Cocktails" in s: return "Cocktails & Warmers"
    if "Shots" in s: return "Shots"
    if "Spirits/Gin" in s: return "Spirits — Gin"
    if "Spirits/Vodka" in s: return "Spirits — Vodka"
    if "Absinthe" in s: return "Spirits — Tequila & Mezcal"
    if "Spirits/Rum" in s: return "Spirits — Rum"
    if "Whisk" in s: return "Spirits — Whisk(e)y"
    if "Brandy" in s: return "Spirits — Brandy & Cognac"
    if "Spirits/Liqueur" in s: return "Spirits — Liqueur"
    if "Aperitif" in s or "Vermouth" in s: return "Spirits — Aperitif & Vermouth"
    if "Wines" in s: return "Wines & Prosecco"
    if "Softs" in s: return "Softs & Hot Drinks"
    if "Snacks" in s or "FOOD" in s: return "Snacks & Food"
    if "Games" in s: return "Games"
    g = statgroup or ""
    return {
        "Beer/Draught": "Beer & Cider", "Beer/Bottle": "Beer & Cider", "Beer/Can": "Beer & Cider",
        "Cider/Bottle": "Beer & Cider", "Drinks/Cocktails": "Cocktails & Warmers",
        "Drinks/Mocktails": "Mocktails", "Drinks/Wines": "Wines & Prosecco",
        "Drinks/Softs": "Softs & Hot Drinks", "Drinks/Hot Drinks": "Softs & Hot Drinks",
        "Spirits/Gin": "Spirits — Gin", "Spirits/Vodka": "Spirits — Vodka",
        "Spirits/Absinthe - Tequila - Mezcal": "Spirits — Tequila & Mezcal",
        "Spirits/Rum": "Spirits — Rum", "Spirits/Whisk(e)y": "Spirits — Whisk(e)y",
        "Spirits/Brandy - Cognac": "Spirits — Brandy & Cognac",
        "Spirits/Liqueur": "Spirits — Liqueur", "Spirits/Shots": "Shots",
        "Spirits/Aperitif": "Spirits — Aperitif & Vermouth",
        "Spirits/Vermouth": "Spirits — Aperitif & Vermouth",
        "Food/Snacks": "Snacks & Food", "Misc/Games": "Games",
    }.get(g)

# ── Joins: till product name → bar stock engine ──────────────────────────────
# stock  = verbatim bar_products.name from supabase/bar_seed.sql
# recipe = bar_menu_items name (created later; GP appears when the recipe exists)
# Pages that are ALWAYS recipes: cocktails, mocktails, food, deals, shots-mixes.
STOCK_ALIASES = {
    # draught & cider
    "camden hells lager": "Camden Hells", "camden stout": "Camden Stout",
    "xpa pale": "Five Points XPA", "pilsner": "Five Points Pils", "low rise": "Five Points Pils",
    "apple cider": "Umbrella Apple Cider (keg)", "olivers cider": "Oliver's Fine Cider (bottle)",
    # bottles & cans
    "asahi super dry": "Asahi", "big drop citrus ipa non alc": "Big Drop Citra IPA 0.5%",
    "corona zero": "Corona 0%", "corona": "Corona", "budweiser": "Budweiser",
    "fresh af ipa non alc": "Fresh Non-Alc", "lucky saint lager": "Lucky Saint 0.5%",
    "lucky saint lager non alc": "Lucky Saint 0.5%", "piccadilly pilsner": "Piccadilly Pilsner GF",
    "cherry breeze sour beer": "Cherry Sour",
    # wine & fizz
    "blanco blanco white": "Blanco Blanco (white)", "los conejos malditos red": "Los Conejos Tinto (red)",
    "doom juice rose": "Doom Juice Rosé", "doom juice rouge red chilled": "Doom Juice Rouge",
    "house top cuvee orange": "Top Cuvée House Orange", "top cuvee rose": "Doom Juice Rosé",
    "favonius, skin contact, orange": "Favonius Orange", "beaujolais nouveau": "Beaujolais Nouveau",
    "chin chin": "Chin Chin Vinho Verde", "chin chin verde": "Chin Chin Vinho Verde",
    "prosecco": "Prosecco 750ml (NV Via Vai)", "mini prosecco": "Mini Prosecco 20cl",
    "prosecco gls alc free": "Prosecco alc-free", "kalimocho": "House red (Kalimotxo)",
    # gin & vodka
    "beefeater london dry gin": "Beefeater London Dry", "beefeater pink": "Beefeater Pink",
    "beefeater orange": "Beefeater Orange", "beefeater peach & raspberry gin": "Beefeater Peach",
    "hanbury gin": "Hanbury London Dry (house)", "hanbury spiced cranberry gin": "Hanbury Spiced Cranberry",
    "malfy gin rosa": "Malfy Gin Rosa", "malfy limone": "Malfy Limone",
    "monkey 47": "Monkey 47", "monkey 47 sloe gin": "Monkey 47 Sloe",
    "absolute blue": "Absolut Blue", "grey goose vodka": "Grey Goose",
    # tequila, mezcal, shots
    "cazcabel blanco": "Cazcabel Blanco", "cazcabel reposado": "Cazcabel Reposado",
    "cazcabel coffee": "Cazcabel Coffee", "cazcabel honey": "Cazcabel Honey",
    "cazcabel coconut": "Cazcabel Coconut", "olmeca altos plata": "Olmeca Altos Blanco",
    "olmeca altos reposado": "Olmeca Altos Reposado", "madre mezcal": "Madre Mezcal",
    "pensador mezcal": "Pensador Mezcal", "vida mezcal": "Vida Mezcal", "vida mezcal l": "Vida Mezcal",
    "tequila rose strawberry liqueur": "Tequila Rose", "jägermeister": "Jägermeister",
    "sourz apple": "Sourz Apple", "sourz raspberry": "Sourz Raspberry",
    "antica classic sambuca": "Antica Sambuca", "ramazotti sambucca": "Antica Sambuca",
    # rum & brandy
    "havana club anejo especial rum": "Havana Especial", "havana especial": "Havana Especial",
    "havana club 3 year old white rum": "Havana Club 3yr", "havana club 7 year old dark rum": "Havana Club 7yr",
    "cut spiced rum": "Cut Spiced Rum", "kraken black spiced rum": "Kraken Black Spiced",
    "wray & nephew overproof rum": "Wray & Nephew Overproof",
    "diplomatico reserva exclusiva dark rum": "Diplomático",
    "velho barreiro cachaca": "Velho Barreiro Cachaça", "cachaca pindorama": "Velho Barreiro Cachaça",
    "courvoisier vsop cognac": "Courvoisier Brandy", "hennessy": "Hennessy Brandy",
    # whisk(e)y
    "jack daniels": "Jack Daniel's", "jameson irish whiskey": "Jameson",
    "jameson black barrel": "Jameson Black", "jameson orange whiskey": "Jameson Orange",
    "four roses bourbon": "Four Roses Bourbon", "woodford reserve bourbon": "Woodford Reserve",
    "bulleit bourbon": "Bulleit Bourbon", "monkey shoulder whisky": "Monkey Shoulder",
    "chivas regal": "Chivas Regal", "nikka from the barrel whisky": "Nikka From The Barrel",
    "laphroaig 10 year old whisky": "Laphroaig",
    # liqueurs & aperitifs
    "disaronno amaretto": "Disaronno Amaretto", "kahlua liqueur": "Kahlúa",
    "baileys liqueur": "Baileys", "st-germain elderflower liqueur": "St Germain",
    "yellow chartreuse": "Yellow Chartreuse", "limoncello": "Limoncello",
    "cointreau orange liqueur": "Cointreau", "passoa passion fruit liqueur": "Passion Fruit Liqueur",
    "archers peach snaps": "Archers Schnapps", "fernet branca": "Fernet Branca",
    "campari bitter": "Campari", "aperol": "Aperol", "cynar vermouth": "Cynar",
    "top cuvee vermouth": "Top Cuvée Sweet Vermouth", "el bandarra": "El Bandarra Vermut",
    "martini rosso vermouth": "Martini Rosso", "cocchi vermouth": "Cocchi Americano",
    "lilet rose": "Lillet Rosé", "amaro": "Amaro Montenegro",
    "golden falernum": "Velvet Falernum", "umeshu plum sake": "Umeshu Plum Sake",
    "the king's ginger liqueur": "King's Ginger Liqueur",
    # NB the seed really did insert these names WITH a backslash (seeding quirk,
    # 17 Aug 2026) — match what the database actually holds, don't "fix" it here.
    "devils botany absinthe 45%": "Devil\\'s Botany London 40%",
    "devils botany absinthe 63%": "Devil\\'s Botany Regalis 60%",
    "devils botany absinthe 24% chocolate liqueur": "Devil\\'s Botany Chocolate 24%",
    # softs (cans/bottles that exist as bar_products; serve suffixes are
    # stripped before lookup, so keys are the BASE names)
    "fanta": "Fanta", "ting": "Ting", "pink ting": "Pink Ting",
    "old jamaica ginger beer": "Old Jamaica Ginger Beer", "red bull": "Red Bull",
    "cherry coke": "Cherry Coke", "still water": "Kingsdown Still Water",
    "sparkling water": "Kingsdown Sparkling Water", "slim line tonic": "Slimline Tonic",
    "equinox organic blood orange kombucha": "Kombucha",
    "equinox organic fiery ginger kombucha": "Kombucha",
    "coke": "Coke", "coke zero": "Coke Zero",
    "schweppes lemonade": "Lemonade", "schweppes tonic": "Schweppes Tonic",
    "apple juice": "Eager Cloudy Apple", "orange juice": "Eager Orange",
    "pineapple juice": "Eager Pineapple", "cranberry juice": "Eager Cranberry",
    "grapefruit juice": "Eager Grapefruit",
    # snacks
    "brown crisps": "Crisps", "salty dog crisps": "Crisps", "nuts": "Nuts", "olives": "Olives",
}

def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s

def strip_serve(name: str):
    label = None
    for rx, lab in NAME_SERVE:
        if rx.search(name):
            label = lab
            name = rx.sub("", name).strip()
            break
    return name.strip(" .-"), label

def build_combo_graph(rows):
    """Resolve every combo's REAL choice structure straight from the export:
    combo → child groups → member items, with the group's Min-Max as the pick
    count. This is Lightspeed's own definition of what each deal allows — the
    till must never guess it."""
    # A SKU appears twice: once as its DEFINITION (typed row) and once as a
    # bare REFERENCE inside a parent (blank-type row). Index the definitions.
    by_sku = {}
    for r in rows:
        sku = r["SKU"].strip()
        if not sku: continue
        if sku not in by_sku or (not by_sku[sku]["Type"] and r["Type"]):
            by_sku[sku] = r
    children = {}
    for r in rows:
        p = r["Parent SKU"].strip()
        if p: children.setdefault(p, []).append(r["SKU"].strip())

    def pick_count(minmax):
        m = re.match(r"^(\d+)\s*-\s*(\d+)$", (minmax or "").strip())
        if not m: return (1, 1)
        return (int(m.group(1)), int(m.group(2)))

    out = {}
    for r in rows:
        if r["Type"] != "combo": continue
        cname = r["Name"].strip()
        choices = []
        for gsku in children.get(r["SKU"].strip(), []):
            g = by_sku.get(gsku)
            if not g or g["Type"] != "group": continue
            gname = g["Name"].strip().rstrip(".")
            lo, hi = pick_count(g["Min - Max"])
            opts = []
            for msku in children.get(gsku, []):
                item = by_sku.get(msku)
                if not item: continue
                nm = item["Name"].strip()
                # "Tall Seltz - Amaro" → "Amaro" when prefixed by the group/combo name
                for prefix in (gname + " - ", cname + " - "):
                    if nm.lower().startswith(prefix.lower()):
                        nm = nm[len(prefix):].strip()
                        break
                else:
                    nm, _ = strip_serve(nm)
                if nm: opts.append(nm)
            if opts:
                choices.append({"name": gname, "min": lo, "max": hi, "options": opts})
        price_s = (r["Default price"] or "").strip()
        price = float(price_s) if price_s and not price_s.endswith("%") else None
        out[cname] = {"price": price, "choices": choices}
    return out


def main():
    rows = list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
    items = [r for r in rows if r["Type"] == "item"]
    combo_graph = build_combo_graph(rows)
    combos = {}
    for r in rows:
        if r["Type"] == "combo":
            m = SKU_RE.match(r["SKU"])
            if m: combos[(m.group(1), m.group(3))] = r
    # Priced combos are real buttons in their own right (2-for-£12, happy hour,
    # food meal-deals, Tall Seltz). £0 combos are just serve-pickers — skipped.
    priced_combos = [r for r in rows if r["Type"] == "combo"
                     and (r["Default price"] or "").strip() not in ("", "0.0", "0", "0.00")
                     and not (r["Default price"] or "").endswith("%")]

    # 2025 units, aggregated by normalised name (best-effort context only)
    units2025 = defaultdict(float)
    try:
        ls = json.load(open(LS2025))
        for c in ls["categories"]:
            for p in c["products"]:
                base, _ = strip_serve(p["name"])
                units2025[norm(base)] += p["units"] or 0
    except FileNotFoundError:
        pass

    products = {}          # key → product dict
    report = {"zero_priced": [], "unjoined": [], "skipped": []}

    for r in items:
        name = r["Name"].strip()
        sku = r["SKU"].strip()
        price_s = (r["Default price"] or "").strip()
        if not price_s or price_s.endswith("%"):
            report["skipped"].append(f"{sku} {name} (no price / percent)")
            continue
        price = float(price_s)
        ml = None
        if (r["Package unit (stock management)"] or "").strip().upper() == "ML":
            try: ml = round(float(r["Package content (stock management)"]))
            except ValueError: ml = None

        m = SKU_RE.match(sku)
        if m:
            fam, seg, num = m.groups()
            key = f"{fam}.{num}"
            label = SEG_LABEL.get(seg)
            base_name, lab2 = strip_serve(name)
            label = label or lab2
            # A combo with the same number gives the cleanest product name — but
            # only trust it when it clearly IS the same product. (Draught combos
            # are numbered independently of their serve items: combo .001 is
            # "Pilsner" while item .001 is Camden Hells. Names must agree.)
            cb = combos.get((fam, num))
            if cb:
                cn, bn = norm(cb["Name"]), norm(base_name)
                if cn and (cn in bn or bn in cn):
                    base_name = cb["Name"].strip()
        else:
            base_name, label = strip_serve(name)
            key = "N." + norm(base_name)

        # £0 bottle/1L rows are stock shadows, other £0 rows are till mistakes.
        if price == 0:
            if label in ("Bottle", "1L"):
                report["skipped"].append(f"{sku} {name} (£0 stock shadow)")
            else:
                report["zero_priced"].append(f"{sku} {name}")
            continue

        screen = (r["Menu/Screen"] or "").split(",")[0].strip()
        page = page_for(screen, r["Statistics group"])
        if not page:
            if sku.startswith(("JUI.", "SOF.")): page = "Softs & Hot Drinks"
            elif FOOD_HINT.search(name): page = "Snacks & Food"
            elif DEAL_HINT.search(name): page = "Deals"
            else: page = "More"

        p = products.setdefault(key, {
            "name": base_name or name, "page": page, "serves": [],
            "group": r["Statistics group"] or None, "sku": key,
        })
        # A row with a real screen assignment beats a sibling's fallback guess.
        if screen and p["page"] in ("More", "Deals") and page not in ("More", "Deals"):
            p["page"] = page
        p["serves"].append({
            "label": label or "Each", "price": price,
            **({"ml": ml} if ml else {}),
            "button": (r["Button name"] or name).strip(),
        })

    # Deal / meal-deal combos become one-serve buttons.
    for r in priced_combos:
        name = r["Name"].strip()
        screen = (r["Menu/Screen"] or "").split(",")[0].strip()
        page = page_for(screen, r["Statistics group"])
        if not page:
            if FOOD_HINT.search(name): page = "Snacks & Food"
            else: page = "Deals"
        key = "C." + norm(name)
        if key in products: continue
        products[key] = {
            "name": name, "page": page, "sku": key,
            "group": r["Statistics group"] or None,
            "serves": [{"label": "Deal", "price": float(r["Default price"]),
                        "button": (r["Button name"] or name).strip()}],
        }

    # joins + 2025 units
    RECIPE_PAGES = {"Cocktails & Warmers", "Mocktails", "Snacks & Food", "Deals", "Shots"}
    for p in products.values():
        n = norm(p["name"])
        if p["page"] == "Games":
            p["noStock"] = True
        elif n in STOCK_ALIASES:
            p["stock"] = STOCK_ALIASES[n]
        elif p["page"] in RECIPE_PAGES:
            p["recipe"] = p["name"]
        else:
            report["unjoined"].append(p["name"])
        u = units2025.get(n)
        if u: p["units2025"] = round(u)

    # order serves sensibly, order products by page then name
    SERVE_ORDER = {"Single": 0, "Double": 1, "Mixer": 2, "Half pint": 0, "Pint": 1,
                   "Pitcher": 2, "125ml": 0, "Glass": 1, "Bottle": 9, "Can": 0, "Each": 0}
    for p in products.values():
        p["serves"].sort(key=lambda s: SERVE_ORDER.get(s["label"], 5))

    # Shots are shots (founder, 20 Aug 2026): no "Single" tag, no doubles —
    # one button, one measure. (The same spirit poured as a double lives on
    # its spirits page.)
    for p in products.values():
        if p["page"] == "Shots":
            singles = [s for s in p["serves"] if s["label"] != "Double"]
            if singles: p["serves"] = singles
            for s in p["serves"]:
                if s["label"] in ("Single", "Shot"): s["label"] = "Each"

    pages = []
    for pg in PAGE_ORDER:
        prods = [p for p in products.values() if p["page"] == pg]
        if not prods: continue
        prods.sort(key=lambda p: (-(p.get("units2025") or 0), p["name"]))
        pages.append({"name": pg, "products": prods})

    out = {
        "source": "K Series items export, live Hackney till — 20 Aug 2026",
        "pages": pages,
        # Every combo's own choice rules (groups, pick counts, member drinks),
        # straight from the export — deal pickers read THIS, never a hand-typed
        # list. Includes combos that aren't till buttons (e.g. "£3 SHOT 💉")
        # because they define happy-hour lists.
        "combos": combo_graph,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))

    n_serves = sum(len(p["serves"]) for pg in pages for p in pg["products"])
    n_prods = sum(len(pg["products"]) for pg in pages)
    print(f"pages={len(pages)} products={n_prods} serves={n_serves}")
    print(f"joined: stock={sum(1 for pg in pages for p in pg['products'] if 'stock' in p)}"
          f" recipe={sum(1 for pg in pages for p in pg['products'] if 'recipe' in p)}"
          f" noStock={sum(1 for pg in pages for p in pg['products'] if p.get('noStock'))}")
    print("\nZERO-PRICED (excluded, fix in Lightspeed):")
    for z in report["zero_priced"]: print("  ", z)
    print("\nUNJOINED (will show 'no stock record'):")
    for u in sorted(set(report["unjoined"])): print("  ", u)

if __name__ == "__main__":
    main()

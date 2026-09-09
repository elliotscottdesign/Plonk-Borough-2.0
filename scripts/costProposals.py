#!/usr/bin/env python3
"""Invoice → cost feed, stage 1 (till lane, 4 Sep 2026).

Xero's bills are one-line summaries ("Beer stock £1,271.43") — the product
prices live in the attached PDFs. Until those PDFs flow in, the best real
price source in the business is src/ops/data/costing.js: 96 lines priced off
the Drinks Club 26-27 wholesale list (live per-unit invoice prices ex-VAT),
plus industry-ballpark rows clearly marked as such.

This script marries those costs to the live bar_products (verbatim seed
names), SCALED to each product's ordering pack (a per-bottle Corona cost
becomes a case-of-24 cost, a 700ml rate becomes a 500ml bottle's price), and
emits src/till/data/costProposals.json for the founder-approval "Costs inbox"
in the till. NOTHING is written to the database here — every application is a
founder tap in the UI, through the bar fn's existing founder-gated action.

Re-run when costing.js updates or (next stage) when supplier PDFs are parsed.
"""
import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COSTING = ROOT / "src/ops/data/costing.js"
SEED = ROOT / "supabase/bar_seed.sql"
OUT = ROOT / "src/till/data/costProposals.json"

def norm(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

# costing.js ingredient name → bar_products name (verbatim seed). Only where
# the automatic name match fails but the products are genuinely the same.
ALIASES = {
    "silver tequila cazcabel": "Cazcabel Blanco",
    "tequila reposado cazcabel": "Cazcabel Reposado",
    "vida mezcal": "Vida Mezcal",
    "house mezcal": "Madre Mezcal",
    "cachaca": "Velho Barreiro Cachaça",
    "havana especial": "Havana Especial",
    "havana club 3yr": "Havana Club 3yr",
    "wray nephew": "Wray & Nephew Overproof",
    "bourbon": "Four Roses Bourbon",
    "house whiskey": "Jameson",
    "hanbury gin": "Hanbury London Dry (house)",
    "hanbury spiced cranberry": "Hanbury Spiced Cranberry",
    "house gin": "Beefeater London Dry",
    "house vodka": "Absolut Blue",
    "vodka": "Absolut Blue",
    "gin": "Beefeater London Dry",
    "triple sec": "Triple Sec",
    "kahlua": "Kahlúa",
    "campari": "Campari",
    "aperol": "Aperol",
    "sweet vermouth": "Top Cuvée Sweet Vermouth",
    "dry vermouth": "Martini Dry",
    "prosecco": "Prosecco 750ml (NV Via Vai)",
    "house white": "Blanco Blanco (white)",
    "house red": "Los Conejos Tinto (red)",
    "house rose": "Doom Juice Rosé",
    "house orange": "Top Cuvée House Orange",
    "corona": "Corona", "corona cero": "Corona 0%", "asahi": "Asahi",
    "budweiser": "Budweiser", "lucky saint": "Lucky Saint 0.5%",
    "ting": "Ting", "red bull": "Red Bull", "fanta": "Fanta",
    "coke": "Coke", "coke zero": "Coke Zero", "cherry coke": "Cherry Coke",
    "lemonade": "Lemonade", "tonic": "Schweppes Tonic",
    "still water": "Kingsdown Still Water", "sparkling water": "Kingsdown Sparkling Water",
    "old jamaica ginger beer": "Old Jamaica Ginger Beer",
    "keg hells": "Camden Hells", "camden hells keg": "Camden Hells",
    "camden hells": "Camden Hells", "camden stout": "Camden Stout",
    "five points xpa": "Five Points XPA", "five points pils": "Five Points Pils",
    "apple cider keg": "Umbrella Apple Cider (keg)",
    "apple juice": "Eager Cloudy Apple", "orange juice": "Eager Orange",
    "pineapple juice": "Eager Pineapple", "cranberry juice": "Eager Cranberry",
    "grapefruit juice": "Eager Grapefruit",
    "lime juice": "Limes", "lemon juice": "Lemons",
    "hanbury london dry gin": "Hanbury London Dry (house)",
    "vermut": "El Bandarra Vermut",
    "umbrella cider keg": "Umbrella Apple Cider (keg)",
    "cloudwater fresh af ipa": "Fresh Non-Alc",
    "cloudwater cheery breeze sour": "Cherry Sour",
    "big drop paradiso citra ipa 0 5": "Big Drop Citra IPA 0.5%",
    "los conejos malditos tinto": "Los Conejos Tinto (red)",
    "prosecco amore della vita": "Prosecco 750ml (NV Via Vai)",
    "house cheap red kalimoxto": "House red (Kalimotxo)",
    "ting grapefruit": "Ting",
    "eager pink grapefruit": "Eager Grapefruit",
    "old jamaican ginger beer": "Old Jamaica Ginger Beer",
    "coca cola bottle": "Coke",
    "sambuca antica": "Antica Sambuca",
    "vodka well": "Absolut Blue",
    "house gin hanbury ld": "Hanbury London Dry (house)",
    "ms better s miraculous foamer": "Ms Better's Foamer",
    "lime juice fresh": "Fresh lime juice",
    "lemon juice fresh": "Fresh lemon juice",
    "sugar syrup 1 1": "Sugar syrup 1:1",
    "london absinthe": "Devil\\'s Botany London 40%",
    "absinthe regalis": "Devil\\'s Botany Regalis 60%",
    "chocolate absinthe": "Devil\\'s Botany Chocolate 24%",
}

def parse_ingredients():
    txt = COSTING.read_text()
    out = []
    for m in re.finditer(r"'[\w-]+':\s*\{([^}]*)\}", txt):
        body = m.group(1)
        f = {}
        nm = re.search(r"name:\s*'((?:[^'\\]|\\')*)'", body)
        ml = re.search(r"packMl:\s*([\d.]+)", body)
        c = re.search(r"defaultCost:\s*([\d.]+)", body)
        sup = re.search(r"supplier:\s*'([^']*)'", body)
        sp = re.search(r"supplierProduct:\s*'((?:[^'\\]|\\')*)'", body)
        if not (nm and ml and c):
            continue
        f = {"name": nm.group(1).replace("\\'", "'"), "packMl": float(ml.group(1)),
             "cost": float(c.group(1)), "supplier": sup.group(1) if sup else None,
             "supplierProduct": sp.group(1).replace("\\'", "'") if sp else None}
        out.append(f)
    return out

def parse_seed():
    txt = SEED.read_text()
    rows = {}
    pat = re.compile(r"bar_products \(name,kind,category,source,base_unit,order_unit,order_to_base,[^)]*\) values \('((?:[^']|'')+)','[^']*','[^']*','[^']*','([^']*)','([^']*)',([\d.]+)")
    for m in pat.finditer(txt):
        name = m.group(1).replace("''", "'")
        rows[norm(name)] = {"name": name, "base_unit": m.group(2), "order_unit": m.group(3), "order_to_base": float(m.group(4))}
    return rows

# ─── Prices read off REAL supplier invoices in the founder's Gmail ───────────
# (per single unit ex-VAT; scaled to the ordering pack like everything else).
# Full invoice-tier confidence — same standing as the Drinks Club list.
EXTRA_INVOICED = [
    # (seed product name, per-unit £ ex-VAT, supplier, invoice ref)
    ("Oliver's Fine Cider (bottle)", 1.94, "Fine Cider Co",
     "INV-34131 (22 Aug 2026) — Gold Rush #11 330ml @ £1.94/btl ex-VAT"),
    ("Limes", 0.20, "Valimex",
     "inv 1472073 (22/08/26) — box of 60 @ £12.00 (zero-VAT produce)"),
    ("Grapefruit", 0.78, "Valimex", "inv 1472073 (22/08/26) — pink grapefruit @ £0.78 ea"),
    ("Cucumber", 0.98, "Valimex", "inv 1472073 (22/08/26) — @ £0.98 ea"),
    ("Lemons", 0.28, "Valimex", "inv 1475183 (28/08/26) — @ £0.28 ea (zero-VAT produce)"),
    ("Lowrise Lager (keg)", 89.00, "Lowrise Brewery", "INV-0856 (17 Aug 2026) — 30L keg @ £89 ex-VAT"),
    ("Lowrise Hazy Pale (keg)", 95.00, "Lowrise Brewery", "INV-0863/0891 (Aug–Sep 2026) — 30L keg @ £95 ex-VAT"),
    ("Umbrella Apple Cider (keg)", 95.00, "Umbrella", "invoice 12565 (24 Jul 2026) — 50L keg @ £95 ex-VAT"),
    ("Umbrella Alcoholic Ginger Beer", 1.4167, "Umbrella", "invoice 12565 (24 Jul 2026) — 330ml×12 case @ £17 ex-VAT"),
    ("Agave syrup", 12.29, "Amazon", "Monin Agave 70cl case of 6 @ £88.47 inc VAT, delivered 18 Aug 2026 = £12.29/btl ex-VAT"),
    # Top Cuvée (Shop Cuvée) INV-11750, 16 Jun 2026 — founder-supplied PDF
    ("Blanco Blanco (white)", 11.55, "Top Cuvée", "INV-11750 (16 Jun 2026) — Xarel-lo/Garnacha/Trepat @ £11.55/btl ex-VAT"),
    ("Doom Juice Rosé", 11.90, "Top Cuvée", "INV-11750 (16 Jun 2026) — Shiraz rosé @ £11.90/btl ex-VAT"),
    ("Doom Juice Rouge", 11.90, "Top Cuvée", "INV-11750 (16 Jun 2026) — Shiraz @ £11.90/btl ex-VAT"),
    ("Top Cuvée House Orange", 10.35, "Top Cuvée", "INV-11750 (16 Jun 2026) — @ £10.35/btl ex-VAT"),
    ("Rouge Petard", 10.75, "Top Cuvée", "INV-11750 (16 Jun 2026) — Aramon @ £10.75/btl ex-VAT"),
    ("Worcestershire sauce", 5.38, "Amazon UK", "L&P 568ml @ £5.38 ex-VAT (founder-sanctioned Amazon pricing, 9 Sep 2026)"),
    ("Tabasco", 2.07, "Amazon UK", "57ml @ £2.48 inc VAT = £2.07 ex (founder-sanctioned, 9 Sep 2026)"),
    ("Valentina Hot Sauce", 1.79, "Amazon UK", "370ml @ £2.15 inc VAT = £1.79 ex (founder-sanctioned, 9 Sep 2026)"),
    ("Soy sauce", 4.54, "Amazon UK", "Kikkoman 1L @ £5.45 inc VAT = £4.54 ex (founder-sanctioned, 9 Sep 2026)"),
    ("Green Chartreuse", 40.81, "supplier portal", "founder screenshot 9 Sep 2026 — 700ml @ £40.81 ex-VAT"),
    ("Pago Tomato Juice (200ml)", 0.94, "supplier portal", "founder screenshot 9 Sep 2026 — case of 12 @ £11.28 ex-VAT"),
    ("Celery", 1.28, "Valimex", "inv 1475183 (28/08/26) — @ £1.28 ea"),
    ("Guilty Pleasure (can)", 1.64, "Fine Cider Co", "INV-33054 (16 Jul 2026) — 330ml can @ £1.64 ex-VAT"),
    ("Oliver's Fine Perry (bottle)", 1.98, "Fine Cider Co", "INV-33054 (16 Jul 2026) — 330ml @ £1.98 ex-VAT"),
    ("Sugar (for house syrup)", 12.98, "Amazon", "Tate & Lyle caster 3kg drum @ £12.98 (zero-VAT food) — founder screenshot 10 Sep 2026"),
    ("Wyborowa Vodka", 15.77, "supplier portal", "founder screenshot 10 Sep 2026 — Wyborowa Blue 700ml @ £15.77 ex-VAT"),
    ("Mint", 0.00, "the garden", "picked from the garden — costs nothing (founder, 10 Sep 2026)"),
    ("Cueva Nueva Vermut (500ml)", 12.29, "Good Wine Good People", "GWGPT-369 (24 Feb 2026) — @ £12.29/btl ex-VAT (invoice says 750ml case format)"),
]

# Founder-sanctioned ballpark for the one larder item with no invoice anywhere:
# supermarket granulated sugar. Clearly marked; replaced when a real bill lands.
SUGAR_BALLPARK = {
    "stock": "Sugar (for house syrup)", "pack_cost": 1.10, "pack_label": "per bag (1kg)",
    "supplier": "supermarket", "source": "ballpark — supermarket granulated ~£1.10/kg; replace with a real bill",
    "confident": False, "ref": "founder asked to work syrup cost out, 9 Sep 2026",
}

# ─── Previous-supplier prices (founder's "HACKNEY PLONK WET STOCK" sheet, ────
# Sep 2026). Founder's rule: use ONLY for drinks the Drinks Club invoice list
# hasn't priced — Drinks Club always wins; these get updated as orders shift
# to current wholesalers. Prices are ex-VAT off the sheet: per BOTTLE / keg /
# BIB for ml products (that IS the ordering pack), per single CAN for
# each-counted ones (scaled by the case size below).
WETSTOCK = [
    # spirits & liqueurs — per bottle
    ("Beefeater London Dry", 14.91), ("Absolut Blue", 15.46), ("Grey Goose", 33.01),
    ("Havana Club 3yr", 18.05), ("Havana Especial", 17.24), ("Havana Club 7", 21.56),
    ("Cut spiced rum", 20.89), ("Havana spiced", 18.80), ("Wray & Nephew", 25.18),
    ("Velho Barreiro Cachaca", 18.97), ("Olmeca Altos Reposado", 32.50),
    ("Cazcabel Blanco", 23.23), ("Cazcabel Reposado", 24.67), ("Cazcabel Coffee", 22.44),
    ("Cazcabel Honey", 22.44), ("Cazcabel Coconut", 22.44),
    ("Four Roses Bourbon", 20.71), ("Woodford Reserve", 26.74), ("Monkey Shoulder", 23.48),
    ("Jameson", 20.52), ("Nikka From The Barrel", 35.82), ("Jack Daniel's", 20.36),
    ("Courvoisier", 24.83), ("Bulleit", 25.63), ("Hennessy", 30.63), ("Chivas", 24.39),
    ("Vida Mezcal", 30.75), ("Madre Mezcal", 42.12), ("Monkey 47", 32.90),
    ("Malfy Gin Rosa", 23.89), ("Malfy Limone", 23.90),
    ("Campari", 15.73), ("Top Cuvee Sweet Vermouth", 15.46), ("El Bandarra", 20.28),
    ("Cocchi Americano", 23.54), ("Martini Dry", 9.92), ("Martini Rosso", 9.92), ("Cynar", 15.60),
    ("Montenegro", 18.04), ("Kahlua", 13.96), ("Archers", 11.54), ("Velvet Falernum", 13.21),
    ("Yellow Chartreuse", 37.38), ("Lillet", 15.18), ("Aperol", 11.98), ("Pimm's", 12.95),
    ("Fernet Branca", 19.60), ("Passion fruit liqueur", 9.51), ("Triple Sec", 11.73),
    ("King's Ginger Liqueur", 20.30), ("Disaronno", 18.25), ("Baileys", 12.76), ("Jagermeister", 17.88),
    ("Sourz Raspberry", 9.15), ("Sourz Apple", 9.15), ("Tequila Rose", 14.43),
    ("Limoncello", 17.45), ("Cointreau", 20.19), ("St Germain", 27.31),
    ("Devil's Botany Chocolate", 18.63), ("Devil's Botany London", 25.30), ("Devil's Botany Regalis", 36.63),
    # cocktail larder — per bottle / tub
    ("Agave syrup", 12.28), ("Monin Gomme", 4.60), ("Monin Grenadine", 4.87),
    ("Monin Vanilla", 6.81), ("Monin Passion Fruit", 7.66), ("Monin Ginger", 8.70),
    ("Belvoir Elderflower Cordial", 14.96), ("Funkin Passion Fruit purée", 47.70),
    ("Funkin Mango", 47.00), ("Lemon bitters", 16.01), ("Grapefruit bitters", 15.26),
    ("Angostura Bitters", 10.27), ("Ms Better's Foamer", 19.99), ("Coffee extract", 61.18),
    # wine — per bottle
    ("Prosecco 750ml (NV Via Vai)", 6.80), ("Doom Juice Rose", 12.35), ("Doom Juice Rouge", 12.35), ("Blanco Blanco", 11.55), ("Los Conejos Tinto", 10.00),
    ("House red (Kalimotxo)", 7.32), ("Top Cuvee House Orange", 10.35),
    # kegs & post-mix — per keg / BIB (the ordering pack)
    ("Camden Hells", 85.39), ("Camden Stout", 84.35), ("Umbrella Apple Cider (keg)", 97.00),
    ("Lemonade", 65.39), ("Coke Zero", 59.78), ("Coke", 74.52), ("Schweppes Tonic", 68.47),
    ("Favonius Orange", 13.50), ("Eager Pineapple", 20.87),
    # each-counted — per single can/bottle, scaled to the case
    ("Mini Prosecco 20cl", 2.12, "unit"), ("Kombucha", 1.01, "unit"),
    ("Cherry Sour", 2.71, "unit"), ("Fresh Non-Alc", 2.04, "unit"),
    ("Fuzzy Hazy Pale", 2.25, "unit"), ("Happy! Easy Pale", 2.08, "unit"),
 ("Piccadilly Pilsner GF", 2.08, "unit"),
]

def main():
    ings = parse_ingredients()
    seed = parse_seed()
    proposals, unmatched = [], []
    seen = set()
    for ing in ings:
        n = norm(ing["name"])
        target = None
        if n in seed: target = seed[n]
        elif n in ALIASES and norm(ALIASES[n]) in seed: target = seed[norm(ALIASES[n])]
        else:
            # forgiving contains-match, one direction only, unique hit required
            hits = [v for k, v in seed.items() if n and (n in k or k in n)]
            if len(hits) == 1: target = hits[0]
        if not target:
            unmatched.append(ing["name"]); continue
        if target["name"] in seen: continue
        seen.add(target["name"])
        # scale the costing rate onto THIS product's ordering pack
        if target["base_unit"] == "each":
            # costing sheets price most each-counted things per single unit
            # (a can, a bottle) — but a pack of 2L+ is the whole case already
            # (e.g. Eager: 8×1L @ £19.28); scaling that by the case size again
            # would 8× the cost.
            per_case_already = ing["packMl"] >= 2000
            pack_cost = round(ing["cost"] if per_case_already else ing["cost"] * target["order_to_base"], 2)
            pack_label = f"per {target['order_unit']} (×{int(target['order_to_base'])})"
        else:
            pack_cost = round(ing["cost"] * target["order_to_base"] / ing["packMl"], 2)
            unit = f"{int(target['order_to_base'])}ml" if target["order_to_base"] < 10000 else f"{target['order_to_base']/1000:.0f}L"
            pack_label = f"per {target['order_unit']} ({unit})"
        invoice_listed = bool(ing["supplierProduct"]) and "estimate" not in (ing["supplierProduct"] or "").lower() and "confirm" not in (ing["supplierProduct"] or "").lower()
        proposals.append({
            "stock": target["name"],
            "pack_cost": pack_cost,
            "pack_label": pack_label,
            "supplier": ing["supplier"],
            "source": "Drinks Club 26-27 invoice list" if invoice_listed else "industry ballpark — confirm",
            "confident": invoice_listed,
            "ref": ing["supplierProduct"] or ing["name"],
        })
    # ── real-invoice extras (from supplier invoices in the founder's Gmail) ──
    for name, unit_cost, supplier, ref in EXTRA_INVOICED:
        target = seed.get(norm(name))
        if not target: print("EXTRA_INVOICED name not in seed:", name); continue
        pack_cost = round(unit_cost * target["order_to_base"], 2) if target["base_unit"] == "each" else round(unit_cost, 2)
        proposals[:] = [p for p in proposals if p["stock"] != target["name"]]
        proposals.append({
            "stock": target["name"], "pack_cost": pack_cost,
            "pack_label": f"per {target['order_unit']} (×{int(target['order_to_base'])})" if target["base_unit"] == "each" else f"per {target['order_unit']}",
            "supplier": supplier, "source": f"supplier invoice — {ref}",
            "confident": True, "ref": ref,
        })

    # Founder-confirmed dead lines (10 Sep 2026): Big Drop no longer stocked,
    # Beaujolais is a seasonal one-off — no standing price needed.
    DISCONTINUED = {"Big Drop Citra IPA 0.5%", "Beaujolais Nouveau"}
    proposals[:] = [p for p in proposals if p["stock"] not in DISCONTINUED]

    if not any(p["stock"] == SUGAR_BALLPARK["stock"] for p in proposals):
        proposals.append(dict(SUGAR_BALLPARK))

    # ── previous-supplier fill-in (Drinks Club always wins) ──────────────────
    confident_stocks = {p["stock"] for p in proposals if p["confident"]}
    wet_unmatched = []
    for entry in WETSTOCK:
        name, price, per = entry[0], entry[1], (entry[2] if len(entry) > 2 else "pack")
        n = norm(name)
        target = seed.get(n)
        if not target and n in ALIASES and norm(ALIASES[n]) in seed: target = seed[norm(ALIASES[n])]
        if not target:
            hits = [v for k, v in seed.items() if n and (n in k or k in n)]
            if len(hits) == 1: target = hits[0]
        if not target:
            wet_unmatched.append(name); continue
        if target["name"] in confident_stocks: continue      # invoice price wins
        pack_cost = round(price * target["order_to_base"], 2) if per == "unit" else round(price, 2)
        if target["base_unit"] == "each":
            pack_label = f"per {target['order_unit']} (×{int(target['order_to_base'])})"
        else:
            unit = f"{int(target['order_to_base'])}{'g' if target['base_unit'] == 'g' else 'ml'}" if target["order_to_base"] < 10000 else f"{target['order_to_base']/1000:.0f}L"
            pack_label = f"per {target['order_unit']} ({unit})"
        # a real (if old) supplier price beats an industry ballpark
        proposals[:] = [p for p in proposals if p["stock"] != target["name"]]
        proposals.append({
            "stock": target["name"], "pack_cost": pack_cost, "pack_label": pack_label,
            "supplier": "previous supplier",
            "source": "previous supplier — wet stock sheet (Sep 2026); update on next wholesaler order",
            "confident": False, "wet": True, "ref": name,
        })

    proposals.sort(key=lambda p: (not p["confident"], not p.get("wet"), p["stock"]))
    OUT.write_text(json.dumps({
        "generated": "9 Sep 2026 · Drinks Club 26-27 invoice list + previous-supplier wet stock sheet + ballparks",
        "proposals": proposals,
    }, ensure_ascii=False, indent=1))
    print(f"proposals={len(proposals)} (invoice-listed={sum(1 for p in proposals if p['confident'])}, previous-supplier={sum(1 for p in proposals if p.get('wet'))}, ballpark={sum(1 for p in proposals if not p['confident'] and not p.get('wet'))})")
    print("unmatched ingredients:", len(unmatched))
    for u in unmatched[:40]: print("  -", u)
    print("wet stock rows with no stock product:", len(wet_unmatched))
    for u in wet_unmatched: print("  ~", u)

if __name__ == "__main__":
    main()

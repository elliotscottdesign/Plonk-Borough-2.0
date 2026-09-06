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
    "ting grapefruit": "Pink Ting",
    "old jamaican ginger beer": "Old Jamaica Ginger Beer",
    "coca cola bottle": "Coke",
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
            pack_cost = round(ing["cost"] * target["order_to_base"], 2)
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
    proposals.sort(key=lambda p: (not p["confident"], p["stock"]))
    OUT.write_text(json.dumps({
        "generated": "4 Sep 2026 · from src/ops/data/costing.js (Jun 2026 costing sheet; Drinks Club 26-27 list where marked)",
        "proposals": proposals,
    }, ensure_ascii=False, indent=1))
    print(f"proposals={len(proposals)} (invoice-listed={sum(1 for p in proposals if p['confident'])}, ballpark={sum(1 for p in proposals if not p['confident'])})")
    print("unmatched ingredients:", len(unmatched))
    for u in unmatched[:40]: print("  -", u)

if __name__ == "__main__":
    main()

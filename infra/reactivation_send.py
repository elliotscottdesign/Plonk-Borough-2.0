#!/usr/bin/env python3
"""
No Dice — reactivation campaign runner (the "carefully + timed" warm-up sender).

Drives the send-campaign edge function to email the WARM slice of the old
Plonk/Mailchimp list in small, controlled batches — most-engaged + most-recent
FIRST — so a brand-new sending domain warms up gently. People who click
"Yes, keep me in" become consent=true (join the active list); everyone else
stays quietly held.

The contact data (engagement stars + signup dates) is read from the LOCAL
Mailchimp `subscribed_*.csv` — it is NEVER committed to the repo (it's PII).

DRY RUN BY DEFAULT. Nothing is emailed unless you pass --go.

Examples
--------
# See who the warmest 50 are (no send):
python3 infra/reactivation_send.py --csv /tmp/mc_import/subscribed_email_audience_export_fddfc27b18.csv --limit 50

# Actually send to the warmest 50 (day 1 of the ramp):
python3 infra/reactivation_send.py --csv .../subscribed.csv --limit 50 --go --secret <SEND_SECRET>

# Day 2: the next 100 (skip the first 50 already done):
python3 infra/reactivation_send.py --csv .../subscribed.csv --offset 50 --limit 100 --go --secret <SEND_SECRET>
"""
import argparse, csv, json, re, sys, urllib.request

CAMPAIGN_URL = "https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/send-campaign"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CHUNK = 80  # emails per POST (function paces ~2/sec internally)


def year(s):
    s = (s or "").strip().strip('"')
    return int(s[:4]) if len(s) >= 4 and s[:4].isdigit() else 0


def load_warm(csv_path, min_stars, since_year):
    rows = []
    with open(csv_path, encoding="utf-8", errors="replace") as fh:
        for r in csv.DictReader(fh):
            e = (r.get("Email Address") or "").strip().lower()
            if not EMAIL_RE.match(e):
                continue
            try:
                stars = int((r.get("MEMBER_RATING") or "0").strip() or 0)
            except ValueError:
                stars = 0
            y = year(r.get("OPTIN_TIME"))
            if stars < min_stars:
                continue
            if since_year and y and y < since_year:
                continue
            rows.append((e, stars, y, year(r.get("LAST_CHANGED"))))
    # de-dupe by email, keep first; then sort WARMEST first:
    #   highest engagement stars, then most-recent signup, then most-recent activity
    seen, uniq = set(), []
    for e, s, y, lc in rows:
        if e in seen:
            continue
        seen.add(e)
        uniq.append((e, s, y, lc))
    uniq.sort(key=lambda t: (t[1], t[2], t[3]), reverse=True)
    return uniq


def post(emails, subject, html, secret):
    body = json.dumps({"emails": emails, "subject": subject, "html": html, "secret": secret}).encode()
    req = urllib.request.Request(CAMPAIGN_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True, help="path to Mailchimp subscribed_*.csv")
    ap.add_argument("--html", default="infra/reintro-email.html")
    ap.add_argument("--subject", default="No Dice — we've moved to London Fields. Still want in?")
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--min-stars", type=int, default=0, help="only contacts with >= this engagement rating")
    ap.add_argument("--since-year", type=int, default=0, help="only contacts who signed up in/after this year")
    ap.add_argument("--go", action="store_true", help="ACTUALLY SEND (default is a dry run)")
    ap.add_argument("--secret", default="", help="SEND_SECRET (required with --go)")
    a = ap.parse_args()

    warm = load_warm(a.csv, a.min_stars, a.since_year)
    sel = warm[a.offset:a.offset + a.limit]
    if not sel:
        print("Nothing selected (check --offset/--limit/filters).")
        return

    # tier summary of the selection
    by_star = {}
    for _, s, _, _ in sel:
        by_star[s] = by_star.get(s, 0) + 1
    print(f"Pool (after filters): {len(warm)}   Selecting [{a.offset}:{a.offset+a.limit}] = {len(sel)}")
    print("Engagement of selection:", {f"{k}*": by_star[k] for k in sorted(by_star, reverse=True)})
    print("First 5:", [e for e, *_ in sel[:5]])

    if not a.go:
        print("\nDRY RUN — nothing sent. Re-run with --go --secret <SEND_SECRET> to send this batch.")
        return
    if not a.secret:
        sys.exit("Refusing to send: --go requires --secret <SEND_SECRET>.")

    html = open(a.html, encoding="utf-8").read()
    emails = [e for e, *_ in sel]
    tot_sent = tot_fail = 0
    fails = []
    for i in range(0, len(emails), CHUNK):
        chunk = emails[i:i + CHUNK]
        res = post(chunk, a.subject, html, a.secret)
        tot_sent += res.get("sent", 0)
        tot_fail += res.get("failed", 0)
        fails += res.get("failures", [])
        print(f"  chunk {i//CHUNK+1}: {res.get('sent')}/{res.get('total')} sent, {res.get('failed')} failed")
    print(f"\nBATCH DONE: sent={tot_sent} failed={tot_fail}")
    if fails:
        print("Failed addresses (send-time rejects):", fails[:20], "..." if len(fails) > 20 else "")
    print("→ Check the Resend dashboard (Emails → Bounces) before the next, larger batch.")


if __name__ == "__main__":
    main()

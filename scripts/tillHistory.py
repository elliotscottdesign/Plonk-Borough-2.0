#!/usr/bin/env python3
"""
Build src/rota/tillHistory.js from Lightspeed exports — the "Historical build"
data for the AI Rota Builder (rota lane).

Two export types are read, most-detailed wins per trading day:
  • Line transactions  (Reports → Transactions, ';'-separated, latin-1):
      products, group, qty, price, till login, minute timestamps.
  • Payments           (Order reports → Payments, ','-separated):
      amount, time, till login — no products. Used for days the line export
      doesn't cover, so the busy-times shadow is never blank.

Trading day: anything before 06:00 belongs to the previous calendar day and is
stored as minutes past midnight + 1440 (matches the roster grid: 1am = 1500).

Usage:
  python3 scripts/tillHistory.py [transactions.csv ...] [payments.csv ...]
  (file type auto-detected from the header)

Refresh: the founder drops a new export → run this → commit. Idempotent.
"""
import csv, json, sys, os, glob, collections
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'rota', 'tillHistory.js')

# Till login → team-member first name (founder mapping, 11 Aug 2026).
LOGIN_TO_NAME = { 'Elliot S': 'Elliot', 'Rhys': 'Rhys', 'Ruby': 'Skye', 'Trial': 'Theo', 'Jonny B': 'Jonny' }

BUCKET = 30  # minutes

def trading(dt):
    """→ (trading_date 'YYYY-MM-DD', minutes past that day's midnight; <06:00 rolls to prev day +1440)"""
    if dt.hour < 6:
        d = (dt - timedelta(days=1)).date()
        return d.isoformat(), dt.hour * 60 + dt.minute + 1440
    return dt.date().isoformat(), dt.hour * 60 + dt.minute

def sniff(path):
    with open(path, 'rb') as f: head = f.read(2000).decode('latin-1')
    if head.startswith('"Identifier";') or ';"Staff";' in head: return 'lines'
    if head.startswith('ID,Date,Status') or ',Gratuity amount,' in head: return 'payments'
    return None

def parse_lines(path, days):
    rows = csv.DictReader(open(path, encoding='latin-1'), delimiter=';')
    for r in rows:
        if r.get('Type') != 'SALE': continue
        try: dt = datetime.strptime(r['Date'], '%d/%m/%y %H:%M')
        except Exception: continue
        price = float(r.get('FinalPrice') or 0)
        qty = float((r.get('Qty') or '0').replace('0E+1', '0') or 0)
        if price <= 0 and qty <= 0: continue
        date, mins = trading(dt)
        day = days.setdefault(date, new_day(date))
        if day['src'] != 'lines':   # lines beat payments for the same day
            days[date] = day = new_day(date); day['src'] = 'lines'
        b = (mins // BUCKET) * BUCKET
        bk = day['buckets'].setdefault(b, {'s': 0.0, 'n': set(), 'by': collections.defaultdict(float)})
        login = (r.get('Staff') or '').split('(')[0].strip()
        bk['s'] += price
        bk['n'].add(r.get('Account') or r.get('Reference'))
        if login: bk['by'][login] += price
        grp = (r.get('Group') or '').split('(')[0].strip() or 'Other'
        day['groups'][grp] = day['groups'].get(grp, 0.0) + price
        item = (r.get('Item') or '').strip()
        if item:
            it = day['items'].setdefault(item, {'q': 0.0, 's': 0.0, 'g': grp})
            it['q'] += qty; it['s'] += price
        if login:
            st = day['staff'].setdefault(login, {'first': mins, 'last': mins, 'sales': 0.0, 'orders': set()})
            st['first'] = min(st['first'], mins); st['last'] = max(st['last'], mins)
            st['sales'] += price; st['orders'].add(r.get('Account') or r.get('Reference'))
        day['total'] += price
        day['first'] = min(day['first'], mins); day['last'] = max(day['last'], mins)

def parse_payments(path, days):
    rows = csv.DictReader(open(path, encoding='utf-8-sig'))
    for r in rows:
        if (r.get('Status') or '').upper() != 'CAPTURED': continue
        try: dt = datetime.strptime(r['Date'], '%Y-%m-%d %H:%M:%S')
        except Exception: continue
        amt = float(r.get('Captured amount') or r.get('Amount') or 0)
        if amt <= 0: continue
        date, mins = trading(dt)
        day = days.setdefault(date, new_day(date))
        if day['src'] == 'lines': continue   # already have the richer source for this day
        day['src'] = 'payments'
        b = (mins // BUCKET) * BUCKET
        bk = day['buckets'].setdefault(b, {'s': 0.0, 'n': set(), 'by': collections.defaultdict(float)})
        login = (r.get('User') or '').strip()
        bk['s'] += amt; bk['n'].add(r.get('Order ID') or r.get('ID'))
        if login: bk['by'][login] += amt
        if login:
            st = day['staff'].setdefault(login, {'first': mins, 'last': mins, 'sales': 0.0, 'orders': set()})
            st['first'] = min(st['first'], mins); st['last'] = max(st['last'], mins)
            st['sales'] += amt; st['orders'].add(r.get('Order ID') or r.get('ID'))
        day['total'] += amt
        day['first'] = min(day['first'], mins); day['last'] = max(day['last'], mins)

def new_day(date):
    return {'date': date, 'src': None, 'total': 0.0, 'first': 10**9, 'last': -1, 'buckets': {}, 'groups': {}, 'items': {}, 'staff': {}}

def finalise(day):
    r2 = lambda x: round(x + 1e-9, 2)
    buckets = []
    for b in sorted(day['buckets']):
        bk = day['buckets'][b]
        buckets.append({'t': b, 's': r2(bk['s']), 'n': len(bk['n']), 'by': {k: r2(v) for k, v in sorted(bk['by'].items())}})
    top = sorted(day['items'].items(), key=lambda kv: -kv[1]['s'])[:8]
    return {
        'date': day['date'], 'src': day['src'],
        'total': r2(day['total']), 'orders': sum(len(bk['n']) for bk in day['buckets'].values()),
        'first': day['first'], 'last': day['last'],
        'buckets': buckets,
        'groups': {k: r2(v) for k, v in sorted(day['groups'].items(), key=lambda kv: -kv[1])},
        'top': [[k, round(v['q']), r2(v['s']), v['g']] for k, v in top],
        'staff': {k: {'first': v['first'], 'last': v['last'], 'sales': r2(v['sales']), 'orders': len(v['orders'])} for k, v in sorted(day['staff'].items())},
    }

def main(argv):
    paths = argv[1:]
    if not paths:
        # Sensible defaults: the founder's usual drop spots.
        home = os.path.expanduser('~')
        paths = glob.glob(os.path.join(home, 'Desktop', '*transactions*.csv')) + glob.glob(os.path.join(home, 'Downloads', 'payments_*.csv')) + glob.glob(os.path.join(home, 'Downloads', '*transactions*.csv'))
    days = {}
    used = []
    # Lines first so they claim their days before payments fill the gaps.
    for p in sorted(paths, key=lambda x: 0 if sniff(x) == 'lines' else 1):
        kind = sniff(p)
        if kind == 'lines': parse_lines(p, days); used.append((kind, os.path.basename(p)))
        elif kind == 'payments': parse_payments(p, days); used.append((kind, os.path.basename(p)))
        else: print('skip (unknown format):', p)
    out = [finalise(d) for _, d in sorted(days.items()) if d['last'] >= 0]
    dates = [d['date'] for d in out]
    body = json.dumps(out, separators=(',', ':'), ensure_ascii=False)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// ─── Till history for the rota "Historical build" (rota lane) ─────────────\n')
        f.write('// GENERATED by scripts/tillHistory.py from Lightspeed exports — do not hand-edit.\n')
        f.write('// Per trading day: 30-min sales buckets (s=£, n=orders, by=£ per till login),\n')
        f.write('// product groups + top items (line export only), and each till login\'s\n')
        f.write('// first→last sale. Times = minutes past midnight (after-midnight +1440).\n')
        f.write(f'// Coverage {dates[0]} → {dates[-1]} · sources: ' + ', '.join(f'{k}:{n}' for k, n in used) + '\n')
        f.write('export const LOGIN_TO_NAME = ' + json.dumps(LOGIN_TO_NAME) + '\n')
        f.write(f'export const TILL_HISTORY_META = {{ from: "{dates[0]}", to: "{dates[-1]}", generated: "{datetime.now().strftime("%Y-%m-%d")}", bucketMin: {BUCKET} }}\n')
        f.write('export const TILL_HISTORY = ' + body + '\n')
    lines_days = sum(1 for d in out if d['src'] == 'lines'); pay_days = len(out) - lines_days
    print(f'wrote {OUT}: {len(out)} trading days ({lines_days} with product detail, {pay_days} payments-only), {dates[0]} → {dates[-1]}, {os.path.getsize(OUT)//1024} KB')

if __name__ == '__main__':
    main(sys.argv)

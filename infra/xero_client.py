"""
XERO CLIENT — the only way anything in this repo is allowed to call Xero.
=========================================================================

WHY THIS EXISTS
---------------
On 15 Sep 2026 a matching job re-downloaded the same 290 PDFs and re-fetched
the same seven pages of bank transactions several times over. It burned all
5,000 of the day's API calls by 1pm and Xero locked the connection for fifteen
hours, on a day the founder had said was a deadline. The work itself was small;
the waste was doing it repeatedly.

Three rules follow from that, and this module enforces them rather than
trusting anyone to remember:

  1. A HARD DAILY BUDGET, well below Xero's real ceiling, that refuses the
     call rather than letting a loop discover the limit the painful way.
  2. FILE CONTENT IS CACHED FOREVER. A document in Xero's file store never
     changes, so downloading one twice is always a bug.
  3. LISTS ARE CACHED FOR MINUTES. Bank transactions change slowly; fetching
     them once per script instead of once per pass removes most of the rest.

Xero's actual limits (per tenant): 5,000 calls/day, 60/minute, 10,000/minute
across all tenants. Exceeding the daily one returns 429 with
X-Rate-Limit-Problem: day and a Retry-After of up to fifteen hours.

USE
---
    from xero_client import Xero
    x = Xero(reason="attach supplier invoices")

    tx    = x.bank_transactions()          # cached 30 min, ~7 calls once
    files = x.files()                      # cached 30 min
    text  = x.file_text(file_id)           # cached forever, PDF read locally
    x.associate(file_id, bank_tx_id)       # a write, budgeted like any call

    print(x.usage())

Anything that needs a raw endpoint uses x.get(path) / x.post(path, body) so it
is still counted. There is deliberately no way to bypass the counter.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

# ── budget ───────────────────────────────────────────────────────────────────
# Xero allows 5,000/day. We stop at 3,000 so that the hourly sweep, the /ops
# receipts screen and any other session still have room. Losing a feature for
# an afternoon is recoverable; losing the whole connection is not.
DAILY_BUDGET = 3_000
WARN_AT = 2_000

# Xero allows 60/minute. 50 leaves headroom for anything else talking to Xero
# at the same time, which on 15 Sep was the thing that actually tripped it.
PER_MINUTE = 50
GAP = 60.0 / PER_MINUTE

STATE = Path.home() / ".nodice" / "xero"
CACHE = STATE / "cache"
DOCS = STATE / "docs"
for d in (STATE, CACHE, DOCS):
    d.mkdir(parents=True, exist_ok=True)

SUPABASE_FN = "https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/finance"
API = "https://api.xero.com/"


class BudgetSpent(RuntimeError):
    """Raised instead of making a call that would eat into the safety margin."""


class Xero:
    def __init__(self, reason: str, secret: str | None = None, pat: str | None = None):
        if not reason:
            raise ValueError("every Xero session states a reason — it goes in the log")
        self.reason = reason
        self._secret = secret or os.environ.get("FINANCE_SECRET", "")
        self._pat = pat or os.environ.get("SUPABASE_PAT", "")
        self._last_call = 0.0
        self._tok = None
        self._tenant = None

    # ── the counter ──────────────────────────────────────────────────────────
    @staticmethod
    def _ledger() -> dict:
        p = STATE / "usage.json"
        try:
            d = json.loads(p.read_text())
        except Exception:
            d = {}
        today = date.today().isoformat()
        if d.get("day") != today:
            d = {"day": today, "calls": 0, "by_reason": {}}
        return d

    def _spend(self, n: int = 1) -> None:
        d = self._ledger()
        if d["calls"] + n > DAILY_BUDGET:
            raise BudgetSpent(
                f"Xero budget spent: {d['calls']}/{DAILY_BUDGET} calls used today "
                f"({d['day']}). Stopping BEFORE Xero's 5,000 ceiling so the "
                f"connection stays alive for the hourly sweep and the /ops screens. "
                f"Cache what you have, do the matching offline, and finish tomorrow."
            )
        d["calls"] += n
        d["by_reason"][self.reason] = d["by_reason"].get(self.reason, 0) + n
        (STATE / "usage.json").write_text(json.dumps(d))
        if d["calls"] == WARN_AT:
            print(f"  ⚠ Xero: {WARN_AT} calls used today — {DAILY_BUDGET - WARN_AT} left before the guard stops you")

    def usage(self) -> str:
        d = self._ledger()
        parts = ", ".join(f"{k}: {v}" for k, v in sorted(d["by_reason"].items(), key=lambda x: -x[1]))
        return f"Xero {d['calls']}/{DAILY_BUDGET} calls today ({parts or 'none'})"

    # ── auth ─────────────────────────────────────────────────────────────────
    def _token(self, force: bool = False):
        """The edge function refreshes if stale; the PAT reads the stored row.

        Neither of these counts against Xero's own limit — they are Supabase.
        """
        if self._tok and not force:
            return self._tenant, self._tok
        urllib.request.urlopen(urllib.request.Request(
            SUPABASE_FN,
            data=json.dumps({"action": "xeroStatus", "secret": self._secret}).encode(),
            headers={"Content-Type": "application/json"},
        )).read()
        row = json.load(urllib.request.urlopen(urllib.request.Request(
            "https://api.supabase.com/v1/projects/rntcujcpsozvuxvmlejv/database/query",
            data=json.dumps({"query": "select tenant_id, access_token from xero_auth where id=1"}).encode(),
            headers={"Authorization": "Bearer " + self._pat, "Content-Type": "application/json"},
        )))[0]
        self._tenant, self._tok = row["tenant_id"], row["access_token"]
        return self._tenant, self._tok

    # ── the one call path ────────────────────────────────────────────────────
    def _call(self, path: str, method: str = "GET", body: bytes | None = None, raw: bool = False):
        self._spend(1)
        gap = GAP - (time.time() - self._last_call)
        if gap > 0:
            time.sleep(gap)
        for attempt in range(4):
            tenant, tok = self._token(force=(attempt > 0))
            headers = {"Authorization": "Bearer " + tok, "Xero-tenant-id": tenant, "Accept": "application/json"}
            if body:
                headers["Content-Type"] = "application/json"
            try:
                r = urllib.request.urlopen(urllib.request.Request(API + path, data=body, method=method, headers=headers))
                self._last_call = time.time()
                data = r.read()
                return data if raw else (json.loads(data) if data.strip()[:1] in b"{[" else data)
            except urllib.error.HTTPError as e:
                self._last_call = time.time()
                if e.code == 401 and attempt < 3:
                    continue
                if e.code == 429:
                    problem = e.headers.get("X-Rate-Limit-Problem", "")
                    retry = int(e.headers.get("Retry-After", "60"))
                    if problem == "day":
                        # Nothing to wait out. Fail loudly and let the caller
                        # save its work rather than spin for fifteen hours.
                        raise BudgetSpent(
                            f"Xero's own DAILY limit is spent — locked out for {retry // 3600}h "
                            f"{retry % 3600 // 60}m. This should be unreachable with the budget "
                            f"guard on; if you are seeing it, something is calling Xero outside "
                            f"this client."
                        ) from None
                    if attempt < 3:
                        time.sleep(retry + 2)
                        continue
                raise

    def get(self, path: str):
        return self._call(path)

    def post(self, path: str, body: dict):
        return self._call(path, "POST", json.dumps(body).encode())

    # ── cached reads ─────────────────────────────────────────────────────────
    def _cached(self, key: str, ttl: int, build):
        p = CACHE / (key + ".json")
        if p.exists() and (time.time() - p.stat().st_mtime) < ttl:
            return json.loads(p.read_text())
        val = build()
        p.write_text(json.dumps(val))
        return val

    def bank_transactions(self, ttl: int = 1800) -> list:
        """Every AUTHORISED transaction. Seven calls, then free for 30 minutes."""
        def build():
            out, page = [], 1
            while True:
                d = self.get(f"api.xro/2.0/BankTransactions?page={page}")
                b = d.get("BankTransactions", [])
                out += b
                if len(b) < 100:
                    break
                page += 1
            return out
        return self._cached("banktransactions", ttl, build)

    def files(self, ttl: int = 1800) -> list:
        def build():
            out, page = [], 1
            while True:
                d = self.get(f"files.xro/1.0/Files?pagesize=100&page={page}")
                items = d.get("Items") or []
                out += items
                if len(items) < 100:
                    break
                page += 1
            return out
        return self._cached("files", ttl, build)

    def file_bytes(self, file_id: str) -> bytes:
        """Cached FOREVER. A file in Xero's store is immutable — re-downloading
        one is the exact mistake that cost 15 September."""
        p = DOCS / file_id
        if p.exists():
            return p.read_bytes()
        data = self._call(f"files.xro/1.0/Files/{file_id}/Content", raw=True)
        if not isinstance(data, (bytes, bytearray)):
            raise RuntimeError(f"unexpected content for {file_id}")
        p.write_bytes(data)
        return data

    def file_text(self, file_id: str, name: str = "") -> str:
        """Extracted text, also cached forever. Costs nothing after the first read."""
        p = DOCS / (file_id + ".txt")
        if p.exists():
            return p.read_text()
        text = ""
        if name.lower().endswith(".pdf") or not name:
            try:
                import fitz  # PyMuPDF
                raw = self.file_bytes(file_id)
                tmp = DOCS / (file_id + ".pdf")
                if not tmp.exists():
                    tmp.write_bytes(raw)
                doc = fitz.open(tmp)
                text = "\n".join(pg.get_text() for pg in doc)
                doc.close()
            except Exception:
                text = ""
        p.write_text(text)
        return text

    # ── the only write we make ───────────────────────────────────────────────
    def associate(self, file_id: str, bank_tx_id: str) -> bool:
        r = self.post(f"files.xro/1.0/Files/{file_id}/Associations",
                      {"ObjectId": bank_tx_id, "ObjectGroup": "BankTransaction",
                       "ObjectType": "BANKTRANSACTION"})
        return bool(r and r.get("ObjectId"))


if __name__ == "__main__":
    print(Xero(reason="usage check").usage())

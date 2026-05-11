# Notes Apps Script — Deploy & Recovery Runbook

This is the one document you read before touching either Notes Apps Script
(`infra/notes-apps-script.gs` for Borough, `infra/notes-apps-script-hackney.gs`
for Hackney). The wrong redeploy gesture is what caused the May 2026 Hackney
notes loss — follow this sheet exactly and that failure mode cannot repeat.

---

## What lives where

| Deck    | Workbook (Google Sheet)                                                                                                | Script file                                  | Frontend wires URL into       |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------- |
| Borough | https://docs.google.com/spreadsheets/d/1dtqbmoKK01oRY-0Zi1ZllVh82NiIGk8eS-l8aKJG_8Y/edit                               | `infra/notes-apps-script.gs`                 | `src/data.js → NOTES_SYNC_URL` |
| Hackney | https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit                               | `infra/notes-apps-script-hackney.gs`         | `src/data/hackney.js → NOTES_SYNC_URL` |

Each script writes into the workbook tab called **`Notes`**, appends an audit
row into **`NotesHistory`**, and (after `installDailyTrigger()` is run once)
snapshots `Notes` daily into a `Notes_Backup_YYYY-MM-DD` tab, retained for 30
days.

---

## Updating the script — the RIGHT way

When you change anything in `notes-apps-script*.gs`:

1. Open the existing Apps Script project (Extensions → Apps Script from inside
   the workbook, **or** the project link in `https://script.google.com/home`).
   It will be called **"Hackney Notes Sync"** or **"Borough Notes Sync"** — NOT
   the lock-sync project.
2. Paste the new file contents over Code.gs. Save (⌘/Ctrl + S).
3. Click **Deploy → Manage deployments**. You will see one row (the active
   web-app deployment).
4. Click the **pencil icon** on that row to edit it.
5. In the "Version" dropdown choose **"New version"** and add a short note.
6. Click **Deploy**.
7. Verify the displayed **Web app URL is unchanged** from what's in the repo's
   `NOTES_SYNC_URL` constant. It MUST be identical character-for-character —
   compare the strings.
8. (One-time, only if you've never run it on this project) Run the
   `installDailyTrigger` function from the Apps Script editor's Run menu to
   register the 03:00 daily snapshot trigger. Subsequent code redeploys do not
   need to repeat this — the trigger persists.

### What NOT to do

- ❌ **Never click "Deploy → New deployment"** to ship a code change. That mints
  a *brand new URL* with no existing data wired to it. The deck will then read
  from an empty backend and the hydrate guard will fire — but only after the
  founder banner gives them a chance to notice. You should never need it.
- ❌ **Never rename the `Notes` tab.** The script literally looks up
  `getSheetByName('Notes')` — rename it and writes silently create a fresh
  blank tab and reads come back empty.
- ❌ **Never delete the `NotesHistory` tab.** Without it you lose the
  append-only audit log; the live `Notes` tab continues working but recovery
  options shrink dramatically.
- ❌ **Never skip the daily-trigger install** on a new project. Without it the
  `Notes_Backup_YYYY-MM-DD` snapshots don't happen and your rollback options
  drop from "any of the last 30 days" to "whatever Google Sheets version
  history kept."

---

## Health check — verify after every redeploy

The script now responds to `GET ?health=1`. From a terminal:

```bash
curl -s "<NOTES_SYNC_URL>?health=1" | jq .
```

Expected:

```json
{
  "health": "ok",
  "sheetId": "1ICwGyn...",
  "sheetName": "Notes",
  "historySheetName": "NotesHistory",
  "sheetRowCount": 4,
  "historyRowCount": 137,
  "backupPrefix": "Notes_Backup_",
  "backupRetentionDays": 30,
  "serverTime": "2026-05-11T11:00:00.000Z"
}
```

If `sheetId` doesn't match what's in this file, you've redeployed against the
wrong workbook — **stop** and re-paste the script into a project bound to the
right workbook before anyone visits the deck.

The founder also gets an in-deck red banner if `sheetRowCount === 0` or the
endpoint is unreachable. Investors never see this banner.

---

## Layers of defence (so this doesn't happen again)

In rough order of how early they catch a problem:

1. **Frontend hydrate guard** (`NotesContext.jsx`). If the server returns a
   blob with fewer pages than the browser's local cache, the local copy is
   kept and a `hydrateWarning` is surfaced. A bad backend can no longer wipe a
   user's browser state on mount.
2. **Server-side empty-write guard** (`doPost` in both scripts). If the
   incoming blob has zero pages but the row on disk has pages, the write is
   refused unless the client explicitly sent `intent: 'delete'`. A misbehaving
   client cannot blank a populated row.
3. **Append-only `NotesHistory` tab.** Every successful write (and every
   refused empty write) appends one row with timestamp, code, op, page id,
   text snippet, page count, and full notes blob JSON. Recovery query: filter
   by `code`, sort by `ts` desc, take the latest non-empty `notes_blob` per
   `page_id`.
4. **Daily snapshot tabs.** `Notes_Backup_YYYY-MM-DD` covers the last 30 days.
   To roll back, right-click a backup tab → Copy to → New sheet → rename to
   `Notes`. Or copy individual rows back into `Notes`.
5. **Email to founder on every save** (5-min throttle per code). Each email
   contains the full JSON blob of that user's notes at the moment of the
   save. Your inbox is a free immutable backup, searchable by access code.
6. **Founder safety banner.** Red top banner on the deck if the health probe
   reports `sheetRowCount === 0` or fails. Only the founder sees it.

---

## Recovery playbook

Open the relevant workbook and pick the freshest source available, in this
order:

1. **`Notes` tab still healthy** — nothing to do; the deck just wasn't reading
   from it. Re-point `NOTES_SYNC_URL` to the right deployment URL.
2. **`Notes` tab is empty/blank but `NotesHistory` has rows** — sort
   `NotesHistory` by `ts` desc, take the most recent `notes_blob` for each
   `(code, page_id)` pair, paste back into `Notes` (one row per code, JSON
   blob in column B).
3. **`NotesHistory` also gone** — open the most recent
   `Notes_Backup_YYYY-MM-DD` tab. Copy it. Rename the copy to `Notes`.
4. **All sheet tabs gone** — File → Version history → See version history;
   roll the whole workbook back to a known-good timestamp.
5. **Workbook itself gone** — search the founder inbox for `Hackney deck —
   note from` (or `Borough deck — note from`). Each email body contains the
   full JSON blob of that user at that moment. Tedious but doable for low row
   counts.

If you need help with any of those, ping in this repo and bring the access
code(s) involved. The history rows + emails should be enough to reconstruct
the state without manual investor outreach.

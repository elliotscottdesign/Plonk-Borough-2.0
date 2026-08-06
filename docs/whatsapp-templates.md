# No Dice — WhatsApp Business (Twilio) message templates

Provider: **Twilio** (WhatsApp Business Platform). These are the message templates to
create in Twilio Console → Messaging → Content Template Builder, then **submit for
WhatsApp (Meta) approval**. Approval is the slow step (hours–days), so submit these
while the account is being set up.

**Categories** (Meta): `UTILITY` = transactional (confirmations/reminders — cheaper, no
opt-in needed if the user has a relationship with us). `MARKETING` = promotional
(needs explicit opt-in + must offer opt-out). Variables use Twilio's `{{1}}`, `{{2}}` form.

Sender: `No Dice`. Keep replies within the 24-hour customer-service window free-form;
these templates are for **business-initiated** messages.

---

## DJs

**dj_dates_open** — MARKETING — vars: 1=name, 2=month, 3=link
> Hi {{1}}, the {{2}} dates at No Dice are now open 🎧 Grab a night before they go:
> {{3}}
> (Reply STOP to opt out.)
*Trigger: the "Email all DJs" blast / auto on "Release next month".*

**dj_booking_confirmed** — UTILITY — vars: 1=name, 2=date, 3=time, 4=link
> Nice one {{1}} — you're confirmed to play No Dice on {{2}} ({{3}}). Details & your
> flyer upload here: {{4}}
*Trigger: admin signs off a DJ's night.*

**dj_set_reminder** — UTILITY — vars: 1=name, 2=day, 3=time, 4=link
> Hi {{1}}, reminder — you're on at No Dice this {{2}} ({{3}}). See you there! Any
> changes: {{4}}
*Trigger: cron, ~2 days before the set.*

**dj_hold_expiry** — UTILITY — vars: 1=name, 2=date, 3=hours, 4=link
> Hi {{1}}, your held No Dice date {{2}} expires in ~{{3}}h — confirm it before it's
> released: {{4}}
*Trigger: cron, when a 24h hold is near expiry.*

## Staff

**staff_shifts_published** — UTILITY — vars: 1=name, 2=month, 3=link
> Hi {{1}}, the {{2}} rota is up at No Dice. Check your shifts & grab any open ones: {{3}}
*Trigger: founder releases/publishes a month's rota.*

**staff_shift_cover** — UTILITY — vars: 1=name, 2=role, 3=date, 4=link
> Hi {{1}}, an open {{2}} shift on {{3}} needs cover at No Dice. Grab it here: {{4}}
*Trigger: a shift is released / dropped and needs filling (to eligible staff).*

**staff_shift_reminder** — UTILITY — vars: 1=name, 2=day, 3=time, 4=link
> Hi {{1}}, reminder: you're working {{2}} at No Dice ({{3}}). Clock in when you
> arrive: {{4}}
*Trigger: cron, day before the shift.*

## Customers — pool & events

**pool_booking_confirmed** — UTILITY — vars: 1=name, 2=type, 3=date
> You're in! {{1}}, your spot for {{2}} pool at No Dice on {{3}} is booked. See you
> there 🎱
*Trigger: a pool ticket is booked (reads the existing booking tables).*

**pool_voucher** — UTILITY — vars: 1=name, 2=place, 3=amount, 4=code
> 🏆 {{1}}, you placed {{2}} at No Dice pool — here's your {{3}} bar tab (code {{4}}).
> Redeem at the bar.
*Trigger: tournament finalised (1st/2nd/3rd) — alongside the existing voucher email.*

**tournament_up_next** — UTILITY — vars: 1=name, 2=table, 3=opponent
> 🎱 {{1}} — get ready, you're up NEXT at No Dice! Come to **table {{2}}** — you're
> playing **{{3}}**. Good luck! 🍀
*Trigger: the tournament engine assigns the match a physical table
(`reassignTables` in the `tournament`/`pingpong` edge fns) — the exact moment the
founder currently runs around the venue rounding people up. Sent to the captain's
`captain_phone` from the booking (walk-up sign-ups capture phone too); one message
per side of the match. Works for pool AND ping pong (var 2 is just the table number).*

**tournament_on_deck** — UTILITY — vars: 1=name, 2=opponent
> 🎱 {{1}}, heads up — your game at No Dice is next in the queue. You're playing
> {{2}}. Stay close to the tables!
*Trigger (optional, phase 2): a match becomes first in line for the next free
table — the "finish your pint" warning before the table-ready message.*

**event_promo** — MARKETING — vars: 1=headline, 2=details, 3=link
> {{1}} at No Dice, London Fields 🎉
> {{2}}
> {{3}}
> (Reply STOP to opt out.)
*Trigger: manual, or auto from the Key Dates tracker when a tracked date is near
(opted-in customer list only).*

## Internal ops

**kitchen_alert** — UTILITY (to management number) — vars: 1=what, 2=date
> ⚠️ No Dice kitchen: {{1}} on {{2}}. Review in /ops → Kitchen.
*Trigger: a failed check or missed opening/closing checklist.*

---

## Wiring (once approved)
Each approved template gets a Twilio **Content SID** (`HX…`). Bring those + the Twilio
**Account SID**, **Auth Token**, and **WhatsApp sender / Messaging Service SID**. They go
in the Supabase edge-function env (server-side, never the browser bundle). Then a shared
`whatsapp` sender (Supabase edge fn) posts to Twilio's API; each feature calls it with the
Content SID + variables + the recipient number. Opt-in state is stored per DJ/customer for
the MARKETING templates.

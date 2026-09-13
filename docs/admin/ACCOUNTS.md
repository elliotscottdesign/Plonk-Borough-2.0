# Account register — who owns the keys

**Why this exists.** No Dice runs on about a dozen third-party services. Several
of them are logged in under **elliotscottdesign@gmail.com**, a personal Gmail,
rather than the company. That is normal for a business built quickly by one
person, and it is worth fixing before it matters rather than after.

The risk is not theft. It is ordinary things: losing the phone that holds the
2FA, an account recovery going wrong, or a buyer or investor asking who
controls the domain and the answer being "Elliot's personal email".

**The fix is almost never migration.** Moving a live service breaks things.
Adding **elliot@nodice.bar** as a second owner or admin gets you 90% of the
protection for a few minutes' work and no downtime. Do that first, everywhere.
Migrate only where a service allows a clean transfer.

---

## The register

Status: 🔴 personal only · 🟡 needs checking · 🟢 company account or company admin added

| Service | What it holds | If access were lost | Account | Status |
|---|---|---|---|---|
| **Cloudflare** | DNS for nodice.bar | Website, team hub, email routing and every link in every email stop working. Nothing else can be fixed until this is. | personal | 🔴 |
| **GitHub** | All the code. Repo is `elliotscottdesign/Plonk-Borough-2.0` | The team hub can still run, but nothing can be changed or redeployed | personal | 🔴 |
| **Supabase** | The database — staff records, rota, bookings, receipts, tips, DJ portal | Every live system stops. This is the single largest store of personal data the company holds | check | 🟡 |
| **Resend** | Sends all transactional email — bookings, rota invites, DJ, newsletters | Customers and staff silently stop receiving anything | personal | 🔴 |
| **Twilio** | SMS (tournament texts; WhatsApp planned) | Match texts and order-ready messages stop | personal | 🔴 |
| **Domain registrar** | Registration of nodice.bar itself, if held apart from Cloudflare | Ultimate control of the domain — outranks Cloudflare | check | 🟡 |
| **Google Workspace** | elliot@nodice.bar, Drive, Apps Script automations | Receipt capture, bills forwarding, every script | company | 🟢 |
| **Xero** | The books | Accounts, VAT, payroll records | company | 🟢 |
| **Lightspeed K-Series** | Till, sales history, daily reports | Trading stops | company | 🟢 |
| **Stripe** | Online payments — No Dice Hackney LTD | Online bookings and ticketing | company | 🟢 |
| **Monzo Business** | The bank | — | company | 🟢 |
| **SumUp / Dojo** | Card terminals | Card payments in the venue | check | 🟡 |
| **Hubdoc** | Being retired — replaced by the receipt capture script | Nothing, once retired | check | 🟡 |

---

## What to do, in order of what it would cost to lose

### 1. Cloudflare
Highest stakes on the list. Cloudflare holds the DNS for nodice.bar, so it
decides where the website, the team hub and your email actually go. Losing it
means losing all of them at once, and being unable to fix anything else because
every other tool is reached through a nodice.bar address.

- Add **elliot@nodice.bar** as an account member with the Super Administrator role
- Check where nodice.bar is actually **registered** — the registrar sits above
  Cloudflare and is the real point of control
- Turn on 2FA if it is not already, and store the recovery codes somewhere that
  is not the same phone

### 2. Supabase
Holds staff records, rota, bookings, DJ details, receipts and tips — the
company's largest store of personal data, which makes it a GDPR
responsibility as well as an operational one.

- Confirm which account owns project `rntcujcpsozvuxvmlejv`
- Invite **elliot@nodice.bar** as an Owner on the organisation
- **Revoke the personal access token issued on 19 Aug 2026** — it was created
  for one job and has been sitting live since

### 3. GitHub
Every line of code, and the deploy pipeline that publishes team.nodice.bar.

- Add **elliot@nodice.bar** as an admin collaborator, or transfer the repo to a
  company organisation
- A transfer keeps the history and redirects old links, so it is safe — but do
  it when nothing is mid-deploy

### 4. Resend and Twilio
Losing these is quieter and therefore worse: nothing breaks visibly, emails and
texts simply stop arriving and you find out from a customer.

- Add **elliot@nodice.bar** as a team member on both
- Note where the API keys live (Supabase edge function secrets) so they can be
  reissued without hunting

---

## Rules from here

**New service, company account.** Anything signed up for from now uses
elliot@nodice.bar. It costs nothing at signup and is painful later.

**Personal account is for personal things.** Keep using it — just not as the
owner of anything the business depends on.

**Two Chrome profiles, one account each.** Work profile signed in only as
elliot@nodice.bar; personal in its own profile. Whichever Google account signs
in first becomes the default for that profile, which is why mixing them keeps
opening the wrong one. Three separate mix-ups on 25 Aug alone, including two
stray Apps Script projects created under the personal account.

---

*Started 26 Aug 2026. Update the status column as each one is done — this file
is the record of who holds the keys.*

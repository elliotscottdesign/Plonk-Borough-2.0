// Supabase Edge Function: dj-admin
// Founder-facing API for the live DJ Calendar + Roster. Auth = SEND_SECRET.
// Deploy --no-verify-jwt. Called from the gated /ops DJ Bookings admin.
//
// POST { secret, action, ...payload }
//   load                 → { djs:[...], slots:[...], receipts:[...] }  (slots include the joined DJ)
//   deleteReceipt {id}   → remove a DJ's logged expense receipt (Payments view)
//   invoiceReceived {date,slot,on,amount?} → tick "invoice landed" (+ capture £)
//   setInvoiceAmount {date,slot,amount}     → set/clear the invoiced £ on a night
//   markPaid {date,slot,on} / invoiceSentAdmin {date,slot,on} → payment status ticks
//   open    {date}       → open a date for booking
//   close   {date}       → close an empty (unbooked) open date
//   signoff {date}       → confirm a pending booking (→ main events calendar)
//   unconfirm {date}     → back to pending
//   removeBooking {date} → free the date (back to open, DJ cleared)
//   editEvent {date,slot,newDate?,nightName,subgenres,setType,promoTrack} → edit a created event in place
//   suspend / unsuspend {date,slot} → hide / re-show a confirmed event on the public feed
//   deleteEvent {date,slot} → remove an event entirely (admin + calendar + public feed)
//   addDj   {profile}    → create a DJ, returns { token }
//   saveDj  {id,profile} → edit a DJ profile
//   removeDj {id}        → delete a DJ
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const now = () => new Date().toISOString();

// ── Email (Resend) — confirmation to the DJ when their night is signed off ──
const RESEND = Deno.env.get("RESEND_API_KEY");
const PORTAL = "https://team.nodice.bar/dj";
const esc = (s: any) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]);
const niceDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "No Dice <elliot@nodice.bar>", to, subject, html }),
    });
  } catch (_) { /* best-effort — never break the sign-off */ }
}
const emailShell = (heading: string, bodyHtml: string, token?: string) =>
  `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#000;color:#fff;padding:28px;border-radius:12px;max-width:560px;margin:auto">
    <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">No Dice · DJ Portal</p>
    <h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
    ${bodyHtml}
    ${token ? `<p style="margin:22px 0"><a href="${PORTAL}?t=${encodeURIComponent(token)}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">Open my portal</a></p>` : ""}
    <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
  </div>`;

async function snapshot(sb: any) {
  const { data: djs, error } = await sb.from("djs").select("*").order("dj_name");
  if (error) return json({ error: error.message }, 500);  // e.g. tables not created yet
  const { data: slots } = await sb.from("dj_slots").select("*, dj:djs(id,dj_name,image_url,instagram,genres,format)").order("date");
  const { data: release } = await sb.from("dj_release_state").select("*").eq("id", 1).maybeSingle();
  // Messages hub: editable templates + inbound DJ notes. Both degrade to [] if
  // the tables haven't been created yet (frontend falls back to default copy).
  const { data: templates } = await sb.from("dj_templates").select("*");
  const { data: notes } = await sb.from("dj_notes").select("*, dj:djs(id,dj_name,image_url,instagram,phone)").order("created_at", { ascending: false }).limit(300);
  // Expense receipts DJs have logged (for the admin Payments view). Degrades to
  // [] if the dj_receipts table isn't created yet.
  const { data: receipts } = await sb.from("dj_receipts").select("id,dj_id,receipt_date,category,amount,note,image_url,created_at").order("receipt_date", { ascending: false }).limit(1000);
  return json({ djs: djs || [], slots: slots || [], release: release || null, templates: templates || [], notes: notes || [], receipts: receipts || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { secret, action, date, slot: slotRaw, id, profile, djId, djId2, nightName, dataUrl, list, source, newDate, subgenres, setType, promoTrack, promoArtist, promoOk, resident, month, mode, key, body, subject, on, amount } = await req.json().catch(() => ({}));
  const slot = slotRaw || "main";   // session-of-the-day (Saturdays: 'main' evening + 'sat_pm' afternoon)
  if (secret !== Deno.env.get("SEND_SECRET")) return json({ error: "unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  switch (action) {
    case "open": {
      const k = [0, 4, 5, 6].includes(new Date(date + "T00:00:00Z").getUTCDay()) ? "session" : "opendecks";
      await sb.from("dj_slots").upsert({ date, slot, status: "open", kind: k }, { onConflict: "date,slot", ignoreDuplicates: true });
      break;
    }
    case "close":
      await sb.from("dj_slots").delete().eq("date", date).eq("slot", slot).eq("status", "open");
      break;
    case "signoff": {
      // HARD RULE (founder, Aug 2026): NOTHING goes live without a promo track —
      // by DJ, founder or anyone. No track listed → the night can't be signed off.
      const { data: sfChk } = await sb.from("dj_slots").select("promo_track").eq("date", date).eq("slot", slot).maybeSingle();
      if (!sfChk || !String((sfChk as any).promo_track || "").trim()) return json({ error: "No promo track on this night — it can't go live. Add the track first (no track, no event)." }, 400);
      await sb.from("dj_slots").update({ status: "confirmed", updated_at: now() }).eq("date", date).eq("slot", slot);
      // Confirmation email to the DJ.
      const { data: row } = await sb.from("dj_slots")
        .select("night_name, dj:djs(dj_name,email,token)").eq("date", date).eq("slot", slot).maybeSingle();
      const d = (row as any)?.dj;
      if (d?.email) {
        const dStr = niceDate(date);
        const link = `${PORTAL}?t=${encodeURIComponent(d.token)}`;
        await sendMail(d.email, `You're confirmed at No Dice — ${dStr} 🎉`,
          `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#000;color:#fff;padding:28px;border-radius:12px;max-width:560px;margin:auto">
            <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">No Dice · DJ Portal</p>
            <h1 style="font-size:22px;margin:0 0 12px">You're confirmed, ${esc(d.dj_name || "")} 🎉</h1>
            <p style="font-size:15px;line-height:1.6;color:#ddd">Your night on <strong style="color:#fff">${dStr}</strong>${(row as any)?.night_name ? ` ("${esc((row as any).night_name)}")` : ""} is locked in at No Dice, London Fields. See you on the decks.</p>
            <p style="font-size:14px;color:#bbb;line-height:1.6">Need to tweak the details or add artwork? You can still edit it from your portal.</p>
            <p style="margin:22px 0"><a href="${link}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">View my booking</a></p>
            <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
          </div>`);
      }
      break;
    }
    case "unconfirm":
      await sb.from("dj_slots").update({ status: "pending", updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "forcePending": {
      // Founder override: push a stuck DJ draft (held) straight to pending so it can
      // be signed off — bypasses the DJ-side booking rules (cap, adjacency, etc).
      // Still needs a promo track (no-track-no-event applies to everyone).
      const { data: fpChk } = await sb.from("dj_slots").select("promo_track").eq("date", date).eq("slot", slot).maybeSingle();
      if (!fpChk || !String((fpChk as any).promo_track || "").trim()) return json({ error: "No promo track on this night — add the track before pushing it through." }, 400);
      await sb.from("dj_slots").update({ status: "pending", held_at: null, reminder_sent: false, updated_at: now() }).eq("date", date).eq("slot", slot).eq("status", "held");
      break;
    }
    case "removeBooking":
      // Free the date AND wipe all booking detail (matches the DJ portal's cancel),
      // including any in-progress 24h hold.
      await sb.from("dj_slots").update({ status: "open", dj_id: null, dj_id2: null, night_name: null, genre: null, genres: [], subgenres: [], promo_track: null, promo_artist: null, promo_ok: false, set_type: null, held_at: null, reminder_sent: false, event_image_url: null, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "editEvent": {
      // Admin edits a created event in place (Events tab). Optionally moves it to a
      // new date; keeps the genre fields + kind consistent with the date's type.
      // HARD RULE: an event must keep a promo track — can't save one without it.
      if (!String(promoTrack || "").trim()) return json({ error: "This night must have a promo track — add one before saving (no track, no event)." }, 400);
      const tgt = (typeof newDate === "string" && newDate) ? newDate : date;
      if (tgt !== date) {
        const { data: clash } = await sb.from("dj_slots").select("date").eq("date", tgt).eq("slot", slot).maybeSingle();
        if (clash) return json({ error: "That date already has a booking in this slot — pick another." }, 409);
      }
      // Detect a genuine lead-DJ swap so neither DJ is silently re-assigned. The
      // Events edit always re-sends the lead, so this only fires on an actual change.
      let oldLead: any = null, newLead: any = null;
      if (djId !== undefined && djId) {
        const { data: cur } = await sb.from("dj_slots").select("dj_id, dj:djs(dj_name,email,token)").eq("date", date).eq("slot", slot).maybeSingle();
        if (cur && (cur as any).dj_id && (cur as any).dj_id !== djId) {
          oldLead = (cur as any).dj;
          const { data: nd } = await sb.from("djs").select("dj_name,email,token").eq("id", djId).maybeSingle();
          newLead = nd;
        }
      }
      const subs = (Array.isArray(subgenres) ? subgenres : String(subgenres || "").split(","))
        .map((x: string) => String(x).trim()).filter(Boolean).slice(0, 4);
      const session = [0, 4, 5, 6].includes(new Date(tgt + "T00:00:00Z").getUTCDay());
      const upd: Record<string, unknown> = {
        night_name: nightName || null, promo_track: (promoTrack || "").trim() || null, promo_artist: (promoArtist || "").trim() || null,
        kind: session ? "session" : "opendecks", updated_at: now(),
      };
      if (session) { upd.subgenres = subs; upd.genres = subs; upd.genre = subs.join(" / ") || null; upd.set_type = null; }
      else { upd.subgenres = []; upd.genres = []; upd.genre = null; upd.set_type = setType || "dj_set"; }
      if (djId !== undefined && djId) upd.dj_id = djId;       // change the lead DJ (admin only)
      if (djId2 !== undefined) upd.dj_id2 = djId2 || null;    // add/change/clear the back-to-back partner
      if (tgt !== date) upd.date = tgt;
      const { error } = await sb.from("dj_slots").update(upd).eq("date", date).eq("slot", slot);
      if (error) return json({ error: error.message }, 500);
      if (oldLead || newLead) {
        const dStr = niceDate(tgt);
        if (oldLead?.email) await sendMail(oldLead.email, `Update to your No Dice night — ${dStr}`, emailShell(`A change to ${dStr}`,
          `<p style="font-size:15px;line-height:1.6;color:#ddd">Hi ${esc(oldLead.dj_name || "")}, your night on <strong style="color:#fff">${dStr}</strong> has been reassigned by No Dice. If that's a surprise, give us a shout.</p>`, oldLead.token));
        if (newLead?.email) await sendMail(newLead.email, `You're on at No Dice — ${dStr}`, emailShell(`You're booked for ${dStr}`,
          `<p style="font-size:15px;line-height:1.6;color:#ddd">Hi ${esc(newLead.dj_name || "")}, No Dice has put you on the night on <strong style="color:#fff">${dStr}</strong>. Open your portal to add your track and artwork.</p>`, newLead.token));
      }
      break;
    }
    case "suspend":
      await sb.from("dj_slots").update({ suspended: true, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "unsuspend":
      await sb.from("dj_slots").update({ suspended: false, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "deleteEvent":
      // Remove the event entirely — gone from admin, the calendar and the public feed.
      await sb.from("dj_slots").delete().eq("date", date).eq("slot", slot);
      break;
    case "eventPhoto": {
      // Per-event artwork (overrides the DJ's profile photo for this night only).
      // Admin-built nights can have artwork set here; the DJ can also change it.
      const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
      if (!m) return json({ error: "bad image" }, 400);
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      const ext = m[1].includes("png") ? "png" : "jpg";
      const key = `events/${date}-${slot}.${ext}`;
      const up = await sb.storage.from("dj-photos").upload(key, bytes, { contentType: m[1], upsert: true });
      if (up.error) return json({ error: up.error.message }, 500);
      const { data: p } = sb.storage.from("dj-photos").getPublicUrl(key);
      await sb.from("dj_slots").update({ event_image_url: `${p.publicUrl}?v=${Date.now()}`, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    }
    case "removeEventPhoto":
      await sb.from("dj_slots").update({ event_image_url: null, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "book": {
      // HARD RULE: no promo track → the night can't be booked (no track, no event).
      if (!String(promoTrack || "").trim()) return json({ error: "Add a promo track before booking the night — no track, no event." }, 400);
      // Admin builds a night for a DJ. Uses the details from the admin form when
      // passed (so admins have the full DJ toolkit), else seeds display genres
      // from the DJ's profile. The DJ can still refine via their portal.
      const { data: dj } = await sb.from("djs").select("genres").eq("id", djId).maybeSingle();
      const session = [0, 4, 5, 6].includes(new Date(date + "T00:00:00Z").getUTCDay());
      const passed = (Array.isArray(subgenres) ? subgenres : String(subgenres || "").split(","))
        .map((x: string) => String(x).trim()).filter(Boolean).slice(0, 4);
      const subs = passed.length ? passed : String(dj?.genres || "").split("/").map((x: string) => x.trim()).filter(Boolean).slice(0, 4);
      await sb.from("dj_slots").upsert({
        date, slot, dj_id: djId, dj_id2: djId2 || null, status: "pending", night_name: nightName || null,
        genre: session ? (subs.join(" / ") || dj?.genres || null) : null,
        genres: session ? subs : [], subgenres: session ? subs : [],
        kind: session ? "session" : "opendecks",
        set_type: session ? null : (setType || "dj_set"),
        promo_track: (promoTrack || "").trim() || null, promo_artist: (promoArtist || "").trim() || null, promo_ok: !!promoOk,
        updated_at: now(),
      }, { onConflict: "date,slot" });
      break;
    }
    case "addDj": {
      const f = profile || {};
      const st = f.status === "pending" ? "pending" : "vetted";
      const { data, error } = await sb.from("djs").insert({
        dj_name: f.dj_name || "New DJ", real_name: f.real_name || null, genres: f.genres || null,
        instagram: f.instagram || null, format: f.format || null, phone: f.phone || null, email: f.email || null,
        status: st, source: f.source || "manual",
        vetted_at: st === "vetted" ? now() : null,
      }).select("id, token").maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ id: data?.id, token: data?.token });
    }
    case "approve":
      await sb.from("djs").update({ status: "vetted", vetted_at: now(), updated_at: now() }).eq("id", id);
      break;
    case "unapprove":
      await sb.from("djs").update({ status: "pending", vetted_at: null, updated_at: now() }).eq("id", id);
      break;
    case "setResident":
      // Resident tier — guaranteed-monthly DJs who get first dibs on new dates.
      await sb.from("djs").update({ resident: !!resident, updated_at: now() }).eq("id", id);
      break;
    case "releaseStart": {
      // Start the monthly resident release in the chosen order. 'everyone' opens
      // to all immediately (no resident priority window).
      const everyone = mode === "everyone";
      await sb.from("dj_release_state").upsert({ id: 1, month: month || null, release_mode: mode || "fresh_first", started_at: now(), opened_all_at: everyone ? now() : null, updated_at: now() }, { onConflict: "id" });
      break;
    }
    case "openMonth": {
      // Bulk-open every bookable night (Mon-Sat) in the given month ("YYYY-MM").
      // Saturday gets two slots (sat_pm afternoon + main evening). Idempotent —
      // existing rows (booked or already open) are left untouched. Skips past dates.
      const mt = /^(\d{4})-(\d{2})$/.exec(String(month || ""));
      if (!mt) return json({ error: "bad month (expected YYYY-MM)" }, 400);
      const yr = +mt[1], mo = +mt[2] - 1;
      const today = now().slice(0, 10);
      const daysIn = new Date(Date.UTC(yr, mo + 1, 0)).getUTCDate();
      // One-off dates that override the weekday pattern. Keep in sync with api.js
      // SPECIAL_DATES. 30 Aug bank-holiday Sunday keeps TWO sessions; September
      // Sundays = ONE paid session, 4–8pm.
      const SPECIAL_DATES: Record<string, { slot: string; kind: string }[]> = {
        "2026-08-30": [{ slot: "sat_pm", kind: "session" }, { slot: "main", kind: "session" }],
        "2026-09-06": [{ slot: "main", kind: "session" }],
        "2026-09-13": [{ slot: "main", kind: "session" }],
        "2026-09-20": [{ slot: "main", kind: "session" }],
        "2026-09-27": [{ slot: "main", kind: "session" }],
      };
      const rows: Record<string, unknown>[] = [];
      for (let d = 1; d <= daysIn; d++) {
        const dateStr = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (dateStr < today) continue;
        if (SPECIAL_DATES[dateStr]) { for (const x of SPECIAL_DATES[dateStr]) rows.push({ date: dateStr, slot: x.slot, status: "open", kind: x.kind }); continue; }
        const wd = new Date(dateStr + "T00:00:00Z").getUTCDay();
        const session = [0, 4, 5, 6].includes(wd);   // Thu/Fri/Sat = paid; Sun-Wed = Open Decks
        rows.push({ date: dateStr, slot: "main", status: "open", kind: session ? "session" : "opendecks" });
        if (wd === 6) rows.push({ date: dateStr, slot: "sat_pm", status: "open", kind: "session" });
      }
      if (rows.length) await sb.from("dj_slots").upsert(rows, { onConflict: "date,slot", ignoreDuplicates: true });
      break;
    }
    case "releaseOpenAll":
      await sb.from("dj_release_state").update({ opened_all_at: now(), updated_at: now() }).eq("id", 1);
      break;
    case "releaseReset":
      await sb.from("dj_release_state").update({ started_at: null, opened_all_at: null, month: null, updated_at: now() }).eq("id", 1);
      break;
    case "saveTemplate":
      // Edit the WhatsApp copy a template sends ({name}/{link}/{month} fill per DJ).
      if (!key) return json({ error: "missing template key" }, 400);
      await sb.from("dj_templates").upsert({ key, body: String(body ?? ""), updated_at: now() }, { onConflict: "key" });
      break;
    case "blastEmail": {
      // One-click "dates are open" email. Recipients are derived HERE from our own
      // roster — never a client-supplied list — so the secret can't be used to spam
      // arbitrary addresses. Client sends only the month, subject and message body.
      const subj = String(subject || "New dates at No Dice").slice(0, 200);
      const monthLbl = String(month || "").slice(0, 40);
      const bodyTpl = String(body || "").slice(0, 4000);
      if (!bodyTpl.trim()) return json({ error: "no message body" }, 400);
      const { data: roster } = await sb.from("djs").select("dj_name, email, token, status").neq("status", "pending");
      const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
      const seen = new Set<string>();
      let sent = 0;
      for (const d of roster || []) {
        const email = String(d?.email || "").trim();
        if (!email || !/.+@.+\..+/.test(email) || !d?.token) continue;
        const key = email.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const link = `${PORTAL}?t=${encodeURIComponent(d.token)}`;
        const text = fill(bodyTpl, { name: d.dj_name || "there", link, month: monthLbl });
        const html = emailShell("The dates are open 🎧", `<p style="color:#ccc;line-height:1.6;white-space:pre-line">${esc(text)}</p>`);
        await sendMail(email, subj, html);
        if (++sent >= 400) break;
      }
      return json({ ok: true, sent });
    }
    case "markNoteRead":
      await sb.from("dj_notes").update({ read_at: now() }).eq("id", id);
      break;
    case "markAllNotesRead":
      await sb.from("dj_notes").update({ read_at: now() }).is("read_at", null);
      break;
    case "deleteNote":
      await sb.from("dj_notes").delete().eq("id", id);
      break;
    case "invoiceReceived": {
      // Founder ticks that the invoice has landed (+ the £ amount off it). Gmail
      // scan (phase 3) will set the same fields automatically.
      const amt = amount === undefined || amount === null || amount === "" ? undefined : Math.max(0, Math.round((Number(amount) || 0) * 100) / 100);
      const upd: Record<string, unknown> = { invoice_received_at: on ? now() : null, updated_at: now() };
      if (amt !== undefined) upd.invoice_amount = amt;
      if (!on) upd.invoice_amount = null;   // clearing "landed" also clears the captured amount
      await sb.from("dj_slots").update(upd).eq("date", date).eq("slot", slot);
      break;
    }
    case "setInvoiceAmount":
      await sb.from("dj_slots").update({ invoice_amount: (amount === "" || amount === null || amount === undefined) ? null : Math.max(0, Math.round((Number(amount) || 0) * 100) / 100), updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "markPaid":
      // Founder marks the night paid / un-paid.
      await sb.from("dj_slots").update({ paid_at: on ? now() : null, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "invoiceSentAdmin":
      // Founder can also tick "invoice sent" on a DJ's behalf.
      await sb.from("dj_slots").update({ invoice_sent_at: on ? now() : null, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "deleteReceipt":
      // Remove a DJ's logged expense receipt (e.g. a mistaken/duplicate one).
      await sb.from("dj_receipts").delete().eq("id", id);
      break;
    case "bulkAdd": {
      // Drop a list of contacts in as PENDING (e.g. Instagram handles, a new sheet).
      const rows = (Array.isArray(list) ? list : []).filter((r: any) => r && (r.dj_name || r.instagram)).map((r: any) => ({
        dj_name: String(r.dj_name || (r.instagram || "").replace(/^@/, "") || "New DJ").slice(0, 120),
        real_name: r.real_name || null, genres: r.genres || null, instagram: r.instagram || null,
        format: r.format || null, phone: r.phone || null, email: r.email || null,
        status: "pending", source: source || "manual",
      }));
      if (!rows.length) return json({ added: 0 });
      const { data, error } = await sb.from("djs").insert(rows).select("id");
      if (error) return json({ error: error.message }, 500);
      return json({ added: (data || []).length });
    }
    case "saveDj": {
      const f = profile || {};
      await sb.from("djs").update({
        dj_name: f.dj_name, real_name: f.real_name, genres: f.genres, instagram: f.instagram,
        format: f.format, phone: f.phone, email: f.email, image_url: f.image_url,
        soundcloud: f.soundcloud, spotify: f.spotify, youtube: f.youtube, updated_at: now(),
      }).eq("id", id);
      break;
    }
    case "photo": {
      const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
      if (!m) return json({ error: "bad image" }, 400);
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      const ext = m[1].includes("png") ? "png" : "jpg";
      const up = await sb.storage.from("dj-photos").upload(`${id}.${ext}`, bytes, { contentType: m[1], upsert: true });
      if (up.error) return json({ error: up.error.message }, 500);
      const { data: p } = sb.storage.from("dj-photos").getPublicUrl(`${id}.${ext}`);
      await sb.from("djs").update({ image_url: `${p.publicUrl}?v=${Date.now()}`, updated_at: now() }).eq("id", id);
      break;
    }
    case "removeDj":
      await sb.from("djs").delete().eq("id", id);
      break;
    case "load":
    default:
      break;
  }
  return snapshot(sb);
});

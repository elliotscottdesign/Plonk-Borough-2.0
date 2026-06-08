// Supabase Edge Function: confirm-optin
// The "Yes, keep me in" link in the re-introduction campaign. When a held
// contact (consent=false) clicks it, we flip them to consent=true and
// unsubscribed=false — i.e. they join the active, emailable list of their
// own free will. This is what makes the reactivation campaign GDPR-clean:
// only people who actively confirm become emailable.
//
// Opened from an email link (GET), no auth — deploy with `--no-verify-jwt`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const email = new URL(req.url).searchParams.get("e")?.toLowerCase();
  if (!email) return new Response("Missing email", { status: 400 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await sb.from("subscribers").update({ consent: true, unsubscribed: false }).eq("email", email);
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're in</title></head>
     <body style="font-family:Arial,Helvetica,sans-serif;text-align:center;padding:64px 24px;color:#fff;background:#000;">
      <h2 style="font-family:Georgia,'Times New Roman',serif;color:#DA1B33;letter-spacing:0.04em;">You're in 🎲</h2>
      <p style="font-size:16px;line-height:1.6;max-width:460px;margin:12px auto 0;color:rgba(255,255,255,0.85);">
        Brilliant — we'll keep you posted on the opening, events and new drinks at
        <strong>No Dice, London Fields</strong>.<br><br>
        407 Mentmore Terrace, Hackney, E8 3PH · Opens 17 June.
      </p>
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:28px;">${email} · You can unsubscribe any time from any email we send.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
});

// Supabase Edge Function: unsubscribe
// One-click unsubscribe from the email footer link. Flips unsubscribed=true.
// Deploy with `--no-verify-jwt` (it's opened from an email, no auth).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const email = new URL(req.url).searchParams.get("e")?.toLowerCase();
  if (!email) return new Response("Missing email", { status: 400 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await sb.from("subscribers").update({ unsubscribed: true }).eq("email", email);
  return new Response(
    `<!doctype html><html><body style="font-family:Arial,sans-serif;text-align:center;padding:64px 24px;color:#222;">
      <h2 style="font-family:Georgia,serif;">You're unsubscribed</h2>
      <p>${email} won't receive any more emails from No Dice.<br>Sorry to see you go — you can re-join any time at nodice.bar.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
});

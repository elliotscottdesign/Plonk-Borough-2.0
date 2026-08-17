// ─── help-out — RETIRED 16 Aug 2026 ──────────────────────────────────────────
// The volunteer drive did its job: No Dice opened at London Fields. The founder
// asked for Help Out to be removed from the system entirely, so this endpoint is
// now closed to everyone.
//
// WHY THIS STUB EXISTS AT ALL, rather than deleting the deployed function:
// the old sign-up form was shared widely by text and the endpoint was public
// (no secret, CORS open to every origin), so anything still holding the URL —
// an old tab, a cached bundle, a bot that scraped it — would keep POSTing
// sign-ups into `bar_helpers` forever. A deployed stub that refuses everything
// is the only way to actually SHUT it; an un-deployed function would just leave
// the last live version running.
//
// NOTHING WAS DELETED. The `bar_helpers` table and every volunteer record are
// untouched, and the full original function (56 KB — sign-ups, job assignment,
// helper tokens, reminder emails, admin actions) is archived in this repo at
//   supabase/archive/help-out-index.ts
// To bring Help Out back: copy that file over this one, redeploy with
//   supabase functions deploy help-out --no-verify-jwt
// and restore the front end from git (commit that removed it).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // 410 Gone — the correct answer for a resource that existed and is retired on
  // purpose. Every action (signup, availability, myload, admin*) ends up here.
  return new Response(
    JSON.stringify({
      ok: false,
      retired: true,
      error:
        "The No Dice Help Out volunteer sign-up has closed — thank you to everyone who pitched in. This service is no longer available.",
    }),
    { status: 410, headers: { ...CORS, "Content-Type": "application/json" } },
  );
});

// Supabase Edge Function: twiml-record
// Tiny voice-webhook for the No Dice Twilio number (+1 413 771 4635):
// answers any incoming call and records it (with transcription) so
// spoken verification codes — e.g. Meta/WhatsApp "call me instead"
// codes — can be read back from the Twilio API. No auth: Twilio
// fetches this URL directly when a call comes in.
Deno.serve(() => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Record playBeep="false" maxLength="50" trim="do-not-trim" transcribe="true"/>
</Response>`;
  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
});

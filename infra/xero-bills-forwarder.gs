/**
 * XERO BILLS AUTO-FORWARDER — No Dice Hackney Ltd
 * ------------------------------------------------
 * Runs on elliot@nodice.bar. Every 15 minutes it finds recent supplier
 * emails that carry an attachment (the invoice PDF), forwards them to
 * Xero's bills inbox, and labels them "SentToXero" so nothing is ever
 * forwarded twice. Xero turns each attachment into a draft bill.
 *
 * SETUP (one time, ~2 minutes):
 *  1. Go to script.google.com while signed in as elliot@nodice.bar
 *  2. New project → name it "Xero Bills Forwarder"
 *  3. Select all in the editor, delete, paste this whole file, Save
 *  4. Run ▶ the function "setup" once → approve the permissions popup
 *     (it asks for Gmail access — that's the point)
 *  That's it. "setup" creates the 15-minute timer itself.
 */

// Xero's email-to-bills address for No Dice Hackney Ltd
const XERO_BILLS_EMAIL = 'bills.ozmxz4.b8m1t4ifk9c8bogl@xerofiles.com';

// Emails FROM these senders (with attachments) are forwarded automatically.
const SUPPLIER_SENDERS = [
  'thedrinksclub.com',                    // The Drinks Club invoices & orders
  'ebilling_uk@boc.com',                  // BOC gas
  'boconline.co.uk',                      // BOC (other notices)
  'messaging-service@post.xero.com',      // Fine Cider, BCS, Five Points (send via Xero)
  'breww.email',                          // Umbrella Brewing
  'quickbooks@notification.intuit.com',   // Friendly Waste
  'orders@valimex.co.uk',                 // Valimex produce
  'jalpurmillersonline.com',              // Jalpur Millers
  'billing.uk@lightspeedhq.com',          // Lightspeed subscription
  'payments-noreply@google.com',          // Google Workspace
  'info.uk@quatra.com',                   // Quatra used-oil (self-billing)
  'noreply@post.dearsystems.com',         // Top Cuvée wine
];

// Any OTHER email with an attachment whose subject mentions an invoice is
// also forwarded (catches DJs / staff / one-off suppliers).
const SUBJECT_CATCH = 'subject:(invoice OR receipt OR statement)';

const LABEL_NAME = 'SentToXero';

function setup() {
  // idempotent: clear old triggers for this handler, then create one
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'forwardBills') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('forwardBills').timeBased().everyMinutes(15).create();
  GmailApp.getUserLabelByName(LABEL_NAME) || GmailApp.createLabel(LABEL_NAME);
  forwardBills(); // run once now
}

function forwardBills() {
  var label = GmailApp.getUserLabelByName(LABEL_NAME) || GmailApp.createLabel(LABEL_NAME);
  var fromQuery = 'from:(' + SUPPLIER_SENDERS.join(' OR ') + ')';
  var queries = [
    'has:attachment newer_than:2d -label:' + LABEL_NAME + ' ' + fromQuery,
    'has:attachment newer_than:2d -label:' + LABEL_NAME + ' ' + SUBJECT_CATCH,
  ];
  var seen = {};
  queries.forEach(function (q) {
    GmailApp.search(q, 0, 50).forEach(function (thread) {
      if (seen[thread.getId()]) return;
      seen[thread.getId()] = true;
      var msgs = thread.getMessages();
      var msg = msgs[msgs.length - 1]; // newest message in the thread
      if (msg.getAttachments({ includeInlineImages: false }).length === 0) return;
      msg.forward(XERO_BILLS_EMAIL, {
        subject: msg.getSubject(),
      });
      thread.addLabel(label);
    });
  });
}

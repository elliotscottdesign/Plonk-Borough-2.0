/**
 * NO DICE HACKNEY — RECEIPT CAPTURE
 * =================================
 * Finds receipts in elliot@nodice.bar and files them into Xero as PDFs.
 *
 * WHAT MAKES THIS DIFFERENT FROM HUBDOC / THE OLD BILLS FORWARDER
 * --------------------------------------------------------------
 * 1. It sends to Xero's FILES inbox, not the BILLS inbox. The Files inbox
 *    parks a document and creates nothing. The Bills inbox turns every email
 *    into a draft bill — that is where ~£6,000 of fake bills came from
 *    (statements, order acknowledgements, superseded invoices).
 * 2. It never invents a transaction. Hubdoc publishes "spend money" out of
 *    thin air when it can't find a bank line to match, which put the bank
 *    £14.12 out on 16 Aug 2026.
 * 3. It never guesses a date off a photo. Every date here comes from the
 *    email itself. Hubdoc mis-read two handwritten slips as 2020 instead of
 *    2026 (£69 and £48), one of which hid £48 of cost in the wrong year.
 *
 * THE BIT THAT MATTERS MOST
 * -------------------------
 * Most receipts have NO ATTACHMENT. Of 23 captured by hand on 16 Aug 2026,
 * not one did — Toast (E5 Bakehouse), Square (Ice Ice Baby), SumUp and Dojo
 * (Mare Street Market) all put the receipt in the email body or behind a
 * link. Anything that only watches for attachments finds nothing. So this
 * script, in order of preference:
 *      a) uses a real PDF/image attachment if there is one;
 *      b) else follows the receipt link in the body and renders that page;
 *      c) else renders the email body itself.
 *
 * FIRST RUN IS SAFE: DRY_RUN is true, so it only reports what it WOULD file.
 * Nothing is sent to Xero until you set DRY_RUN to false.
 *
 * SETUP
 *   1. Save this file.
 *   2. Run  installTrigger  once (Run menu → installTrigger). Approve access.
 *   3. Run  run  once. You'll get a preview email listing what it found.
 *   4. Happy? Set DRY_RUN to false, save, run  run  again.
 */

var CONFIG = {

  // Xero → Files → "Email to Files Inbox". NOT the bills.* address.
  XERO_FILES_INBOX: 'xero.inbox.ozmxz4.b8m1t4ifk9c8bogl@xerofiles.com',

  // Where the run report goes.
  REPORT_TO: 'elliot@nodice.bar',

  // true  = report only, send nothing to Xero (safe)
  // false = actually file the receipts
  DRY_RUN: false,

  // How far back to look on each run. Gmail labels stop anything being
  // filed twice, so a generous window is fine.
  LOOKBACK_DAYS: 60,

  // Don't file anything dated before this.
  //
  // Set to 17 Aug 2026, the day this went live — NOT the first trading day.
  // The back catalogue (19 Jun – 16 Aug) was attached to its bank payments by
  // hand: 23 receipts, £645.68. Re-filing those would only put duplicate
  // copies in the Xero files inbox. This date is the line between "done by
  // hand" and "handled automatically".
  //
  // If you ever need to sweep older mail, move this back, run once, then
  // put it forward again.
  EARLIEST: '2026-08-17',

  // Safety cap per run.
  MAX_PER_RUN: 60,

  LABEL_FILED:  'Receipts/Filed',
  LABEL_REVIEW: 'Receipts/Needs review',

  // ── Supplier invoices ────────────────────────────────────────────────────
  // Separate from receipts, and it goes somewhere different. A receipt is
  // evidence for card spend; a supplier invoice is the paperwork behind a
  // payment made on terms, often weeks later. Both end up attached to the
  // bank payment, but the matching window is completely different, so they
  // are marked as they are sent.
  FINANCE_FN:   'https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/finance',
  FINANCE_KEY:  '33394275513216b85489a6f16f61fb6646ace49365b12f74',
  LABEL_INVOICE: 'Receipts/Invoice filed'
};

/**
 * Where the trade invoices come from.
 *
 * The audit on 20 Aug found £23,416 of undocumented spend across these five —
 * the single biggest hole in the books, and every invoice is already sitting
 * in this mailbox.
 *
 * `not` is doing real work. The Drinks Club sends order acknowledgements from
 * a different address with "(This is not an Invoice)" in the subject, and
 * treating those as invoices is exactly what put ~£6,000 of fake bills into
 * Xero in August. An order is not an invoice; a statement is not an invoice.
 */
var INVOICE_SOURCES = [
  { supplier: 'The Drinks Club',
    query: 'from:accounts@thedrinksclub.com subject:invoice',
    not: /not an invoice|statement|order/i,
    ref: /invoice\s+(\d{6,})/i },

  { supplier: 'The Five Points Brewing Company',
    query: 'subject:"from The Five Points Brewing Company"',
    not: /statement|credit/i,
    ref: /invoice\s+([A-Z]{1,3}-?\d+)/i },

  { supplier: 'Top Cuvee (Shop Cuvee Ltd)',
    query: '(from:cuvee OR subject:cuvee) (subject:invoice OR has:attachment)',
    not: /statement|delivery|order confirmation/i,
    ref: /(?:invoice|inv)[^A-Za-z0-9]{0,3}([A-Z0-9-]{3,})/i },

  { supplier: 'Umbrella Brewing',
    query: '(from:umbrella OR subject:umbrella) (subject:invoice OR has:attachment)',
    not: /statement|delivery/i,
    ref: /(?:invoice|inv)[^A-Za-z0-9]{0,3}([A-Z0-9-]{3,})/i },

  { supplier: 'The Fine Cider Company',
    query: '(from:finecider OR from:"fine cider" OR subject:"fine cider") (subject:invoice OR subject:receipt OR has:attachment)',
    not: /statement/i,
    ref: /(?:invoice|inv|receipt)[^A-Za-z0-9]{0,3}([A-Z0-9#-]{3,})/i }
];

/**
 * Where receipts come from.
 *
 * query    — Gmail search. Keep it tight; a loose query files junk.
 * supplier — how to pull the shop's name out of the subject line.
 *            Give a regex with one capture group, or a fixed string.
 *
 * TO ADD A NEW SUPPLIER: copy a block, change the query, save. Nothing else.
 */
var SOURCES = [
  {
    id: 'toast',
    query: 'from:no-reply@toasttab.com subject:receipt',
    supplier: /at\s+(.+?)\s+-\s+\d/i,          // "... at E5 Bakehouse - London Fields - 396 ..."
    fallbackSupplier: 'Toast'
  },
  {
    id: 'square',
    query: 'from:messenger@messaging.squareup.com subject:receipt',
    supplier: /Receipt from\s+(.+?)\s+#/i,     // "Receipt from Ice Ice Baby Ltd #lQHG"
    fallbackSupplier: 'Square'
  },
  {
    id: 'dojo',
    query: 'from:noreply@dojo.tech subject:receipt',
    supplier: /receipt from\s+(.+)$/i,         // "Your receipt from Mare Street Market"
    fallbackSupplier: 'Dojo'
  },
  {
    id: 'sumup',
    query: 'subject:"SumUp Receipt"',
    supplier: null,
    fallbackSupplier: 'SumUp',
    allowSelf: true                            // SumUp receipts arrive self-sent
  },
  {
    // THE CATCH-ALL THAT MATTERS.
    //
    // Anything you forward to yourself is an explicit "file this" — that is
    // the whole point of bothering to forward it. It does not need to be from
    // a shop we already know about, and it does not need an attachment.
    // Without this, a receipt from a supplier not on the list above (Ozone,
    // any new café, a one-off) is invisible no matter what you do with it.
    //
    // Requires a currency amount somewhere so ordinary notes-to-self don't
    // get filed as spending.
    id: 'forwarded',
    query: 'from:me to:me',
    supplier: null,
    fallbackSupplier: null,
    allowSelf: true,
    oncePerThread: true,                       // a self-send lands twice; file once
    needsAmount: true
  },
  {
    id: 'stripe',
    query: 'from:stripe.com subject:receipt',
    supplier: /Your\s+(.+?)\s+receipt/i,       // "Your Lightspeed POS UK Ltd receipt [#...]"
    fallbackSupplier: 'Stripe'
  }

  // DELIBERATELY NOT HERE: a catch-all for "has:attachment subject:invoice".
  // The first preview run (17 Aug 2026) showed why. It pulled in 32 supplier
  // invoices — Five Points, The Drinks Club, BOC, Google Workspace, Storage
  // Solutions and the staff invoices from Skye, Theo and Nicola. Those are
  // unpaid bills, not receipts for money already spent. They belong in the
  // BILLS inbox, which the separate forwarder already handles, and filing
  // them here would just have made a pile of unattached duplicates.
  // This script's job is narrow on purpose: evidence for card spend that has
  // already left the bank.
];

/**
 * Receipts we issued, not ones we were given.
 * Stripe emails a copy of every payment TAKEN as well as every payment made,
 * so the first run picked up "Your No Dice Hackney LTD receipt" for a £22
 * customer booking — income, not a cost. Anything whose supplier matches
 * this is skipped.
 */
var OUR_OWN_NAMES = /no\s*dice|plonk/i;

/** Receipt pages we know how to fetch directly. */
var RECEIPT_LINKS = [
  /https:\/\/www\.toasttab\.com\/receipts\/[A-Za-z0-9_\-\/]+/,
  /https:\/\/squareup\.com\/r\/[A-Za-z0-9]+/,
  /https:\/\/sales-receipt\.sumup\.com\/[^\s"'<>]+/
];


/* ------------------------------------------------------------------ */
/* MAIN                                                               */
/* ------------------------------------------------------------------ */

/**
 * Apps Script passes an event object when a trigger fires, and nothing when
 * you press Run yourself. That is how we tell the two apart: a scheduled run
 * that found nothing stays quiet, but pressing Run always reports back so you
 * are never left wondering whether it worked.
 */
function run(e) {
  var isManual = !e;
  var filed = [], review = [], skipped = 0;
  var labelFiled  = ensureLabel_(CONFIG.LABEL_FILED);
  var labelReview = ensureLabel_(CONFIG.LABEL_REVIEW);
  var earliest = new Date(CONFIG.EARLIEST + 'T00:00:00');
  var count = 0;

  for (var s = 0; s < SOURCES.length; s++) {
    var src = SOURCES[s];
    var q = src.query
          + ' newer_than:' + CONFIG.LOOKBACK_DAYS + 'd'
          + ' -label:"' + CONFIG.LABEL_FILED + '"'
          + ' -label:"' + CONFIG.LABEL_REVIEW + '"';

    var threads;
    try {
      threads = GmailApp.search(q, 0, 100);
    } catch (e) {
      review.push({ supplier: src.id, why: 'Gmail search failed: ' + e });
      continue;
    }

    for (var t = 0; t < threads.length; t++) {
      if (count >= CONFIG.MAX_PER_RUN) break;
      var msgs = threads[t].getMessages();
      var doneThisThread = false;

      for (var m = 0; m < msgs.length; m++) {
        // A message you send to yourself lands in the thread twice. File once.
        if (src.oncePerThread && doneThisThread) break;
        if (count >= CONFIG.MAX_PER_RUN) break;
        var msg = msgs[m];

        // Normally ignore our own mail (old forwarder copies, replies). But a
        // source can opt in: forwarding a receipt to yourself IS the
        // instruction to file it, and that mail is from you by definition.
        if (!src.allowSelf && msg.getFrom().indexOf(CONFIG.REPORT_TO) > -1) continue;
        if (msg.getDate() < earliest) { skipped++; continue; }

        var item = buildReceipt_(msg, src);

        // Our own sales receipt, not a purchase. Label it so it stops coming
        // back, but don't file it and don't count it.
        if (OUR_OWN_NAMES.test(item.supplier)) {
          if (!CONFIG.DRY_RUN) threads[t].addLabel(labelFiled);
          skipped++;
          continue;
        }

        // The forwarded catch-all is deliberately wide, so it has to earn its
        // keep: no money on the page means it is a note to yourself, not a
        // receipt. Left unlabelled so a later, better-formed forward still gets
        // picked up.
        if (src.needsAmount && !item.amount) { skipped++; continue; }

        doneThisThread = true;
        count++;

        if (!item.blob) {
          item.why = item.why || 'Could not produce a document';
          review.push(item);
          if (!CONFIG.DRY_RUN) threads[t].addLabel(labelReview);
          continue;
        }

        if (!CONFIG.DRY_RUN) {
          try {
            GmailApp.sendEmail(
              CONFIG.XERO_FILES_INBOX,
              item.filename,
              'Filed automatically by No Dice receipt capture.\n\n'
                + 'Supplier: ' + item.supplier + '\n'
                + 'Date:     ' + item.dateStr + '\n'
                + 'Amount:   ' + (item.amount ? '£' + item.amount : 'not detected') + '\n'
                + 'Source:   ' + src.id + ' / ' + msg.getFrom() + '\n',
              { attachments: [item.blob], name: 'No Dice Receipt Capture' }
            );
            threads[t].addLabel(labelFiled);
          } catch (e) {
            item.why = 'Send to Xero failed: ' + e;
            review.push(item);
            threads[t].addLabel(labelReview);
            continue;
          }
        }
        filed.push(item);
      }
    }
  }

  // Six "nothing found" emails a day is how a useful alert becomes noise you
  // stop opening. Only write when there is something to say.
  if (isManual || filed.length || review.length) report_(filed, review, skipped);

  return 'filed ' + filed.length + ', needs review ' + review.length
       + (isManual ? '' : ' (scheduled run)');
}


/* ------------------------------------------------------------------ */
/* BUILDING ONE RECEIPT                                                */
/* ------------------------------------------------------------------ */

function buildReceipt_(msg, src) {
  var subject = msg.getSubject() || '';
  var body    = safeBody_(msg);
  var date    = msg.getDate();

  var item = {
    supplier: pickSupplier_(subject, msg.getFrom(), src, body),
    dateStr:  Utilities.formatDate(date, 'Europe/London', 'yyyy-MM-dd'),
    amount:   pickAmount_(body, subject),
    subject:  subject,
    from:     msg.getFrom(),
    how:      '',
    blob:     null,
    why:      ''
  };

  item.filename = [
    item.supplier.replace(/[^A-Za-z0-9]+/g, ''),
    item.dateStr,
    item.amount || 'na'
  ].join('_') + '.pdf';

  // (a) a real attachment beats everything
  var atts = msg.getAttachments({ includeInlineImages: false, includeAttachments: true });
  for (var i = 0; i < atts.length; i++) {
    var type = atts[i].getContentType() || '';
    if (type.indexOf('pdf') > -1 || type.indexOf('image') > -1) {
      var a = atts[i].copyBlob();
      a.setName(item.filename.replace(/\.pdf$/, '') + '_' + atts[i].getName());
      item.blob = a;
      item.how = 'attachment';
      return item;
    }
  }

  // (b) follow the hosted receipt link
  var link = findReceiptLink_(body);
  if (link) {
    var fetched = fetchPage_(link);
    if (fetched && looksLikeReceipt_(fetched, item.amount)) {
      // Some emails are nothing but a link — SumUp's is one line — so the
      // amount isn't in the message at all. Take it off the fetched receipt
      // instead, or the file lands named "_na" and can't be matched later.
      if (!item.amount) {
        item.amount = pickAmount_(fetched.replace(/<[^>]+>/g, ' '), '');
        if (item.amount) item.filename = item.filename.replace(/_na\.pdf$/, '_' + item.amount + '.pdf');
      }
      item.blob = htmlToPdf_(fetched, item.filename);
      if (item.blob) { item.how = 'receipt link'; return item; }
    }
  }

  // (c) render the email itself
  var html = msg.getBody();
  if (!html || html.length < 40) html = '<pre>' + escapeHtml_(body) + '</pre>';
  html = '<h2 style="font-family:Helvetica,Arial">' + escapeHtml_(item.supplier) + '</h2>'
       + '<p style="font-family:Helvetica,Arial;color:#666;font-size:12px">'
       + escapeHtml_(item.dateStr) + ' &middot; ' + escapeHtml_(subject) + '</p><hr>'
       + html;
  item.blob = htmlToPdf_(html, item.filename);
  item.how = item.blob ? 'email body' : '';
  if (!item.blob) item.why = 'Could not render the email to PDF';
  return item;
}

function findReceiptLink_(body) {
  for (var i = 0; i < RECEIPT_LINKS.length; i++) {
    var hit = body.match(RECEIPT_LINKS[i]);
    if (hit) return hit[0];
  }
  return null;
}

function fetchPage_(url) {
  try {
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: true
    });
    if (res.getResponseCode() !== 200) return null;
    return res.getContentText();
  } catch (e) {
    return null;
  }
}

/**
 * A hosted receipt page is only useful if the real content came back.
 * Several of these pages are JavaScript shells that render client-side —
 * fetching them gives an empty skeleton, and filing that would be worse
 * than useless. Require a currency symbol, and the amount if we know it.
 */
function looksLikeReceipt_(html, amount) {
  if (!html || html.length < 500) return false;
  var text = html.replace(/<[^>]+>/g, ' ');
  if (amount && text.indexOf(amount) === -1) return false;
  return /£|&pound;|GBP/.test(text);
}

function htmlToPdf_(html, filename) {
  try {
    return Utilities.newBlob(html, MimeType.HTML, filename.replace(/\.pdf$/, '.html'))
                    .getAs(MimeType.PDF)
                    .setName(filename);
  } catch (e) {
    try {
      return Utilities.newBlob(html.replace(/<[^>]+>/g, '\n'), MimeType.PLAIN_TEXT, 'r.txt')
                      .getAs(MimeType.PDF)
                      .setName(filename);
    } catch (e2) {
      return null;
    }
  }
}


/* ------------------------------------------------------------------ */
/* READING THE DETAIL                                                  */
/* ------------------------------------------------------------------ */

function pickSupplier_(subject, from, src, body) {
  if (src.supplier) {
    var hit = subject.match(src.supplier);
    if (hit && hit[1]) return tidy_(hit[1]);
  }

  // A forward is from YOU, so the sender tells us nothing. The shop's name is
  // in the quoted header inside the body, or in the subject after "Fwd:".
  if (src.id === 'forwarded') {
    var orig = (body || '').match(/^\s*[>\s]*From:\s*"?([^"<\n]+?)"?\s*(?:<|$)/m);
    if (orig && orig[1] && orig[1].indexOf('@') === -1) {
      var name = tidy_(orig[1]);
      if (name && !/^elliot/i.test(name)) return name;
    }
    var addr = (body || '').match(/^\s*[>\s]*From:.*?<([^@>]+)@([A-Za-z0-9.\-]+)>/m);
    if (addr && addr[2] && !/nodice\.bar/i.test(addr[2])) return tidy_(addr[2].split('.')[0]);

    var subj = tidy_(String(subject || '').replace(/^\s*(fw|fwd|re)\s*:\s*/i, ''));
    if (subj) return subj.slice(0, 40);
    return 'Forwarded receipt';
  }

  if (src.fallbackSupplier) return src.fallbackSupplier;
  var dom = (from.match(/@([A-Za-z0-9.\-]+)/) || [])[1] || 'Unknown';
  return tidy_(dom.split('.')[0]);
}

/**
 * Pull the amount out. Prefer an explicit total; fall back to the largest
 * figure on the page, which for a receipt is almost always the total.
 */
function pickAmount_(body, subject) {
  // The leading [^A-Za-z] matters: without it "Subtotal" matches "Total" and
  // every Toast receipt files at the pre-service-charge figure (£3.90 instead
  // of £4.39). Checked against the real E5 and Square emails.
  var labelled = body.match(/(?:^|[^A-Za-z])(?:Amount Total|Total|Amount paid|You paid)[^\d£]{0,12}£?\s?([\d,]+\.\d{2})/i);
  if (labelled) return labelled[1].replace(/,/g, '');

  var subj = subject.match(/£\s?([\d,]+\.\d{2})/);
  if (subj) return subj[1].replace(/,/g, '');

  var all = body.match(/£\s?[\d,]+\.\d{2}/g);
  if (all && all.length) {
    var best = 0;
    for (var i = 0; i < all.length; i++) {
      var n = parseFloat(all[i].replace(/[£,\s]/g, ''));
      if (n > best) best = n;
    }
    if (best > 0) return best.toFixed(2);
  }
  return '';
}

function safeBody_(msg) {
  try { return msg.getPlainBody() || ''; }
  catch (e) {
    try { return (msg.getBody() || '').replace(/<[^>]+>/g, ' '); }
    catch (e2) { return ''; }
  }
}

function tidy_(s) {
  return String(s || '').replace(/\s+/g, ' ').replace(/[<>|]/g, '').trim().slice(0, 60);
}

function escapeHtml_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Filenames keep 2026-08-14, because that is the only form that sorts into
 * date order in the Xero files list. This is just for the report you read.
 */
function ukDate_(iso) {
  var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return parseInt(m[3], 10) + ' ' + months[parseInt(m[2], 10) - 1] + ' ' + m[1];
}

function ensureLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}


/* ------------------------------------------------------------------ */
/* THE RUN REPORT                                                      */
/* ------------------------------------------------------------------ */

function report_(filed, review, skipped) {
  var mode = CONFIG.DRY_RUN ? 'PREVIEW — nothing was sent to Xero' : 'FILED to Xero';
  var total = 0;
  var rows = '';

  for (var i = 0; i < filed.length; i++) {
    var f = filed[i];
    if (f.amount) total += parseFloat(f.amount);
    rows += '<tr><td>' + escapeHtml_(ukDate_(f.dateStr)) + '</td>'
          + '<td>' + escapeHtml_(f.supplier) + '</td>'
          + '<td align="right">' + (f.amount ? '£' + f.amount : '&mdash;') + '</td>'
          + '<td style="color:#777">' + escapeHtml_(f.how) + '</td></tr>';
  }

  var probs = '';
  for (var j = 0; j < review.length; j++) {
    probs += '<li>' + escapeHtml_(review[j].supplier || '?') + ' &mdash; '
           + escapeHtml_(review[j].subject || '') + ' <span style="color:#a00">'
           + escapeHtml_(review[j].why || '') + '</span></li>';
  }

  var html =
      '<div style="font-family:Helvetica,Arial;font-size:14px;color:#111">'
    + '<h2 style="margin-bottom:2px">Receipt capture — ' + mode + '</h2>'
    + '<p style="color:#666;margin-top:0">'
    + Utilities.formatDate(new Date(), 'Europe/London', 'd MMM yyyy, HH:mm') + '</p>'
    + '<p><b>' + filed.length + '</b> receipts'
    + (total ? ', <b>£' + total.toFixed(2) + '</b> of spend' : '')
    + (review.length ? ' &middot; <b style="color:#a00">' + review.length + '</b> need a look' : '')
    + (skipped ? ' &middot; ' + skipped + ' too old, ignored' : '')
    + '</p>'
    + (rows
        ? '<table cellpadding="6" style="border-collapse:collapse;font-size:13px">'
          + '<tr style="background:#f4f4f4"><th align="left">Date</th><th align="left">Supplier</th>'
          + '<th align="right">Amount</th><th align="left">Found via</th></tr>' + rows + '</table>'
        : '<p>Nothing new.</p>')
    + (probs ? '<h3>Needs a look</h3><ul>' + probs + '</ul>' : '')
    + (CONFIG.DRY_RUN
        ? '<p style="margin-top:24px;padding:12px;background:#fff8e1;border-left:4px solid #f0b429">'
          + '<b>Preview only.</b> To start filing for real, set '
          + '<code>DRY_RUN: false</code> at the top of the script and save.</p>'
        : '<p style="margin-top:24px;color:#666">Filed to the Xero <b>Files</b> inbox. '
          + 'These create no bills and no payments &mdash; they wait to be attached '
          + 'to the matching transaction.</p>')
    + '</div>';

  GmailApp.sendEmail(CONFIG.REPORT_TO,
    'Receipts: ' + filed.length + ' found' + (review.length ? ', ' + review.length + ' to check' : ''),
    'See the HTML version.', { htmlBody: html, name: 'No Dice Receipt Capture' });
}


/* ------------------------------------------------------------------ */
/* TRIGGER                                                             */
/* ------------------------------------------------------------------ */

/** Run once. Sets the script going every 4 hours. Safe to run again. */
function installTrigger() {
  var all = ScriptApp.getProjectTriggers();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'run') ScriptApp.deleteTrigger(all[i]);
  }
  ScriptApp.newTrigger('run').timeBased().everyHours(4).create();
  return 'Receipt capture will now run every 4 hours.';
}

/** Undo: clears the Filed/Needs-review labels so everything is reconsidered. */
function resetLabels() {
  [CONFIG.LABEL_FILED, CONFIG.LABEL_REVIEW].forEach(function (n) {
    var l = GmailApp.getUserLabelByName(n);
    if (l) l.deleteLabel();
  });
  return 'Labels cleared — the next run will look at everything again.';
}


/* ------------------------------------------------------------------ */
/* SUPPLIER INVOICES                                                   */
/*                                                                     */
/* Separate from receipts on purpose, and it takes a different route.  */
/* A receipt goes to Xero's Files inbox. An invoice goes into the      */
/* finance service, which matches it to the bank payment and attaches  */
/* it — because an invoice is paid on TERMS, often weeks after it was  */
/* issued, and needs a much wider search than a card receipt.          */
/*                                                                     */
/* Run  sweepInvoices  by hand. First run reports only; set            */
/* INVOICE_DRY to false when the list looks right.                     */
/* ------------------------------------------------------------------ */

var INVOICE_DRY = true;

function sweepInvoices() {
  var label = ensureLabel_(CONFIG.LABEL_INVOICE);
  var sent = [], review = [];

  for (var i = 0; i < INVOICE_SOURCES.length; i++) {
    var src = INVOICE_SOURCES[i];
    var q = src.query
          + ' newer_than:120d'
          + ' -label:"' + CONFIG.LABEL_INVOICE + '"';

    var threads;
    try { threads = GmailApp.search(q, 0, 40); }
    catch (e) { review.push({ supplier: src.supplier, why: 'search failed: ' + e }); continue; }

    for (var t = 0; t < threads.length; t++) {
      var msgs = threads[t].getMessages();
      for (var m = 0; m < msgs.length; m++) {
        var msg = msgs[m];
        var subject = msg.getSubject() || '';

        // An order acknowledgement is not an invoice, and a statement is not
        // an invoice. Filing those is what created ~£6,000 of fake bills.
        if (src.not && src.not.test(subject)) { continue; }
        if (msg.getFrom().indexOf(CONFIG.REPORT_TO) > -1) continue;   // our own forwards

        var body = safeBody_(msg);
        var amount = pickAmount_(body, subject);
        var refHit = src.ref ? (subject.match(src.ref) || body.match(src.ref)) : null;
        var ref = refHit ? tidy_(refHit[1]) : '';
        var dateStr = Utilities.formatDate(msg.getDate(), 'Europe/London', 'yyyy-MM-dd');

        var item = { supplier: src.supplier, ref: ref, date: dateStr, amount: amount, subject: subject };

        if (!amount) { item.why = 'no total found in the email'; review.push(item); continue; }

        // The document itself: a real PDF beats anything we could render.
        var blob = null;
        var atts = msg.getAttachments({ includeInlineImages: false });
        for (var a = 0; a < atts.length; a++) {
          var ct = atts[a].getContentType() || '';
          if (ct.indexOf('pdf') > -1 || ct.indexOf('image') > -1) { blob = atts[a].copyBlob(); break; }
        }
        if (!blob) {
          // Xero-to-Xero invoices (Five Points, BCS) arrive as a link, not a
          // file. Render the email so there is still something to attach.
          blob = htmlToPdf_(msg.getBody() || ('<pre>' + escapeHtml_(body) + '</pre>'),
                            'invoice.pdf');
          item.rendered = true;
        }
        if (!blob) { item.why = 'could not produce a document'; review.push(item); continue; }

        blob.setName([src.supplier.replace(/[^A-Za-z0-9]+/g, ''), dateStr, amount].join('_') + '.pdf');
        item.file = blob.getName();

        if (INVOICE_DRY) { sent.push(item); continue; }

        try {
          sendInvoiceToFinance_(src.supplier, dateStr, amount, ref, blob);
          threads[t].addLabel(label);
          sent.push(item);
        } catch (e) {
          item.why = String(e).slice(0, 160);
          review.push(item);
        }
      }
    }
  }

  invoiceReport_(sent, review);
  return 'invoices: ' + sent.length + ' sent, ' + review.length + ' to check';
}

/** Upload the document, then register it so the finance service can match it. */
function sendInvoiceToFinance_(supplier, dateStr, amount, ref, blob) {
  var up = financeCall_({ action: 'receiptUploadUrl', filename: blob.getName() });

  var putUrl = 'https://rntcujcpsozvuxvmlejv.supabase.co/storage/v1/object/upload/sign/receipts/'
             + up.path + '?token=' + up.token;
  var put = UrlFetchApp.fetch(putUrl, {
    method: 'put', contentType: blob.getContentType() || 'application/pdf',
    payload: blob.getBytes(), muteHttpExceptions: true,
  });
  if (put.getResponseCode() >= 300) throw new Error('upload failed ' + put.getResponseCode());

  financeCall_({
    action: 'receiptAdd', kind: 'invoice',
    supplier: supplier, spendDate: dateStr, amount: Number(amount),
    category: 'business', docRef: ref, imagePath: up.path,
    note: 'Supplier invoice, filed automatically',
  });
}

function financeCall_(payload) {
  payload.secret = CONFIG.FINANCE_KEY;
  var res = UrlFetchApp.fetch(CONFIG.FINANCE_FN, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true,
  });
  var body = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() >= 300) throw new Error(body.error || res.getResponseCode());
  return body;
}

function invoiceReport_(sent, review) {
  var mode = INVOICE_DRY ? 'PREVIEW — nothing sent' : 'SENT to be matched';
  var total = 0, rows = '';
  for (var i = 0; i < sent.length; i++) {
    var s = sent[i];
    total += parseFloat(s.amount || 0);
    rows += '<tr><td>' + escapeHtml_(ukDate_(s.date)) + '</td><td>' + escapeHtml_(s.supplier) + '</td>'
          + '<td>' + escapeHtml_(s.ref || '&mdash;') + '</td>'
          + '<td align="right">&pound;' + escapeHtml_(s.amount) + '</td>'
          + '<td style="color:#777">' + (s.rendered ? 'rendered from email' : 'PDF attached') + '</td></tr>';
  }
  var probs = '';
  for (var j = 0; j < review.length; j++) {
    probs += '<li>' + escapeHtml_(review[j].supplier) + ' &mdash; ' + escapeHtml_(review[j].subject || '')
           + ' <span style="color:#a00">' + escapeHtml_(review[j].why || '') + '</span></li>';
  }
  var html = '<div style="font-family:Helvetica,Arial;font-size:14px;color:#111">'
    + '<h2 style="margin-bottom:2px">Supplier invoices — ' + mode + '</h2>'
    + '<p><b>' + sent.length + '</b> invoices' + (total ? ', <b>&pound;' + total.toFixed(2) + '</b>' : '')
    + (review.length ? ' &middot; <b style="color:#a00">' + review.length + '</b> need a look' : '') + '</p>'
    + (rows ? '<table cellpadding="6" style="border-collapse:collapse;font-size:13px">'
            + '<tr style="background:#f4f4f4"><th align="left">Date</th><th align="left">Supplier</th>'
            + '<th align="left">Ref</th><th align="right">Amount</th><th align="left">Document</th></tr>'
            + rows + '</table>' : '<p>Nothing new.</p>')
    + (probs ? '<h3>Needs a look</h3><ul>' + probs + '</ul>' : '')
    + (INVOICE_DRY
        ? '<p style="margin-top:24px;padding:12px;background:#fff8e1;border-left:4px solid #f0b429">'
          + '<b>Preview only.</b> Set <code>INVOICE_DRY = false</code> to send these.</p>'
        : '<p style="margin-top:24px;color:#666">Sent to the finance service. Each one is matched to its '
          + 'bank payment by amount and supplier, then attached. Anything it cannot match with confidence '
          + 'is left for review rather than guessed at.</p>')
    + '</div>';
  GmailApp.sendEmail(CONFIG.REPORT_TO,
    'Supplier invoices: ' + sent.length + ' found' + (review.length ? ', ' + review.length + ' to check' : ''),
    'See the HTML version.', { htmlBody: html, name: 'No Dice Receipt Capture' });
}

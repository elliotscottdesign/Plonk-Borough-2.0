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
  DRY_RUN: true,

  // How far back to look on each run. Gmail labels stop anything being
  // filed twice, so a generous window is fine.
  LOOKBACK_DAYS: 60,

  // Don't file anything dated before this — the venue's first trading day.
  EARLIEST: '2026-06-01',

  // Safety cap per run.
  MAX_PER_RUN: 60,

  LABEL_FILED:  'Receipts/Filed',
  LABEL_REVIEW: 'Receipts/Needs review'
};

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
    fallbackSupplier: 'SumUp'
  },
  {
    id: 'stripe',
    query: 'from:stripe.com subject:receipt',
    supplier: /Your\s+(.+?)\s+receipt/i,       // "Your Lightspeed POS UK Ltd receipt [#...]"
    fallbackSupplier: 'Stripe'
  },
  {
    id: 'attachments',
    // Genuine invoices/receipts that arrive as a real PDF.
    query: 'has:attachment filename:pdf (subject:invoice OR subject:receipt)',
    supplier: null,
    fallbackSupplier: null                     // fall back to the sender's domain
  }
];

/** Receipt pages we know how to fetch directly. */
var RECEIPT_LINKS = [
  /https:\/\/www\.toasttab\.com\/receipts\/[A-Za-z0-9_\-\/]+/,
  /https:\/\/squareup\.com\/r\/[A-Za-z0-9]+/,
  /https:\/\/sales-receipt\.sumup\.com\/[^\s"'<>]+/
];


/* ------------------------------------------------------------------ */
/* MAIN                                                               */
/* ------------------------------------------------------------------ */

function run() {
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

      for (var m = 0; m < msgs.length; m++) {
        if (count >= CONFIG.MAX_PER_RUN) break;
        var msg = msgs[m];

        // Ignore anything we sent ourselves (old forwarder copies, replies).
        if (msg.getFrom().indexOf(CONFIG.REPORT_TO) > -1 && src.id !== 'sumup') continue;
        if (msg.getDate() < earliest) { skipped++; continue; }

        var item = buildReceipt_(msg, src);
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

  report_(filed, review, skipped);
  return 'filed ' + filed.length + ', needs review ' + review.length;
}


/* ------------------------------------------------------------------ */
/* BUILDING ONE RECEIPT                                                */
/* ------------------------------------------------------------------ */

function buildReceipt_(msg, src) {
  var subject = msg.getSubject() || '';
  var body    = safeBody_(msg);
  var date    = msg.getDate();

  var item = {
    supplier: pickSupplier_(subject, msg.getFrom(), src),
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

function pickSupplier_(subject, from, src) {
  if (src.supplier) {
    var hit = subject.match(src.supplier);
    if (hit && hit[1]) return tidy_(hit[1]);
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
    rows += '<tr><td>' + escapeHtml_(f.dateStr) + '</td>'
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

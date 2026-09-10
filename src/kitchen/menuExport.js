import { ON_A_ROLL_LOGO_BW } from './logo.js'
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

// Shared "On A Roll" branded-menu export — used by the Menu manager AND the public
// live printable menu page (/onaroll/print). One A4 = two identical A5 halves (cut
// down the middle), each with a "scan to order & pay" QR + the "open til 10pm" line.
// mode 'print' → opens a print window that auto-fits to one landscape sheet.
// mode 'pdf'   → generates On A Roll Menu.pdf directly (html2canvas + jsPDF).

// Where the printed QR points (the live customer order page).
export const ORDER_URL = 'https://nodice.bar/onaroll'

// UK-format dated title for a filed menu, e.g. "On a Roll Menu 09.09.26".
export function todayMenuTitle(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `On a Roll Menu ${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`
}

const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// One A5 half of the branded menu (two of these = one A4 sheet). Shared by the
// print/PDF popup AND the 'send' mode that files the menu to staff profiles,
// so the staff copy is byte-for-byte the same layout as what customers see.
export function buildA5(sections, vatOn = false) {
  const filtered = (sections || []).filter(s => s.id !== 'bar')
  const gbp = n => '£' + (n % 1 === 0 ? n : n.toFixed(2))
  const rowHtml = it => {
    const price = it.sell ? gbp(parseFloat(it.sell)) : ''
    const adds = (it.addons || []).filter(a => a.name && a.name.trim())
    const addLine = adds.length ? `<div class="mao">${adds.map(a => `${esc(a.name.trim())} +${gbp(parseFloat(a.price) || 0)}`).join(' · ')}</div>` : ''
    return `<div class="mrow"><div class="mi"><span class="mn">${esc(it.name)}</span><span class="dots"></span><span class="mp">${price}</span></div>${it.desc ? `<div class="md">${esc(it.desc)}</div>` : ''}${addLine}</div>`
  }
  // Starred items are auto-pulled OUT of their section into a Specials box at the top.
  // Archived items are hidden everywhere.
  const starred = filtered.flatMap(s => s.items.filter(it => it.name && it.star && !it.archived))
  const specialsHtml = starred.length
    ? `<div class="msec mspecial"><div class="mtag">⭑ Specials</div><div class="mh">Specials</div>${starred.map(rowHtml).join('')}</div>`
    : ''
  const sectionsHtml = filtered.map(sec => {
    const its = sec.items.filter(it => it.name && !it.star && !it.archived)
    if (!its.length) return ''
    return `<div class="msec"><div class="mh">${esc(sec.name)}</div>${its.map(rowHtml).join('')}</div>`
  }).join('')
  const inner = specialsHtml + sectionsHtml
  // Everything lives inside .a5inner, which is scaled as ONE block to fit the A5
  // half (see FIT_JS) — so the layout never breaks, only shrinks to fit.
  return `<div class="a5"><div class="a5inner"><div class="a5top"><div class="a5brand"><img class="logo" src="${ON_A_ROLL_LOGO_BW}" alt="On A Roll"><div class="msub">London Fields · open til 10pm</div></div><div class="scan"><div class="qr"></div><div class="scantxt"><div class="scanh">Scan to order &amp; pay</div><div class="scansub">Order on your phone — we'll text you the second it's ready. No queue.</div></div></div></div><div class="a5body">${inner}</div><div class="mfoot">Please inform us of any allergies before ordering${vatOn ? ' · all prices include VAT' : ''}</div></div></div>`
}

// The lock: each A5 half is a FIXED box; .a5inner is scaled down uniformly (never
// up) until it fits the half's height. Content can never spill off the page or
// reflow — a busy menu just prints a little smaller. Shared by print + PDF + the
// staff-menu capture so all three behave identically.
export const FIT_JS = `function fitA5(scope){(scope||document).querySelectorAll('.a5').forEach(function(a5){var inner=a5.querySelector('.a5inner');if(!inner)return;inner.style.transform='none';var cs=getComputedStyle(a5);var padV=parseFloat(cs.paddingTop||0)+parseFloat(cs.paddingBottom||0);var avail=a5.clientHeight-padV;var need=inner.scrollHeight;if(need>avail&&need>0){inner.style.transform='scale('+(avail/need)+')';}});}`

// Shared stylesheet for the branded menu (print, PDF download, staff-menu capture).
export const MENU_CSS = `
    @page{ size:A4 landscape; margin:6mm } *{ box-sizing:border-box }
    html,body{ margin:0; padding:0; font-family:Impact,'Arial Narrow Bold',sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact }
    /* Hard page lock: one A4 landscape sheet = two fixed A5 halves, nothing escapes it. */
    .a4{ display:flex; width:283mm; height:195mm; background:#fff; overflow:hidden; page-break-inside:avoid; break-inside:avoid; page-break-after:avoid }
    .logo{ width:100px; height:auto; display:block }
    .a5{ flex:1 1 0; width:50%; min-width:0; padding:8mm 9mm; color:#000; overflow:hidden } .a5:first-child{ border-right:1px dashed #999 }
    .a5inner{ transform-origin:top left; width:100% }   /* scaled as one block to fit — see FIT_JS */
    .a5top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; border-bottom:2.5px solid #000; padding-bottom:8px; margin-bottom:13px }
    .a5brand{ min-width:0; flex-shrink:0 }
    .mn{ overflow-wrap:anywhere }
    .msub{ font-family:Arial; font-size:9.5px; color:#444; margin:3px 0 0; text-transform:uppercase; letter-spacing:.09em }
    .msec{ margin-bottom:17px } .mh{ font-size:19px; color:#000; letter-spacing:1px; border-bottom:1.5px solid #000; padding-bottom:4px; margin-bottom:9px }
    .mspecial{ border:2.2px dotted #000; border-radius:14px; padding:12px 15px 7px; margin-bottom:20px }
    .mspecial .mtag{ font-family:Arial; font-weight:800; font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:#e0231b; margin-bottom:4px }
    .mspecial .mh{ border-bottom:1px dotted #666 }
    .mrow{ margin-bottom:13px }
    .mi{ display:flex; align-items:baseline; gap:5px; font-family:Impact,'Arial Narrow Bold',sans-serif; font-size:19px; color:#000 }
    .mi .dots{ flex:1; border-bottom:1px dotted #999 } .mp{ font-weight:800 }
    .md{ font-family:Arial; font-size:16.5px; color:#1a1a1a; line-height:1.42; margin-top:3px }
    .mao{ font-family:Arial; font-size:13px; font-style:italic; color:#000; margin-top:3px }
    .scan{ display:flex; flex-direction:column; align-items:flex-end; text-align:right; gap:5px; flex-shrink:0; max-width:48% }
    .qr{ width:82px; height:82px; flex-shrink:0 } .qr img,.qr canvas{ width:82px!important; height:82px!important }
    .scantxt{ max-width:180px }
    .scanh{ font-size:15px; color:#000; line-height:1 } .scansub{ font-family:Arial; font-size:8.5px; color:#000; margin-top:3px; line-height:1.32 }
    .mfoot{ font-family:Arial; font-size:8.5px; color:#444; margin-top:12px; border-top:1px solid #bbb; padding-top:7px }
`

// mode: 'print' | 'pdf' | 'send'. 'send' captures the same PDF and uploads it to
// the staff Menus store (rota addMenu) instead of downloading — runs in this
// popup, which is the SAME engine as Download PDF (proven to work on the kitchen
// iPad, unlike in-page capture), so "Force send to profiles" is reliable.
export function exportMenu(sections, mode = 'print', vatOn = false, title = 'On a Roll Menu') {
  const a5 = buildA5(sections, vatOn)
  const isPdf = mode === 'pdf', isSend = mode === 'send', needsPdf = isPdf || isSend
  const ORDER = JSON.stringify(ORDER_URL)
  const libs = needsPdf
    ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>`
    : ''
  // Both PDF paths: draw QR → fitA5() locks each half to the page → capture → jsPDF.
  // Then either save the file (pdf) or upload it to staff Menus (send).
  const qrJS = `try{document.querySelectorAll('.qr').forEach(function(el){new QRCode(el,{text:${ORDER},width:88,height:88,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M})})}catch(e){}`
  const ROTA = JSON.stringify(`${SUPABASE_URL}/functions/v1/rota`), SEC = JSON.stringify(SEND_SECRET), TITLE = JSON.stringify(title)
  const afterPdf = isSend
    ? `var out=String(pdf.output('datauristring'));var data='data:application/pdf;base64,'+out.slice(out.indexOf('base64,')+7);document.body.innerHTML="<div style='font-family:sans-serif;padding:48px;text-align:center;color:#111'><h2>Sending to staff profiles…</h2></div>";fetch(${ROTA},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'addMenu',secret:${SEC},title:${TITLE},kind:'pdf',data:data})}).then(function(r){return r.json()}).then(function(j){document.body.innerHTML=(j&&j.ok)?"<div style='font-family:sans-serif;padding:48px;text-align:center;color:#111'><h2 style='color:#1f8a4d'>&#10003; Sent to staff profiles</h2><p>Filed as <b>"+${TITLE}+"</b>. Staff open it in their portal &rarr; <b>Menus</b>. You can close this tab.</p></div>":"<div style='font-family:sans-serif;padding:48px'>Send failed: "+((j&&j.error)||'unknown')+". Please try again.</div>";}).catch(function(e){document.body.innerHTML="<div style='font-family:sans-serif;padding:48px'>Send failed (network): "+e+". Please try again.</div>";});`
    : `pdf.save('On A Roll Menu.pdf');document.body.innerHTML="<div style='font-family:sans-serif;padding:48px;text-align:center;color:#111'><h2 style='color:#e0231b'>&#10003; PDF downloaded</h2><p>Saved as <b>On A Roll Menu.pdf</b> — check your Downloads folder. You can close this tab.</p></div>";`
  const pdfRun = `${FIT_JS}window.addEventListener('load',function(){${qrJS}setTimeout(function(){fitA5();setTimeout(function(){var el=document.querySelector('.a4');html2canvas(el,{scale:3,backgroundColor:'#ffffff',useCORS:true}).then(function(canvas){try{var J=(window.jspdf||{}).jsPDF;var pdf=new J({orientation:'landscape',unit:'mm',format:'a4'});var pw=297,ph=210,m=7,aw=pw-2*m,ah=ph-2*m,iw=canvas.width,ih=canvas.height,r=Math.min(aw/iw,ah/ih),w=iw*r,h=ih*r;pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',(pw-w)/2,(ph-h)/2,w,h);${afterPdf}}catch(e){document.body.innerHTML="<div style='font-family:sans-serif;padding:48px'>Sorry, that didn't generate: "+e+".</div>";}},150)},450)});`
  const printRun = `${FIT_JS}window.addEventListener('load',function(){${qrJS}setTimeout(function(){fitA5();setTimeout(function(){window.print()},250)},400)});`
  const runScript = needsPdf ? pdfRun : printRun
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>On A Roll menu</title><style>${MENU_CSS}</style></head><body><div class="a4">${a5}${a5}</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  ${libs}
  <script>${runScript}<\/script>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Allow pop-ups to send/print the menu.'); return }
  w.document.write(html); w.document.close()
}

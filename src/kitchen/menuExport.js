import { ON_A_ROLL_LOGO_BW } from './logo.js'

// Shared "On A Roll" branded-menu export — used by the Menu manager AND the public
// live printable menu page (/onaroll/print). One A4 = two identical A5 halves (cut
// down the middle), each with a "scan to order & pay" QR + the "open til 10pm" line.
// mode 'print' → opens a print window that auto-fits to one landscape sheet.
// mode 'pdf'   → generates On A Roll Menu.pdf directly (html2canvas + jsPDF).

// Where the printed QR points (the live customer order page).
export const ORDER_URL = 'https://nodice.bar/onaroll'

const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

export function exportMenu(sections, mode = 'print', vatOn = false) {
  const filtered = (sections || []).filter(s => s.id !== 'bar')
  const gbp = n => '£' + (n % 1 === 0 ? n : n.toFixed(2))
  const rowHtml = it => {
    const price = it.sell ? gbp(parseFloat(it.sell)) : ''
    const adds = (it.addons || []).filter(a => a.name && a.name.trim())
    const addLine = adds.length ? `<div class="mao">${adds.map(a => `${esc(a.name.trim())} +${gbp(parseFloat(a.price) || 0)}`).join(' · ')}</div>` : ''
    return `<div class="mrow"><div class="mi"><span class="mn">${esc(it.name)}</span><span class="dots"></span><span class="mp">${price}</span></div>${it.desc ? `<div class="md">${esc(it.desc)}</div>` : ''}${addLine}</div>`
  }
  // Starred items are auto-pulled OUT of their section into a Specials box at the top.
  const starred = filtered.flatMap(s => s.items.filter(it => it.name && it.star))
  const specialsHtml = starred.length
    ? `<div class="msec mspecial"><div class="mtag">⭑ Specials</div><div class="mh">Specials</div>${starred.map(rowHtml).join('')}</div>`
    : ''
  const sectionsHtml = filtered.map(sec => {
    const its = sec.items.filter(it => it.name && !it.star)
    if (!its.length) return ''
    return `<div class="msec"><div class="mh">${esc(sec.name)}</div>${its.map(rowHtml).join('')}</div>`
  }).join('')
  const inner = specialsHtml + sectionsHtml
  const a5 = `<div class="a5"><div class="a5top"><div class="a5brand"><img class="logo" src="${ON_A_ROLL_LOGO_BW}" alt="On A Roll"><div class="msub">London Fields · open til 10pm</div></div><div class="scan"><div class="qr"></div><div class="scantxt"><div class="scanh">Scan to order &amp; pay</div><div class="scansub">Order on your phone — we'll text you the second it's ready. No queue.</div></div></div></div><div class="a5body">${inner}</div><div class="mfoot">Please inform us of any allergies before ordering${vatOn ? ' · all prices include VAT' : ''}</div></div>`
  const isPdf = mode === 'pdf'
  const ORDER = JSON.stringify(ORDER_URL)
  const libs = isPdf
    ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>`
    : ''
  // PDF mode captures the A4 at natural height (nothing clipped) and scales the
  // whole thing to fit one A4 landscape page → a real downloadable file, no print
  // dialog. Print mode shrinks each half to fit and calls window.print().
  const runScript = isPdf
    ? `window.addEventListener('load',function(){try{document.querySelectorAll('.qr').forEach(function(el){new QRCode(el,{text:${ORDER},width:88,height:88,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M})})}catch(e){}setTimeout(function(){var el=document.querySelector('.a4');html2canvas(el,{scale:3,backgroundColor:'#ffffff',useCORS:true}).then(function(canvas){try{var J=(window.jspdf||{}).jsPDF;var pdf=new J({orientation:'landscape',unit:'mm',format:'a4'});var pw=297,ph=210,m=7,aw=pw-2*m,ah=ph-2*m,iw=canvas.width,ih=canvas.height,r=Math.min(aw/iw,ah/ih),w=iw*r,h=ih*r;pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',(pw-w)/2,(ph-h)/2,w,h);pdf.save('On A Roll Menu.pdf');document.body.innerHTML="<div style='font-family:sans-serif;padding:48px;text-align:center;color:#111'><h2 style='color:#e0231b'>&#10003; PDF downloaded</h2><p>Saved as <b>On A Roll Menu.pdf</b> — check your Downloads folder. You can close this tab.</p></div>";}catch(e){document.body.innerHTML="<div style='font-family:sans-serif;padding:48px'>Sorry, the PDF didn't generate: "+e+". Try the Print button and choose \\"Save as PDF\\".</div>";}},600)},450)});`
    : `function fitA5(){document.querySelectorAll('.a5').forEach(function(a5){var b=a5.querySelector('.a5body');if(!b)return;var z=1;b.style.zoom='1';var g=0;while(a5.scrollHeight>a5.clientHeight&&z>0.5&&g<60){z-=0.02;b.style.zoom=String(z);g++;}});}window.addEventListener('load',function(){try{document.querySelectorAll('.qr').forEach(function(el){new QRCode(el,{text:${ORDER},width:88,height:88,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M})})}catch(e){}setTimeout(function(){fitA5();setTimeout(function(){window.print()},250)},400)});`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>On A Roll menu</title><style>
    @page{ size:A4 landscape; margin:6mm } *{ box-sizing:border-box }
    html,body{ margin:0; padding:0; font-family:Impact,'Arial Narrow Bold',sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact }
    .a4{ display:flex; width:283mm; height:195mm; background:#fff; overflow:hidden; page-break-inside:avoid; break-inside:avoid }
    body.pdf .a4{ height:auto; overflow:visible } body.pdf .a5{ overflow:visible }
    .logo{ width:100px; height:auto; display:block }
    .a5{ flex:1; min-width:0; padding:8mm 9mm; color:#000; display:flex; flex-direction:column; overflow:hidden } .a5:first-child{ border-right:1px dashed #999 }
    .a5top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; border-bottom:2.5px solid #000; padding-bottom:8px; margin-bottom:13px }
    .a5brand{ min-width:0; flex-shrink:0 }
    .a5body{ transform-origin:top left }
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
  </style></head><body class="${isPdf ? 'pdf' : ''}"><div class="a4">${a5}${a5}</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  ${libs}
  <script>${runScript}<\/script>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Allow pop-ups to print the menu.'); return }
  w.document.write(html); w.document.close()
}

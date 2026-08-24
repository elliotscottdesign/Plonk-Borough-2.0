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
  const secs = (sections || []).filter(s => s.id !== 'bar')
  const inner = secs.map(sec => {
    const its = sec.items.filter(it => it.name)
    if (!its.length) return ''
    const gbp = n => '£' + (n % 1 === 0 ? n : n.toFixed(2))
    const rows = its.map(it => {
      const price = it.sell ? gbp(parseFloat(it.sell)) : ''
      const adds = (it.addons || []).filter(a => a.name && a.name.trim())
      const addLine = adds.length ? `<div class="mao">${adds.map(a => `${esc(a.name.trim())} +${gbp(parseFloat(a.price) || 0)}`).join(' · ')}</div>` : ''
      return `<div class="mrow"><div class="mi"><span class="mn">${esc(it.name)}</span><span class="dots"></span><span class="mp">${price}</span></div>${it.desc ? `<div class="md">${esc(it.desc)}</div>` : ''}${addLine}</div>`
    }).join('')
    return `<div class="msec"><div class="mh">${esc(sec.name)}</div>${rows}</div>`
  }).join('')
  const a5 = `<div class="a5"><img class="logo" src="${ON_A_ROLL_LOGO_BW}" alt="On A Roll"><div class="a5body"><div class="msub">London Fields · open til 10pm</div>${inner}</div><div class="scan"><div class="qr"></div><div class="scantxt"><div class="scanh">Scan to order &amp; pay</div><div class="scansub">Order on your phone — we'll text you the second it's ready. No queue. Open til 10pm.</div></div></div><div class="mfoot">Please inform us of any allergies before ordering${vatOn ? ' · all prices include VAT' : ''}</div></div>`
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
    .logo{ width:118px; height:auto; display:block; margin-bottom:3px }
    .a5{ flex:1; min-width:0; padding:8mm 9mm; color:#000; display:flex; flex-direction:column; overflow:hidden } .a5:first-child{ border-right:1px dashed #999 }
    .a5body{ transform-origin:top left }
    .msub{ font-family:Arial; font-size:9.5px; color:#444; margin:2px 0 14px; text-transform:uppercase; letter-spacing:.09em }
    .msec{ margin-bottom:17px } .mh{ font-size:18px; color:#000; letter-spacing:1px; border-bottom:1.5px solid #000; padding-bottom:4px; margin-bottom:9px }
    .mrow{ margin-bottom:12px }
    .mi{ display:flex; align-items:baseline; gap:5px; font-family:Impact,'Arial Narrow Bold',sans-serif; font-size:18px; color:#000 }
    .mi .dots{ flex:1; border-bottom:1px dotted #999 } .mp{ font-weight:800 }
    .md{ font-family:Arial; font-size:12px; color:#222; line-height:1.4; margin-top:3px }
    .mao{ font-family:Arial; font-size:11px; font-style:italic; color:#000; margin-top:3px }
    .scan{ display:flex; gap:11px; align-items:center; margin-top:auto; border-top:2px solid #000; padding-top:10px }
    .qr{ width:92px; height:92px; flex-shrink:0 } .qr img,.qr canvas{ width:92px!important; height:92px!important }
    .scanh{ font-size:16px; color:#000 } .scansub{ font-family:Arial; font-size:9.5px; color:#000; margin-top:3px; line-height:1.35 }
    .mfoot{ font-family:Arial; font-size:8.5px; color:#444; margin-top:10px }
  </style></head><body class="${isPdf ? 'pdf' : ''}"><div class="a4">${a5}${a5}</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  ${libs}
  <script>${runScript}<\/script>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Allow pop-ups to print the menu.'); return }
  w.document.write(html); w.document.close()
}

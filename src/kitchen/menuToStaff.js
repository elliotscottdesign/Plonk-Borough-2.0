import { buildA5, MENU_CSS, ORDER_URL } from './menuExport.js'
import { rotaAddMenu } from '../rota/api.js'

// "Send the live On A Roll menu to the staff Menus tab" — generates the SAME
// branded A4 (= two A5) PDF as the Download-PDF button, but in-page (no popup),
// and files it into the rota Menus store so staff see it in their portal.
// Titled "On a Roll Menu DD.MM.YY" (UK date). Reuses buildA5 + MENU_CSS so it
// never drifts from the printed/customer menu.

const CDN = {
  qrcode: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
}
const _loading = {}
function loadScript(src) {
  if (window.__oarLib && _loading[src] === 'done') return Promise.resolve()
  if (_loading[src] instanceof Promise) return _loading[src]
  _loading[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src; s.async = true
    s.onload = () => { _loading[src] = 'done'; resolve() }
    s.onerror = () => { _loading[src] = null; reject(new Error('Could not load a required library (check your connection).')) }
    document.head.appendChild(s)
  })
  return _loading[src]
}

// Scale each A5 half's .a5inner down (never up) until it fits the fixed half —
// the same lock the print/PDF popup uses (FIT_JS in menuExport.js).
function fitMenu(root) {
  root.querySelectorAll('.a5').forEach(a5 => {
    const inner = a5.querySelector('.a5inner'); if (!inner) return
    inner.style.transform = 'none'
    const cs = getComputedStyle(a5)
    const padV = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
    const avail = a5.clientHeight - padV, need = inner.scrollHeight
    if (need > avail && need > 0) inner.style.transform = `scale(${avail / need})`
  })
}

// UK-format dated title, e.g. "On a Roll Menu 09.09.26".
export function todayMenuTitle(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `On a Roll Menu ${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`
}

export async function sendMenuToStaff(sections, vatOn = false, title = todayMenuTitle()) {
  // qrcodejs first (defines window.QRCode), then the capture/pdf libs.
  await loadScript(CDN.qrcode)
  await Promise.all([loadScript(CDN.html2canvas), loadScript(CDN.jspdf)])

  const a5 = buildA5(sections, vatOn)
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:283mm;height:195mm;background:#fff;z-index:-1;pointer-events:none'
  // Fixed 283×195mm A4 box; fitMenu() locks each A5 half to the page (same rule as
  // the print/PDF popup), so the capture is exactly one A4-landscape sheet.
  host.innerHTML = `<style>${MENU_CSS}</style><div class="a4">${a5}${a5}</div>`
  document.body.appendChild(host)
  try {
    host.querySelectorAll('.qr').forEach(el => {
      try { new window.QRCode(el, { text: ORDER_URL, width: 82, height: 82, colorDark: '#000', colorLight: '#fff', correctLevel: window.QRCode.CorrectLevel.M }) } catch { /* QR is nice-to-have */ }
    })
    await new Promise(r => setTimeout(r, 500))   // let the QR canvas + fonts settle
    fitMenu(host)   // scale each A5 half's content to fit its fixed box — never clips
    const a4 = host.querySelector('.a4')
    const canvas = await window.html2canvas(a4, { scale: 3, backgroundColor: '#ffffff', useCORS: true })
    const J = (window.jspdf || {}).jsPDF
    if (!J) throw new Error('PDF library did not load.')
    const pdf = new J({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pw = 297, ph = 210, m = 7, aw = pw - 2 * m, ah = ph - 2 * m
    const iw = canvas.width, ih = canvas.height, r = Math.min(aw / iw, ah / ih), w = iw * r, h = ih * r
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h)
    const out = pdf.output('datauristring')   // data:application/pdf;filename=…;base64,…
    const b64 = out.slice(out.indexOf('base64,') + 7)
    const dataUrl = 'data:application/pdf;base64,' + b64
    await rotaAddMenu(title, 'pdf', dataUrl)
    return { title, bytes: b64.length }
  } finally {
    host.remove()
  }
}

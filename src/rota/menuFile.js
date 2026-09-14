import { rotaGetMenu } from './api.js'

// Turn a stored data: URL into a Blob URL (Chrome blocks top-level navigation to
// a big data: URL, so we hand the browser a blob instead).
function blobUrlFrom(dataUrl) {
  const s = String(dataUrl || '')
  const comma = s.indexOf(',')
  if (comma < 0) throw new Error('That file looks corrupted — re-upload it.')
  const mime = (s.slice(0, comma).match(/data:([^;]+)/) || [])[1] || 'application/octet-stream'
  const bin = atob(s.slice(comma + 1))
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([arr], { type: mime }))
}

// Open a data-URL file (PDF or image) in a new tab so the browser's own viewer
// can print it (to the WiFi printer).
export function openDataUrl(dataUrl) {
  const url = blobUrlFrom(dataUrl)
  const w = window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return w
}

// Open a stored menu (PDF/image) in a new tab to view/print. CRITICAL: we open
// the tab SYNCHRONOUSLY on the tap — before awaiting the download — because iOS
// Safari's popup blocker silently blocks any window.open that runs after an
// await, which made every menu look "unclickable" on the staff iPads/phones.
// We then point that already-open tab at the blob once the data arrives.
export async function openMenu(id) {
  const w = window.open('', '_blank')   // reserve the tab inside the user gesture
  try {
    const r = await rotaGetMenu(id)
    const url = blobUrlFrom(r.data)
    if (w) w.location.href = url
    else window.open(url, '_blank')     // fallback if the tab was pre-blocked
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    return w
  } catch (e) {
    if (w) { try { w.close() } catch { /* ignore */ } }
    throw e
  }
}

export const fileToDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(r.result)
  r.onerror = () => rej(new Error('Could not read that file.'))
  r.readAsDataURL(file)
})

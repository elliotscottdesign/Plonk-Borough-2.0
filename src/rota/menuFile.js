import { rotaGetMenu } from './api.js'

// Open a data-URL file (PDF or image) in a new tab so the browser's own viewer
// can print it (to the WiFi printer). We go via a Blob URL because Chrome blocks
// top-level navigation to a big data: URL.
export function openDataUrl(dataUrl) {
  const s = String(dataUrl || '')
  const comma = s.indexOf(',')
  if (comma < 0) throw new Error('That file looks corrupted — re-upload it.')
  const mime = (s.slice(0, comma).match(/data:([^;]+)/) || [])[1] || 'application/octet-stream'
  const bin = atob(s.slice(comma + 1))
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([arr], { type: mime }))
  const w = window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return w
}

export async function openMenu(id) {
  const r = await rotaGetMenu(id)
  return openDataUrl(r.data)
}

export const fileToDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(r.result)
  r.onerror = () => rej(new Error('Could not read that file.'))
  r.readAsDataURL(file)
})

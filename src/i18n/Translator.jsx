import { useEffect } from 'react'
import { useLanguage } from './context.jsx'
import { translate } from './dictionary.js'

/**
 * DEPRECATED — no longer mounted. Superseded by react-i18next (see
 * ./i18n-setup.js and ./locales/). Kept on disk so we can restore
 * quickly if the migration regresses. Do not wire this back into
 * App.jsx without first reverting the component-level useTranslation
 * calls, or translations will double up.
 *
 * Original description:
 *
 * DOM-walking translator. React renders its VDOM as English text. Once
 * mounted, we walk the real DOM and swap the text nodes (and a few
 * attributes) to the target lang. A MutationObserver catches any
 * subsequent React updates. Guards against infinite loops by only
 * translating text whose trimmed value matches a dictionary key or a
 * pattern; once translated, the new value won't match again.
 */

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'])
const ATTR_KEYS = ['placeholder', 'title', 'alt', 'aria-label']

function translateTextNode(node, lang) {
  if (!node || node.nodeType !== 3) return
  const v = node.nodeValue
  if (!v) return
  const t = translate(v, lang)
  if (t !== v) node.nodeValue = t
}

function translateAttributes(el, lang) {
  for (const key of ATTR_KEYS) {
    if (!el.hasAttribute(key)) continue
    const v = el.getAttribute(key)
    const t = translate(v, lang)
    if (t !== v) el.setAttribute(key, t)
  }
}

function walk(node, lang) {
  if (!node) return
  if (node.nodeType === 3) {
    translateTextNode(node, lang)
    return
  }
  if (node.nodeType !== 1) return
  if (SKIP_TAGS.has(node.tagName)) return
  // translate attributes on this element
  translateAttributes(node, lang)
  // recurse children
  for (let c = node.firstChild; c; c = c.nextSibling) walk(c, lang)
}

export default function Translator() {
  const { lang } = useLanguage()

  useEffect(() => {
    if (lang === 'en') return
    // Observe <body> so anything React-portals (e.g. chart tooltips)
    // also gets translated. #root is a subtree of body.
    const root = document.body
    if (!root) return

    // Initial pass
    walk(root, lang)

    // Observe subsequent updates
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') {
          translateTextNode(m.target, lang)
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((n) => walk(n, lang))
        } else if (m.type === 'attributes') {
          if (m.target.nodeType === 1 && ATTR_KEYS.includes(m.attributeName)) {
            translateAttributes(m.target, lang)
          }
        }
      }
    })

    obs.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTR_KEYS,
    })

    return () => obs.disconnect()
  }, [lang])

  return null
}

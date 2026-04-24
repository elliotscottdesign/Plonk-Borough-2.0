// Locale-aware number/currency formatters. Keeps £ symbol regardless of
// language — only thousand/decimal separators follow locale.
const localeOf = (lang) => (lang === 'pt-BR' ? 'pt-BR' : 'en-GB')

export function formatNumber(n, lang, opts = {}) {
  if (n === null || n === undefined || Number.isNaN(n)) return ''
  try {
    return new Intl.NumberFormat(localeOf(lang), opts).format(n)
  } catch {
    return String(n)
  }
}

export function formatCurrency(n, lang, opts = {}) {
  if (n === null || n === undefined || Number.isNaN(n)) return ''
  const formatted = formatNumber(n, lang, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...opts,
  })
  return `£${formatted}`
}

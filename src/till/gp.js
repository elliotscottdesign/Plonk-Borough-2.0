// Shared GP arithmetic for the till screens. One rule: never invent a number.
// A serve's cost comes from the bar engine's cost_per_base — ml-based products
// multiply by the serve's ml, each-based products (cans, bottles, bags) cost
// one unit per serve regardless of the ml printed on the tin.
export const VAT = 1.2

// → { state, gp?, cost?, net? }
// state: 'ok' | 'time' | 'noPrice' | 'notCosted' | 'noRecipe' | 'noStock' | 'noData'
export function serveGP(product, serve, costsByName, marginsByName) {
  if (serve.price == null) return { state: 'noPrice' }
  const net = serve.price / VAT
  if (product.noStock) return { state: 'time', gp: 100, cost: 0, net }
  if (product.stock) {
    if (!costsByName) return { state: 'noData' }
    const row = costsByName[product.stock.toLowerCase()]
    if (!row) return { state: 'noStock' }
    if (row.cost_per_base == null) return { state: 'notCosted' }
    const qty = String(row.base_unit) === 'each' ? 1 : serve.ml
    if (qty == null) return { state: 'notCosted' }
    const cost = qty * Number(row.cost_per_base)
    return { state: 'ok', gp: net > 0 ? (100 * (net - cost)) / net : null, cost, net }
  }
  if (product.recipe) {
    if (!marginsByName) return { state: 'noData' }
    const row = marginsByName[product.recipe.toLowerCase()]
    if (!row || !row.recipe_lines) return { state: 'noRecipe' }
    if (row.unpriced_lines > 0 || row.gp_percent == null) return { state: 'notCosted' }
    return { state: 'ok', gp: Number(row.gp_percent), cost: Number(row.recipe_cost), net: Number(row.net_price) }
  }
  return { state: 'noStock' }
}

export const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

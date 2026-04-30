// Compatibility shim — forecast lock state now lives in LockedDeckContext.
// Re-exports the forecast hook + provider so existing imports continue
// to work unchanged.
export { useLockedForecast, LockedDeckProvider as LockedForecastProvider } from './LockedDeckContext.jsx'

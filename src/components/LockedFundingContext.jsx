// Compatibility shim — funding state now lives in LockedDeckContext.
// Re-exports the funding hook + provider + range so existing imports
// continue to work unchanged.
export { useLockedFunding, LockedDeckProvider as LockedFundingProvider, FUNDING_RANGE } from './LockedDeckContext.jsx'

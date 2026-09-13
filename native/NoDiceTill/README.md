# No Dice Till — native iPad app (the Swift shell)

A thin Xcode/Swift app that carries the web till (team.nodice.bar/ops?tab=till)
full-screen on the venue iPads. The till screens keep shipping from this repo in
minutes; the shell adds what only a real app can: installed locally, instant
open, screen never sleeps, offline boot via the service worker (App-Bound
Domains), kiosk-friendly. Native-only powers land here later: Square's Mobile
Payments SDK (the £19 Reader), background printing, per-till identity.

## For the founder — the two one-time steps

1. **Apple Developer account** (needed to put the app on any iPad):
   sign in at developer.apple.com/programs/enroll with the elliot@nodice.bar
   Apple ID and enrol (£79/yr). Individual is fastest and fine for our own
   iPads; the company (D-U-N-S) route can come later if we ever go public.
2. **Install Xcode on the Mac**: App Store → search "Xcode" → Get (~big
   download) → open it once → accept the licence → let it install the iOS
   platform. Then tell Claude — everything after that (building, simulator,
   TestFlight to the iPads) is Claude's job.

## For Claude — regenerating / building

- Project is generated from `project.yml` with XcodeGen (`xcodegen generate`);
  edit the yml, never the .xcodeproj by hand.
- Bundle id `bar.nodice.till`, iPad-only, iOS 16+, all orientations,
  status bar hidden, `WKAppBoundDomains = [team.nodice.bar]` (service worker =
  offline). Web view storage is persistent.
- Build/run once Xcode exists: open `NoDiceTill.xcodeproj`, or
  `xcodebuild -scheme NoDiceTill -destination 'platform=iOS Simulator,name=iPad Pro 11-inch'`.

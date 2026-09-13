import SwiftUI

// ─── No Dice Till — the native iPad shell ───────────────────────────────────
// A thin Swift app that hosts the till (team.nodice.bar/ops?tab=till) inside
// a full-screen web view. The screens keep shipping from the web repo in
// minutes; this shell provides what only a real app can:
//   • installed locally on the iPad, opens instantly
//   • the screen NEVER sleeps while the till is up (bar law)
//   • service-worker offline caching works via App-Bound Domains, so the till
//     opens and rings through an internet outage
//   • kiosk-friendly (pair with iPad Guided Access for staff lockdown)
// Later, native-only powers plug in here: Square's Mobile Payments SDK (the
// £19 Reader), background printing, per-till-point identity.

@main
struct NoDiceTillApp: App {
    var body: some Scene {
        WindowGroup {
            TillShellView()
                .ignoresSafeArea()
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)
                .onAppear {
                    // A till must never dim or lock mid-service.
                    UIApplication.shared.isIdleTimerDisabled = true
                }
        }
    }
}

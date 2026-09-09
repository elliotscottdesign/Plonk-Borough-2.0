import SwiftUI
import WebKit

// The web view that carries the till. Persistent storage (the drawn room,
// staff name, offline caches survive restarts), app-bound navigation (enables
// the service worker → offline boot), no bounce/zoom — it feels native.
struct TillShellView: UIViewRepresentable {
    static let tillURL = URL(string: "https://team.nodice.bar/ops?tab=till")!

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()               // persistent — logins, room, caches
        config.allowsInlineMediaPlayback = true
        config.limitsNavigationsToAppBoundDomains = true   // unlocks service workers (offline)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.078, green: 0.078, blue: 0.078, alpha: 1) // --ink
        webView.navigationDelegate = context.coordinator
        webView.load(URLRequest(url: Self.tillURL))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator() }

    // First-ever launch with no internet has nothing cached to show — retry
    // until the network appears, then the service worker takes over forever.
    final class Coordinator: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                webView.load(URLRequest(url: TillShellView.tillURL))
            }
        }
    }
}

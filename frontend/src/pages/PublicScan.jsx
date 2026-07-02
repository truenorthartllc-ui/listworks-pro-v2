import { useState } from "react";
import { AlertCircle, Check, X, Mail } from "lucide-react";

/**
 * PublicScan — Free Fair Housing scanner, no signup required
 *
 * Flow:
 * 1. Paste listing → instant scan
 * 2. Violations highlighted in red, clean copy shown
 * 3. Email gate for "Get compliant rewrite" (lead capture)
 * 4. Shareable results with OG image
 */

export default function PublicScan() {
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [captured, setCaptured] = useState(false);

  async function runScan() {
    if (!input.trim()) return;
    setScanning(true);
    setResult(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "https://listworks-pro-v2-production.up.railway.app"}/api/analyze/fair-housing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });

      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();

      setResult({
        text: input.trim(),
        violations: data.violations || [],
        clean: data.violations?.length === 0,
      });
    } catch (e) {
      console.error(e);
      alert("Scan failed. Try again.");
    } finally {
      setScanning(false);
    }
  }

  async function captureEmail() {
    if (!email.trim()) return;
    // Hit /api/capture-email endpoint
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || "https://listworks-pro-v2-production.up.railway.app"}/api/capture-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "public-scan" }),
      });
      setCaptured(true);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      {/* Header */}
      <header className="border-b border-ink/15 bg-oat/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-lg tracking-tight">
            ListWorks <span className="text-vermillion">PRO</span>
          </a>
          <a
            href="https://listworks.pro"
            className="text-sm px-4 py-2 bg-ink text-oat hover:bg-ink/90 transition-colors"
          >
            Try Free
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-vermillion mb-2">
            Free Fair Housing Scanner
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] mb-4">
            <span className="font-light">Find violations before</span>{" "}
            <span className="italic">HUD does.</span>
          </h1>
          <p className="text-ink/65 max-w-lg mx-auto">
            Paste any listing description. Instant scan. No signup, no card. First-offense fine: <strong>$26,262</strong> (24 CFR §180.671).
          </p>
        </div>

        {/* Input */}
        <div className="mb-8">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your listing description here..."
            className="w-full h-48 p-4 border border-ink/20 bg-white text-ink resize-none focus:outline-none focus:border-vermillion transition-colors"
            disabled={scanning}
          />
          <button
            onClick={runScan}
            disabled={!input.trim() || scanning}
            className="mt-4 w-full md:w-auto px-8 py-3 bg-vermillion text-oat font-semibold hover:bg-vermillion/90 disabled:bg-ink/20 disabled:text-ink/40 transition-colors"
          >
            {scanning ? "Scanning..." : "Scan for Violations"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="border border-ink/20 bg-white p-6">
            {result.clean ? (
              <div className="flex items-start gap-3 text-emerald-700">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <div>
                  <p className="font-semibold mb-1">Clean — No violations detected</p>
                  <p className="text-sm text-ink/65">
                    This listing passed Fair Housing compliance scan. Safe to publish.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 text-vermillion mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <div>
                    <p className="font-semibold mb-1">
                      {result.violations.length} potential {result.violations.length === 1 ? "violation" : "violations"} found
                    </p>
                    <p className="text-sm text-ink/65">
                      HUD penalties start at $26,262 per violation. Fix these before publishing.
                    </p>
                  </div>
                </div>

                {/* Violations list */}
                <div className="space-y-3 mb-6">
                  {result.violations.map((v, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-vermillion flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div>
                        <span className="font-mono text-vermillion bg-vermillion/10 px-1.5 py-0.5">
                          "{v.phrase}"
                        </span>
                        <span className="text-ink/65 ml-2">— {v.category}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email gate for rewrite */}
                {!captured ? (
                  <div className="border-t border-ink/15 pt-6">
                    <p className="text-sm font-semibold mb-3">Get a compliant rewrite (free)</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 px-4 py-2 border border-ink/20 focus:outline-none focus:border-vermillion"
                      />
                      <button
                        onClick={captureEmail}
                        disabled={!email.trim()}
                        className="px-6 py-2 bg-vermillion text-oat font-semibold hover:bg-vermillion/90 disabled:bg-ink/20 disabled:text-ink/40"
                      >
                        Get Rewrite
                      </button>
                    </div>
                    <p className="text-xs text-ink/50 mt-2">
                      We'll email you the compliant version + 3 free rewrites to try the full tool.
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-ink/15 pt-6 flex items-start gap-3 text-emerald-700">
                    <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Check your inbox</p>
                      <p className="text-sm text-ink/65">
                        Compliant rewrite + 3 free trial rewrites sent to <strong>{email}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CTA */}
        {!result && (
          <div className="mt-12 text-center text-sm text-ink/65">
            <p>
              Unlimited scans, always free. Or{" "}
              <a href="https://listworks.pro" className="text-vermillion font-semibold hover:underline">
                try the full tool
              </a>{" "}
              (MLS + Instagram + Facebook + 5 headlines + buyer email in one click).
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

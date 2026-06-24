import { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RISK_COLOR = {
  CRITICAL: "text-red-600",
  HIGH: "text-red-500",
  MEDIUM: "text-orange-500",
  LOW: "text-yellow-600",
  CLEAN: "text-green-600",
};

const GRADE_BG = {
  A: "bg-green-100 text-green-700 border-green-200",
  B: "bg-yellow-50 text-yellow-700 border-yellow-200",
  C: "bg-orange-100 text-orange-700 border-orange-200",
  D: "bg-red-100 text-red-700 border-red-200",
  F: "bg-red-200 text-red-800 border-red-300",
};

export default function ComplianceHero() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const check = async () => {
    if (!text.trim() || text.trim().length < 20) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const session_id = localStorage.getItem("lw_session_id") || "";
      const { data } = await axios.post(`${API}/analyze/fair-housing`, {
        text: text.trim(),
        session_id,
      });
      setResult(data);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  const goToRewrite = () => {
    // Scroll to the rewrite sandbox or navigate to the app
    const el = document.getElementById("playground");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "https://listworks.pro/#playground";
    }
  };

  return (
    <section className="relative bg-oat border-b border-ink/10 overflow-hidden">
      {/* Blueprint background */}
      <div className="blueprint-bg absolute inset-0 opacity-40 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 md:px-10 pt-16 pb-20">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span className="h-px w-8 bg-ink/40" />
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink/50">
            Free · Instant · No account needed
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display tracking-tight leading-[1.0] text-4xl md:text-6xl text-ink mb-4">
          Find out if your listing will cost you{" "}
          <span className="italic text-vermillion">$26,262</span>
          {" "}in 10 seconds
        </h1>

        <p className="font-body text-base md:text-lg text-ink/60 mb-8 max-w-xl">
          Free Fair Housing compliance check. Paste any listing copy — get instant results before it hits MLS.
        </p>

        {/* Paste box */}
        {!result && (
          <div className="bg-white border border-ink/15 p-6">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-3">
              Paste your listing copy here
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              autoFocus
              className="w-full border border-ink/12 bg-oat/50 p-4 font-body text-sm text-ink/80 resize-none outline-none focus:border-vermillion transition placeholder:text-ink/25"
              placeholder={`Example: "Perfect for families with kids. Master bedroom suite. Safe, quiet neighborhood near top-rated schools. No pets please."`}
            />
            <div className="flex items-center justify-between mt-4">
              <span className="font-mono text-[10px] text-ink/35 uppercase tracking-wider">
                Min. 20 characters
              </span>
              <button
                onClick={check}
                disabled={loading || text.trim().length < 20}
                className="bg-ink text-oat hover:bg-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition disabled:opacity-30"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                  : <><Sparkles className="w-4 h-4" /> Check for violations</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 font-body text-sm">
            {error}{" "}
            <button onClick={() => setError(null)} className="underline ml-2">Try again</button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="animate-rise">
            {result.clean ? (
              /* CLEAN RESULT */
              <div className="bg-white border border-green-200 p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-heading text-sm uppercase tracking-[0.15em] text-green-600 mb-2">
                      No violations found
                    </div>
                    <h2 className="font-display italic text-3xl text-ink leading-tight mb-3">
                      Your listing passed the Fair Housing check.
                    </h2>
                    <p className="font-body text-ink/60 text-sm mb-6">
                      No protected class language detected. This listing is compliant with the Fair Housing Act.
                    </p>

                    <div className="border-t border-ink/10 pt-6">
                      <p className="font-heading text-xs uppercase tracking-[0.15em] text-ink/50 mb-3">
                        Want AI to make it sell faster?
                      </p>
                      <p className="font-body text-sm text-ink/60 mb-4">
                        A compliant listing is just the start. Get a publish-ready MLS description, Instagram caption, Facebook post, and 5 headlines — in 10 seconds.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={goToRewrite}
                          className="bg-vermillion text-oat hover:bg-[#e02d0e] px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition"
                        >
                          <Sparkles className="w-4 h-4" />
                          Rewrite it with AI — Free
                        </button>
                        <button
                          onClick={() => { setResult(null); setText(""); }}
                          className="border border-ink/20 px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition"
                        >
                          Check another listing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* VIOLATIONS FOUND */
              <div className="bg-white border border-red-200 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <div className={`font-heading text-sm uppercase tracking-[0.15em] mb-1 ${RISK_COLOR[result.risk] || "text-red-600"}`}>
                      {result.total} violation{result.total !== 1 ? "s" : ""} detected — {result.risk} risk
                    </div>
                    <h2 className="font-display italic text-3xl text-ink leading-tight">
                      This listing has Fair Housing issues.
                    </h2>
                  </div>
                  <div className={`ml-auto border px-4 py-2 font-mono text-2xl font-bold ${GRADE_BG[result.grade] || "bg-red-100 text-red-700 border-red-200"}`}>
                    {result.grade}
                  </div>
                </div>

                {/* Violations list */}
                <div className="space-y-3 mb-6">
                  {result.violations.map((v, i) => (
                    <div key={i} className="border border-red-100 bg-red-50/50 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-red-600">
                          {v.rule}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-ink/40">
                          {v.severity}
                        </span>
                      </div>
                      <p className="font-body text-sm text-ink/70 mb-1">{v.explanation}</p>
                      {v.matched_text && (
                        <p className="font-mono text-xs text-red-500 bg-red-50 px-2 py-1 border-l-2 border-red-300">
                          "{v.matched_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* CTA — AI fix */}
                <div className="border-t border-red-100 pt-6">
                  <p className="font-heading text-xs uppercase tracking-[0.15em] text-ink/50 mb-2">
                    AI can fix every one of these — in 10 seconds
                  </p>
                  <p className="font-body text-sm text-ink/60 mb-4">
                    ListWorks PRO rewrites your listing clean. Same property, same value — zero violations.
                    Free trial includes 3 complete rewrites.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={goToRewrite}
                      className="bg-vermillion text-oat hover:bg-[#e02d0e] px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Fix this with AI — Free Trial
                    </button>
                    <button
                      onClick={() => { setResult(null); setText(""); }}
                      className="border border-ink/20 px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition"
                    >
                      Check another listing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trust bar below checker */}
        {!result && (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">
            <span>✦ 100% free</span>
            <span>● No account needed</span>
            <span>● Results in under 5 seconds</span>
            <span>● HUD-referenced patterns</span>
          </div>
        )}
      </div>
    </section>
  );
}

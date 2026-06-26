import { useState, useEffect } from "react";
import { ArrowUpRight, X, FileText, Loader2, Lock } from "lucide-react";
import { startCheckout } from "@/lib/checkout";

export default function GuideUpsell() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const buyGuide = async () => {
    setBuying(true);
    await startCheckout("guide_pdf");
    setBuying(false);
  };

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && setPreviewOpen(false);
    if (previewOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handler);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [previewOpen]);

  return (
    <section id="guide" data-testid="guide-section" className="bg-coal text-oat border-b border-ink/15 relative overflow-hidden">
      <div className="blueprint-bg absolute inset-0 opacity-[0.07] pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16 grid grid-cols-12 gap-6 relative">
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-baseline gap-6 mb-4">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">Document No. 001</span>
            <div className="flex-1 h-px bg-oat/10" />
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-oat/30 shrink-0">50+ yrs combined experience</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter leading-[0.95]">
            <span className="font-light">The Guide.</span>{" "}
            <span className="italic text-vermillion">$20.</span>
          </h2>
          <p className="mt-4 font-body text-sm text-oat/70 leading-relaxed max-w-xl">
             45 pages of no-fluff framework. Feature → Benefit → Feeling framework. 15 copy-paste AI prompts. 5-part MLS template. 6 real before/after rewrites with full breakdowns. Read it in one sitting — use it on your next listing the same day.
          </p>

          <ul className="mt-5 space-y-2 font-body text-sm text-oat/80 max-w-xl">
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion shrink-0">✦</span> The 5-part listing structure used by top-1% agents</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion shrink-0">✦</span> 15 plug-and-play prompts for ChatGPT, Claude, Gemini</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion shrink-0">✦</span> Buyer psychology triggers that drive showings</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion shrink-0">✦</span> Headline formulas that stop scrolls in 1.2 seconds</li>
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              data-testid="guide-buy-btn"
              onClick={buyGuide}
              disabled={buying}
              className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {buying ? (<><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>) : (<>Buy the Guide — $20 <ArrowUpRight className="w-4 h-4" /></>)}
            </button>
            <button
              data-testid="guide-preview-btn"
              onClick={() => setPreviewOpen(true)}
              className="px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] border border-oat/40 text-oat hover:bg-oat hover:text-coal transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Preview Inside
            </button>
          </div>

          <p className="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-oat/40">
            30-day money-back · Lifetime access · Instant download
          </p>
        </div>

        <aside className="col-span-12 lg:col-span-5 lg:pl-10 lg:border-l lg:border-oat/15">
          <div className="border border-oat/25 p-5 bg-coal/60">
            <div className="flex items-center justify-between mb-4 font-mono text-[10px] tracking-[0.25em] uppercase text-oat/40">
              <span>LWP-DOC-001</span>
              <span>REV. 02 / 2026</span>
            </div>
            <p className="font-display italic text-xl leading-snug">
              "Finally someone teaching the real <span className="text-vermillion">skill</span> — not just templates. Worth every penny."
            </p>
            <div className="mt-5 grid grid-cols-4 gap-4 pt-5 border-t border-oat/15">
              {[["85","Pages"],["15","AI Prompts"],["5","Templates"],["$20","One-time"]].map(([n,l]) => (
                <div key={l}>
                  <div className={`font-display text-2xl ${n === "$20" ? "text-vermillion" : ""}`}>{n}</div>
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-oat/40 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {previewOpen && (
        <div
          data-testid="guide-preview-modal"
          className="fixed inset-0 z-[100] bg-coal/95 backdrop-blur-sm flex flex-col animate-rise"
          onClick={(e) => e.target === e.currentTarget && setPreviewOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-oat/20 bg-coal shrink-0">
            <div className="flex items-baseline gap-3">
              <span className="font-display italic text-2xl text-oat">ListWorks Guide</span>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">Preview · Pages 1–3 of 85</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                data-testid="modal-buy-btn"
                onClick={buyGuide}
                disabled={buying}
                className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-5 py-2.5 font-heading text-[12px] uppercase tracking-[0.15em] flex items-center gap-2 transition"
              >
                {buying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ArrowUpRight className="w-3.5 h-3.5" /> Unlock All 85 Pages — $20</>}
              </button>
              <button
                data-testid="close-preview-btn"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
                className="w-10 h-10 border border-oat/30 text-oat hover:bg-oat hover:text-coal transition flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF teaser — locked to top portion, no interaction */}
          <div className="relative flex-1 bg-[#2a2a2a] overflow-hidden">
            <iframe
              data-testid="guide-pdf-iframe"
              src="/assets/listworks-guide.pdf#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH"
              title="ListWorks Guide Preview"
              className="w-full h-full"
              style={{ pointerEvents: "none" }}
            />

            {/* Gradient fade — bottom 55% */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{ height: "55%", background: "linear-gradient(to bottom, transparent 0%, #1a1a1a 60%, #1a1a1a 100%)" }}
            />

            {/* Paywall block */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-12 px-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 border border-oat/30 mb-4">
                <Lock className="w-5 h-5 text-oat/60" />
              </div>
              <p className="font-display italic text-2xl md:text-3xl text-oat mb-2">Pages 4–85 are locked.</p>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-oat/50 mb-6">
                15 prompts · 5 templates · buyer psychology · the full framework
              </p>
              <button
                onClick={buyGuide}
                disabled={buying}
                className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-8 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-60"
              >
                {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowUpRight className="w-4 h-4" /> Unlock Everything — $20</>}
              </button>
              <p className="mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-oat/40">30-day money-back · instant download</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import { useState, useEffect } from "react";
import { ArrowUpRight, X, FileText, Loader2 } from "lucide-react";
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-32 grid grid-cols-12 gap-6 relative">
        <div className="col-span-12 lg:col-span-7">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">Document No. 001</span>
          <h2 className="font-display text-5xl md:text-7xl tracking-tighter leading-[0.95] mt-6">
            <span className="font-light">The Guide.</span><br />
            <span className="italic">$20.</span>
          </h2>
          <p className="mt-8 font-body text-lg md:text-xl text-oat/80 leading-relaxed max-w-xl">
            The exact framework powering this tool — written out, page by page.
            The Feature → Benefit → Feeling system. The 5-part structure. The four
            buyer psychology triggers. 15 plug-and-play AI prompts. Read it once.
            Use it on every listing.
          </p>

          <ul className="mt-8 space-y-3 font-body text-oat/85 max-w-xl">
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> The 5-part listing structure used by top-1% agents</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> 15 plug-and-play prompts for ChatGPT, Claude, Gemini</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> 4 buyer psychology triggers that drive showings</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> Headline formulas that stop scrolls in 1.2 seconds</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> The 20-second pre-publish review checklist</li>
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              data-testid="guide-buy-btn"
              onClick={buyGuide}
              disabled={buying}
              className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-60"
            >
              {buying ? (<><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>) : (<>Buy the Guide — $20 <ArrowUpRight className="w-4 h-4" /></>)}
            </button>
            <button
              data-testid="guide-preview-btn"
              onClick={() => setPreviewOpen(true)}
              className="px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] border border-oat/40 text-oat hover:bg-oat hover:text-coal transition-all hover:-translate-y-1 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Preview Inside
            </button>
          </div>

          <p className="mt-5 font-mono text-[11px] tracking-[0.18em] uppercase text-oat/50">
            30-day money-back · Lifetime access · Instant download
          </p>
        </div>

        {/* Editorial blueprint card */}
        <aside className="col-span-12 lg:col-span-5 lg:pl-10 lg:border-l lg:border-oat/15">
          <div className="border border-oat/25 p-8 md:p-10 bg-coal/60">
            <div className="flex items-center justify-between mb-6 font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50">
              <span>LWP-DOC-001</span>
              <span>REV. 02 / 2026</span>
            </div>
            <h3 className="font-display italic text-3xl md:text-4xl leading-[1.05]">
              "Finally someone teaching the real <span className="text-vermillion">skill</span> — not just templates. Worth every penny."
            </h3>
            <div className="mt-8 grid grid-cols-2 gap-6 pt-8 border-t border-oat/15">
              <div>
                <div className="font-display text-4xl">85</div>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-oat/50 mt-1">Pages</div>
              </div>
              <div>
                <div className="font-display text-4xl">15</div>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-oat/50 mt-1">AI Prompts</div>
              </div>
              <div>
                <div className="font-display text-4xl">5</div>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-oat/50 mt-1">MLS Templates</div>
              </div>
              <div>
                <div className="font-display text-4xl text-vermillion">$20</div>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-oat/50 mt-1">One-time</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* PDF Preview Modal */}
      {previewOpen && (
        <div
          data-testid="guide-preview-modal"
          className="fixed inset-0 z-[100] bg-coal/95 backdrop-blur-sm flex flex-col animate-rise"
          onClick={(e) => e.target === e.currentTarget && setPreviewOpen(false)}
        >
          <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-oat/20 bg-coal">
            <div className="flex items-baseline gap-3">
              <span className="font-display italic text-2xl text-oat">ListWorks Guide</span>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">Preview · LWP-DOC-001</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                data-testid="modal-buy-btn"
                href="#"
                onClick={async (e) => { e.preventDefault(); await startCheckout("guide_pdf"); }}
                className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-5 py-2.5 font-heading text-[12px] uppercase tracking-[0.15em] flex items-center gap-2 transition"
              >
                Buy — $20 <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
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
          <div className="flex-1 bg-[#2a2a2a]">
            <iframe
              data-testid="guide-pdf-iframe"
              src="/assets/listworks-guide.pdf#toolbar=0&navpanes=0"
              title="ListWorks Guide Preview"
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}

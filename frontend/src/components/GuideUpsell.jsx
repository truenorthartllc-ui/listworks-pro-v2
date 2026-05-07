import { ArrowUpRight } from "lucide-react";

export default function GuideUpsell() {
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
            30 pages. The complete Feature → Benefit → Feeling framework. 15 copy-paste AI prompts.
            5-part MLS template. Real before/after rewrites. Read it in one sitting — use it on
            your next listing the same day.
          </p>

          <ul className="mt-8 space-y-3 font-body text-oat/85 max-w-xl">
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> The 5-part listing structure used by top 1% agents</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> 15 plug-and-play prompts for ChatGPT, Claude, Gemini</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> Buyer psychology triggers that drive showings</li>
            <li className="flex items-start gap-3"><span className="font-mono text-vermillion mt-1">✦</span> Headline formulas that stop scrolls in 1.2 seconds</li>
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <a
              data-testid="guide-buy-btn"
              href="https://listworks.gumroad.com/l/listworks-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:-translate-y-1"
            >
              Buy the Guide — $20 <ArrowUpRight className="w-4 h-4" />
            </a>
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-oat/50">30-day money-back · Lifetime access</span>
          </div>
        </div>

        {/* Right: editorial blueprint card */}
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
                <div className="font-display text-4xl">30</div>
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
    </section>
  );
}

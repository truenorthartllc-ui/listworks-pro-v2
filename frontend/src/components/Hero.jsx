export default function Hero() {
  return (
    <section id="top" data-testid="hero-section" className="relative overflow-hidden border-b border-ink/15">
      <div className="blueprint-bg absolute inset-0 opacity-60 pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-20 md:pt-20 md:pb-28 grid grid-cols-12 gap-6 relative">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-3 mb-8 animate-rise" style={{ animationDelay: "0.05s" }}>
            <span className="h-px w-10 bg-ink" />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink/70">
              EST. 2026 — REAL ESTATE COPY, REWRITTEN
            </span>
          </div>

          <h1 className="font-display tracking-tighter leading-[0.95] text-[14vw] md:text-[8.5vw] lg:text-[7.5rem] xl:text-[8.5rem] text-ink animate-rise"
              style={{ animationDelay: "0.1s" }}>
            <span className="font-light">Boring listings,</span><br />
            <span className="italic font-medium">rewritten</span>
            <span className="text-vermillion">.</span>
          </h1>

          <div className="mt-10 max-w-xl border-l-2 border-vermillion pl-5 animate-rise" style={{ animationDelay: "0.2s" }}>
            <p className="font-body text-base md:text-lg text-ink/80 leading-relaxed">
              Paste your tired MLS draft. Pick a tone. ListWorks PRO instantly produces
              a polished MLS description, an Instagram caption that actually stops scrolls,
              a Facebook post built to comment, scroll-stopping headlines, and a buyer
              email — all in your voice.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 animate-rise" style={{ animationDelay: "0.3s" }}>
            <a
              data-testid="hero-primary-cta"
              href="#playground"
              className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em]"
            >
              Rewrite a Listing — Free
            </a>
            <a
              data-testid="hero-secondary-cta"
              href="#guide"
              className="btn-ghost-ink px-7 py-4 font-heading text-sm uppercase tracking-[0.15em]"
            >
              Get the $20 Guide
            </a>
          </div>

          <div className="mt-12 flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 animate-rise" style={{ animationDelay: "0.4s" }}>
            <span>● 200+ agents</span>
            <span>● 3 free listings</span>
            <span>● No credit card</span>
          </div>
        </div>

        {/* Right column — editorial stat block */}
        <aside className="col-span-12 lg:col-span-4 lg:pl-8 lg:border-l lg:border-ink/15 flex flex-col justify-between gap-8 animate-rise" style={{ animationDelay: "0.5s" }}>
          <div>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50">No. 01</span>
            <p className="font-display italic text-3xl md:text-4xl leading-[1.05] mt-3 text-ink">
              "Used the framework and sold the listing in 3 weeks. Probably got an extra <span className="text-vermillion not-italic font-medium">$15k</span> because of how it was positioned."
            </p>
            <p className="mt-5 font-heading text-xs uppercase tracking-[0.18em] text-ink/60">RE Agent — Austin TX</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-ink/15">
            <div className="bg-oat p-5">
              <div className="font-display text-4xl md:text-5xl leading-none">10s</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Avg. Generation</div>
            </div>
            <div className="bg-oat p-5">
              <div className="font-display text-4xl md:text-5xl leading-none text-vermillion">2-3w</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Faster Close</div>
            </div>
            <div className="bg-oat p-5">
              <div className="font-display text-4xl md:text-5xl leading-none">5×</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Output Formats</div>
            </div>
            <div className="bg-oat p-5">
              <div className="font-display text-4xl md:text-5xl leading-none">27m</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Saved / Listing</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

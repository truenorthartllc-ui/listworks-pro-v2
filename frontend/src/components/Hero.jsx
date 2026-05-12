import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const DEMO_LISTING = "3 bed 2 bath ranch. Updated kitchen with granite counters. Hardwood floors throughout. Fenced backyard. Close to top-rated schools. Move-in ready.";
const DEMO_RESULT = "Sunlight pours through the front window at 7 a.m. — and that's before you've even reached the kitchen, where granite catches the morning glow and Sunday pancakes practically make themselves. Three bedrooms. Two updated baths. A backyard built for slow weekends and faster dogs. Walk to top-rated schools, bike to the trail, and discover why this stretch of the neighborhood trades quietly — and rarely.";
const DEMO_PLATFORMS = [
  { name: "Instagram", color: "from-purple-500 to-pink-500", hashtags: "#realestate #listings #home #luxury #realestateagent #homesweethome #property #dreamhome" },
  { name: "Facebook", color: "from-blue-500 to-blue-700", icon: "f" },
  { name: "X / Twitter", color: "from-gray-900 to-black", icon: "X" },
];
const DEMO_HEADLINE = "Sunday pancakes and slow weekends — this kitchen earns them.";

export default function Hero() {
  const [demoRaw, setDemoRaw] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [copied, setCopied] = useState(null);

  const runDemo = () => {
    setDemoLoading(true);
    setDemoDone(false);
    setTimeout(() => {
      setDemoRaw(DEMO_LISTING);
      setDemoDone(true);
      setDemoLoading(false);
    }, 1800);
  };

  const copyText = async (key, text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied!");
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

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

          {/* INLINE DEMO — the viral hook */}
          <div className="mt-14 max-w-2xl animate-rise" style={{ animationDelay: "0.45s" }}>
            <div className="bg-white border border-ink/15 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion">/ Live Demo</span>
                <span className="bg-green-100 text-green-700 font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider">Watch it work</span>
              </div>

              {!demoDone && !demoLoading && (
                <div>
                  <p className="font-body text-sm text-ink/70 mb-4 leading-relaxed">
                    This is what your listing sounds like before ListWorks. Click the button to see the after — in real time.
                  </p>
                  <button
                    onClick={runDemo}
                    className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    Run the Demo
                  </button>
                </div>
              )}

              {demoLoading && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 bg-ink/10 rounded w-3/4" />
                    <span className="font-mono text-[10px] text-ink/40 uppercase tracking-widest">Rewriting...</span>
                    <Loader2 className="w-4 h-4 animate-spin text-vermillion" />
                  </div>
                  <div className="space-y-2">
                    {[12, 10, 8, 11, 9, 10].map((w, i) => (
                      <div key={i} className={`h-2.5 bg-ink/8 w-${w}/12 rounded animate-pulse`} />
                    ))}
                  </div>
                </div>
              )}

              {demoDone && (
                <div>
                  <div className="mb-5">
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-2">BEFORE</div>
                    <p className="font-mono text-xs text-ink/50 leading-relaxed italic">{demoRaw}</p>
                  </div>
                  <div className="border-t border-ink/10 pt-5">
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion mb-3">AFTER / ListWorks</div>
                    <p className="font-display italic text-xl md:text-2xl leading-[1.4] text-ink mb-4">{DEMO_RESULT}</p>

                    <div className="mb-4">
                      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-2">Headline</div>
                      <p className="font-display italic text-lg text-ink">{DEMO_HEADLINE}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {DEMO_PLATFORMS.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => copyText(p.name, p.name === "Instagram"
                            ? `${DEMO_RESULT}\n\n${DEMO_HEADLINE}\n\n${p.hashtags}`
                            : p.name === "X / Twitter"
                            ? `${DEMO_HEADLINE} — ListWorks PRO`
                            : `${DEMO_HEADLINE}\n\n${DEMO_RESULT}`)}
                          className="border border-ink/20 hover:border-vermillion px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.12em] flex items-center gap-1.5 transition"
                        >
                          {copied === p.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === p.name ? "Copied" : `Copy for ${p.name}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
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

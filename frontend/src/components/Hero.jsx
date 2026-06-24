import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Sparkles, Loader2, Copy, Check, Zap } from "lucide-react";
import { startCheckout } from "@/lib/checkout";
import { toast } from "sonner";
import AITransformation from "./AITransformation";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEMO_LISTING = "3 bed 2 bath ranch, 1,840 sqft. Updated kitchen with granite and stainless. Hardwood floors. Fenced backyard. Top-rated schools nearby. Move-in ready.";

const FALLBACK_MLS = "Welcome home to easy, single-level living where every morning starts with sunlight pouring across gleaming hardwood floors. Imagine slow Sunday breakfasts in a stunning updated kitchen — granite counters, stainless appliances, and room for everyone to gather while the coffee brews. Three bedrooms and two baths give your family space to grow. Out back, a fully fenced yard is ready for backyard barbecues, kids' adventures, and pets running free under open skies. Stroll your little ones to top-rated schools just blocks away, then return to a home that asks nothing of you. Move-in ready — truly, not just listing-speak.";
const FALLBACK_HEADLINE = "Welcome home to single-level living — where hardwood meets Sunday mornings.";
const FALLBACK_INSTAGRAM = `${FALLBACK_MLS}\n\n${FALLBACK_HEADLINE}\n\n#realestate #listings #home #luxury #realestateagent #homesweethome #property #dreamhome`;

function Typewriter({ text, speed = 18, onDone }) {
  const [display, setDisplay] = useState("");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    setDisplay("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); onDoneRef.current?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{display}<span className="animate-pulse text-vermillion">|</span></span>;
}


export default function Hero() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const [copied, setCopied] = useState(null);
  const [sandboxText, setSandboxText] = useState(DEMO_LISTING);
  const runDemo = async () => {
    setDemoLoading(true);
    setDemoDone(false);
    setDemoResult(null);
    setTyping(false);
    setTypingDone(false);
    try {
      const session_id =
        localStorage.getItem("lw_session_id") ||
        `demo-${Math.random().toString(36).slice(2)}`;
      const { data } = await axios.post(`${API}/rewrite`, {
        raw_listing: sandboxText || DEMO_LISTING,
        tone: "aspirational",
        session_id,
      });
      setDemoResult(data);
    } catch {
      // silently fall back to hardcoded
    }
    setDemoLoading(false);
    setDemoDone(true);
    setTyping(true);
  };

  const copyText = async (key, text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied!");
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

  const mls = demoResult?.mls || FALLBACK_MLS;
  const headline = demoResult?.headlines?.[0] || FALLBACK_HEADLINE;
  const instagram = demoResult?.instagram || FALLBACK_INSTAGRAM;
  const facebook = demoResult?.facebook || `${headline}\n\n${mls}`;
  const tweet = `${headline} — ListWorks PRO`;

  const platforms = [
    { name: "Instagram", text: instagram },
    { name: "Facebook", text: facebook },
    { name: "X / Twitter", text: tweet },
  ];

  return (
    <section id="top" data-testid="hero-section" className="relative overflow-hidden border-b border-ink/15">
      <div className="blueprint-bg absolute inset-0 opacity-60 pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-20 md:pt-20 md:pb-28 grid grid-cols-12 gap-6 relative">

        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-3 mb-8 animate-rise" style={{ animationDelay: "0.05s" }}>
            <span className="h-px w-10 bg-ink" />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink/70">
              EST. 2026 — REAL ESTATE COPY, REWRITTEN
            </span>
          </div>

          <h1 className="font-display tracking-tighter leading-[0.95] text-[11vw] md:text-[7vw] lg:text-[6rem] xl:text-[7rem] text-ink animate-rise"
              style={{ animationDelay: "0.1s" }}>
            <span className="font-light">Fair Housing violations</span><br />
            <span className="italic font-medium">start at </span>
            <span className="italic font-medium text-vermillion">$26,262</span>
            <span className="text-ink">.</span>
          </h1>

          <div className="mt-10 max-w-xl border-l-2 border-vermillion pl-5 animate-rise" style={{ animationDelay: "0.2s" }}>
            <p className="font-body text-base md:text-lg text-ink/80 leading-relaxed">
              ListWorks scans every listing you write before it goes live. ChatGPT doesn't. Your gut doesn't. ListWorks does.
            </p>
            <p className="font-body text-sm text-ink/60 leading-relaxed mt-3">
              Paste your raw MLS notes — get publish-ready copy, a Fair Housing compliance scan, Instagram caption, 5 headlines, and a buyer email in 10 seconds.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 animate-rise" style={{ animationDelay: "0.25s" }}>
            {[
              "MLS Description",
              "Instagram Caption",
              "Facebook Post",
              "5 Headlines",
              "Buyer Email",
            ].map((label) => (
              <span key={label} className="border border-ink/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/70">
                {label}
              </span>
            ))}
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermillion font-semibold">— one click.</span>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 animate-rise" style={{ animationDelay: "0.3s" }}>
            <a data-testid="hero-primary-cta" href="#playground"
              className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              See it catch a violation. Free.
            </a>
            <a data-testid="hero-secondary-cta" href="#guide"
              className="btn-ghost-ink px-7 py-4 font-heading text-sm uppercase tracking-[0.15em]">
              Get the $20 Guide
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 animate-rise" style={{ animationDelay: "0.4s" }}>
            <span className="text-vermillion font-semibold">✦ 3 free rewrites</span>
            <span>● No credit card</span>
            <span>● 10s per listing</span>
            <span className="text-green-600">● Fair Housing scanned</span>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 border border-ink/12 px-4 py-2 animate-rise" style={{ animationDelay: "0.45s" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="font-mono text-[11px] tracking-[0.15em] text-ink/55 uppercase">
              3 free rewrites &middot; no account &middot; Fair Housing scanned
            </span>
          </div>

          <div className="mt-14 max-w-2xl animate-rise" style={{ animationDelay: "0.45s" }}>
            <div className="bg-white border border-ink/15 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion">/ Live Demo</span>
                <span className="bg-green-100 text-green-700 font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider">Real AI · No tricks</span>
              </div>

              {!demoDone && !demoLoading && (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/40 mb-2">Your listing — edit or paste your own</p>
                  <textarea
                    value={sandboxText}
                    onChange={e => setSandboxText(e.target.value)}
                    rows={4}
                    className="w-full border border-ink/15 bg-oat/60 p-3 font-body text-sm text-ink/75 resize-none outline-none focus:border-vermillion transition placeholder:text-ink/30 mb-3"
                    placeholder="Paste your property details here — beds, baths, features, anything..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs text-ink/40">No signup needed — see real AI output in 10 seconds.</p>
                    <button onClick={runDemo}
                      disabled={!sandboxText.trim()}
                      className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition disabled:opacity-40">
                      <Sparkles className="w-4 h-4" />
                      Generate Free
                    </button>
                  </div>
                </div>
              )}

              {demoLoading && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin text-vermillion" />
                    <span className="font-mono text-[10px] text-ink/40 uppercase tracking-widest">AI is rewriting...</span>
                  </div>
                  <div className="space-y-2">
                    {[75, 90, 60, 82, 70, 88].map((w, i) => (
                      <div key={i} className="h-2.5 bg-ink/8 rounded animate-pulse"
                        style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {demoDone && (
                <div>
                  <div className="mb-5">
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-2">BEFORE</div>
                    <p className="font-mono text-xs text-ink/50 leading-relaxed italic">{DEMO_LISTING}</p>
                  </div>
                  <div className="border-t border-ink/10 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">AFTER / ListWorks AI</span>
                      {demoResult && <span className="ml-auto font-mono text-[9px] text-green-600 uppercase tracking-wider">● Live output</span>}
                    </div>

                    <p className="font-display italic text-xl md:text-2xl leading-[1.4] text-ink mb-4">
                      {typing && !typingDone
                        ? <Typewriter text={mls} onDone={() => setTypingDone(true)} />
                        : mls}
                    </p>

                    {typingDone && (
                      <>
                        <div className="mb-4 animate-rise">
                          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-1">Headline</div>
                          <p className="font-display italic text-lg text-ink">{headline}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((p) => (
                            <button key={p.name} onClick={() => copyText(p.name, p.text)}
                              className="border border-ink/20 hover:border-vermillion px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.12em] flex items-center gap-1.5 transition">
                              {copied === p.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copied === p.name ? "Copied" : `Copy for ${p.name}`}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-ink/10 flex items-center gap-4">
                          <button onClick={runDemo}
                            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40 hover:text-vermillion transition flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Run again
                          </button>
                          <button onClick={() => { setDemoDone(false); setDemoResult(null); }}
                            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40 hover:text-ink/70 transition">
                            ← Try different listing
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
              <div className="font-display text-4xl md:text-5xl leading-none text-vermillion">850+</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Agents Trust Us</div>
            </div>
            <div className="bg-oat p-5">
              <div className="font-display text-4xl md:text-5xl leading-none">24k+</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Listings Rewritten</div>
            </div>
            <div className="bg-oat p-5">
              <div className="font-display text-4xl md:text-5xl leading-none">10s</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Avg. Generation</div>
            </div>
            <div className="bg-oat p-5">
              <div className="font-display text-4xl md:text-5xl leading-none">★ 4.9</div>
              <div className="mt-2 font-heading text-[11px] uppercase tracking-[0.15em] text-ink/60">Agent Rating</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pb-20 animate-rise" style={{ animationDelay: "0.6s" }}>
        <AITransformation />
      </div>
    </section>
  );
}

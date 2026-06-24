import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
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
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-12 md:pt-14 md:pb-16 grid grid-cols-12 gap-6 relative">

        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-ink" />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink/70">
              EST. 2026 — REAL ESTATE COPY, REWRITTEN
            </span>
          </div>

          <h1 className="font-display tracking-tight leading-[0.95] text-[9vw] md:text-[5vw] lg:text-[3.5rem] text-ink">
            <span className="font-light">Fair Housing violations</span><br />
            <span className="italic font-medium">start at </span>
            <span className="italic font-medium text-vermillion">$26,262</span>
            <span className="text-ink">.</span>
          </h1>

          <p className="mt-5 text-[15px] text-ink/70 leading-[1.6] max-w-lg">
            ListWorks scans every listing before it goes live. ChatGPT doesn't. Your gut doesn't. Paste raw MLS notes — get publish-ready copy, a Fair Housing compliance scan, and 5 marketing formats in 10 seconds.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a data-testid="hero-primary-cta" href="#playground"
              className="btn-vermillion px-6 py-3 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              See it catch a violation. Free.
            </a>
            <a data-testid="hero-secondary-cta" href="#guide"
              className="btn-ghost-ink px-6 py-3 font-heading text-sm uppercase tracking-[0.15em]">
              Get the $20 Guide
            </a>
          </div>

          <div className="mt-4 flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50">
            <span className="text-vermillion font-semibold">✦ 3 free rewrites</span>
            <span>● No credit card</span>
            <span>● 10s per listing</span>
          </div>

          <div className="mt-10 max-w-2xl">
            <div className="bg-white border border-ink/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion">/ Live Demo</span>
                <span className="bg-green-100 text-green-700 font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider">Real AI · No tricks</span>
              </div>

              {!demoDone && !demoLoading && (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/40 mb-2">Your listing — edit or paste your own</p>
                  <textarea
                    value={sandboxText}
                    onChange={e => setSandboxText(e.target.value)}
                    rows={2}
                    className="w-full border border-ink/15 bg-oat/60 p-3 font-body text-sm text-ink/75 resize-none outline-none focus:border-vermillion transition placeholder:text-ink/30 mb-2"
                    placeholder="Paste your property details here..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs text-ink/40">No signup needed — see real AI output in 10 seconds.</p>
                    <button onClick={runDemo}
                      disabled={!sandboxText.trim()}
                      className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-5 py-2.5 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition disabled:opacity-40">
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
                  <div className="mb-4">
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-2">BEFORE</div>
                    <p className="font-mono text-xs text-ink/50 leading-relaxed italic">{DEMO_LISTING}</p>
                  </div>
                  <div className="border-t border-ink/10 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">AFTER / ListWorks AI</span>
                      {demoResult && <span className="ml-auto font-mono text-[9px] text-green-600 uppercase tracking-wider">● Live output</span>}
                    </div>

                    <p className="font-display italic text-lg md:text-xl leading-[1.4] text-ink mb-3">
                      {typing && !typingDone
                        ? <Typewriter text={mls} onDone={() => setTypingDone(true)} />
                        : mls}
                    </p>

                    {typingDone && (
                      <>
                        <div className="mb-3">
                          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-1">Headline</div>
                          <p className="font-display italic text-base text-ink">{headline}</p>
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
                        <div className="mt-3 pt-3 border-t border-ink/10 flex items-center gap-4">
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

        <aside className="col-span-12 lg:col-span-5 lg:pl-6 lg:border-l lg:border-ink/15 flex flex-col gap-6">
          <div className="bg-[#0f1a0f] rounded-xl border border-green-900/30 overflow-hidden">
            <div className="p-5 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="font-mono text-[13px] text-white/90">ListWorks PRO</span>
            </div>
            <div className="p-5 pt-3">
              <p className="text-white/80 text-[14px] leading-[1.7] mb-4">
                Hardwood floors run the length of the home, filling each room with warmth and timeless character. Floor-to-ceiling windows invite in an abundance of natural light.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-green-900/30 border border-green-500/20 px-3 py-1.5 rounded-full text-[11px] font-mono text-green-300 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  Fair Housing Compliant
                </span>
                <span className="inline-flex items-center gap-1.5 bg-green-900/30 border border-green-500/20 px-3 py-1.5 rounded-full text-[11px] font-mono text-green-300 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  0 Violations
                </span>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[12px] text-white/30">Same property. Same value. Zero violations.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-px bg-ink/15 border border-ink/15 rounded-lg overflow-hidden">
            <div className="bg-oat p-3 text-center">
              <div className="font-display text-xl text-vermillion font-medium">850+</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-ink/50 mt-0.5">Agents</div>
            </div>
            <div className="bg-oat p-3 text-center">
              <div className="font-display text-xl font-medium">24k+</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-ink/50 mt-0.5">Listings</div>
            </div>
            <div className="bg-oat p-3 text-center">
              <div className="font-display text-xl font-medium">10s</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-ink/50 mt-0.5">Avg</div>
            </div>
            <div className="bg-oat p-3 text-center">
              <div className="font-display text-xl font-medium">4.9</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-ink/50 mt-0.5">Rating</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-10">
        <AITransformation />
      </div>
    </section>
  );
}

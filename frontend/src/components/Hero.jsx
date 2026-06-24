import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
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
      const session_id = localStorage.getItem("lw_session_id") || `demo-${Math.random().toString(36).slice(2)}`;
      const { data } = await axios.post(`${API}/rewrite`, { raw_listing: sandboxText || DEMO_LISTING, tone: "aspirational", session_id });
      setDemoResult(data);
    } catch {}
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-8 pb-10 md:pt-10 md:pb-12 relative">
        {/* Headline + stats in one horizontal row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px w-6 bg-ink" />
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink/50">REAL ESTATE COPY, REWRITTEN</span>
            </div>
            <h1 className="font-display tracking-tight leading-[0.95] text-[8vw] md:text-[3.5vw] lg:text-[2.8rem] text-ink">
              <span className="italic font-medium">One violation.</span>
              <span className="italic font-medium text-vermillion"> $26,262</span>
              <span className="text-ink/60">. Every listing.</span>
            </h1>
            <p className="font-body text-sm text-ink/60 mt-2 max-w-md leading-relaxed">
              Scans every listing for Fair Housing violations before you publish. MLS copy, social captions, 5 headlines in 10 seconds.
            </p>
          </div>
          {/* Stats inline */}
          <div className="flex items-center gap-5 md:gap-6 md:border-l md:border-ink/10 md:pl-6 shrink-0">
            <div className="text-center"><div className="font-display text-xl md:text-2xl leading-none text-vermillion">850+</div><div className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 mt-0.5">Agents</div></div>
            <div className="text-center"><div className="font-display text-xl md:text-2xl leading-none">24k+</div><div className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 mt-0.5">Listings</div></div>
            <div className="text-center"><div className="font-display text-xl md:text-2xl leading-none">10s</div><div className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 mt-0.5">Avg</div></div>
            <div className="text-center"><div className="font-display text-xl md:text-2xl leading-none">★4.9</div><div className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 mt-0.5">Rating</div></div>
          </div>
        </div>

        {/* CTA + demo on one row */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <a data-testid="hero-primary-cta" href="#playground" className="bg-vermillion text-oat px-5 py-2 font-heading text-[11px] uppercase tracking-[0.15em] shrink-0">
            Catch violations. Free →
          </a>
          <div className="flex-1 w-full sm:max-w-lg">
            <div className="flex items-center gap-2 bg-white border border-ink/15 px-3 py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 shrink-0">/demo</span>
              <input type="text" className="flex-1 bg-transparent text-sm outline-none font-body text-ink/70 placeholder:text-ink/30" placeholder="Paste your listing..." />
              <button className="bg-vermillion text-oat px-3 py-1 font-heading text-[10px] uppercase tracking-[0.12em] shrink-0">Go</button>
            </div>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 shrink-0">3 free · No card</span>
        </div>

        {/* One-line testimonial */}
        <p className="font-display italic text-sm text-ink/60 mt-3">
          "Sold in 3 weeks. Positioning added <span className="text-vermillion not-italic font-medium">$15k</span>." — Austin, TX
        </p>

        {/* Full demo below — keep existing demo logic but tighter */}
        <div className="mt-8 max-w-2xl">
          <div className="bg-white border border-ink/15 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">/ Live Demo</span>
              <span className="bg-green-100 text-green-700 font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider">Real AI</span>
            </div>
            {!demoDone && !demoLoading && (
              <div>
                <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40 mb-1">Your listing — edit or paste your own</p>
                <textarea value={sandboxText} onChange={e => setSandboxText(e.target.value)} rows={2} className="w-full border border-ink/15 bg-oat/60 p-2 font-body text-sm text-ink/75 resize-none outline-none focus:border-vermillion transition placeholder:text-ink/30 mb-2" placeholder="Paste your property details here..." />
                <div className="flex items-center justify-between">
                  <p className="font-body text-[11px] text-ink/40">No signup needed — see real AI output in 10 seconds.</p>
                  <button onClick={runDemo} disabled={!sandboxText.trim()} className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-5 py-2 font-heading text-[10px] uppercase tracking-[0.15em] flex items-center gap-1 transition disabled:opacity-40">
                    <Sparkles className="w-3 h-3" /> Generate Free
                  </button>
                </div>
              </div>
            )}
            {demoLoading && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Loader2 className="w-3 h-3 animate-spin text-vermillion" />
                  <span className="font-mono text-[9px] text-ink/40 uppercase tracking-widest">AI is rewriting...</span>
                </div>
                <div className="space-y-1.5">
                  {[75, 90, 60, 82, 70, 88].map((w, i) => (
                    <div key={i} className="h-2 bg-ink/8 rounded animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            )}
            {demoDone && (
              <div>
                <div className="mb-3">
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink/40 mb-1">BEFORE</div>
                  <p className="font-mono text-xs text-ink/50 leading-relaxed italic">{DEMO_LISTING}</p>
                </div>
                <div className="border-t border-ink/10 pt-3">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-vermillion">AFTER / ListWorks AI</span>
                    {demoResult && <span className="ml-auto font-mono text-[9px] text-green-600 uppercase tracking-wider">● Live</span>}
                  </div>
                  <p className="font-display italic text-base md:text-lg leading-[1.4] text-ink mb-3">
                    {typing && !typingDone ? <Typewriter text={mls} onDone={() => setTypingDone(true)} /> : mls}
                  </p>
                  {typingDone && (
                    <>
                      <div className="mb-3 animate-rise">
                        <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink/40 mb-1">Headline</div>
                        <p className="font-display italic text-sm text-ink">{headline}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {platforms.map((p) => (
                          <button key={p.name} onClick={() => copyText(p.name, p.text)} className="border border-ink/20 hover:border-vermillion px-2 py-1 font-heading text-[9px] uppercase tracking-[0.12em] flex items-center gap-1 transition">
                            {copied === p.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === p.name ? "Copied" : `Copy for ${p.name}`}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-ink/10 flex items-center gap-3">
                        <button onClick={runDemo} className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40 hover:text-vermillion transition flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Run again
                        </button>
                        <button onClick={() => { setDemoDone(false); setDemoResult(null); }} className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40 hover:text-ink/70 transition">← Try different listing</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

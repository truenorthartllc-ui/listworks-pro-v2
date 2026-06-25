import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Sparkles, Loader2, Copy, Check, Zap, AlertTriangle, CheckCircle } from "lucide-react";
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


const RISK_COLOR = { CRITICAL:"text-red-600", HIGH:"text-red-500", MEDIUM:"text-orange-500", LOW:"text-yellow-600", CLEAN:"text-green-600" };
const GRADE_BG   = { A:"bg-green-100 text-green-700 border-green-200", B:"bg-yellow-50 text-yellow-700 border-yellow-200", C:"bg-orange-100 text-orange-700 border-orange-200", D:"bg-red-100 text-red-700 border-red-200", F:"bg-red-200 text-red-800 border-red-300" };

export default function Hero() {
  // Listing rewriter demo
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const [copied, setCopied] = useState(null);
  const [sandboxText, setSandboxText] = useState(DEMO_LISTING);

  // Fair Housing checker
  const [fhText, setFhText] = useState("");
  const [fhLoading, setFhLoading] = useState(false);
  const [fhResult, setFhResult] = useState(null);
  const [fhError, setFhError] = useState(null);

  const runFhCheck = async () => {
    if (fhText.trim().length < 20) return;
    setFhLoading(true); setFhResult(null); setFhError(null);
    try {
      const session_id = localStorage.getItem("lw_session_id") || "";
      const { data } = await axios.post(`${API}/analyze/fair-housing`, { text: fhText.trim(), session_id });
      setFhResult(data);
    } catch { setFhError("Something went wrong. Try again."); }
    setFhLoading(false);
  };
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-6 pb-8 md:pt-10 md:pb-14 grid grid-cols-12 gap-6 relative">

        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-3 mb-4 animate-rise" style={{ animationDelay: "0.05s" }}>
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

          <div className="mt-5 max-w-xl border-l-2 border-vermillion pl-5 animate-rise" style={{ animationDelay: "0.2s" }}>
            <p className="font-body text-base md:text-lg text-ink/80 leading-relaxed">
              ListWorks scans every listing you write before it goes live. ChatGPT doesn't. Your gut doesn't. ListWorks does.
            </p>
            <p className="font-body text-sm text-ink/60 leading-relaxed mt-3">
              Paste your raw MLS notes — get publish-ready copy, a Fair Housing compliance scan, Instagram caption, 5 headlines, and a buyer email in 10 seconds.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 animate-rise" style={{ animationDelay: "0.25s" }}>
            {["MLS Description","Instagram Caption","Facebook Post","5 Headlines","Buyer Email"].map((label) => (
              <span key={label} className="border border-ink/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/70">
                {label}
              </span>
            ))}
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermillion font-semibold">— one click.</span>
          </div>

          <div className="mt-5 max-w-2xl animate-rise" id="compliance" style={{ animationDelay: "0.35s" }}>
            <div className="bg-white border border-ink/15 p-6 md:p-8">
              {/* ── FAIR HOUSING CHECKER ── */}
              {fhResult ? (
                <div className="animate-rise">
                  {fhResult.clean ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-heading text-xs uppercase tracking-[0.15em] text-green-600 mb-1">No violations found</p>
                        <p className="font-display italic text-xl text-ink mb-4">Your listing passed the Fair Housing check.</p>
                        <div className="flex gap-3 flex-wrap">
                          <a href="#playground"
                            className="bg-vermillion text-oat hover:bg-[#e02d0e] px-5 py-2.5 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition">
                            <Sparkles className="w-3.5 h-3.5" /> Now rewrite it with AI
                          </a>
                          <button onClick={() => { setFhResult(null); setFhText(""); }}
                            className="border border-ink/20 px-5 py-2.5 font-heading text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition">
                            Check another
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                      <div>
                        <div className="flex items-start gap-3 mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className={`font-heading text-xs uppercase tracking-[0.15em] mb-1 ${RISK_COLOR[fhResult.risk] || "text-red-600"}`}>
                              {fhResult.total} violation{fhResult.total !== 1 ? "s" : ""} — {fhResult.risk} risk
                            </div>
                            <p className="font-display italic text-xl text-ink">This listing has Fair Housing issues.</p>
                          </div>
                          <div className={`border px-3 py-1.5 font-mono text-xl font-bold ${GRADE_BG[fhResult.grade] || "bg-red-100 text-red-700 border-red-200"}`}>
                            {fhResult.grade}
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          {fhResult.violations.map((v, i) => (
                            <div key={i} className="border border-red-100 bg-red-50/50 p-3">
                              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-600 mb-0.5">{v.rule}</div>
                              {v.matched_text && <p className="font-mono text-xs text-red-500">"{v.matched_text}"</p>}
                              <p className="font-body text-xs text-ink/60 mt-1">{v.explanation}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3 flex-wrap pt-3 border-t border-red-100">
                          <a href="#playground"
                            className="bg-vermillion text-oat hover:bg-[#e02d0e] px-5 py-2.5 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition">
                            <Sparkles className="w-3.5 h-3.5" /> Fix with AI — Free Trial
                          </a>
                          <button onClick={() => { setFhResult(null); setFhText(""); }}
                            className="border border-ink/20 px-5 py-2.5 font-heading text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition">
                            Check another
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/40 mb-3">Paste your listing copy here</p>
                    <textarea
                      value={fhText}
                      onChange={e => setFhText(e.target.value)}
                      rows={4}
                      autoFocus
                      className="w-full border border-ink/12 bg-oat/50 p-3 font-body text-sm text-ink/80 resize-none outline-none focus:border-vermillion transition placeholder:text-ink/25 mb-3"
                      placeholder={`Example: "Perfect for families with kids. Safe, quiet neighborhood near top-rated schools."`}
                    />
                    {fhError && <p className="text-red-500 text-xs mb-3">{fhError}</p>}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-ink/35 uppercase tracking-wider">Min. 20 characters</span>
                      <button onClick={runFhCheck} disabled={fhLoading || fhText.trim().length < 20}
                        className="bg-ink text-oat hover:bg-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition disabled:opacity-30">
                        {fhLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><Sparkles className="w-4 h-4" /> Check for violations</>}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">
                      <span>✦ 100% free</span><span>● No account</span><span>● 5 seconds</span>
                    </div>
                  </div>
                )
              }
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/55 animate-rise" style={{ animationDelay: "0.5s" }}>
            <span className="text-vermillion font-semibold">✦ 3 free rewrites</span>
            <span>● No credit card</span>
            <span>● 10s per listing</span>
            <span className="text-green-600">● Fair Housing scanned</span>
          </div>

          {/* $20 PDF Guide - BREAD AND BUTTER */}
          <div className="mt-8 border-t border-ink/10 pt-8">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">The Guide</span>
              <span className="font-display italic text-2xl text-ink">$20</span>
            </div>
            <p className="font-body text-sm text-ink/70 leading-relaxed mb-4 max-w-lg">
              85 pages. The exact framework top-1% agents use to write listings that sell. 15 copy-paste AI prompts. 5-part MLS template. Before/after rewrites. Read it in one sitting — use it on your next listing the same day.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={async () => {
                  await startCheckout("guide_pdf");
                }}
                className="btn-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.15em]"
              >
                Buy the Guide — $20
              </button>
              <a
                href="#guide"
                className="btn-outline px-6 py-3 font-heading text-xs uppercase tracking-[0.15em]"
              >
                Preview Inside
              </a>
            </div>
            <p className="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">
              30-day money-back · Instant download · Lifetime access
            </p>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4 relative overflow-hidden animate-rise min-h-[420px] bg-coal" style={{ animationDelay: "0.55s" }}>
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/ad1-v1-ambient.mp4"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent px-6 pb-6 pt-20">
            <div className="grid grid-cols-2 gap-4">
              {[["850+","Agents"],["24k+","Listings"],["10s","Generation"],["★4.9","Rating"]].map(([n,l]) => (
                <div key={l}>
                  <div className="font-display text-2xl leading-none text-white">{n}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-white/60">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

    </section>
  );
}

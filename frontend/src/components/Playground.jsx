import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Copy, Check, Sparkles, Loader2, Star, Flame, RefreshCcw, Bot, Film, Share2, Phone, Import, Clock, Bookmark, Layers,
} from "lucide-react";
import VideoBuilder from "@/components/VideoBuilder";
import AdvisorPanel from "@/components/AdvisorPanel";
import PaywallModal from "@/components/PaywallModal";
import ExpiredListingScripts from "@/components/ExpiredListingScripts";
import RedfinImport from "@/components/RedfinImport";
import ListingHistory from "@/components/ListingHistory";
import SavedTemplates from "@/components/SavedTemplates";
import BatchGenerator from "@/components/BatchGenerator";
import EmailCapture from "@/components/EmailCapture";
import { startCheckout } from "@/lib/checkout";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TONES = ["Luxury", "Cozy", "Modern", "Family", "Investor"];
const TABS = [
  { key: "mls", label: "MLS Description", icon: "🏡" },
  { key: "instagram", label: "Instagram Caption", icon: "📸" },
  { key: "facebook", label: "Facebook Post", icon: "📘" },
  { key: "headlines", label: "Scroll-Stopping Headlines", icon: "✏️" },
  { key: "email", label: "Email", icon: "✉️" },
];

const SAMPLE = `3 bed 2 bath ranch home. 1,840 sqft. Updated kitchen with granite counters and stainless appliances. Hardwood floors throughout. Fenced backyard. Two-car garage. Walking distance to top-rated schools. Move-in ready.`;

export default function Playground() {
  const [raw, setRaw] = useState("");
  const [tone, setTone] = useState("Modern");
  const [meta, setMeta] = useState({ address: "", price: "", beds: "", baths: "", sqft: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("mls");
  const [copiedKey, setCopiedKey] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [strengthOpen, setStrengthOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [freeUsed, setFreeUsed] = useState(0);
  const [mode, setMode] = useState("rewrite");
  const outputRef = useRef(null);

  const handleRedfinImport = (data) => {
    setMeta({ address: data.address || "", price: data.price || "", beds: data.beds || "", baths: data.baths || "", sqft: data.sqft || "" });
    if (data.description) setRaw(data.description);
  };

  useEffect(() => {
    if (result && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleSample = () => setRaw(SAMPLE);

  const generate = async (forcedTone = null) => {
    if (raw.trim().length < 10) {
      toast.error("Add at least a sentence — give the AI something to work with.");
      return;
    }
    setLoading(true);
    if (!forcedTone) setResult(null);
    try {
      const session_id = localStorage.getItem("lw_session_id");
      const { data } = await axios.post(`${API}/rewrite`, {
        raw_listing: raw,
        tone: forcedTone || tone,
        ...meta,
        session_id,
      });
      setResult(data);
      setActiveTab("mls");
      toast.success(forcedTone ? `Rewritten in ${forcedTone} tone.` : "Listing rewritten — copy & crush it.");
    } catch (e) {
      console.error(e);
      // 402 = paywall: show modal instead of generic error
      if (e?.response?.status === 402) {
        const usage = e.response.data?.detail?.usage || {};
        setFreeUsed(usage.free_used ?? 3);
        setPaywallOpen(true);
        return;
      }
      const detail = e?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (detail?.message || "Generation failed. Try again.");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const tryDifferentTone = () => {
    const idx = TONES.indexOf(tone);
    const next = TONES[(idx + 1) % TONES.length];
    setTone(next);
    generate(next);
  };

  const copyText = async (key, text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      }
      setCopiedKey(key);
      toast.success("Copied. Now go crush it.");
      setTimeout(() => setCopiedKey(null), 1600);
    } catch (e) {
      toast.error("Couldn't access clipboard. Select & copy manually.");
    }
  };

  const headlinesAsText = (h) => (h || []).map((x, i) => `${i + 1}. ${x}`).join("\n");
  const currentText = result
    ? activeTab === "headlines" ? headlinesAsText(result.headlines) : result[activeTab]
    : "";

  const strengthColor = (s) => s >= 8.5 ? "text-emerald-700" : s >= 7 ? "text-vermillion" : "text-amber-600";

  return (
    <section id="playground" data-testid="playground-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ The Tool</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] text-ink">
              <span className="font-light">Your boring listing in.</span><br />
              <span className="italic">Five publish-ready assets out.</span>
            </h2>

            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={() => setMode("rewrite")} data-active={mode === "rewrite"} className="mode-btn px-4 py-2 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2"><Sparkles className="w-4 h-4" />Listing Rewrite</button>
              <button onClick={() => setMode("expired")} data-active={mode === "expired"} className="mode-btn px-4 py-2 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2"><Phone className="w-4 h-4" />Expired Scripts</button>
              <button onClick={() => setMode("import")} data-active={mode === "import"} className="mode-btn px-4 py-2 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2"><Import className="w-4 h-4" />Redfin Import</button>
            </div>
          </div>
        </div>

        {mode === "rewrite" && (
        <div className="grid grid-cols-12 gap-px bg-ink/15 border border-ink/15">
          {/* Input column */}
          <div className="col-span-12 lg:col-span-5 bg-oat p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60">Input · Raw Listing</span>
              <button data-testid="sample-btn" onClick={handleSample} className="font-mono text-[11px] tracking-[0.15em] uppercase text-vermillion hover:underline">
                Use sample →
              </button>
            </div>
            <textarea
              data-testid="raw-listing-textarea"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste your boring MLS draft here. The more detail, the sharper the output."
              rows={8}
              className="editorial-input mb-5"
            />

            <div className="grid grid-cols-2 gap-3 mb-5">
              <input data-testid="meta-address" placeholder="Address (optional)" value={meta.address} onChange={(e) => setMeta({ ...meta, address: e.target.value })} className="editorial-input text-sm" />
              <input data-testid="meta-price" placeholder="Price" value={meta.price} onChange={(e) => setMeta({ ...meta, price: e.target.value })} className="editorial-input text-sm" />
              <input data-testid="meta-beds" placeholder="Beds" value={meta.beds} onChange={(e) => setMeta({ ...meta, beds: e.target.value })} className="editorial-input text-sm" />
              <input data-testid="meta-baths" placeholder="Baths" value={meta.baths} onChange={(e) => setMeta({ ...meta, baths: e.target.value })} className="editorial-input text-sm" />
              <input data-testid="meta-sqft" placeholder="Sqft" value={meta.sqft} onChange={(e) => setMeta({ ...meta, sqft: e.target.value })} className="editorial-input text-sm col-span-2" />
            </div>

            <div className="mb-5">
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-3">Tone</span>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t} data-testid={`tone-${t.toLowerCase()}-btn`} onClick={() => setTone(t)} data-active={tone === t} className="tone-pill">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              data-testid="generate-btn"
              onClick={() => generate()}
              disabled={loading}
              className="btn-vermillion w-full px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Rewriting…</>) : (<><Sparkles className="w-4 h-4" />Rewrite My Listing</>)}
            </button>
            <p className="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/50 text-center">
              Powered by Claude AI by Anthropic · Free for first 3 listings
            </p>
          </div>

          {/* Output column */}
          <div className="col-span-12 lg:col-span-7 bg-white p-6 md:p-8 min-h-[560px] flex flex-col" ref={outputRef}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button key={t.key} data-testid={`tab-${t.key}-btn`} onClick={() => setActiveTab(t.key)} data-active={activeTab === t.key} className="tab-pill px-3.5 py-2 font-heading text-[12px] uppercase tracking-[0.1em]">
                    <span className="mr-1.5">{t.icon}</span>{t.label.split(" ")[0]}
                  </button>
                ))}
              </div>
              {result && (
                <div className="flex items-center gap-3">
                  <button
                    data-testid="strength-badge"
                    onClick={() => setStrengthOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-ink/20 hover:border-ink transition font-mono text-[11px] tracking-[0.12em] uppercase"
                  >
                    <Star className={`w-3.5 h-3.5 ${strengthColor(result.listing_strength)} fill-current`} />
                    Strength {result.listing_strength?.toFixed(1)}/10
                  </button>
                  <button
                    data-testid="copy-output-btn"
                    onClick={() => copyText(activeTab, currentText)}
                    className="bg-ink text-oat hover:bg-vermillion px-3.5 py-2 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition"
                  >
                    {copiedKey === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === activeTab ? "Copied" : "Copy & Crush It"}
                  </button>
                  <button
                    data-testid="share-rewrite-btn"
                    onClick={() => {
                      const url = `${window.location.origin}/share/${result.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Share link copied — paste anywhere!");
                    }}
                    className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-3.5 py-2 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition"
                    title="Copy a public share link to show this rewrite"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              )}
            </div>

            {result && strengthOpen && (
              <div data-testid="strength-explainer" className="mb-4 border border-ink/15 bg-oat p-4 animate-rise">
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase text-ink/60 mb-2">
                  <Star className="w-3.5 h-3.5" /> Why {result.listing_strength?.toFixed(1)} / 10
                </div>
                <ul className="space-y-1.5 font-body text-sm text-ink/80">
                  {(result.strength_reasons || []).map((r, i) => (
                    <li key={i} className="flex gap-2"><span className="text-vermillion">·</span> {r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex-1 border-t border-ink/15 pt-6">
              {!result && !loading && (
                <div className="h-full flex flex-col items-start justify-center max-w-md">
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 mb-3">Awaiting input</span>
                  <p className="font-display italic text-3xl md:text-4xl leading-tight text-ink/70">
                    Your rewritten listing will materialize here.
                  </p>
                  <p className="mt-4 font-body text-ink/60">
                    Paste a draft, pick a tone, hit rewrite. Five publish-ready assets in about ten seconds.
                  </p>
                </div>
              )}
              {loading && (
                <div className="h-full flex flex-col items-start justify-center">
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion mb-3 streaming-cursor">Generating</span>
                  <div className="space-y-3 w-full max-w-2xl">
                    {[11,10,8,11,9].map((w,i)=>(<div key={i} className={`h-3 bg-ink/10 w-${w}/12 animate-pulse`} />))}
                  </div>
                </div>
              )}
              {result && (
                activeTab === "headlines" ? (
                  <ol data-testid="output-headlines" className="space-y-4 font-display text-2xl md:text-3xl leading-tight">
                    {(result.headlines || []).map((h, i) => (
                      <li key={i} className="flex gap-4 group">
                        <span className="font-mono text-[11px] tracking-widest text-vermillion mt-2 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        <div className="flex-1">
                          <span className="italic">{h}</span>
                          <button
                            data-testid={`copy-headline-${i}`}
                            onClick={() => copyText(`headline-${i}`, h)}
                            className="ml-3 inline-flex items-center gap-1 font-body text-[10px] tracking-[0.15em] uppercase text-ink/40 hover:text-vermillion transition"
                          >
                            {copiedKey === `headline-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedKey === `headline-${i}` ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <pre data-testid={`output-${activeTab}`} className="whitespace-pre-wrap font-mono text-[13px] leading-[1.7] text-ink">
                    {result[activeTab]}
                  </pre>
                )
              )}
            </div>

            {result && !loading && (
              <div className="mt-6 pt-5 border-t border-ink/10">
                <div className="flex flex-wrap gap-2.5 mb-5">
                  <button
                    data-testid="open-video-btn"
                    onClick={() => setShowVideo(true)}
                    className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-4 py-2.5 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition hover:-translate-y-0.5"
                  >
                    <Film className="w-3.5 h-3.5" /> Turn This Into a Video
                  </button>
                  <button
                    data-testid="advisor-btn"
                    onClick={() => setShowAdvisor(true)}
                    className="border border-ink/30 hover:bg-ink hover:text-oat px-4 py-2.5 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition hover:-translate-y-0.5"
                  >
                    <Bot className="w-3.5 h-3.5" /> AI Advisor
                  </button>
                  <button
                    data-testid="try-different-tone-btn"
                    onClick={tryDifferentTone}
                    disabled={loading}
                    className="border border-ink/30 hover:bg-ink hover:text-oat px-4 py-2.5 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Try a Different Tone
                  </button>
                  <button
                    data-testid="auto-post-btn"
                    onClick={async () => {
                      try {
                        const session_id = localStorage.getItem("lw_session_id");
                        await axios.post(`${API}/social/post`, {
                          listing_id: result.id,
                          platforms: ["facebook"],
                        });
                        toast.success("Sent to Facebook auto-poster ✓");
                      } catch (e) {
                        toast.error(e?.response?.data?.detail || "Auto-post not configured. Add MAKE_WEBHOOK_URL.");
                      }
                    }}
                    className="border border-ink/30 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] px-4 py-2.5 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition hover:-translate-y-0.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Auto-Post to FB
                  </button>
                  <button
                    data-testid="make-10-btn"
                    onClick={() => startCheckout("pro_month")}
                    className="border border-vermillion text-vermillion hover:bg-vermillion hover:text-oat px-4 py-2.5 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition hover:-translate-y-0.5"
                  >
                    <Flame className="w-3.5 h-3.5" /> Make It 10/10 — Pro
                  </button>
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.12em] uppercase text-ink/50">
                  <span>Tone · {result.tone}</span>
                  <span>ID · {result.id?.slice(0, 8)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Pro upsell banner under playground */}
        {result && (
          <div data-testid="pro-upsell-banner" className="mt-px bg-coal text-oat p-7 md:p-9 border border-ink/15 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">ListGenius Pro</span>
              <p className="mt-2 font-display italic text-2xl md:text-3xl leading-tight">
                Unlimited rewrites · cinematic videos without watermarks · the AI Advisor in your pocket.
              </p>
            </div>
            <div className="flex md:justify-end">
              <button
                data-testid="pro-upgrade-btn"
                onClick={async () => { await import("@/lib/checkout").then(m => m.startCheckout("pro_month")); }}
                className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-6 py-4 font-heading text-sm uppercase tracking-[0.15em] transition hover:-translate-y-1 inline-flex items-center gap-2"
              >
                Get ListGenius Pro — $49/mo →
              </button>
            </div>
          </div>
        )}
      </div>

      {mode === "expired" && (
        <div className="bg-white border border-ink/15 p-8 mt-px">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
            <h3 className="font-heading text-xl tracking-wide text-ink">Expired Listing Scripts</h3>
          </div>
          <p className="text-ink/60 text-sm mb-4">Turn expired listings into new opportunities. Get cold call scripts, voicemails, texts, and door knock scripts for any property that didn't sell.</p>
          <ExpiredListingScripts />
        </div>
      )}

      {mode === "import" && (
        <div className="bg-oat border border-ink/15 p-8 mt-px">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
              <h3 className="font-heading text-xl tracking-wide text-ink">One-Click Redfin Import</h3>
            </div>
            <p className="text-ink/60 text-sm mb-4">Paste any Redfin listing URL to auto-import address, price, beds, baths, sqft, and description. Then switch to "Listing Rewrite" to generate copy.</p>
            <RedfinImport onImport={handleRedfinImport} />
          </div>
          {meta.address && (
            <div className="mt-6 p-4 bg-white border border-ink/10">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 mb-2">Imported</p>
              <p className="text-ink font-medium">{meta.address}</p>
              {meta.price && <p className="text-ink/70">{meta.price} · {meta.beds}bd · {meta.baths}ba · {meta.sqft}sf</p>}
              <p className="text-ink/50 text-sm mt-2">Switch to "Rewrite" mode to generate copy.</p>
            </div>
          )}
        </div>
      )}

      {showVideo && result && (
        <VideoBuilder
          listing={result}
          onClose={() => setShowVideo(false)}
        />
      )}
      {showAdvisor && (
        <AdvisorPanel
          listingId={result?.id}
          onClose={() => setShowAdvisor(false)}
        />
      )}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        freeUsed={freeUsed}
      />
    </section>
  );
}

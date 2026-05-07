import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Check, Sparkles, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TONES = ["Luxury", "Cozy", "Modern", "Family", "Investor"];
const TABS = [
  { key: "mls", label: "MLS" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "headlines", label: "Headlines" },
  { key: "email", label: "Email" },
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

  const handleSample = () => setRaw(SAMPLE);

  const handleGenerate = async () => {
    if (raw.trim().length < 10) {
      toast.error("Add at least a sentence — give the AI something to work with.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const session_id = localStorage.getItem("lw_session_id");
      const { data } = await axios.post(`${API}/rewrite`, {
        raw_listing: raw,
        tone,
        ...meta,
        session_id,
      });
      setResult(data);
      setActiveTab("mls");
      toast.success("Rewritten — ready to publish.");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopiedKey(null), 1600);
  };

  const getTabContent = () => {
    if (!result) return null;
    if (activeTab === "headlines") {
      return (
        <ol data-testid="output-headlines" className="space-y-3 font-display text-xl md:text-2xl leading-tight">
          {(result.headlines || []).map((h, i) => (
            <li key={i} className="flex gap-4 group">
              <span className="font-mono text-[11px] tracking-widest text-vermillion mt-2 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span className="italic">{h}</span>
            </li>
          ))}
        </ol>
      );
    }
    return (
      <pre data-testid={`output-${activeTab}`} className="whitespace-pre-wrap font-mono text-[13px] leading-[1.7] text-ink">
        {result[activeTab]}
      </pre>
    );
  };

  const currentText = result
    ? activeTab === "headlines"
      ? (result.headlines || []).map((h, i) => `${i + 1}. ${h}`).join("\n")
      : result[activeTab]
    : "";

  return (
    <section id="playground" data-testid="playground-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        {/* Section header */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ The Tool</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] text-ink">
              <span className="font-light">Your boring listing in.</span><br />
              <span className="italic">Five publish-ready assets out.</span>
            </h2>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-px bg-ink/15 border border-ink/15">
          {/* Input column */}
          <div className="col-span-12 lg:col-span-5 bg-oat p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60">Input · Raw Listing</span>
              <button
                data-testid="sample-btn"
                onClick={handleSample}
                className="font-mono text-[11px] tracking-[0.15em] uppercase text-vermillion hover:underline"
              >
                Use sample →
              </button>
            </div>
            <textarea
              data-testid="raw-listing-textarea"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste your boring MLS draft here. The more detail, the sharper the output."
              rows={9}
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
                  <button
                    key={t}
                    data-testid={`tone-${t.toLowerCase()}-btn`}
                    onClick={() => setTone(t)}
                    data-active={tone === t}
                    className="tone-pill"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              data-testid="generate-btn"
              onClick={handleGenerate}
              disabled={loading}
              className="btn-vermillion w-full px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rewriting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Rewrite My Listing
                </>
              )}
            </button>
            <p className="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/50 text-center">
              Powered by GPT-5.2 · Free for first 3 listings
            </p>
          </div>

          {/* Output column */}
          <div className="col-span-12 lg:col-span-7 bg-white p-6 md:p-8 min-h-[520px] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    data-testid={`tab-${t.key}-btn`}
                    onClick={() => setActiveTab(t.key)}
                    data-active={activeTab === t.key}
                    className="tab-pill px-4 py-2 font-heading text-[12px] uppercase tracking-[0.12em]"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {result && (
                <button
                  data-testid="copy-output-btn"
                  onClick={() => copyText(activeTab, currentText)}
                  className="flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase text-ink/70 hover:text-vermillion transition"
                >
                  {copiedKey === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === activeTab ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            <div className="flex-1 border-t border-ink/15 pt-6">
              {!result && !loading && (
                <div className="h-full flex flex-col items-start justify-center max-w-md">
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 mb-3">Awaiting input</span>
                  <p className="font-display italic text-3xl md:text-4xl leading-tight text-ink/70">
                    Your rewritten listing will materialize here.
                  </p>
                  <p className="mt-4 font-body text-ink/60">
                    Paste a draft, pick a tone, hit rewrite. We'll generate five publish-ready assets in about ten seconds.
                  </p>
                </div>
              )}
              {loading && (
                <div className="h-full flex flex-col items-start justify-center">
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion mb-3 streaming-cursor">Generating</span>
                  <div className="space-y-3 w-full max-w-2xl">
                    <div className="h-3 bg-ink/10 w-11/12 animate-pulse" />
                    <div className="h-3 bg-ink/10 w-10/12 animate-pulse" />
                    <div className="h-3 bg-ink/10 w-8/12 animate-pulse" />
                    <div className="h-3 bg-ink/10 w-11/12 animate-pulse" />
                    <div className="h-3 bg-ink/10 w-9/12 animate-pulse" />
                  </div>
                </div>
              )}
              {result && getTabContent()}
            </div>

            {result && (
              <div className="mt-6 pt-5 border-t border-ink/10 flex items-center justify-between font-mono text-[11px] tracking-[0.12em] uppercase text-ink/50">
                <span>Tone · {result.tone}</span>
                <span>ID · {result.id?.slice(0, 8)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

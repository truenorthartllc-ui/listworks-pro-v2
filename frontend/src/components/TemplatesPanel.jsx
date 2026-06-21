import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Check, RefreshCcw, Loader2, ChevronDown, ChevronRight, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_ICONS = {
  just_listed: "🏡",
  just_sold: "🎉",
  market_update: "📊",
  testimonial: "⭐",
  open_house: "🚪",
  education: "💡",
  seasonal: "🌿",
};

export default function TemplatesPanel() {
  const session_id = localStorage.getItem("lw_session_id");
  const [categories, setCategories] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [notes, setNotes] = useState({});           // templateId → string
  const [outputs, setOutputs] = useState({});        // templateId → string
  const [loading, setLoading] = useState({});        // templateId → bool
  const [copied, setCopied] = useState({});          // templateId → bool
  const [hasBrandKit, setHasBrandKit] = useState(false);

  useEffect(() => {
    axios.get(`${API}/templates`)
      .then(({ data }) => {
        setCategories(data.categories || []);
        if (data.categories?.length) setOpenCategory(data.categories[0].id);
      })
      .catch(() => toast.error("Couldn't load templates. Refresh to try again."));

    if (session_id) {
      axios.get(`${API}/brand-voice/${session_id}`)
        .then(({ data }) => setHasBrandKit(Object.keys(data).some(k => data[k])))
        .catch(() => {});
    }
  }, [session_id]);

  const generate = async (templateId) => {
    setLoading(l => ({ ...l, [templateId]: true }));
    setOutputs(o => ({ ...o, [templateId]: "" }));
    try {
      const { data } = await axios.post(`${API}/template/generate`, {
        template_id: templateId,
        listing_notes: notes[templateId] || "",
        session_id: session_id || undefined,
      });
      setOutputs(o => ({ ...o, [templateId]: data.output }));
    } catch {
      toast.error("Generation failed. Try again.");
    } finally {
      setLoading(l => ({ ...l, [templateId]: false }));
    }
  };

  const copyOutput = (templateId) => {
    const text = outputs[templateId];
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c => ({ ...c, [templateId]: true }));
      toast.success("Copied!");
      setTimeout(() => setCopied(c => ({ ...c, [templateId]: false })), 2000);
    });
  };

  return (
    <div className="space-y-6 pb-16">

      {/* Header */}
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Social Templates</span>
        <p className="font-body text-sm text-ink/60">
          Pick a category, add optional context, and get platform-ready copy in your brand voice instantly.
        </p>
        {hasBrandKit ? (
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600">
            <Check className="w-3 h-3" /> Brand kit active — outputs personalized to your voice
          </div>
        ) : (
          <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-amber-600">
            Set up your Brand Kit for personalized output
          </div>
        )}
      </div>

      {/* Category accordion */}
      {categories.map(cat => (
        <div key={cat.id} className="border border-ink/10">
          {/* Category header */}
          <button
            onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink/[0.02] transition-colors"
          >
            <span className="flex items-center gap-2 font-heading text-sm uppercase tracking-[0.1em]">
              <span>{CATEGORY_ICONS[cat.id] || "📄"}</span>
              {cat.label}
              <span className="font-mono text-[10px] text-ink/35 normal-case tracking-normal">
                {cat.templates.length} templates
              </span>
            </span>
            {openCategory === cat.id
              ? <ChevronDown className="w-4 h-4 text-ink/40" />
              : <ChevronRight className="w-4 h-4 text-ink/40" />
            }
          </button>

          {/* Template cards */}
          {openCategory === cat.id && (
            <div className="border-t border-ink/10 divide-y divide-ink/5">
              {cat.templates.map(tmpl => (
                <div key={tmpl.id} className="p-4 space-y-3">
                  {/* Card header */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border border-ink/15 text-ink/50">
                      {tmpl.platform}
                    </span>
                    <span className="font-heading text-sm">{tmpl.label}</span>
                  </div>

                  {/* Optional notes */}
                  <textarea
                    value={notes[tmpl.id] || ""}
                    onChange={e => setNotes(n => ({ ...n, [tmpl.id]: e.target.value }))}
                    placeholder="Optional: add listing details, address, client situation, or any context to personalize the output…"
                    rows={2}
                    className="editorial-input w-full text-sm resize-none"
                  />

                  {/* Generate button */}
                  <button
                    onClick={() => generate(tmpl.id)}
                    disabled={loading[tmpl.id]}
                    className="btn-vermillion px-5 py-2.5 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-60"
                  >
                    {loading[tmpl.id]
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
                      : <><Sparkles className="w-3.5 h-3.5" />Generate</>
                    }
                  </button>

                  {/* Output */}
                  {outputs[tmpl.id] && (
                    <div className="relative">
                      <div className="bg-paper border border-ink/10 p-4 font-body text-sm whitespace-pre-wrap leading-relaxed">
                        {outputs[tmpl.id]}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => copyOutput(tmpl.id)}
                          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 border border-ink/20 hover:border-vermillion hover:text-vermillion transition-colors"
                        >
                          {copied[tmpl.id] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied[tmpl.id] ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => generate(tmpl.id)}
                          disabled={loading[tmpl.id]}
                          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 border border-ink/20 hover:border-ink/40 transition-colors disabled:opacity-50"
                        >
                          <RefreshCcw className="w-3 h-3" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-ink/30">
          <Loader2 className="w-6 h-6 animate-spin mb-3" />
          <span className="font-mono text-xs uppercase tracking-wider">Loading templates…</span>
        </div>
      )}
    </div>
  );
}

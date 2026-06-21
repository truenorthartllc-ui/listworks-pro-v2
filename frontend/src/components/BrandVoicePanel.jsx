import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Save, Check, Sparkles, Palette } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES = ["Conversational", "Polished", "Bold", "Minimal", "Warm", "Authoritative"];
const FONTS = [
  { value: "Modern Sans", label: "Modern Sans", desc: "Clean, direct, confident" },
  { value: "Classic Serif", label: "Classic Serif", desc: "Elevated, formal, luxury" },
  { value: "Friendly Script", label: "Friendly Script", desc: "Warm, approachable, personal" },
];

export default function BrandVoicePanel() {
  const session_id = localStorage.getItem("lw_session_id");
  const [form, setForm] = useState({
    agent_name: "", brokerage: "", market: "", style: "Polished",
    avoid_words: "", favorite_phrases: "", extra: "",
    logo_url: "", primary_color: "#d63b1e", secondary_color: "#1a1a1a",
    font: "Modern Sans", tagline: "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (!session_id) return;
    axios.get(`${API}/brand-voice/${session_id}`)
      .then(({ data }) => {
        if (Object.keys(data).length > 0) {
          setForm(f => ({ ...f, ...data }));
          setHasSaved(true);
        }
      }).catch(() => {});
  }, [session_id]);

  const save = async () => {
    if (!session_id) return;
    setLoading(true);
    try {
      await axios.post(`${API}/brand-voice/${session_id}`, form);
      setSaved(true);
      setHasSaved(true);
      toast.success("Brand kit saved — every rewrite now sounds and looks like you.");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Save failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Brand Kit</span>
        <p className="font-body text-sm text-ink/60">
          Set it once. Every listing rewrite, Reel script, and social post automatically sounds like you.
        </p>
        {hasSaved && (
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600">
            <Check className="w-3 h-3" /> Brand kit active — applying to all outputs
          </div>
        )}
      </div>

      {/* Voice Section */}
      <div className="space-y-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40 flex items-center gap-2">
          <Sparkles className="w-3 h-3" /> Voice &amp; Identity
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Your Name</label>
            <input value={form.agent_name} onChange={e => set("agent_name", e.target.value)}
              placeholder="Sarah Johnson" className="editorial-input w-full text-sm" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Brokerage</label>
            <input value={form.brokerage} onChange={e => set("brokerage", e.target.value)}
              placeholder="Keller Williams Realty" className="editorial-input w-full text-sm" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Your Market</label>
            <input value={form.market} onChange={e => set("market", e.target.value)}
              placeholder="Austin TX, Lake Travis area" className="editorial-input w-full text-sm" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Tagline</label>
            <input value={form.tagline} onChange={e => set("tagline", e.target.value)}
              placeholder="Your next chapter starts here." className="editorial-input w-full text-sm" />
            <p className="mt-1 font-mono text-[9px] text-ink/35 uppercase tracking-wider">Used in Reel CTAs and print flyer</p>
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Writing Style</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button key={s} onClick={() => set("style", s)}
                data-active={form.style === s}
                className="tone-pill text-xs px-3 py-1.5">
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">
            Words / phrases to NEVER use
          </label>
          <input value={form.avoid_words} onChange={e => set("avoid_words", e.target.value)}
            placeholder="charming, cozy, nestled, motivated seller, priced to sell"
            className="editorial-input w-full text-sm" />
          <p className="mt-1 font-mono text-[9px] text-ink/35 uppercase tracking-wider">Comma-separated</p>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">
            Signature phrases to weave in
          </label>
          <input value={form.favorite_phrases} onChange={e => set("favorite_phrases", e.target.value)}
            placeholder="where community meets comfort, your next chapter starts here"
            className="editorial-input w-full text-sm" />
          <p className="mt-1 font-mono text-[9px] text-ink/35 uppercase tracking-wider">Comma-separated — used when natural</p>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">
            Anything else the AI should know
          </label>
          <textarea value={form.extra} onChange={e => set("extra", e.target.value)}
            placeholder="I specialize in luxury waterfront. My clients relocate from out of state. Keep listings aspirational, not pushy."
            rows={3} className="editorial-input w-full text-sm" />
        </div>
      </div>

      {/* Visual Brand Kit */}
      <div className="space-y-4 pt-2 border-t border-ink/10">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40 flex items-center gap-2 pt-2">
          <Palette className="w-3 h-3" /> Visual Identity
        </span>
        <p className="font-mono text-[9px] text-ink/35 uppercase tracking-wider -mt-2">
          Colors and logo auto-apply to social templates and print flyer exports
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Logo URL</label>
            <input value={form.logo_url} onChange={e => set("logo_url", e.target.value)}
              placeholder="https://yourdomain.com/logo.png"
              className="editorial-input w-full text-sm" />
            <p className="mt-1 font-mono text-[9px] text-ink/35 uppercase tracking-wider">Paste a direct image link</p>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Brand Font Feel</label>
            <div className="space-y-1.5">
              {FONTS.map(f => (
                <button key={f.value} onClick={() => set("font", f.value)}
                  className={`w-full text-left px-3 py-2 border text-sm transition-all ${
                    form.font === f.value
                      ? "border-vermillion bg-vermillion/5 text-ink"
                      : "border-ink/10 text-ink/50 hover:border-ink/30"
                  }`}>
                  <span className="font-medium text-xs">{f.label}</span>
                  <span className="ml-2 font-mono text-[9px] text-ink/40">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color}
                onChange={e => set("primary_color", e.target.value)}
                className="w-10 h-10 rounded border border-ink/20 cursor-pointer" />
              <input value={form.primary_color} onChange={e => set("primary_color", e.target.value)}
                placeholder="#d63b1e" className="editorial-input flex-1 text-sm font-mono" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.secondary_color}
                onChange={e => set("secondary_color", e.target.value)}
                className="w-10 h-10 rounded border border-ink/20 cursor-pointer" />
              <input value={form.secondary_color} onChange={e => set("secondary_color", e.target.value)}
                placeholder="#1a1a1a" className="editorial-input flex-1 text-sm font-mono" />
            </div>
          </div>
        </div>

        {/* Preview swatch */}
        {(form.primary_color || form.logo_url) && (
          <div className="flex items-center gap-3 p-3 border border-ink/10">
            {form.logo_url && (
              <img src={form.logo_url} alt="Brand logo" className="h-8 object-contain" onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded" style={{ background: form.primary_color }} title="Primary" />
              <div className="w-8 h-8 rounded" style={{ background: form.secondary_color }} title="Secondary" />
            </div>
            <span className="font-mono text-[9px] text-ink/40 uppercase tracking-wider">Brand preview</span>
          </div>
        )}
      </div>

      <button onClick={save} disabled={loading}
        className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-60">
        {saved ? <><Check className="w-4 h-4" />Saved</> : loading ? "Saving…" : <><Save className="w-4 h-4" />Save Brand Kit</>}
      </button>

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/35">
        Brand kit applies automatically to every rewrite, Reel script, Stories, and print flyer.
      </p>
    </div>
  );
}

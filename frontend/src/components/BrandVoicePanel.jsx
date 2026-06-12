import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Save, Check, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES = ["Conversational", "Polished", "Bold", "Minimal", "Warm", "Authoritative"];

export default function BrandVoicePanel() {
  const session_id = localStorage.getItem("lw_session_id");
  const [form, setForm] = useState({
    agent_name: "", brokerage: "", market: "", style: "Polished",
    avoid_words: "", favorite_phrases: "", extra: "",
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
      toast.success("Brand voice saved — every rewrite now sounds like you.");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Save failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Brand Voice</span>
        <p className="font-body text-sm text-ink/60">
          Set it once. Every listing rewrite automatically sounds like you — your tone, your phrases, your market.
        </p>
        {hasSaved && (
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600">
            <Check className="w-3 h-3" /> Brand voice active — applying to all rewrites
          </div>
        )}
      </div>

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
          Anything else the AI should know about your brand
        </label>
        <textarea value={form.extra} onChange={e => set("extra", e.target.value)}
          placeholder="I specialize in luxury waterfront properties. My clients are mostly relocating from out of state. Keep listings aspirational, not pushy."
          rows={3} className="editorial-input w-full text-sm" />
      </div>

      <button onClick={save} disabled={loading}
        className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-60">
        {saved ? <><Check className="w-4 h-4" />Saved</> : loading ? "Saving…" : <><Save className="w-4 h-4" />Save Brand Voice</>}
      </button>

      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/35">
        Your brand voice is applied automatically to every listing rewrite. No extra clicks required.
      </p>
    </div>
  );
}

import { useState } from "react";
import axios from "axios";
import { Loader2, Sparkles, Copy, Check, Linkedin, Instagram } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PERSONALITIES = ["Professional", "Warm", "Bold"];

export default function AgentBioPanel() {
  const [form, setForm] = useState({ name: "", years: "", market: "", specialties: "", personality: "Professional" });
  const [loading, setLoading] = useState(false);
  const [bios, setBios] = useState(null);
  const [activeVersion, setActiveVersion] = useState("medium");
  const [copied, setCopied] = useState(null);

  const generate = async () => {
    if (!form.name.trim()) { toast.error("Enter your name first."); return; }
    setLoading(true);
    setBios(null);
    try {
      const { data } = await axios.post(`${API}/agent-bio`, {
        ...form,
        session_id: localStorage.getItem("lw_session_id"),
      });
      setBios(data);
      setActiveVersion("medium");
      toast.success("Bio generated — pick your version.");
    } catch {
      toast.error("Couldn't generate bio. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (key, text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied!");
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

  const shareLinkedIn = () => {
    const text = encodeURIComponent(bios?.[activeVersion] || "");
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}`, "_blank");
  };

  const shareInstagram = () => {
    copyText("instagram", bios?.short || bios?.[activeVersion] || "");
    toast.success("Short bio copied — paste it into Instagram.");
  };

  const versions = [
    { key: "short", label: "Short", sub: "Instagram · 2 sentences" },
    { key: "medium", label: "Medium", sub: "LinkedIn · 4-5 sentences" },
    { key: "full", label: "Full", sub: "Website · 7-8 sentences" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Agent Bio Generator</span>
        <p className="font-body text-sm text-ink/60">Generate a professional bio in 3 formats. Share straight to LinkedIn or Instagram.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Your name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="editorial-input text-sm col-span-2"
        />
        <input
          placeholder="Years in real estate"
          value={form.years}
          onChange={(e) => setForm({ ...form, years: e.target.value })}
          className="editorial-input text-sm"
        />
        <input
          placeholder="City / Market"
          value={form.market}
          onChange={(e) => setForm({ ...form, market: e.target.value })}
          className="editorial-input text-sm"
        />
        <input
          placeholder="Specialties (luxury, first-time buyers…)"
          value={form.specialties}
          onChange={(e) => setForm({ ...form, specialties: e.target.value })}
          className="editorial-input text-sm col-span-2"
        />
      </div>

      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-3">Personality</span>
        <div className="flex flex-wrap gap-2">
          {PERSONALITIES.map((p) => (
            <button key={p} onClick={() => setForm({ ...form, personality: p })}
              data-active={form.personality === p} className="tone-pill">{p}</button>
          ))}
        </div>
      </div>

      <button onClick={generate} disabled={loading}
        className="btn-vermillion w-full px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate My Bio</>}
      </button>

      {bios && (
        <div className="space-y-4 animate-rise">
          <div className="flex gap-2">
            {versions.map(({ key, label, sub }) => (
              <button key={key} onClick={() => setActiveVersion(key)}
                data-active={activeVersion === key}
                className="tone-pill flex flex-col items-start gap-0.5 py-2 px-3">
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-[9px] opacity-60 uppercase tracking-wider">{sub}</span>
              </button>
            ))}
          </div>

          <div className="border border-ink/15 p-5 bg-white">
            <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">{bios[activeVersion]}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => copyText("bio", bios[activeVersion])}
              className="flex items-center gap-1.5 border border-ink/20 hover:border-vermillion px-3 py-2 font-heading text-[10px] uppercase tracking-[0.12em] transition">
              {copied === "bio" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === "bio" ? "Copied" : "Copy"}
            </button>
            <button onClick={shareLinkedIn}
              className="flex items-center gap-1.5 bg-[#0077B5] text-white px-3 py-2 font-heading text-[10px] uppercase tracking-[0.12em] hover:bg-[#006097] transition">
              <Linkedin className="w-3 h-3" />
              Share to LinkedIn
            </button>
            <button onClick={shareInstagram}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white px-3 py-2 font-heading text-[10px] uppercase tracking-[0.12em] transition">
              <Instagram className="w-3 h-3" />
              Copy for Instagram
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

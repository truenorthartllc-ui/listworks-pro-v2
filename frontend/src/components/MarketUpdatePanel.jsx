import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OUTPUTS = [
  { key: "summary", label: "Summary", platform: null },
  { key: "instagram", label: "Instagram", platform: "Instagram" },
  { key: "facebook", label: "Facebook", platform: "Facebook" },
  { key: "email", label: "Email Newsletter", platform: "Email" },
];

export default function MarketUpdatePanel() {
  const session_id = localStorage.getItem("lw_session_id");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState({});

  const generate = async () => {
    if (!location.trim()) { toast.error("Enter a city, ZIP, or neighborhood"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/market-update`, {
        location: location.trim(),
        session_id: session_id || undefined,
      });
      setResult(data);
    } catch {
      toast.error("Market data fetch failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = (key, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c => ({ ...c, [key]: true }));
      toast.success("Copied!");
      setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000);
    });
  };

  return (
    <div className="space-y-6 pb-16">

      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Market Update</span>
        <p className="font-body text-sm text-ink/60">
          Enter any city, ZIP, or neighborhood and get 3 ready-to-post market updates — Instagram, Facebook, and email.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          onKeyDown={e => e.key === "Enter" && generate()}
          placeholder="Austin TX · Denver CO · 90210 · Lake Travis area"
          className="editorial-input flex-1 text-sm"
        />
        <button
          onClick={generate}
          disabled={loading || !location.trim()}
          className="btn-vermillion px-5 py-2.5 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Searching…" : "Generate"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
            Results for: {result.location}
          </div>

          {OUTPUTS.map(({ key, label, platform }) => {
            const text = result[key];
            if (!text) return null;
            return (
              <div key={key} className="border border-ink/10">
                <div className="flex items-center justify-between px-4 py-2 border-b border-ink/10 bg-paper">
                  <div className="flex items-center gap-2">
                    {platform && (
                      <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border border-ink/15 text-ink/50">
                        {platform}
                      </span>
                    )}
                    <span className="font-heading text-xs uppercase tracking-[0.1em]">{label}</span>
                  </div>
                  <button
                    onClick={() => copy(key, text)}
                    className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-1 border border-ink/15 hover:border-vermillion hover:text-vermillion transition-colors"
                  >
                    {copied[key] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied[key] ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-4 font-body text-sm whitespace-pre-wrap leading-relaxed">
                  {text}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

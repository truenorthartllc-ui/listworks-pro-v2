import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Import } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUPPORTED = ["zillow.com", "redfin.com", "realtor.com", "trulia.com", "homes.com", "compass.com", "kw.com", "homesnap.com", "movoto.com"];

export default function RedfinImport({ onImport }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) { toast.error("Paste a listing URL first"); return; }
    if (!trimmed.startsWith("http")) { toast.error("Please paste a full URL starting with https://"); return; }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/import/listing`, { url: trimmed });
      onImport(data);
      setUrl("");
      toast.success("Listing imported — form auto-filled!");
    } catch (e) {
      const msg = e?.response?.data?.detail || "Couldn't import that listing. Try copying the description manually.";
      toast.error(typeof msg === "string" ? msg : "Import failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Paste any listing URL — Zillow, Redfin, Realtor.com, MLS…"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleImport()}
          className="editorial-input text-sm flex-1"
        />
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="btn-vermillion px-4 py-2 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />}
          {loading ? "Importing…" : "Import"}
        </button>
      </div>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink/35">
        Works with: {SUPPORTED.join(" · ")}
      </p>
    </div>
  );
}

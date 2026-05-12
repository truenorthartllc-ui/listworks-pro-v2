import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Link2, Import } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RedfinImport({ onImport }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Please enter a Redfin URL");
      return;
    }
    if (!url.toLowerCase().includes("redfin.com")) {
      toast.error("Please enter a valid Redfin listing URL");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/import/redfin`, { redfin_url: url });
      onImport(data);
      setUrl("");
      toast.success("Property imported successfully!");
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail?.message || "Failed to import. Check the URL.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="redfin-import flex items-center gap-3">
      <input
        type="text"
        placeholder="Paste Redfin URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="editorial-input text-sm flex-1"
      />
      <button
        onClick={handleImport}
        disabled={loading || !url.trim()}
        className="btn-vermillion px-4 py-2 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />}
        Import
      </button>
    </div>
  );
}
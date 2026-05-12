import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Loader2, Check, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BatchGenerator({ onComplete }) {
  const [listings, setListings] = useState([{ raw_listing: "", address: "", tone: "Modern" }]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const addListing = () => {
    setListings([...listings, { raw_listing: "", address: "", tone: "Modern" }]);
  };

  const updateListing = (index, field, value) => {
    const updated = [...listings];
    updated[index][field] = value;
    setListings(updated);
  };

  const removeListing = (index) => {
    setListings(listings.filter((_, i) => i !== index));
  };

  const generateAll = async () => {
    const valid = listings.filter(l => l.raw_listing.trim().length > 10);
    if (!valid.length) {
      toast.error("Add at least one listing with content");
      return;
    }
    setLoading(true);
    try {
      const session_id = localStorage.getItem("lw_session_id");
      const { data } = await axios.post(`${API}/batch-rewrite`, {
        listings: valid.map(l => ({ ...l, session_id })),
      });
      setResults(data);
      toast.success(`Generated ${data.success_count} listings`);
      if (onComplete) onComplete(data.results);
    } catch (e) {
      console.error(e);
      toast.error("Batch generation failed");
    } finally {
      setLoading(false);
    }
  };

  const TONES = ["Luxury", "Cozy", "Modern", "Family", "Investor"];

  return (
    <div className="batch-generator">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg tracking-wide text-ink">Batch Generate</h3>
        <button onClick={addListing} className="flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-vermillion hover:underline">
          <Plus className="w-3 h-3" />Add Listing
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {listings.map((l, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              value={l.raw_listing}
              onChange={(e) => updateListing(i, "raw_listing", e.target.value)}
              placeholder={`Listing ${i + 1}...`}
              className="editorial-input text-sm flex-1"
              rows={2}
            />
            <select
              value={l.tone}
              onChange={(e) => updateListing(i, "tone", e.target.value)}
              className="editorial-input text-xs w-24"
            >
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {listings.length > 1 && (
              <button onClick={() => removeListing(i)} className="p-2 text-ink/40 hover:text-vermillion">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={generateAll}
        disabled={loading || !listings.some(l => l.raw_listing.trim())}
        className="btn-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-60"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : "Generate All Listings"}
      </button>

      {results && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200">
          <p className="text-emerald-700 text-sm">
            <Check className="w-4 h-4 inline mr-1" />
            {results.success_count} generated, {results.failed_count} failed
          </p>
        </div>
      )}
    </div>
  );
}
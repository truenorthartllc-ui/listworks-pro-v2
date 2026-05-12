import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Clock, Trash2, Eye } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ListingHistory({ onLoadListing }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session_id = localStorage.getItem("lw_session_id");
    if (session_id) {
      loadHistory(session_id);
    }
  }, []);

  const loadHistory = async (session_id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/listings/${session_id}`);
      setListings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!listings.length && !loading) return null;

  return (
    <div className="history-panel mt-8 border-t border-ink/10 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4" />
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60">Recent Listings</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {listings.slice(0, 6).map((l) => (
          <div key={l.id} className="bg-white border border-ink/10 p-4 hover:border-vermillion/30 transition cursor-pointer" onClick={() => onLoadListing(l)}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-sm text-ink">{l.address || "Untitled"}</span>
              <span className="text-[10px] text-ink/40">{new Date(l.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] bg-oat px-2 py-0.5 rounded">{l.tone}</span>
              <span className="text-[10px] text-ink/50">Strength: {l.listing_strength}/10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Loader2, Check, X, Upload, Download } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TONES = ["Luxury", "Cozy", "Modern", "Minimalist", "Family", "Investor"];
const EMPTY_ROW = () => ({ raw_listing: "", address: "", tone: "Modern" });

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ""; });
    return {
      raw_listing: row.description || row.listing || row.raw_listing || row.draft || "",
      address: row.address || row.addr || "",
      tone: TONES.includes(row.tone) ? row.tone : "Modern",
      price: row.price || "",
      beds: row.beds || row.bedrooms || "",
      baths: row.baths || row.bathrooms || "",
      sqft: row.sqft || row.sqfeet || row["sq ft"] || "",
    };
  }).filter(r => r.raw_listing.length > 5);
}

function downloadCSV(results) {
  const headers = ["address", "tone", "mls", "instagram", "facebook", "headline_1", "email"];
  const rows = results.map(r => [
    r.address || "",
    r.tone || "",
    (r.mls || "").replace(/"/g, '""'),
    (r.instagram || "").replace(/"/g, '""'),
    (r.facebook || "").replace(/"/g, '""'),
    (r.headlines?.[0] || "").replace(/"/g, '""'),
    (r.email || "").replace(/"/g, '""'),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "listworks-rewrites.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function BatchGenerator({ onComplete }) {
  const [listings, setListings] = useState([EMPTY_ROW()]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const onCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (!parsed.length) { toast.error("No valid listings found. Check your CSV format."); return; }
      setListings(parsed);
      setResults(null);
      toast.success(`${parsed.length} listing${parsed.length > 1 ? "s" : ""} loaded from CSV.`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const generateAll = async () => {
    const valid = listings.filter(l => l.raw_listing.trim().length > 10);
    if (!valid.length) { toast.error("Add at least one listing with content."); return; }
    setLoading(true);
    setProgress(0);
    setResults(null);
    try {
      const session_id = localStorage.getItem("lw_session_id");
      const { data } = await axios.post(`${API}/batch-rewrite`, {
        listings: valid.map(l => ({ ...l, session_id })),
      });
      setResults(data);
      setProgress(100);
      toast.success(`${data.success_count} listing${data.success_count > 1 ? "s" : ""} rewritten.`);
      if (onComplete) onComplete(data.results);
    } catch {
      toast.error("Batch generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const validCount = listings.filter(l => l.raw_listing.trim().length > 10).length;

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Bulk CSV Rewrite</span>
        <p className="font-body text-sm text-ink/60">Upload a CSV of listings or add them manually. Rewrite all at once, download results.</p>
      </div>

      {/* CSV upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-ink/20 hover:border-vermillion cursor-pointer p-6 flex flex-col items-center gap-3 transition"
      >
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onCSVUpload} />
        <Upload className="w-6 h-6 text-ink/30" />
        <div className="text-center">
          <span className="font-heading text-xs uppercase tracking-[0.15em] text-ink/60 block">Upload CSV</span>
          <span className="font-mono text-[10px] text-ink/40 mt-1 block">Columns: address, description, price, beds, baths, sqft, tone</span>
        </div>
      </div>

      {/* Manual listings */}
      <div className="space-y-3">
        {listings.map((l, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <textarea
                value={l.raw_listing}
                onChange={(e) => { const u = [...listings]; u[i].raw_listing = e.target.value; setListings(u); }}
                placeholder={`Listing ${i + 1} — paste draft or leave blank to skip`}
                className="editorial-input text-sm w-full"
                rows={2}
              />
              <input
                value={l.address}
                onChange={(e) => { const u = [...listings]; u[i].address = e.target.value; setListings(u); }}
                placeholder="Address (optional)"
                className="editorial-input text-xs w-full"
              />
            </div>
            <select
              value={l.tone}
              onChange={(e) => { const u = [...listings]; u[i].tone = e.target.value; setListings(u); }}
              className="editorial-input text-xs w-28 shrink-0"
            >
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {listings.length > 1 && (
              <button onClick={() => setListings(listings.filter((_, j) => j !== i))}
                className="p-2 text-ink/30 hover:text-vermillion transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => setListings([...listings, EMPTY_ROW()])}
        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 hover:text-vermillion transition">
        <Plus className="w-3 h-3" /> Add listing manually
      </button>

      <button
        onClick={generateAll}
        disabled={loading || validCount === 0}
        className="btn-vermillion w-full px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" />Rewriting {validCount} listing{validCount > 1 ? "s" : ""}…</>
          : <><span className="w-4 h-4 text-center font-bold">{validCount}</span>Rewrite All Listings</>}
      </button>

      {results && (
        <div className="space-y-4 animate-rise">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-700">{results.success_count} rewritten</span>
              {results.failed_count > 0 && <span className="text-red-500 ml-2">{results.failed_count} failed</span>}
            </div>
            <button
              onClick={() => downloadCSV(results.results)}
              className="flex items-center gap-1.5 bg-ink text-oat px-3 py-2 font-heading text-[10px] uppercase tracking-[0.12em] hover:bg-coal transition"
            >
              <Download className="w-3 h-3" />
              Download CSV
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {results.results?.map((r, i) => (
              <div key={i} className="border border-ink/10 p-4">
                {r.address && <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40 mb-2">{r.address}</p>}
                <p className="font-body text-sm text-ink leading-relaxed line-clamp-3">{r.mls}</p>
                {r.headlines?.[0] && (
                  <p className="mt-2 font-display italic text-base text-vermillion">{r.headlines[0]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

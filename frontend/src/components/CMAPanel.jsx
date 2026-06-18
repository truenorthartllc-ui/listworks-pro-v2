import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles, MapPin, Home, DollarSign, Maximize, Bath, Bed, Building2, Copy, Check, Download } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CMAPanel() {
  const [form, setForm] = useState({ address: "", price: "", beds: "", baths: "", sqft: "", property_type: "" });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!form.address.trim()) { toast.error("Enter a property address."); return; }
    setLoading(true);
    setReport(null);
    try {
      const { data } = await axios.post(`${API}/cma/report`, {
        ...form,
        session_id: localStorage.getItem("lw_session_id"),
      });
      setReport(data);
      toast.success("CMA report generated!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "CMA generation failed. Try a different address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ CMA Market Report</span>
        <p className="font-body text-sm text-ink/60">Generate a professional Comparative Market Analysis — comps, pricing, and market trends from live listings data.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Property address *" value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="editorial-input text-sm col-span-2" />
        <input placeholder="List price" value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="editorial-input text-sm" />
        <input placeholder="Property type (e.g. Single Family)" value={form.property_type}
          onChange={(e) => setForm({ ...form, property_type: e.target.value })}
          className="editorial-input text-sm" />
        <input placeholder="Beds" value={form.beds}
          onChange={(e) => setForm({ ...form, beds: e.target.value })}
          className="editorial-input text-sm" />
        <input placeholder="Baths" value={form.baths}
          onChange={(e) => setForm({ ...form, baths: e.target.value })}
          className="editorial-input text-sm" />
        <input placeholder="Sq Ft" value={form.sqft}
          onChange={(e) => setForm({ ...form, sqft: e.target.value })}
          className="editorial-input text-sm col-span-2" />
      </div>

      <button onClick={generate} disabled={loading || !form.address.trim()}
        className="btn-vermillion w-full px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Searching listings & generating…</> : <><Sparkles className="w-4 h-4" />Generate CMA Report</>}
      </button>

      {report && (
        <div className="space-y-4 animate-rise">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {report.subject?.estimated_value && (
              <div className="border border-ink/15 p-4 bg-white">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">Est. Value</span>
                <p className="font-display italic text-xl mt-1">{report.subject.estimated_value}</p>
                <p className="font-mono text-[9px] text-ink/40 uppercase tracking-wider">{report.subject.confidence || ""}</p>
              </div>
            )}
            {report.price_per_sqft_avg && (
              <div className="border border-ink/15 p-4 bg-white">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">Price/SqFt Avg</span>
                <p className="font-display italic text-xl mt-1">{report.price_per_sqft_avg}</p>
              </div>
            )}
            {report.days_on_market_avg && (
              <div className="border border-ink/15 p-4 bg-white">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">Avg DOM</span>
                <p className="font-display italic text-xl mt-1">{report.days_on_market_avg}</p>
              </div>
            )}
            {report.comps?.length > 0 && (
              <div className="border border-ink/15 p-4 bg-white">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">Comps Found</span>
                <p className="font-display italic text-xl mt-1">{report.comps.length}</p>
              </div>
            )}
          </div>

          {/* Comps Table */}
          {report.comps?.length > 0 && (
            <div className="border border-ink/15 bg-white overflow-x-auto">
              <div className="p-4 border-b border-ink/10">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">Comparable Properties</span>
              </div>
              <table className="w-full text-left font-body text-sm">
                <thead className="bg-oat font-mono text-[10px] uppercase tracking-wider text-ink/60">
                  <tr><th className="p-3">Address</th><th className="p-3">Price</th><th className="p-3">Beds</th><th className="p-3">Baths</th><th className="p-3">SqFt</th><th className="p-3">DOM</th></tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {report.comps.map((c, i) => (
                    <tr key={i} className="hover:bg-oat/50">
                      <td className="p-3 text-xs">{c.address}</td>
                      <td className="p-3">{c.price}</td>
                      <td className="p-3">{c.beds}</td>
                      <td className="p-3">{c.baths}</td>
                      <td className="p-3">{c.sqft}</td>
                      <td className="p-3">{c.dom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Market Summary */}
          {report.market_summary && (
            <div className="border border-ink/15 p-5 bg-white">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40 block mb-2">Market Summary</span>
              <p className="font-body text-sm text-ink/80 leading-relaxed">{report.market_summary}</p>
            </div>
          )}

          {/* Recommendation */}
          {report.recommendation && (
            <div className="border border-vermillion/30 p-5 bg-vermillion/5">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-vermillion block mb-2">Pricing Recommendation</span>
              <p className="font-body text-sm text-ink/80 leading-relaxed">{report.recommendation}</p>
            </div>
          )}

          {/* Full HTML Report */}
          {report.html_report && (
            <div className="border border-ink/15 bg-white">
              <div className="p-4 border-b border-ink/10 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">Full Report Preview</span>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(report.html_report); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 1600); }}
                    className="flex items-center gap-1 border border-ink/20 px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.12em] transition hover:border-vermillion">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy HTML
                  </button>
                  <button onClick={() => { const w = window.open(); if (w) { w.document.write(report.html_report); w.document.close(); } }}
                    className="flex items-center gap-1 bg-coal text-oat px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.12em] hover:bg-vermillion transition">
                    <Download className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>
              <div className="p-5 max-h-[600px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: report.html_report }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

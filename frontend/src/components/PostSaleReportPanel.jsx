import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { BarChart3, Loader2, Copy, Check, Share2, Download, CheckCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PostSaleReportPanel() {
  const [form, setForm] = useState({ seller_name: "", sold_price: "", days_on_market: "" });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const session_id = localStorage.getItem("lw_session_id") || "";
      const { data } = await axios.post(`${API}/report/post-sale`, {
        session_id,
        seller_name: form.seller_name,
        sold_price: form.sold_price,
        days_on_market: parseInt(form.days_on_market) || 0,
      });
      setReport(data);
      toast.success("Report generated!");
    } catch (e) {
      const msg = e?.response?.data?.detail || "Generation failed.";
      if (msg.includes("No listing found")) {
        toast.error("No listing found. Generate a rewrite first, then come back here.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyShareText = () => {
    if (report?.copy?.share_text) {
      navigator.clipboard.writeText(report.copy.share_text);
      setCopied(true);
      toast.success("Copied! Paste it for your clients.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-oat border border-ink/15 p-8 mt-px">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-5 h-5 text-vermillion" />
        <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-vermillion">/ Post-Sale Marketing Report</span>
      </div>
      <h3 className="font-display text-3xl tracking-tight mb-1">Listing Performance Report</h3>
      <p className="font-body text-ink/65 mb-6">Generate a branded case study to win your next listing appointment. Agents love showing results.</p>

      {!report ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text" placeholder="Seller's name" value={form.seller_name}
                onChange={e => setForm(f => ({ ...f, seller_name: e.target.value }))}
                className="border border-ink/20 px-4 py-3 font-body text-sm outline-none focus:border-vermillion transition"
              />
              <input
                type="text" placeholder="Sold price (e.g. $425,000)" value={form.sold_price}
                onChange={e => setForm(f => ({ ...f, sold_price: e.target.value }))}
                className="border border-ink/20 px-4 py-3 font-body text-sm outline-none focus:border-vermillion transition"
              />
            </div>
            <input
              type="number" placeholder="Days on market" value={form.days_on_market}
              onChange={e => setForm(f => ({ ...f, days_on_market: e.target.value }))}
              className="w-full border border-ink/20 px-4 py-3 font-body text-sm outline-none focus:border-vermillion transition"
            />
            <button
              onClick={generate}
              disabled={loading}
              className="w-full bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-6 py-3.5 font-heading text-sm uppercase tracking-[0.12em] transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate My Report"}
            </button>
          </div>
          <div className="col-span-12 lg:col-span-7 flex items-center justify-center text-ink/30 font-body text-sm">
            Your AI-generated performance report will appear here
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-coal text-oat p-8">
            <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-3">
              / Marketing Case Study
            </div>
            <h4 className="font-display text-3xl md:text-4xl tracking-tight mb-4 leading-tight">
              {report.copy.headline}
            </h4>
            <p className="font-display italic text-xl text-oat/80 mb-2">{report.copy.summary}</p>
            <p className="font-body text-oat/60 text-sm">{report.copy.buyers_loved}</p>
            <div className="mt-6 grid grid-cols-3 gap-6">
              <div>
                <div className="font-display text-4xl text-vermillion">{report.report.listing_strength}/10</div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-oat/50 mt-1">Listing Strength Score</div>
              </div>
              <div>
                <div className="font-display text-4xl text-vermillion">{report.report.days_on_market}</div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-oat/50 mt-1">Days on Market</div>
              </div>
              <div>
                <div className="font-display text-4xl text-vermillion">{report.report.strength_label}</div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-oat/50 mt-1">Performance Tier</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-ink/15 p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60">Share Text</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-ink/80 mb-4 whitespace-pre-wrap">{report.copy.share_text}</p>
            <button
              onClick={copyShareText}
              className="flex items-center gap-2 bg-ink hover:bg-vermillion text-oat px-5 py-2.5 font-heading text-xs uppercase tracking-[0.12em] transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy to Share"}
            </button>
          </div>

          <button
            onClick={() => setReport(null)}
            className="text-center w-full border border-ink/20 hover:border-vermillion px-4 py-3 font-heading text-xs uppercase tracking-[0.12em] transition"
          >
            Generate Another Report +
          </button>
        </div>
      )}
    </div>
  );
}
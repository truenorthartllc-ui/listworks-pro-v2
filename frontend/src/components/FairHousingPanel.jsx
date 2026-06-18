import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  ShieldAlert, CheckCircle, AlertTriangle, Loader2, ShieldCheck,
  ChevronDown, ChevronRight, Download, FileText, Eye
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RISK_BADGE = {
  CRITICAL: "bg-red-700 text-white",
  HIGH:     "bg-red-500 text-white",
  MEDIUM:   "bg-amber-500 text-white",
  LOW:      "bg-yellow-400 text-ink",
};

const GRADE_STYLE = {
  A: "text-emerald-600",
  B: "text-green-500",
  C: "text-amber-500",
  D: "text-orange-600",
  F: "text-red-700",
};

function RiskBadge({ risk }) {
  return (
    <span className={`inline-block px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] uppercase font-bold ${RISK_BADGE[risk] || "bg-ink/20 text-ink"}`}>
      {risk}
    </span>
  );
}

function ViolationCard({ v, scanId, onAcknowledge }) {
  const [expanded, setExpanded] = useState(false);
  const [acking, setAcking] = useState(false);
  const [acked, setAcked] = useState(v.acknowledged || false);

  const borderColor = acked ? "border-ink/20" :
    v.risk === "CRITICAL" ? "border-red-700" :
    v.risk === "HIGH" ? "border-red-400" :
    v.risk === "MEDIUM" ? "border-amber-400" : "border-yellow-300";

  const iconColor = v.risk === "CRITICAL" ? "text-red-700" :
    v.risk === "HIGH" ? "text-red-500" : "text-amber-500";

  const acknowledge = async () => {
    if (!scanId) return;
    setAcking(true);
    try {
      await axios.post(`${API}/compliance/acknowledge/${scanId}`);
      setAcked(true);
      onAcknowledge();
      toast.success("Violation acknowledged and logged.");
    } catch {
      toast.error("Failed to acknowledge.");
    } finally {
      setAcking(false);
    }
  };

  return (
    <div className={`bg-white border ${borderColor} p-4 ${acked ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <RiskBadge risk={v.risk} />
            <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink/60">{v.rule}</span>
            {acked && <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5">Acknowledged</span>}
          </div>
          <div className="font-mono text-sm text-ink font-medium mb-1">
            Found: <span className="text-red-600">&quot;{v.phrase}&quot;</span>
          </div>
          <div className="font-body text-sm text-ink/70 mb-2">{v.fix}</div>
          <button
            onClick={() => setExpanded(x => !x)}
            className="flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] uppercase text-ink/50 hover:text-ink transition"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            HUD Citation &amp; Legal Basis
          </button>
          {expanded && (
            <div className="mt-2 pl-4 border-l-2 border-ink/10 space-y-1">
              <div className="font-mono text-[10px] tracking-[0.1em] text-ink/80">
                <span className="text-ink/50 uppercase">Citation: </span>{v.hud_citation}
              </div>
              <div className="font-body text-xs text-ink/60">{v.legal_basis}</div>
            </div>
          )}
          {!acked && v.risk !== "LOW" && (
            <button
              onClick={acknowledge}
              disabled={acking}
              className="mt-3 flex items-center gap-1.5 font-heading text-xs uppercase tracking-[0.12em] text-ink/60 hover:text-ink border border-ink/20 hover:border-ink px-3 py-1.5 transition"
            >
              {acking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              Mark Reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function COActModal({ onClose }) {
  const [form, setForm] = useState({ agent_name: "", brokerage_name: "", property_address: "" });
  const [loading, setLoading] = useState(false);
  const [disclosure, setDisclosure] = useState(null);

  const generate = async () => {
    if (!form.agent_name || !form.brokerage_name || !form.property_address) {
      toast.error("Fill in all fields to generate the CO AI Act disclosure.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/compliance/co-act-disclosure`, {
        ...form,
        listing_text: "(AI-generated listing copy)",
      });
      setDisclosure(data.disclosure_text);
    } catch {
      toast.error("Failed to generate disclosure.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(disclosure);
    toast.success("Disclosure copied to clipboard.");
  };

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-oat border border-ink/20 w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-vermillion" />
          <h4 className="font-display text-xl">CO AI Act Disclosure</h4>
        </div>
        <p className="font-body text-sm text-ink/65 mb-4">
          Colorado SB 24-205 requires disclosure when AI generates listing copy. Fill in your details to generate a compliant statement.
        </p>
        {!disclosure ? (
          <div className="space-y-3">
            {[["agent_name","Your Full Name"],["brokerage_name","Brokerage Name"],["property_address","Property Address"]].map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-ink/20 px-3 py-2.5 font-body text-sm outline-none focus:border-vermillion transition"
              />
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={generate}
                disabled={loading}
                className="flex-1 bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-4 py-2.5 font-heading text-sm uppercase tracking-[0.12em] transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Disclosure"}
              </button>
              <button onClick={onClose} className="px-4 py-2.5 border border-ink/20 hover:border-vermillion font-heading text-xs uppercase tracking-[0.12em] transition">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-ink/15 p-4 font-body text-sm text-ink leading-relaxed">{disclosure}</div>
            <div className="flex gap-3">
              <button onClick={copy} className="flex-1 bg-ink hover:bg-ink/80 text-oat px-4 py-2.5 font-heading text-sm uppercase tracking-[0.12em] transition">Copy</button>
              <button onClick={onClose} className="px-4 py-2.5 border border-ink/20 hover:border-vermillion font-heading text-xs uppercase tracking-[0.12em] transition">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FairHousingPanel({ text, setText, result, setResult, loading, setLoading }) {
  const [coActOpen, setCoActOpen] = useState(false);
  const [ackCount, setAckCount] = useState(0);

  const violations = result?.violations || [];
  const grade = result?.grade;
  const risk = result?.overall_risk;

  const analyze = async () => {
    if (text.trim().length < 20) {
      toast.error("Paste at least a sentence of listing copy to analyze.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/analyze/fair-housing`, { text });
      setResult(data);
      setAckCount(0);
    } catch {
      toast.error("Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setText(""); setResult(null); setAckCount(0); };

  const downloadPdf = () => {
    if (result?.scan_id) window.open(`${API}/compliance/pdf/${result.scan_id}`, "_blank");
  };

  return (
    <>
      {coActOpen && <COActModal onClose={() => setCoActOpen(false)} />}
      <div className="bg-oat border border-ink/15 p-8 mt-px">
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="w-5 h-5 text-vermillion" />
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-vermillion">/ Fair Housing Guard</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h3 className="font-display text-3xl tracking-tight mb-1">Compliance Check</h3>
            <p className="font-body text-ink/65">Paste your listing copy. We will scan it for FHA red flags before you publish.</p>
          </div>
          {grade && (
            <div className="text-right">
              <div className={`font-display text-6xl font-bold leading-none ${GRADE_STYLE[grade] || "text-ink"}`}>{grade}</div>
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink/40 mt-1">{risk} risk</div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6 space-y-4">
            <textarea
              placeholder="Paste your listing copy here... We will check for discriminatory language, protected class references, and risky phrasing."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              className="w-full border border-ink/20 px-4 py-3 font-body text-sm outline-none focus:border-vermillion transition resize-none"
            />
            <div className="flex gap-3 flex-wrap">
              <button onClick={analyze} disabled={loading}
                className="flex-1 bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-6 py-3.5 font-heading text-sm uppercase tracking-[0.12em] transition hover:-translate-y-0.5 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                {loading ? "Scanning..." : "Scan for Violations"}
              </button>
              {text && <button onClick={clear} className="px-4 py-3.5 border border-ink/20 hover:border-vermillion font-heading text-xs uppercase tracking-[0.12em] transition">Clear</button>}
            </div>
            {result && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={downloadPdf}
                  className="flex items-center gap-1.5 font-heading text-xs uppercase tracking-[0.12em] text-ink/60 hover:text-ink border border-ink/20 hover:border-ink px-3 py-2 transition">
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>
                <button onClick={() => setCoActOpen(true)}
                  className="flex items-center gap-1.5 font-heading text-xs uppercase tracking-[0.12em] text-ink/60 hover:text-ink border border-ink/20 hover:border-ink px-3 py-2 transition">
                  <FileText className="w-3.5 h-3.5" /> CO AI Act Disclosure
                </button>
              </div>
            )}
          </div>
          <div className="col-span-12 lg:col-span-6">
            {!result ? (
              <div className="h-full flex items-center justify-center text-center p-8 border-2 border-dashed border-ink/15">
                <div>
                  <ShieldCheck className="w-10 h-10 text-ink/20 mx-auto mb-3" />
                  <div className="font-display italic text-ink/40">Results will appear here</div>
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/30 mt-2">Powered by FHA + HUD 2024 guidelines</div>
                </div>
              </div>
            ) : violations.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-emerald-700">Clean</span>
                </div>
                <h4 className="font-display text-2xl text-emerald-800 mb-2">No violations found</h4>
                <p className="font-body text-sm text-emerald-700">Listing passed the Fair Housing scan. No protected class references or discriminatory language detected.</p>
                <div className="mt-4 pt-4 border-t border-emerald-200 font-mono text-[10px] tracking-[0.15em] uppercase text-emerald-600">Grade: A — CLEAN</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-red-600">
                      {violations.length} violation{violations.length !== 1 ? "s" : ""} — Grade {grade}
                    </span>
                  </div>
                  {ackCount > 0 && <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-emerald-600">{ackCount} acknowledged</span>}
                </div>
                {violations.map((v, i) => (
                  <ViolationCard key={i} v={v} scanId={result.scan_id} onAcknowledge={() => setAckCount(n => n + 1)} />
                ))}
                <div className="bg-amber-50 border border-amber-200 p-4">
                  <div className="font-body text-sm text-amber-800">
                    <strong>Tip:</strong> Replace flagged phrases with verifiable facts — sqft, verified school ratings, walk times — not lifestyle or demographic language.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

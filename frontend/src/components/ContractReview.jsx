import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileText, Loader2, AlertTriangle, CheckCircle, Clock, ShieldAlert, ChevronRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COMMON_ISSUES = [
  { id: "inspection", label: "Inspection contingency", desc: "24-hour windows, items above threshold" },
  { id: "financing", label: "Financing contingency", desc: "pre-approval language, loan type, appraisal contingency" },
  { id: "disclosure", label: "Seller disclosures", desc: "SOD, Lead Paint, material defects" },
  { id: "deadlines", label: "Critical deadlines", desc: "days to close, inspection period, objection period" },
  { id: "price", label: "Price & terms adjustments", desc: "counter-offer language, escalation clauses" },
  { id: "contingency_waiver", label: "Contingency waiver", desc: "risky one-sided language" },
];

export default function ContractReview() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState("paste"); // "upload" | "paste"
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [focus, setFocus] = useState([]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File too large — max 5MB");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(f);
  };

  const handleSubmit = async () => {
    const content = mode === "paste" ? text.trim() : text.trim();
    if (content.length < 50) {
      toast.error("Paste more text or upload a contract file.");
      return;
    }
    setLoading(true);
    try {
      const session_id = localStorage.getItem("lw_session_id");
      const { data } = await axios.post(
        `${API}/contract/review`,
        { content, focus_areas: focus, session_id },
        { timeout: 60000 }
      );
      setResult(data);
      toast.success("Contract reviewed — see findings below.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Review failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFocus = (id) => {
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-coal flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-vermillion" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-display text-2xl">Contract Risk Review</h3>
          <p className="font-body text-ink/60 text-sm">Upload or paste any real estate contract. Get flagged risks + plain-English breakdown before you sign.</p>
        </div>
      </div>

      <div className="p-8 border border-ink/15 bg-white">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          {["paste", "upload"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              data-active={mode === m}
              className="mode-btn px-4 py-2 font-heading text-xs uppercase tracking-[0.12em]"
            >
              {m === "paste" ? "Paste Text" : "Upload PDF"}
            </button>
          ))}
        </div>

        {mode === "upload" ? (
          <label className="block border-2 border-dashed border-ink/20 p-12 text-center cursor-pointer hover:border-vermillion transition">
            <FileText className="w-8 h-8 mx-auto mb-3 text-ink/40" />
            <p className="font-heading text-sm uppercase tracking-[0.12em] text-ink/70">
              {file ? file.name : "Drop PDF or click to upload"}
            </p>
            <p className="font-mono text-[10px] text-ink/40 mt-2 uppercase tracking-widest">
              Max 5MB · PDF, TXT, DOCX
            </p>
            <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFile} className="hidden" />
          </label>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your contract text here — purchase agreement, counter-offer, addendum, or disclosure form..."
            rows={12}
            className="editorial-input w-full"
          />
        )}

        {/* Focus areas */}
        <div className="mt-6">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-3">
            Focus areas (what to check)
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ISSUES.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleFocus(item.id)}
                data-active={focus.includes(item.id)}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
                  focus.includes(item.id)
                    ? "bg-coal text-oat"
                    : "border border-ink/20 text-ink/60 hover:border-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="mt-6 btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Reviewing contract…</> : <><ShieldAlert className="w-4 h-4" />Review This Contract</>}
        </button>

        <p className="mt-3 font-mono text-[10px] text-ink/40 uppercase tracking-widest">
          AI-assisted review — not legal advice. Always consult a licensed attorney.
        </p>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Score */}
          <div className={`p-6 border ${
            result.risk_level === "high" ? "border-red-400 bg-red-50" :
            result.risk_level === "medium" ? "border-amber-400 bg-amber-50" :
            "border-green-400 bg-green-50"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {result.risk_level === "high" ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
               result.risk_level === "medium" ? <Clock className="w-5 h-5 text-amber-600" /> :
               <CheckCircle className="w-5 h-5 text-green-600" />}
              <span className="font-display text-2xl">
                {result.risk_level === "high" ? "Review before signing" :
                 result.risk_level === "medium" ? "Standard — verify key terms" :
                 "Looks solid"}
              </span>
            </div>
            <p className="font-body text-sm text-ink/80">{result.summary}</p>
          </div>

          {/* Findings */}
          {result.findings?.length > 0 && (
            <div className="border border-ink/15 divide-y divide-ink/10">
              {result.findings.map((f, i) => (
                <div key={i} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 shrink-0 w-2 h-2 rounded-full ${
                      f.severity === "critical" ? "bg-red-500" :
                      f.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                    <div className="flex-1">
                      <div className="font-heading text-sm uppercase tracking-[0.1em] text-ink/70 mb-1">
                        {f.severity?.toUpperCase()} · {f.area}
                      </div>
                      <p className="font-body text-sm text-ink leading-relaxed">{f.text}</p>
                      {f.recommendation && (
                        <p className="mt-2 font-body text-xs text-vermillion leading-relaxed">
                          → {f.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plain-English Summary */}
          {result.plain_english && (
            <div className="bg-coal text-oat p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-vermillion mb-4">
                / Plain-English Breakdown
              </p>
              <div className="font-body text-sm leading-[1.8] whitespace-pre-wrap">{result.plain_english}</div>
            </div>
          )}

          {/* Todo Checklist */}
          {result.todo_checklist?.length > 0 && (
            <div className="border border-ink/15 p-6">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/50 mb-4">
                / Your Action Checklist
              </p>
              <div className="space-y-3">
                {result.todo_checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-ink/30 shrink-0 mt-0.5" />
                    <p className="font-body text-sm text-ink leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function FairHousingPanel({ text, setText, result, setResult, loading, setLoading }) {
  const analyze = async () => {
    if (text.trim().length < 20) {
      toast.error("Paste at least a sentence of listing copy to analyze.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/analyze/fair-housing`, { text });
      setResult(data);
    } catch {
      toast.error("Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setText(""); setResult(null); };

  return (
    <div className="bg-oat border border-ink/15 p-8 mt-px">
      <div className="flex items-center gap-3 mb-2">
        <ShieldAlert className="w-5 h-5 text-vermillion" />
        <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-vermillion">/ Fair Housing Guard</span>
      </div>
      <h3 className="font-display text-3xl tracking-tight mb-1">Compliance Check</h3>
      <p className="font-body text-ink/65 mb-6">
        Paste your listing copy. We'll scan it for FHA red flags before you publish.
      </p>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <textarea
            placeholder="Paste your listing copy here... We'll check for discriminatory language, protected class references, and risky phrasing."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={10}
            className="w-full border border-ink/20 px-4 py-3 font-body text-sm outline-none focus:border-vermillion transition resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={analyze}
              disabled={loading}
              className="flex-1 bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-6 py-3.5 font-heading text-sm uppercase tracking-[0.12em] transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {loading ? "Scanning..." : "Scan for Violations"}
            </button>
            {text && (
              <button onClick={clear} className="px-4 py-3.5 border border-ink/20 hover:border-vermillion font-heading text-xs uppercase tracking-[0.12em] transition">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          {!result ? (
            <div className="h-full flex items-center justify-center text-center p-8 border-2 border-dashed border-ink/15">
              <div>
                <ShieldCheck className="w-10 h-10 text-ink/20 mx-auto mb-3" />
                <div className="font-display italic text-ink/40">Results will appear here</div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/30 mt-2">Powered by FHA guidelines</div>
              </div>
            </div>
          ) : result.violations && result.violations.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-emerald-700">Clean</span>
              </div>
              <h4 className="font-display text-2xl text-emerald-800 mb-2">No violations found</h4>
              <p className="font-body text-sm text-emerald-700">
                Your listing copy passed the Fair Housing scan. No protected class references or discriminatory language detected.
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-200 font-mono text-[10px] tracking-[0.15em] uppercase text-emerald-600">
                Risk level: LOW
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-red-600">
                  {result.violations.length} violation{result.violations.length !== 1 ? "s" : ""} found
                </span>
              </div>
              {(result.violations || []).map((v, i) => (
                <div key={i} className="bg-white border border-red-200 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-red-600 mb-1">
                        {v.risk} RISK
                      </div>
                      <div className="font-mono text-sm text-ink font-medium mb-1">
                        Found: <span className="text-red-600">"{v.phrase}"</span>
                      </div>
                      <div className="font-body text-sm text-ink/70">{v.fix}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-200 p-4">
                <div className="font-body text-sm text-amber-800">
                  <strong>Tip:</strong> Replace flagged phrases with specific property facts — square footage, school ratings, exact distances — rather than lifestyle or demographic language.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
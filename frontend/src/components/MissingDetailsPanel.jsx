import { useState } from "react";
import axios from "axios";
import { Search, Check, X, Lightbulb, ArrowRight, Loader2, AlertTriangle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MissingDetailsPanel({ rawListing, onFillDetails }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);

  async function analyze() {
    if (!rawListing || rawListing.trim().length < 20) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/listings/missing`, { raw_listing: rawListing });
      setResult(data);
    } catch {
      setResult(null);
    }
    setLoading(false);
  }

  function handleAnswer(field, value) {
    setAnswers(prev => ({ ...prev, [field]: value }));
  }

  function submitAnswers() {
    const filled = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    if (onFillDetails && filled) {
      onFillDetails(`${rawListing}\n\nAdditional details:\n${filled}`);
    }
    setShowAnswers(false);
  }

  const missing = result?.details?.filter(d => !d.present) || [];
  const present = result?.details?.filter(d => d.present) || [];

  return (
    <div className="border border-ink/10 bg-white">
      <button
        onClick={analyze}
        disabled={loading}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink/5 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Search size={16} className="text-ink/40" />
          <span className="font-medium text-sm">What's Missing?</span>
        </div>
        {loading ? (
          <Loader2 size={16} className="animate-spin text-ink/40" />
        ) : result ? (
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${result.score >= 70 ? 'bg-green-100 text-green-700' : result.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {result.score}/100
          </span>
        ) : (
          <span className="text-xs text-ink/40">Analyze listing</span>
        )}
      </button>

      {result && (
        <div className="px-4 pb-4 space-y-3 border-t border-ink/5 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-ink/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${result.score >= 70 ? 'bg-green-500' : result.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${result.score >= 70 ? 'text-green-600' : result.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {result.score < 40 ? 'Needs work' : result.score < 70 ? 'Could improve' : 'Strong listing'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="text-center p-2 bg-green-50 rounded">
              <span className="text-lg font-bold text-green-700">{result.present_count}</span>
              <p className="text-[10px] text-green-600">Present</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <span className="text-lg font-bold text-red-700">{result.missing_count}</span>
              <p className="text-[10px] text-red-600">Missing</p>
            </div>
          </div>

          {missing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink/60 mb-2 flex items-center gap-1">
                <AlertTriangle size={12} /> Missing details
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {missing.slice(0, 10).map(d => (
                  <div key={d.field} className="flex items-center gap-2 text-xs text-ink/70">
                    <X size={12} className="text-red-400 shrink-0" />
                    <span>{d.field}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink/60 mb-2 flex items-center gap-1">
                <Lightbulb size={12} /> Quick answers to strengthen
              </p>
              <div className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <div key={i}>
                    <p className="text-xs text-ink/70 mb-1">{s}</p>
                    <input
                      type="text"
                      placeholder="Type your answer..."
                      className="w-full text-xs px-2 py-1.5 border border-ink/10 rounded focus:outline-none focus:border-ink/30"
                      value={answers[s] || ''}
                      onChange={e => handleAnswer(s, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              {Object.values(answers).some(v => v.trim()) && (
                <button
                  onClick={submitAnswers}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-medium bg-ink text-white py-2 rounded hover:bg-ink/90 transition-colors"
                >
                  Regenerate with added details <ArrowRight size={12} />
                </button>
              )}
            </div>
          )}

          {present.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink/60 mb-2 flex items-center gap-1">
                <Check size={12} /> Covered
              </p>
              <div className="flex flex-wrap gap-1">
                {present.slice(0, 8).map(d => (
                  <span key={d.field} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">
                    {d.field}
                  </span>
                ))}
                {present.length > 8 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-ink/5 text-ink/40 rounded">
                    +{present.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
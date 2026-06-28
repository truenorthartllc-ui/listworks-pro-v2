import React, { useState } from 'react';

export default function COActPanel({ listingText, agentName = "" }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkCompliance = async () => {
    if (!listingText || listingText.trim().length < 20) {
      alert("Please generate a listing first");
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://listworks-pro-v2-production.up.railway.app'}/api/compliance/co-act`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: listingText,
          agent_name: agentName || "Agent",
          human_reviewed: true,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("CO Act check failed: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  const downloadPDF = async () => {
    if (!result?.scan_id) return;
    window.open(
      `${process.env.REACT_APP_BACKEND_URL || 'https://listworks-pro-v2-production.up.railway.app'}/api/compliance/co-act/pdf/${result.scan_id}`,
      '_blank'
    );
  };

  return (
    <div className="bg-oat border border-ink/15 rounded p-5">
      <div className="flex items-baseline gap-4 mb-3">
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">AI Disclosure Record</span>
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink/40">Best Practice — Colorado</span>
      </div>

      <p className="font-body text-sm text-ink/70 leading-relaxed mb-4">
        Generate a voluntary AI disclosure record for your listing. Shows sellers you use AI responsibly.
      </p>

      {!result && (
        <button
          onClick={checkCompliance}
          disabled={checking || !listingText}
          className="btn-vermillion w-full py-3 px-5 font-heading text-xs uppercase tracking-[0.15em] disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {checking ? "Checking..." : "Generate Disclosure Record"}
        </button>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`p-4 rounded border-l-4 ${result.compliant ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-heading text-sm uppercase tracking-[0.1em] ${result.compliant ? 'text-green-700' : 'text-red-700'}`}>
                {result.compliant ? 'DISCLOSURE OK' : 'NEEDS ATTENTION'}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40">
                {new Date().toLocaleDateString()}
              </span>
            </div>

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="mt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40 mb-2">Suggestions (not required):</p>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-ink/60">
                      <span className="text-vermillion">→</span> {r.explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.violations && result.violations.length > 0 && (
              <ul className="space-y-2 mt-3">
                {result.violations.map((v, i) => (
                  <li key={i} className="text-xs text-ink/70">
                    <span className="font-semibold text-red-600">{v.rule}:</span> {v.explanation}
                  </li>
                ))}
              </ul>
            )}

            {result.compliant && !result.recommendations?.length && (
              <p className="text-xs text-green-700 mt-2">
                ✓ Disclosure recorded. Human review attested.
              </p>
            )}

            {!result.disclosure_present && result.suggested_disclosure && (
              <div className="mt-4 p-3 bg-white rounded border border-ink/10">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-vermillion mb-2">Suggested Disclosure:</p>
                <p className="font-body text-xs text-ink/70 italic leading-relaxed">
                  "{result.suggested_disclosure}"
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.suggested_disclosure);
                    alert("Disclosure copied to clipboard");
                  }}
                  className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-vermillion hover:underline"
                >
                  Copy Disclosure
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              className="flex-1 btn-ink py-2.5 px-4 font-heading text-xs uppercase tracking-[0.15em]"
            >
              Download PDF Certificate
            </button>
            <button
              onClick={() => setResult(null)}
              className="flex-1 btn-outline py-2.5 px-4 font-heading text-xs uppercase tracking-[0.15em]"
            >
              Check Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

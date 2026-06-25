import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Download, AlertTriangle, CheckCircle } from 'lucide-react';

export default function COCompliancePage() {
  const [listingText, setListingText] = useState('');
  const [agentName, setAgentName] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkCompliance = async () => {
    if (!listingText || listingText.trim().length < 20) {
      alert("Please enter a listing description (at least 20 characters)");
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
      alert("Check failed: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  const downloadPDF = () => {
    if (!result?.scan_id) return;
    window.open(
      `${process.env.REACT_APP_BACKEND_URL || 'https://listworks-pro-v2-production.up.railway.app'}/api/compliance/co-act/pdf/${result.scan_id}`,
      '_blank'
    );
  };

  const copyDisclosure = () => {
    if (!result?.suggested_disclosure) return;
    navigator.clipboard.writeText(result.suggested_disclosure);
    alert("✓ Disclosure copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-oat">
      {/* Header */}
      <header className="bg-white border-b border-ink/15">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-ink hover:text-vermillion transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-heading text-sm uppercase tracking-[0.15em]">Back to ListWorks</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink/40">Free Tool</span>
            <Link to="/dashboard" className="btn-vermillion px-5 py-2 font-heading text-xs uppercase tracking-[0.15em]">
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        <div className="max-w-[700px]">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-vermillion" />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">Colorado AI Act — SB 24-205</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink mb-4">
            Check Your Listing for Colorado AI Compliance
          </h1>
          <p className="font-body text-lg text-ink/70 leading-relaxed mb-6">
            Colorado law (SB 24-205, effective Feb 1, 2026) requires AI disclosure on all real estate listings. Paste your listing below — we'll check if you're compliant and give you the exact disclosure text to add.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
              100% Free
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
              No Login Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Instant Results + PDF
            </span>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <div className="bg-white border border-ink/15 rounded p-6 md:p-8">

          {!result && (
            <>
              <div className="mb-5">
                <label className="block font-heading text-xs uppercase tracking-[0.15em] text-ink mb-2">
                  Your Listing Description
                </label>
                <textarea
                  value={listingText}
                  onChange={(e) => setListingText(e.target.value)}
                  placeholder="Paste your listing description here..."
                  className="w-full h-48 px-4 py-3 border border-ink/20 rounded font-body text-sm text-ink resize-none focus:outline-none focus:border-vermillion"
                />
              </div>

              <div className="mb-6">
                <label className="block font-heading text-xs uppercase tracking-[0.15em] text-ink mb-2">
                  Agent Name (Optional)
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 border border-ink/20 rounded font-body text-sm text-ink focus:outline-none focus:border-vermillion"
                />
              </div>

              <button
                onClick={checkCompliance}
                disabled={checking || !listingText}
                className="btn-vermillion w-full py-4 px-6 font-heading text-sm uppercase tracking-[0.15em] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Checking Compliance...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Check CO Compliance (Free)
                  </>
                )}
              </button>
            </>
          )}

          {result && (
            <div className="space-y-6">

              {/* Result Card */}
              <div className={`p-6 rounded border-l-4 ${result.compliant ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {result.compliant ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <h3 className={`font-heading text-lg uppercase tracking-[0.1em] ${result.compliant ? 'text-green-700' : 'text-red-700'}`}>
                        {result.grade}
                      </h3>
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40 mt-1">
                        Scanned {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {result.violations && result.violations.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-heading text-xs uppercase tracking-[0.15em] text-red-600 mb-2">Issues Found:</p>
                    {result.violations.map((v, i) => (
                      <div key={i} className="bg-white p-4 rounded border border-red-200">
                        <p className="font-semibold text-sm text-red-700 mb-1">{v.rule}</p>
                        <p className="text-xs text-ink/70 leading-relaxed">{v.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {result.compliant && (
                  <p className="text-sm text-green-700 leading-relaxed">
                    ✓ Your listing includes proper AI disclosure and human review attestation. You're compliant with Colorado SB 24-205.
                  </p>
                )}
              </div>

              {/* Suggested Disclosure */}
              {!result.disclosure_present && result.suggested_disclosure && (
                <div className="bg-white p-6 rounded border border-ink/15">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-vermillion" />
                    <h3 className="font-heading text-sm uppercase tracking-[0.15em] text-vermillion">
                      Add This Disclosure
                    </h3>
                  </div>
                  <div className="bg-oat/50 p-4 rounded mb-4">
                    <p className="font-body text-sm text-ink/80 italic leading-relaxed">
                      "{result.suggested_disclosure}"
                    </p>
                  </div>
                  <button
                    onClick={copyDisclosure}
                    className="btn-outline py-2.5 px-5 font-heading text-xs uppercase tracking-[0.15em]"
                  >
                    Copy Disclosure Text
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={downloadPDF}
                  className="btn-ink py-3 px-6 font-heading text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Certificate
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="btn-outline py-3 px-6 font-heading text-xs uppercase tracking-[0.15em]"
                >
                  Check Another Listing
                </button>
              </div>

              {/* CTA */}
              <div className="border-t border-ink/10 pt-6 text-center">
                <p className="font-body text-sm text-ink/60 mb-4">
                  Need Fair Housing compliance too? ListWorks PRO scans for both.
                </p>
                <Link to="/dashboard" className="btn-vermillion inline-block py-3 px-8 font-heading text-xs uppercase tracking-[0.15em]">
                  Try ListWorks PRO Free →
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}

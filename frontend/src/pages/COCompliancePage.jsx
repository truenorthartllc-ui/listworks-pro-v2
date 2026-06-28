import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function COCompliancePage() {
  const [listingText, setListingText] = useState('');
  const [agentName, setAgentName] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkCompliance = async () => {
    if (!listingText || listingText.trim().length < 20) {
      alert("C'mon — paste a listing first. At least 20 characters.");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://listworks-pro-v2-production.up.railway.app'}/api/compliance/co-act`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: listingText, agent_name: agentName || "Agent", human_reviewed: true }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Something broke. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const downloadPDF = () => {
    if (!result?.scan_id) return;
    window.open(`${process.env.REACT_APP_BACKEND_URL || 'https://listworks-pro-v2-production.up.railway.app'}/api/compliance/co-act/pdf/${result.scan_id}`, '_blank');
  };

  const copyDisclosure = () => {
    if (!result?.suggested_disclosure) return;
    navigator.clipboard.writeText(result.suggested_disclosure);
    alert("✓ Copied. Stick it in your listing.");
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d0d0d', color: '#f5f3ee', fontFamily: 'Inter, sans-serif' }}>
      {/* HEADER */}
      <header style={{ borderBottom: '1px solid rgba(198,169,97,0.1)', background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a8a49e', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
            ← Back
          </Link>
          <Link to="/" style={{ fontSize: '20px', fontWeight: 700, textDecoration: 'none', color: '#f5f3ee', letterSpacing: '-0.3px', fontFamily: 'Playfair Display, serif' }}>
            ListWorks<span style={{ color: '#C6A961' }}>.</span>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', color: '#C6A961' }}>
              ⚡ Fair Housing + AI Disclosure Check
            </span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 700, lineHeight: '1.1', marginBottom: '16px', letterSpacing: '-0.5px', fontFamily: 'Playfair Display, serif' }}>
            Using AI in a Colorado listing?<br />Create your <span style={{ color: '#C6A961' }}>disclosure record</span>.
          </h1>
          <p style={{ fontSize: '17px', lineHeight: '1.6', color: '#a8a49e', marginBottom: '20px' }}>
            Colorado's AI disclosure rules are here. Many agents choose to disclose AI assistance as a best practice — it shows sellers you're using AI responsibly. Generate a clean disclosure record before you publish. No login required.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#6b6b6b' }}>
            <span style={{ color: '#C6A961' }}>✓ Free. No login.</span>
            <span style={{ color: '#C6A961' }}>✓ Takes 10 seconds</span>
            <span style={{ color: '#C6A961' }}>✓ PDF report included</span>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(198,169,97,0.15)', borderRadius: '12px', padding: '32px' }}>
          
          {!result && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px', color: '#C6A961', marginBottom: '8px' }}>
                  Paste your listing
                </label>
                <textarea
                  value={listingText}
                  onChange={(e) => setListingText(e.target.value)}
                  placeholder="Paste your listing description here..."
                  style={{ width: '100%', height: '180px', padding: '14px', border: '1px solid rgba(198,169,97,0.1)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', background: '#0d0d0d', color: '#f5f3ee' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px', color: '#C6A961', marginBottom: '8px' }}>
                  Your name <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="John Smith"
                  style={{ width: '100%', padding: '14px', border: '1px solid rgba(198,169,97,0.1)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#0d0d0d', color: '#f5f3ee' }}
                />
              </div>

              <button
                onClick={checkCompliance}
                disabled={checking || !listingText}
                style={{
                  width: '100%', padding: '16px', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: checking ? '#333' : '#C6A961', color: checking ? '#666' : '#0d0d0d',
                  opacity: (!listingText || checking) ? 0.5 : 1,
                }}
              >
                {checking ? 'Checking...' : 'Check My Listing →'}
              </button>
              
              <p style={{ fontSize: '12px', color: '#555', textAlign: 'center', marginTop: '12px' }}>
                We don't store your listing text. This runs and disappears.
              </p>
            </>
          )}

          {result && (
            <div>
              <div style={{
                padding: '24px', borderRadius: '8px', marginBottom: '16px',
                borderLeft: '4px solid',
                background: '#0d0d0d',
                borderColor: result.compliant ? '#C6A961' : '#ef4444'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{result.compliant ? '✅' : '⚠️'}</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: result.compliant ? '#C6A961' : '#ef4444' }}>
                    {result.compliant ? 'Looking good.' : 'Needs work.'}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#a8a49e', lineHeight: '1.6', margin: 0 }}>{result.message || result.summary}</p>
              </div>

              {result.suggested_disclosure && (
                <div style={{ padding: '20px', border: '1px solid rgba(198,169,97,0.1)', borderRadius: '8px', marginBottom: '16px', background: '#1a1a1a' }}>
                  <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px', color: '#C6A961', marginBottom: '8px' }}>
                    Suggested Disclosure — Add to Your Listing
                  </div>
                  <div style={{ padding: '14px', background: '#0d0d0d', borderRadius: '6px', fontSize: '13px', color: '#a8a49e', lineHeight: '1.5', marginBottom: '12px', border: '1px solid rgba(198,169,97,0.06)' }}>
                    {result.suggested_disclosure}
                  </div>
                  <button onClick={copyDisclosure} style={{ padding: '10px 20px', border: '1px solid rgba(198,169,97,0.3)', borderRadius: '6px', background: 'transparent', color: '#C6A961', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Copy Disclosure
                  </button>
                </div>
              )}

              {result.risk_phrases && result.risk_phrases.length > 0 && (
                <div style={{ padding: '20px', border: '1px solid rgba(198,169,97,0.1)', borderRadius: '8px', marginBottom: '16px', background: '#1a1a1a' }}>
                  <div style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '2px', color: '#C6A961', marginBottom: '8px' }}>
                    🚩 Flagged Phrases
                  </div>
                  {result.risk_phrases.map((p, i) => (
                    <div key={i} style={{ padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>"{p.phrase}"</span>
                      <span style={{ color: '#888' }}> — {p.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                {result.scan_id && (
                  <button onClick={downloadPDF} style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '8px', background: '#C6A961', color: '#0d0d0d', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Download PDF Report
                  </button>
                )}
                <button onClick={() => { setResult(null); setListingText(''); }} style={{ flex: 1, padding: '14px', border: '1px solid rgba(198,169,97,0.3)', borderRadius: '8px', background: 'transparent', color: '#f5f3ee', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Check Another
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

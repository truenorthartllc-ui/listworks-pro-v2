import { useEffect } from "react";
import { Link } from "react-router-dom";

const RISKY_PHRASES = [
  { phrase: '"Perfect for families"', why: "Familial status discrimination — implies a preference for families or excludes others." },
  { phrase: '"Ideal for young professionals"', why: "Age discrimination. Also implies excluding families and retirees." },
  { phrase: '"Great for empty nesters"', why: "Age discrimination — targets a specific age group." },
  { phrase: '"Walk to church"', why: "Religious preference — signals a religious demographic." },
  { phrase: '"Good school district"', why: "Familial status risk when used as a buyer filter; careful framing needed." },
  { phrase: '"Exclusive neighborhood"', why: "Can imply racial/income preference when used loosely." },
  { phrase: '"Quiet, mature community"', why: "Age discrimination — a known euphemism for excluding families/children." },
  { phrase: '"Country living"', why: "Historically used as a racial code word. High risk, avoid entirely." },
  { phrase: '"Master bedroom"', why: "Not a Fair Housing violation itself, but increasingly flagged by listings platforms." },
  { phrase: '"Handyman special"', why: "Disability discrimination risk — implies not suitable for disabled buyers." },
];

const PENALTIES = [
  { label: "First offense", amount: "$26,262" },
  { label: "Second offense (within 7 years)", amount: "$65,654" },
  { label: "Third offense (within 7 years)", amount: "$131,308" },
];

export default function FairHousingCompliancePage() {
  useEffect(() => {
    document.title = "Fair Housing Compliance for Real Estate Listings | ListWorks";
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d", color: "#f5f3ee", fontFamily: "Inter, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(198,169,97,0.1)", background: "rgba(13,13,13,0.9)" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" style={{ fontSize: "20px", fontWeight: 700, textDecoration: "none", color: "#f5f3ee", fontFamily: "Playfair Display, serif" }}>
            ListWorks<span style={{ color: "#C6A961" }}>.</span>
          </Link>
          <Link to="/" style={{ color: "#a8a49e", textDecoration: "none", fontSize: "14px" }}>← Back to home</Link>
        </div>
      </header>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px 40px" }}>
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#C6A961" }}>🛡️ Fair Housing + AI Compliance</span>
        <h1 style={{ fontSize: "42px", fontWeight: 700, lineHeight: "1.1", margin: "12px 0 16px", letterSpacing: "-0.5px", fontFamily: "Playfair Display, serif" }}>
          One wrong word can cost <span style={{ color: "#C6A961" }}>$26,262</span>.
        </h1>
        <p style={{ fontSize: "17px", lineHeight: "1.6", color: "#a8a49e", maxWidth: "680px" }}>
          The Fair Housing Act applies to everything you publish — and HUD confirmed in 2024 it applies to AI-generated copy too. Your tool's ignorance is not a defense. Here's what violates, what it costs, and how to self-audit in seconds.
        </p>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 50px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "50px" }}>
          {PENALTIES.map((p) => (
            <div key={p.label} style={{ background: "#141414", border: "1px solid rgba(198,169,97,0.15)", borderRadius: "12px", padding: "24px" }}>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#C6A961", fontFamily: "Playfair Display, serif" }}>{p.amount}</div>
              <div style={{ fontSize: "13px", color: "#a8a49e", marginTop: "6px" }}>{p.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "13px", color: "#6b6b6b", marginTop: "-34px", marginBottom: "40px" }}>
          Per 24 CFR §180.671, adjusted for inflation. This is the maximum civil penalty HUD can assess — actual damages and attorney fees are on top.
        </p>

        <h2 style={{ fontSize: "28px", fontFamily: "Playfair Display, serif", marginBottom: "20px" }}>10 phrases that put agents at risk</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px", marginBottom: "50px" }}>
          {RISKY_PHRASES.map((r) => (
            <div key={r.phrase} style={{ background: "#141414", border: "1px solid #232323", borderRadius: "10px", padding: "16px" }}>
              <div style={{ color: "#f5f3ee", fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>{r.phrase}</div>
              <div style={{ color: "#a8a49e", fontSize: "13px", lineHeight: "1.5" }}>{r.why}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "28px", fontFamily: "Playfair Display, serif", marginBottom: "14px" }}>Why AI makes this worse</h2>
        <div style={{ maxWidth: "760px", fontSize: "15px", lineHeight: "1.8", color: "#a8a49e", marginBottom: "50px" }}>
          <p style={{ marginBottom: "14px" }}>
            General-purpose AI (ChatGPT, Claude, Gemini) will happily write "perfect for families," "ideal for young professionals," and "great for empty nesters" — because those phrases read as normal marketing to a language model. Every one of them is a Fair Housing concern (familial status, age). HUD formally confirmed in 2024 that the Fair Housing Act covers AI-generated advertising.
          </p>
          <p style={{ marginBottom: "14px" }}>
            ListWorks PRO screens every rewrite against a Fair Housing problem-phrase list before it leaves your screen. If a generation contains risky language, you see it flagged — not after a complaint lands, but before you publish. That's the difference between a general chatbot and a purpose-built agent tool.
          </p>
          <p>
            <Link to="/compliance" style={{ color: "#C6A961" }}>Browse our free state-by-state compliance guides →</Link>
          </p>
        </div>

        <h2 style={{ fontSize: "28px", fontFamily: "Playfair Display, serif", marginBottom: "20px" }}>How to self-audit in 30 seconds</h2>
        <ol style={{ maxWidth: "720px", fontSize: "15px", lineHeight: "1.9", color: "#a8a49e", paddingLeft: "20px", marginBottom: "50px" }}>
          <li><strong style={{ color: "#f5f3ee" }}>Run every listing through a phrase check.</strong> Our free <Link to="/listing-analyzer" style={{ color: "#C6A961" }}>listing analyzer</Link> flags risky language automatically.</li>
          <li><strong style={{ color: "#f5f3ee" }}>Remove protected-class adjectives.</strong> If a word describes who should live there, cut it. Describe the home, not the "ideal" resident.</li>
          <li><strong style={{ color: "#f5f3ee" }}>Document your process.</strong> States like Colorado are adding AI-disclosure requirements (SB 26-189, effective Jan 1 2027). A written review step is cheap insurance.</li>
          <li><strong style={{ color: "#f5f3ee" }}>Use a tool with guardrails built in.</strong> If you're pasting AI output into MLS without checking, you're the compliance department — and the one holding the $26,262 bill.</li>
        </ol>

        <div style={{ textAlign: "center", background: "#141414", border: "1px solid rgba(198,169,97,0.2)", borderRadius: "16px", padding: "40px" }}>
          <h2 style={{ fontSize: "26px", fontFamily: "Playfair Display, serif", marginBottom: "10px" }}>Write compliant listings that actually sell</h2>
          <p style={{ fontSize: "15px", color: "#a8a49e", marginBottom: "20px", maxWidth: "560px", margin: "0 auto 20px" }}>
            ListWorks PRO generates buyer-magnet copy with Fair Housing guardrails on every rewrite. Three free rewrites, no card required.
          </p>
          <Link to="/" style={{ background: "#C6A961", color: "#0d0d0d", textDecoration: "none", borderRadius: "8px", padding: "14px 28px", fontSize: "14px", fontWeight: 600, display: "inline-block" }}>
            Rewrite Your First Listing Free
          </Link>
        </div>
      </section>
    </div>
  );
}

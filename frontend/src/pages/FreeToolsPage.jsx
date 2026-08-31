import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TOOLS = [
  {
    icon: "✍️",
    title: "Free Listing Description Rewriter",
    desc: "Paste your boring listing, get a buyer-magnet rewrite in seconds. This is the ListWorks PRO core engine — free to try, 3 rewrites, no card.",
    link: "/",
    cta: "Try it free",
  },
  {
    icon: "📸",
    title: "Instagram Caption Generator",
    desc: "Turn any listing into a scroll-stopping caption with emojis, specific details, and a low-friction CTA. Same engine that powers the paid tool.",
    link: "/social",
    cta: "Generate captions",
  },
  {
    icon: "🛡️",
    title: "Fair Housing Compliance Checker",
    desc: "Paste your listing and scan for HUD-problem language — 'perfect for families,' 'ideal for young professionals,' and 20+ more risky phrases.",
    link: "/compliance",
    cta: "Check my listing",
  },
  {
    icon: "🧮",
    title: "Listing Strength Score",
    desc: "See how your current listing description ranks on a 0-100 strength scale. Find the weak spots before buyers do.",
    link: "/listing-analyzer",
    cta: "Score my listing",
  },
  {
    icon: "🗺️",
    title: "State Compliance Guides",
    desc: "Free Fair Housing cheat sheets for all 50 states. Know what language is risky in your market before you publish.",
    link: "/compliance",
    cta: "Browse states",
  },
  {
    icon: "💬",
    title: "AI Prompt Library",
    desc: "Free, battle-tested ChatGPT prompts for real estate agents — listing descriptions, buyer emails, objection handling, and more.",
    link: "/prompt-library",
    cta: "Browse prompts",
  },
];

export default function FreeToolsPage() {
  const [listingText, setListingText] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = "Free Real Estate Marketing Tools for Agents | ListWorks";
  }, []);

  const doRewrite = async () => {
    if (!listingText.trim() || listingText.trim().length < 20) {
      alert("Paste a listing first — at least 20 characters.");
      return;
    }
    setRewriting(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://listworks-pro-v2-production.up.railway.app'}/api/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_listing: listingText, tone: "professional" }),
      });
      const data = await res.json();
      setResult(data.rewritten_listing || data.listing || data.result || JSON.stringify(data).slice(0, 800));
    } catch (e) {
      alert("Something broke — try again.");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0d0d0d", color: "#f5f3ee", fontFamily: "Inter, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(198,169,97,0.1)", background: "rgba(13,13,13,0.9)" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" style={{ fontSize: "20px", fontWeight: 700, textDecoration: "none", color: "#f5f3ee", letterSpacing: "-0.3px", fontFamily: "Playfair Display, serif" }}>
            ListWorks<span style={{ color: "#C6A961" }}>.</span>
          </Link>
          <a href="https://listworks.pro" style={{ color: "#a8a49e", textDecoration: "none", fontSize: "14px" }}>Back to home →</a>
        </div>
      </header>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px 40px" }}>
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#C6A961" }}>Free Tools for Real Estate Agents</span>
        <h1 style={{ fontSize: "44px", fontWeight: 700, lineHeight: "1.1", margin: "12px 0 14px", letterSpacing: "-0.5px", fontFamily: "Playfair Display, serif" }}>
          Free real estate marketing tools, <span style={{ color: "#C6A961" }}>no card required</span>.
        </h1>
        <p style={{ fontSize: "17px", lineHeight: "1.6", color: "#a8a49e", maxWidth: "640px" }}>
          Every tool on this page is free to use right now — the same AI engine behind ListWorks PRO. Try the rewriter below, or jump straight to any tool.
        </p>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ background: "#141414", border: "1px solid rgba(198,169,97,0.15)", borderRadius: "16px", padding: "32px", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "22px", fontFamily: "Playfair Display, serif", marginBottom: "16px" }}>
            Free Listing Description Rewriter
          </h2>
          <textarea
            value={listingText}
            onChange={(e) => setListingText(e.target.value)}
            placeholder={"Paste your listing here... e.g. '3 bed 2 bath home with updated kitchen and big backyard in quiet neighborhood'"}
            rows={4}
            style={{ width: "100%", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#f5f3ee", padding: "14px", fontSize: "15px", fontFamily: "inherit", marginBottom: "12px", resize: "vertical" }}
          />
          <button
            onClick={doRewrite}
            disabled={rewriting}
            style={{ background: "#C6A961", color: "#0d0d0d", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            {rewriting ? "Rewriting..." : "Rewrite My Listing Free"}
          </button>
          {result && (
            <div style={{ marginTop: "16px", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6", color: "#e8e4dc" }}>
              {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {TOOLS.map((t) => (
            <Link key={t.title} to={t.link} style={{ textDecoration: "none", background: "#141414", border: "1px solid #232323", borderRadius: "12px", padding: "24px", transition: "border 0.2s" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{t.icon}</div>
              <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#f5f3ee", marginBottom: "8px", fontFamily: "Playfair Display, serif" }}>{t.title}</h3>
              <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#a8a49e", marginBottom: "12px" }}>{t.desc}</p>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#C6A961" }}>{t.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px", borderTop: "1px solid #1a1a1a" }}>
        <h2 style={{ fontSize: "28px", fontFamily: "Playfair Display, serif", marginBottom: "20px" }}>Free tools, serious results</h2>
        <div style={{ maxWidth: "760px", fontSize: "15px", lineHeight: "1.8", color: "#a8a49e" }}>
          <p style={{ marginBottom: "14px" }}>
            ListWorks PRO is used by real estate agents across the U.S. to turn raw listing notes into marketing that sells — MLS descriptions, Instagram captions, Facebook posts, headlines, and buyer emails, all in one click. Every free tool here runs on the same AI engine, so what you try free is exactly what you get with the paid plan.
          </p>
          <p style={{ marginBottom: "14px" }}>
            The free tools are our way of proving the engine before you commit. No credit card, no trial timer, no "sign up to see the result" gating — paste your copy, get real output, decide from there.
          </p>
          <p>
            When you're ready for the full workflow — Brand Voice Memory, Fair Housing guardrails, neighborhood intelligence, photo-to-listing analysis, and unlimited rewrites — <Link to="/pricing" style={{ color: "#C6A961" }}>see ListWorks PRO pricing</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}

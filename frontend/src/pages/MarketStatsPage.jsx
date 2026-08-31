import { useEffect } from "react";
import { Link } from "react-router-dom";

const STATS = [
  { metric: "Median home price (national)", value: "$425,000", note: "Q2 2026, NAR data", trend: "stable" },
  { metric: "Average 30-year fixed mortgage rate", value: "6.4%", note: "August 2026", trend: "slightly down" },
  { metric: "Months of housing supply", value: "3.8", note: "Near a balanced market (5-6 = balanced)", trend: "rising" },
  { metric: "Existing home sales (annualized)", value: "3.9M", note: "July 2026", trend: "up 3% MoM" },
  { metric: "Days on market (national average)", value: "38", note: "For-sale listings", trend: "rising" },
  { metric: "Share of listings with price cuts", value: "18.2%", note: "Active inventory", trend: "rising" },
  { metric: "New construction starts", value: "1.48M", note: "Annualized, July 2026", trend: "stable" },
  { metric: "Cash sales share", value: "29%", note: "All transactions", trend: "rising" },
];

export default function MarketStatsPage() {
  useEffect(() => {
    document.title = "US Real Estate Market Stats & Trends (2026) | ListWorks";
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
        <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", color: "#C6A961" }}>📊 Market Data</span>
        <h1 style={{ fontSize: "42px", fontWeight: 700, lineHeight: "1.1", margin: "12px 0 14px", letterSpacing: "-0.5px", fontFamily: "Playfair Display, serif" }}>
          US real estate market stats: <span style={{ color: "#C6A961" }}>August 2026</span>
        </h1>
        <p style={{ fontSize: "17px", lineHeight: "1.6", color: "#a8a49e", maxWidth: "680px" }}>
          The numbers agents need to price, position, and talk to sellers right now. Updated monthly. Sources: NAR, FHFA, Freddie Mac.
        </p>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 50px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px", marginBottom: "50px" }}>
          {STATS.map((s) => (
            <div key={s.metric} style={{ background: "#141414", border: "1px solid #232323", borderRadius: "12px", padding: "22px" }}>
              <div style={{ fontSize: "13px", color: "#a8a49e", marginBottom: "8px" }}>{s.metric}</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#f5f3ee", fontFamily: "Playfair Display, serif" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#6b6b6b", marginTop: "6px" }}>{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 60px", borderTop: "1px solid #1a1a1a", paddingTop: "50px" }}>
        <h2 style={{ fontSize: "28px", fontFamily: "Playfair Display, serif", marginBottom: "16px" }}>What this means for agents right now</h2>
        <div style={{ maxWidth: "760px", fontSize: "15px", lineHeight: "1.8", color: "#a8a49e" }}>
          <p style={{ marginBottom: "14px" }}>
            Inventory is loosening — months of supply rose to 3.8 and days-on-market is climbing. That's a market where listing copy matters more, not less. When buyers have more options, the listing that reads better gets the showing. The <Link to="/blog/winter-2026-real-estate-marketing" style={{ color: "#C6A961" }}>winter 2026 playbook</Link> is already about standing out in a slower, choosier market.
          </p>
          <p style={{ marginBottom: "14px" }}>
            Price cuts are up (18.2% of listings) — which means more re-listings, price adjustments, and "bring your offer" conversations. Every one of those is a chance to refresh the copy, not just the number. A <Link to="/" style={{ color: "#C6A961" }}>rewritten listing</Link> with fresh positioning outperforms a stale description with a lower price tag.
          </p>
          <p>
            Rate-dependent buyers are still rate-dependent. Cash sales at 29% and climbing means sellers increasingly face investors with strong offers — and agents who can present the home's lifestyle case (not just its stats) are the ones closing at list price.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: "24px", fontFamily: "Playfair Display, serif", marginBottom: "16px" }}>Methodology & sources</h2>
        <p style={{ fontSize: "13px", color: "#6b6b6b", lineHeight: "1.7", maxWidth: "760px" }}>
          Data reflects the latest available releases as of August 2026: median prices and sales from the <a href="https://www.nar.realtor/research-and-statistics" style={{ color: "#C6A961" }}>National Association of Realtors</a>, house price trends from the <a href="https://www.fhfa.gov/DataTools/Downloads/Documents/HPI/HPI_AT_brief.pdf" style={{ color: "#C6A961" }}>FHFA House Price Index</a>, and mortgage rates from <a href="https://www.freddiemac.com/pmms" style={{ color: "#C6A961" }}>Freddie Mac PMMS</a>. Figures are national averages; local markets vary significantly.
        </p>
      </section>
    </div>
  );
}

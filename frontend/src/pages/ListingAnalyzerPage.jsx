import { useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle, ArrowRight, BarChart3, ShieldCheck, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WEAK_WORDS = ["nice", "great", "good", "beautiful", "amazing", "perfect", "wonderful", "fantastic", "incredible", "stunning", "gorgeous", "meticulously", "nestled", "boasts", "imagine", "don't miss", "rare find", "must see", "priced to sell", "motivated seller"];
const FAIR_HOUSING_WORDS = ["family", "families", "walking distance", "safe", "quiet neighborhood", "integrated", "hispanic", "asian", "exclusive", "prestigious area", "perfect for couples", "bachelor", "master"];
const FILLER_PHRASES = ["as you can see", "this home has it all", "the possibilities are endless", "pride of ownership", "one of a kind", "truly special", "speaks for itself"];

function scoreText(text) {
  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const issues = [];
  let score = 100;

  // Length check
  if (wordCount < 50) {
    issues.push({ type: "warning", text: `Too short (${wordCount} words) — MLS descriptions need 80–200 words to rank and convert.` });
    score -= 20;
  } else if (wordCount > 300) {
    issues.push({ type: "info", text: `Long (${wordCount} words) — consider trimming to under 250 for social posts.` });
    score -= 5;
  }

  // Weak/AI words
  const foundWeak = WEAK_WORDS.filter(w => lower.includes(w));
  if (foundWeak.length > 0) {
    issues.push({ type: "error", text: `AI clichés detected: "${foundWeak.slice(0, 3).join('", "')}" — these get ignored by buyers and flagged by editors.` });
    score -= foundWeak.length * 6;
  }

  // Fair housing flags
  const foundFH = FAIR_HOUSING_WORDS.filter(w => lower.includes(w));
  if (foundFH.length > 0) {
    issues.push({ type: "error", text: `Fair Housing risk: "${foundFH.slice(0, 3).join('", "')}" — these phrases can trigger $26,262+ HUD violations.` });
    score -= foundFH.length * 8;
  }

  // Filler phrases
  const foundFiller = FILLER_PHRASES.filter(p => lower.includes(p));
  if (foundFiller.length > 0) {
    issues.push({ type: "warning", text: `Filler phrases: "${foundFiller[0]}" — adds length without adding value.` });
    score -= foundFiller.length * 4;
  }

  // No hook
  const firstSentence = text.split(/[.!?]/)[0] || "";
  if (firstSentence.toLowerCase().startsWith("this ") || firstSentence.toLowerCase().startsWith("welcome ")) {
    issues.push({ type: "warning", text: `Weak opening — starts with "${firstSentence.split(" ")[0]}" which buyers skim past. Lead with the best feature.` });
    score -= 10;
  }

  // No numbers (specificity signal)
  if (!/\d/.test(text)) {
    issues.push({ type: "info", text: "No numbers detected — specific details (1,847 sq ft, $12k kitchen remodel) build trust and memorability." });
    score -= 8;
  }

  // Positives
  if (wordCount >= 80 && wordCount <= 200 && foundWeak.length === 0 && foundFH.length === 0) {
    issues.push({ type: "success", text: "Good length and clean language — solid foundation." });
  }

  return { score: Math.max(0, Math.min(100, score)), issues, wordCount };
}

function ScoreRing({ score }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Needs Work" : "Risky";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-medium" style={{ color }}>{score}</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-ink/40">/100</span>
        </div>
      </div>
      <span className="mt-2 font-heading text-xs uppercase tracking-[0.15em]" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ListingAnalyzerPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (text.trim().length < 30) return;
    setLoading(true);
    try {
      const local = scoreText(text);
      let fhViolations = [];
      try {
        const { data } = await axios.post(`${API}/analyze/fair-housing`, { text });
        fhViolations = data.violations || [];
      } catch {}
      setResult({ ...local, fhViolations });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-oat text-ink">
      <div className="border-b border-ink/15">
        <div className="max-w-[900px] mx-auto px-6 py-5 flex items-baseline gap-2">
          <a href="/" className="font-display italic text-2xl font-medium text-ink">ListWorks</a>
          <span className="font-mono text-[10px] tracking-[0.2em] text-vermillion uppercase">/pro</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-14">
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Free Tool</span>
        <h1 className="mt-3 font-display text-4xl md:text-5xl tracking-tight leading-[1.05] mb-3">
          <span className="font-light">MLS Listing</span> <span className="italic">Analyzer</span>
        </h1>
        <p className="font-body text-lg text-ink/60 max-w-xl mb-10">
          Paste any listing description. Get an instant score — Fair Housing risks, AI clichés, weak hooks, and what to fix.
        </p>

        <div className="border border-ink/15">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your MLS listing description here…"
            rows={8}
            className="w-full p-5 font-body text-sm bg-transparent outline-none resize-none placeholder:text-ink/30 border-b border-ink/15"
          />
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="font-mono text-[10px] text-ink/35 tracking-wider">{text.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button
              onClick={analyze}
              disabled={loading || text.trim().length < 30}
              className="flex items-center gap-2 bg-vermillion text-oat px-6 py-2.5 font-heading text-xs uppercase tracking-[0.15em] hover:bg-[#ff2a0e] transition disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
              {loading ? "Analyzing…" : "Analyze Listing"}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-8 border border-ink/15">
            <div className="p-6 border-b border-ink/15 flex flex-col md:flex-row items-start md:items-center gap-6">
              <ScoreRing score={result.score} />
              <div>
                <p className="font-body text-sm text-ink/60 mb-1">{result.wordCount} words · {result.issues.filter(i => i.type === "error").length} critical issues · {result.fhViolations.length} Fair Housing flags</p>
                <p className="font-body text-sm text-ink/70 leading-relaxed max-w-lg">
                  {result.score < 50
                    ? "This listing has significant risks that could cost you a sale — or trigger a Fair Housing violation. Rewrite it before it goes live."
                    : result.score < 75
                    ? "Decent foundation, but AI clichés and weak phrasing are leaving engagement on the table. A quick rewrite will close the gap."
                    : "Clean, well-structured listing. Minor tweaks could push conversion further."}
                </p>
              </div>
            </div>

            <div className="divide-y divide-ink/8">
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-3 px-6 py-4">
                  {issue.type === "error" && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                  {issue.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                  {issue.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
                  {issue.type === "info" && <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />}
                  <p className="font-body text-sm text-ink/75">{issue.text}</p>
                </div>
              ))}
              {result.fhViolations.map((v, i) => (
                <div key={`fh-${i}`} className="flex items-start gap-3 px-6 py-4 bg-red-50/30">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-ink/75">
                    <span className="font-semibold text-red-600">Fair Housing violation: </span>
                    {typeof v === "string" ? v : v.phrase || v.issue || JSON.stringify(v)}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-coal text-oat">
              <p className="font-heading text-sm uppercase tracking-[0.12em] mb-1">Fix it in 8 seconds</p>
              <p className="font-body text-sm text-oat/65 mb-4">ListWorks PRO rewrites this with Fair Housing guardrails, no AI clichés, and all 5 formats at once. First 3 rewrites are free — no card required.</p>
              <a
                href={`/?prefill=${encodeURIComponent(text.slice(0, 500))}`}
                className="inline-flex items-center gap-2 bg-vermillion text-oat px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] hover:bg-[#ff2a0e] transition"
              >
                Rewrite This Listing Free <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: "Fair Housing Risks", body: "AI tools like ChatGPT generate phrases that violate HUD guidelines — 'great for families,' 'safe neighborhood,' 'walking distance to church.' First violation: $26,262 fine. ListWorks screens every word." },
            { label: "AI Clichés Kill Listings", body: "Words like 'stunning,' 'nestled,' and 'meticulously maintained' appear in 40% of listings. Buyers tune them out. ListWorks bans 25+ of them at the system level." },
            { label: "Weak Hooks Lose Buyers", body: "Listings that start with 'This home...' or 'Welcome to...' get 60% less engagement than listings that open with a specific, sensory hook. Your first sentence is your most important." },
          ].map(f => (
            <div key={f.label} className="border border-ink/12 p-5">
              <h3 className="font-heading text-xs uppercase tracking-[0.12em] mb-2">{f.label}</h3>
              <p className="font-body text-ink/55 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

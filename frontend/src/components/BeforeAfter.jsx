import { useState } from "react";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";

function ScoreGauge({ score, label, color }) {
  const pct = Math.round((score / 10) * 100);
  const barColor = score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/50">{label}</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const EXAMPLES = [
  {
    address: "248 Linden Ave, Austin TX",
    tag: "Family Ranch",
    before: "3 bed 2 bath ranch home. Updated kitchen with granite. Fenced backyard. Close to schools. Move-in ready.",
    before_score: 3.5,
    after: "Imagine Saturday mornings: coffee in hand, sunlight pouring across granite while the kids race through the fully fenced backyard. This 3-bedroom, 2-bath ranch isn't just a house — it's where holidays happen.",
    after_score: 8.7,
  },
  {
    address: "12 Skyline Dr, Beverly Hills CA",
    tag: "Luxury Estate",
    before: "Large modern home, 5 bedrooms, pool, city views. High ceilings. Two car garage.",
    before_score: 2.8,
    after: "Wake up above it all — the city sprawled at your feet, glittering like it was built just for you. Five bedrooms, a pool, and walls of glass that dissolve the line between indoors and infinity.",
    after_score: 9.2,
  },
  {
    address: "904 Ironwood Ct, Denver CO",
    tag: "Investment 4-Plex",
    before: "Investment property. 4-plex. Fully rented. Cap rate 6.2%. Recent roof. Off-street parking.",
    before_score: 3.2,
    after: "Wake up to passive income. Four units, four rent checks, zero vacancies. This turnkey 4-plex is already working hard so you don't have to — proven 6.2% cap rate from day one.",
    after_score: 8.9,
  },
];

export default function BeforeAfter() {
  const [active, setActive] = useState(0);
  const ex = EXAMPLES[active];
  return (
    <section id="examples" data-testid="examples-section" className="border-b border-ink/15 bg-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {EXAMPLES.map((e, i) => (
            <button key={i} onClick={() => setActive(i)} className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition-all border ${i === active ? "bg-ink text-oat border-ink" : "bg-transparent text-ink/50 border-ink/15 hover:border-ink/40"}`}>
              {e.address.split(",")[0]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/15 border border-ink/15">
          <div className="bg-ink/5 p-4 md:p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/40 font-semibold">Before</span>
              <span className="font-mono text-[9px] text-ink/30 uppercase">{ex.tag}</span>
            </div>
            <p className="font-mono text-xs text-ink/50 leading-relaxed italic">"{ex.before}"</p>
            <ScoreGauge score={ex.before_score} label="Strength" color="#a0a0a0" />
          </div>
          <div className="bg-white p-4 md:p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vermillion font-semibold">After / ListWorks</span>
              <Sparkles className="w-3 h-3 text-vermillion" strokeWidth={2} />
            </div>
            <p className="font-display text-sm leading-relaxed text-ink whitespace-pre-line">{ex.after}</p>
            <ScoreGauge score={ex.after_score} label="Strength" color="#e84118" />
            <div className="mt-2 flex items-center gap-3">
              <a href="#playground" className="inline-flex items-center gap-1 bg-vermillion text-oat hover:bg-[#ff2a0e] px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.15em] transition-all">Rewrite Yours <ArrowRight className="w-3 h-3" /></a>
              <span className="flex items-center gap-1 font-mono text-[9px] text-green-600 uppercase tracking-wider"><TrendingUp className="w-3 h-3" />+{Math.round((ex.after_score - ex.before_score) * 10)}% stronger</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

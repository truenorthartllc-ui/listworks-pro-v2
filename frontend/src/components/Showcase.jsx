import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const EXAMPLES = [
  {
    address: "248 Linden Ave, Austin TX",
    tag: "Family Ranch",
    before: "3 bed 2 bath ranch home. Updated kitchen with granite. Fenced backyard. Close to schools. Move-in ready.",
    after: "Imagine Saturday mornings here: coffee in hand, sunlight pouring across granite countertops while pancakes sizzle and the kids race through the backyard — your backyard, fully fenced, where memories are made and worries stay outside the gate.\n\nThis isn't just a 3-bedroom, 2-bath ranch. It's the home where holidays happen, where the dining room holds laughter instead of dust, and where you walk to top-rated schools at a pace that lets little legs keep up. Move-in ready means exactly that — no projects, no contractors, just keys and boxes.\n\nWalk through the front door and feel it: this is where your life starts.",
  },
  {
    address: "12 Skyline Dr, Beverly Hills CA",
    tag: "Luxury Estate",
    before: "Large modern home, 5 bedrooms, pool, city views. High ceilings. Two car garage.",
    after: "Wake up above it all — the city sprawled at your feet, glittering like it was built just for you.\n\nThis is where Sunday mornings stretch lazy by the pool, where laughter echoes off soaring ceilings, and where five bedrooms mean every guest has their own sanctuary. Walls of glass dissolve the line between indoors and infinity — the view doesn't stop, and neither does the feeling.\n\nTwo-car garage? Yes. But the real parking spot is the one you'll claim poolside, watching the sun drop behind the skyline. This isn't a house you live in. It's the house you live up to.",
  },
  {
    address: "904 Ironwood Ct, Denver CO",
    tag: "Investment 4-Plex",
    before: "Investment property. 4-plex. Fully rented. Cap rate 6.2%. Recent roof. Off-street parking.",
    after: "Wake up to passive income. Four units, four rent checks, zero vacancies.\n\nThis turnkey 4-plex is already working hard so you don't have to. While other investors chase deals, you'll be cashing in on a proven 6.2% cap rate from day one. The big-ticket worry? Handled — new roof, new peace of mind. Off-street parking for every tenant, and an emerging Denver block where comps are climbing 9% year over year.\n\nThis isn't a fixer-upper. It's a printer. Low turnover, strong renters, and a sub-market that's begging for more inventory. The kind of deal you don't find — you act on.",
  },
];

export default function Showcase() {
  const [active, setActive] = useState(0);
  const ex = EXAMPLES[active];

  return (
    <section id="showcase" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Before & After</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              <span className="font-light">The same property,</span><br />
              <span className="italic">two different markets.</span>
            </h2>
          </div>
        </div>

        {/* Property selector */}
        <div className="flex flex-wrap gap-3 mb-10">
          {EXAMPLES.map((e, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] transition-all border ${
                i === active
                  ? "bg-ink text-oat border-ink"
                  : "bg-transparent text-ink/60 border-ink/15 hover:border-ink/40"
              }`}
            >
              {e.address}
            </button>
          ))}
        </div>

        {/* Before/After cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/15 border border-ink/15">
          <div className="bg-ink/5 p-8 md:p-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 font-semibold">Before</span>
              <span className="flex-1" />
              <span className="font-mono text-[9px] text-ink/30 uppercase tracking-widest">{ex.tag}</span>
            </div>
            <p className="font-mono text-sm text-ink/50 leading-relaxed italic">
              "{ex.before}"
            </p>
          </div>

          <div className="bg-oat p-8 md:p-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion font-semibold">After / ListWorks</span>
              <span className="flex-1" />
              <Sparkles className="w-3.5 h-3.5 text-vermillion" strokeWidth={2} />
            </div>
            <p className="font-display text-base md:text-lg leading-relaxed text-ink whitespace-pre-line">
              {ex.after}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a href="#playground"
                className="inline-flex items-center gap-2 bg-vermillion text-oat hover:bg-[#ff2a0e] px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] transition-all"
              >
                Rewrite Yours <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[11px] tracking-[0.18em] uppercase text-ink/50">
          3 free rewrites · No credit card · See the difference in 10 seconds
        </p>
      </div>
    </section>
  );
}

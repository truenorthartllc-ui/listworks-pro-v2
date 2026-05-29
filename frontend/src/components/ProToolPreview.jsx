import { Lock, ArrowUpRight } from "lucide-react";
import { startCheckout } from "@/lib/checkout";

const EXAMPLES = {
  expired: {
    label: "Expired Listing Scripts",
    desc: "Turn expired listings into signed clients with scripts that actually get callbacks.",
    preview: (
      <div className="space-y-5 font-body text-sm text-ink/80 leading-relaxed">
        <div className="border-l-2 border-vermillion pl-4">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-2">Cold Call — 30 sec opener</div>
          <p>"Hi, is this [Owner Name]? I noticed your home at 47 Maple St came off the market after 94 days. Most agents would call to relist it — I'm calling because I've identified the two exact reasons it didn't sell, and how to fix them without dropping the price. Do you have 20 seconds?"</p>
        </div>
        <div className="border-l-2 border-ink/20 pl-4">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-2">Voicemail</div>
          <p>"[Name], this is Alex. I specialize in properties that didn't sell the first time. After reviewing your listing, I know exactly why it expired and how to get it sold — likely without a major price cut. Call me back. It'll be worth 5 minutes."</p>
        </div>
        <div className="border-l-2 border-ink/20 pl-4">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-2">Text Message</div>
          <p className="font-mono text-xs">"Hi [Name] — saw 47 Maple expired. I know why & how to sell it without a big price drop. Worth a quick call?"</p>
        </div>
      </div>
    ),
  },
  contract: {
    label: "Contract Review",
    desc: "Flag risky clauses before your client signs something they'll regret.",
    preview: (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-widest font-bold">⚠ HIGH RISK — Clause 7.3</span>
          </div>
          <p className="font-mono text-xs text-ink/60 italic mb-3">"Buyer waives the right to a general home inspection. Seller disclosure limited to defects discovered within the past 12 months."</p>
          <p className="font-body text-sm text-red-800 leading-relaxed">Seller only discloses defects from the last 12 months — leaving older hidden issues completely undetected. Combined with the inspection waiver, your buyer has zero recourse after closing.</p>
          <p className="mt-2 font-heading text-xs uppercase tracking-wider text-red-700">→ Demand full inspection. Extend disclosure to cover full property history.</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-700 font-mono text-[10px] uppercase tracking-widest font-bold">⚡ MEDIUM RISK — Clause 4.1</span>
          </div>
          <p className="font-body text-sm text-yellow-900">Earnest money forfeiture clause is non-standard. Recommend capping at 1% of purchase price.</p>
        </div>
      </div>
    ),
  },
  seller: {
    label: "Seller Market Report",
    desc: "Show sellers exactly where they stand — and why your strategy wins.",
    preview: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-px bg-ink/10">
          {[
            { v: "$725k", l: "Your Ask" },
            { v: "$698k", l: "Area Avg" },
            { v: "12-18d", l: "Est. DOM" },
          ].map((s) => (
            <div key={s.l} className="bg-oat p-4 text-center">
              <div className="font-display text-2xl">{s.v}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/50 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-2">Your Competitive Edge</div>
          <ul className="space-y-1.5">
            {["2023 kitchen renovation — comps avg 5+ years older","2024 roof — zero near-term maintenance concern","Conservation land behind property — no rear neighbors ever"].map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm"><span className="text-vermillion font-bold mt-0.5">✦</span>{a}</li>
            ))}
          </ul>
        </div>
        <div className="border-l-2 border-vermillion pl-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-1">Strategy</div>
          <p className="text-sm">Hold firm at $725k for 10 days. Conservation access is a scarcity play — use it. Adjust $5-10k only if no offers by day 12.</p>
        </div>
      </div>
    ),
  },
  nurture: {
    label: "Lead Nurture Emails",
    desc: "Re-engage cold leads with emails that feel human and get replies.",
    preview: (
      <div className="space-y-3">
        <div className="border border-ink/15 p-4 bg-white">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-1">Subject</div>
          <p className="font-heading text-sm font-semibold">Marcus — found 3 new homes with those open layouts you loved</p>
        </div>
        <div className="border border-ink/15 p-5 bg-white font-body text-sm leading-relaxed text-ink/80 space-y-3">
          <p>Hey Marcus,</p>
          <p>I know you've been thinking things over since we toured those homes. No pressure at all — this is a big decision and it should feel right.</p>
          <p>3 new listings hit this week that check all your boxes: open floor plans, dedicated office space, 2-car garages. All within your $550-600k range. One has that kitchen island setup from the second house you really liked.</p>
          <p>No obligation — just didn't want you to miss them.</p>
          <p className="text-ink/50">— Alex</p>
        </div>
      </div>
    ),
  },
  score: {
    label: "Lead Scoring",
    desc: "Know exactly who to call first — and what to say when you do.",
    preview: (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200">
          <div>
            <div className="font-display text-4xl text-green-700">9.1</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-green-600 mt-1">Hot — Ready to Offer</div>
          </div>
          <div className="text-right">
            <div className="font-heading text-sm font-semibold">Sarah Chen</div>
            <div className="font-mono text-[10px] text-ink/50">Pre-approved $650k</div>
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-2">Buying Signals</div>
          <ul className="space-y-1.5 text-sm">
            {["Pre-approved — budget locked and ready","Viewed 7 listings in 3 days, opened every email in under 2 min","Clicked virtual tours 4x on 3BR listings","Lease ends in 60 days — hard deadline"].map((s) => (
              <li key={s} className="flex items-start gap-2"><span className="text-green-600 font-bold">●</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="border-l-2 border-vermillion pl-4 text-sm font-body">
          <strong>Next move:</strong> Call Sarah today. Book the top two 3BR listings she toured virtually. She is ready to write an offer this week.
        </div>
      </div>
    ),
  },
  voice: {
    label: "Walk & Talk",
    desc: "Narrate your walkthrough. ListWorks turns your voice into polished listing copy.",
    preview: (
      <div className="space-y-4">
        <div className="bg-ink/5 border-l-2 border-ink/20 pl-4 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-2">Your raw notes</div>
          <p className="font-mono text-xs text-ink/50 italic">"Ok so um... walking in the front door, the entryway has like really tall ceilings, feels grand. Kitchen is actually gorgeous, white cabinets, quartz counters, big island. Backyard is huge, covered patio, they clearly entertain out here. Master is upstairs, the closet is insane, his and hers. Light in here is incredible."</p>
        </div>
        <div className="border-l-2 border-vermillion pl-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-vermillion mb-2">ListWorks output</div>
          <p className="font-display italic text-lg leading-relaxed">The ceiling catches you first — that grand two-story entry that makes you exhale before you've even reached the kitchen. And the kitchen delivers: white shaker cabinets, quartz that runs edge to edge, and an island large enough to mean something. Out back, a covered patio tells the story of a home that's been lived in generously. Upstairs, the primary suite earns its name — a his-and-hers closet that ends the argument before it starts, and afternoon light that pours in like it owns the place.</p>
        </div>
      </div>
    ),
  },
  import: {
    label: "Redfin Import",
    desc: "Paste any Redfin URL — we extract everything and pre-fill your rewrite in seconds.",
    preview: (
      <div className="space-y-4">
        <div className="border border-ink/15 p-4 font-mono text-xs text-ink/60">
          https://www.redfin.com/home/123-oak-street...
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[["Address","123 Oak Street, Austin TX"],["Price","$689,000"],["Beds / Baths","4 BD / 3 BA"],["Sqft","2,180"],["Year Built","2018"],["Description","Extracted & pre-filled ✓"]].map(([k,v]) => (
            <div key={k} className="border border-ink/10 p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{k}</div>
              <div className="mt-1 font-body text-ink">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/50 font-mono">→ Switched to Rewrite mode. Your listing is pre-filled.</p>
      </div>
    ),
  },
  transaction: {
    label: "Transaction Tracker",
    desc: "Every deal, every deadline, every next step — one place.",
    preview: (
      <div className="space-y-3">
        {[
          { addr: "47 Maple St", status: "Under Contract", next: "Inspection due Jan 12", dot: "bg-yellow-400" },
          { addr: "142 Birchwood Ln", status: "Active", next: "Price review Jan 15", dot: "bg-green-400" },
          { addr: "89 Crestview Dr", status: "Closing Jan 18", next: "Final walkthrough Jan 17", dot: "bg-blue-400" },
        ].map((t) => (
          <div key={t.addr} className="flex items-center gap-3 p-3 border border-ink/10">
            <span className={`w-2.5 h-2.5 rounded-full ${t.dot} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="font-heading text-sm font-semibold">{t.addr}</div>
              <div className="font-mono text-[10px] text-ink/50 uppercase tracking-wider">{t.status} · {t.next}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  openhouse: {
    label: "Open House Check-In",
    desc: "Digital sign-in, auto follow-up emails, and lead capture — all from your phone.",
    preview: (
      <div className="space-y-4">
        <div className="border border-ink/15 p-5 bg-white text-center">
          <div className="font-display italic text-2xl mb-1">47 Maple Street</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-4">Open House — Sat Jan 11, 1–4PM</div>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {["Name","Email","Phone","Are you pre-approved?"].map((f) => (
              <div key={f} className="border-b border-ink/10 pb-2 font-mono text-xs text-ink/40">{f}</div>
            ))}
          </div>
        </div>
        <div className="text-xs font-mono text-ink/50 space-y-1">
          <div>✓ 14 visitors signed in</div>
          <div>✓ Follow-up emails sent automatically</div>
          <div>✓ 3 leads flagged as pre-approved</div>
        </div>
      </div>
    ),
  },
  fairhousing: {
    label: "Fair Housing Checker",
    desc: "Flag discriminatory language before it becomes a $20k fine.",
    preview: (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-red-600 mb-2">⚠ 2 Issues Flagged</div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-mono text-xs text-ink/60 italic mb-1">"Perfect for young families in a quiet Christian neighborhood..."</p>
              <p className="text-red-800">"Christian neighborhood" implies religious preference. Replace with "quiet, family-friendly street."</p>
            </div>
            <div>
              <p className="font-mono text-xs text-ink/60 italic mb-1">"Walking distance to everything — ideal for active couples."</p>
              <p className="text-red-800">"Active couples" implies familial status preference. Use "walkable location."</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 p-3 font-mono text-xs text-green-700">✓ Revised copy passes Fair Housing review</div>
      </div>
    ),
  },
  report: {
    label: "Post-Sale Report",
    desc: "Send a branded closing summary that gets you referrals before the ink dries.",
    preview: (
      <div className="space-y-4">
        <div className="border border-ink/15 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-4">Closing Summary — 47 Maple Street</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[["List Price","$489,000"],["Sale Price","$501,500"],["Days on Market","11"],["Above Ask","+$12,500"]].map(([k,v]) => (
              <div key={k}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{k}</div>
                <div className="font-display text-xl mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-ink/10 pt-4 font-body text-sm text-ink/70 italic">
            "Working with Alex was the smoothest transaction I've had in 20 years. Sold in 11 days, above ask. Sending everyone I know your way."
          </div>
          <div className="mt-2 font-mono text-[10px] text-ink/40">— The Chen Family</div>
        </div>
      </div>
    ),
  },
};

export default function ProToolPreview({ tool, onUnlock }) {
  const ex = EXAMPLES[tool];
  if (!ex) return null;

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-vermillion mb-1">Example Output</div>
        <h3 className="font-display italic text-2xl text-ink">{ex.label}</h3>
        <p className="font-body text-sm text-ink/60 mt-1">{ex.desc}</p>
      </div>

      {/* Example content — visible then fades */}
      <div className="relative overflow-hidden" style={{ maxHeight: "420px" }}>
        <div className="pointer-events-none select-none">
          {ex.preview}
        </div>

        {/* Gradient fade */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: "65%", background: "linear-gradient(to bottom, transparent 0%, white 55%, white 100%)" }}
        />

        {/* Paywall block */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-6 px-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 border border-ink/20 mb-3 bg-white">
            <Lock className="w-4 h-4 text-ink/50" />
          </div>
          <p className="font-display italic text-xl text-ink mb-1">Unlock this on your listings.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50 mb-5">
            Pro includes all 12 tools · unlimited rewrites · no watermark
          </p>
          <button
            onClick={onUnlock}
            className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-8 py-3.5 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Upgrade to Pro — $49/mo
          </button>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink/35">Cancel anytime · instant access</p>
        </div>
      </div>
    </div>
  );
}

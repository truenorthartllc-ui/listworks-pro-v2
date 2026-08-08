import { useParams, Link } from "react-router-dom";
import { getStateInfo, getAllStates } from "@/lib/stateCompliance";
import { ShieldCheck, AlertTriangle, BookOpen, ArrowLeft, ExternalLink } from "lucide-react";

export default function ProgrammaticCompliancePage() {
  const { state: stateAbbr } = useParams();
  const info = getStateInfo(stateAbbr || "");
  const allStates = getAllStates();

  if (!info) {
    return (
      <div className="min-h-screen bg-oat text-ink font-body flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl mb-4">State not found</h1>
          <p className="text-ink/60 mb-6">No compliance data for that state yet.</p>
          <Link to="/compliance" className="text-vermillion hover:underline text-sm">See all states →</Link>
        </div>
      </div>
    );
  }

  const c = info.compliance;
  const isDefault = !STATE_NAMES[info.abbr];

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <header className="border-b border-ink/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/compliance" className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
            <ArrowLeft size={14} /> All states
          </Link>
          <Link to="/" className="font-display text-xl font-bold tracking-tight">
            ListWorks<span className="text-vermillion">.</span>
          </Link>
        </div>
      </header>

      <section className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="mb-2 text-xs font-mono tracking-[0.2em] uppercase text-vermillion">/ Compliance</div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05] mb-2">
          {info.name} ({info.abbr})<br />
          <span className="font-light italic text-ink/40">AI & Fair Housing Compliance</span>
        </h1>
        <p className="text-ink/60 mt-4 max-w-2xl leading-relaxed">
          What {info.name} real estate agents need to know about AI disclosure, Fair Housing rules, and MLS compliance when using AI-generated listing content.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="border border-ink/10 bg-white p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={18} className="text-vermillion" />
              <span className="font-semibold text-sm">AI Disclosure</span>
            </div>
            <p className="text-sm text-ink/70 leading-relaxed">{c.ai}</p>
          </div>

          <div className="border border-ink/10 bg-white p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-amber-500" />
              <span className="font-semibold text-sm">Fair Housing</span>
            </div>
            <p className="text-sm text-ink/70 leading-relaxed">{c.fh}</p>
          </div>

          <div className="border border-ink/10 bg-white p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={18} className="text-blue-500" />
              <span className="font-semibold text-sm">MLS Rules</span>
            </div>
            <p className="text-sm text-ink/70 leading-relaxed">{c.mls}</p>
          </div>
        </div>

        <div className="mt-10 border border-ink/10 bg-white p-6">
          <h2 className="font-semibold text-sm mb-4">Try {info.name} Compliance Check</h2>
          <p className="text-xs text-ink/60 mb-4">
            Paste a listing below and we'll scan it for {info.name}-specific compliance issues.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-medium bg-ink text-white px-4 py-2.5 rounded hover:bg-ink/90 transition-colors"
          >
            Open Compliance Scanner <ExternalLink size={12} />
          </a>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 py-10">
          <h2 className="font-display text-2xl tracking-tight mb-6">All States</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {allStates.map(s => (
              <Link
                key={s.abbr}
                to={`/compliance/${s.abbr.toLowerCase()}`}
                className={`text-xs px-3 py-2 rounded border transition-colors ${
                  s.abbr === info.abbr
                    ? "bg-ink text-white border-ink"
                    : "border-ink/10 hover:border-ink/30 text-ink/60 hover:text-ink"
                }`}
              >
                {s.abbr} — {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const STATE_NAMES = {
  CA: 1, CO: 1, FL: 1, NY: 1, TX: 1,
  AL: 1, AK: 1, AZ: 1, AR: 1, CT: 1, DE: 1, GA: 1, HI: 1, ID: 1, IL: 1, IN: 1, IA: 1, KS: 1, KY: 1, LA: 1,
  ME: 1, MD: 1, MA: 1, MI: 1, MN: 1, MS: 1, MO: 1, MT: 1, NE: 1, NV: 1, NH: 1, NJ: 1, NM: 1, NC: 1, ND: 1,
  OH: 1, OK: 1, OR: 1, PA: 1, RI: 1, SC: 1, SD: 1, TN: 1, UT: 1, VT: 1, VA: 1, WA: 1, WV: 1, WI: 1, WY: 1,
};
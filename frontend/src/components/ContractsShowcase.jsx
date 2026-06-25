const contracts = [
  "Listing Agreement — 14 fields, every one explained",
  "Purchase Agreement — price, contingencies, closing, all broken down",
  "Seller Disclosure — roof, HVAC, water damage, legal obligations",
  "Lease Agreement — rent, deposit, pets, subletting, all covered",
  "Buyer Rep Agreement — compensation, term, territory",
];

const fields = [
  { name: "Cooperating Broker Commission", note: "The portion offered to the buyer's brokerage. Must be clearly stated — affects buyer agent willingness to show." },
  { name: "Inspection Period", note: "Days buyer has to complete inspections. Typical: 10–17 days. Buyer can terminate or negotiate during this window." },
  { name: "Earnest Money Deposit", note: "Good-faith deposit held in escrow. Usually 1–3% of purchase price. Forfeited if buyer defaults without a contingency." },
  { name: "Loan Contingency", note: "If YES, buyer can back out if financing falls through. Waived for cash offers or strong buyers." },
];

export default function ContractsShowcase() {
  return (
    <section className="bg-oat border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">

        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Contracts</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">Contracts that explain themselves.</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ink/12 border border-ink/12">
          {/* Left: list */}
          <div className="bg-oat p-6 flex flex-col gap-4">
            <p className="font-body text-sm text-ink/60 leading-relaxed">
              Every field in every contract has a plain-English explanation. No more guessing what "cooperating broker commission" means.
            </p>
            <ul className="space-y-0 divide-y divide-ink/8">
              {contracts.map((c) => (
                <li key={c} className="py-2.5 font-mono text-[11px] tracking-[0.08em] text-ink/70">{c}</li>
              ))}
            </ul>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a href="/dashboard" className="btn-vermillion inline-flex items-center px-5 py-3 font-heading text-xs uppercase tracking-[0.15em]">
                Try It Free →
              </a>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40">No credit card · Free rewrites included</span>
            </div>
          </div>

          {/* Right: field preview */}
          <div className="bg-white p-6">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion mb-4">Listing Agreement Preview</p>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.name} className="border-l-2 border-ink/10 pl-3">
                  <div className="font-heading text-[11px] uppercase tracking-[0.1em] text-ink mb-1">{f.name}</div>
                  <p className="font-body text-xs text-ink/50 leading-relaxed">{f.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

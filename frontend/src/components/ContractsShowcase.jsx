import React from 'react';

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
  const [selectedContract, setSelectedContract] = React.useState(0);

  const contractExamples = [
    {
      name: "Listing Agreement",
      summary: "14 fields, every one explained",
      description: "Every field in your listing agreement gets a plain-English explanation. Know exactly what you're signing and what it means for your commission, term, and obligations.",
    },
    {
      name: "Purchase Agreement",
      summary: "price, contingencies, closing, all broken down",
      description: "Price, contingencies, inspection periods, earnest money, closing dates — every section decoded so you can explain it to your client with confidence.",
    },
    {
      name: "Seller Disclosure",
      summary: "roof, HVAC, water damage, legal obligations",
      description: "What must be disclosed by law vs what's optional. Roof age, HVAC condition, past water damage, foundation issues — know what protects you and what exposes you.",
    },
    {
      name: "Lease Agreement",
      summary: "rent, deposit, pets, subletting, all covered",
      description: "Rent terms, security deposits, pet policies, subletting rules, maintenance responsibilities — every clause explained so you never miss a detail in a lease negotiation.",
    },
    {
      name: "Buyer Rep Agreement",
      summary: "compensation, term, territory",
      description: "How you get paid, how long the agreement lasts, what territory it covers, and what happens if the buyer finds a home themselves. No more awkward commission conversations.",
    },
  ];

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
              {contractExamples.map((c, idx) => (
                <li
                  key={c.name}
                  onClick={() => setSelectedContract(idx)}
                  className={`py-2.5 font-mono text-[11px] tracking-[0.08em] cursor-pointer transition-colors ${selectedContract === idx ? 'text-vermillion font-semibold' : 'text-ink/70 hover:text-ink'}`}
                >
                  {c.name} — {c.summary}
                </li>
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
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion mb-3">{contractExamples[selectedContract].name} Preview</p>
            <div className="bg-oat/50 p-4 rounded mb-4 border-l-2 border-vermillion/30">
              <p className="font-body text-sm text-ink/70 leading-relaxed italic">
                {contractExamples[selectedContract].description}
              </p>
            </div>
            <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink/40 mb-3">Example Fields:</p>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.name} className="border-l-2 border-ink/10 pl-3 hover:border-vermillion/30 transition-colors">
                  <div className="font-heading text-[11px] uppercase tracking-[0.1em] text-ink mb-1">{f.name}</div>
                  <p className="font-body text-xs text-ink/50 leading-relaxed">{f.note}</p>
                </div>
              ))}
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink/30 mt-4 pt-4 border-t border-ink/10">
              + 10 more fields explained in the full contract
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

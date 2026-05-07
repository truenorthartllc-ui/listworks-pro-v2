import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "For agents trying it on their next listing.",
    features: ["3 listings / month", "All 5 output formats", "5 tone modes", "Listing history (30 days)"],
    cta: "Start Free",
    href: "#playground",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    blurb: "For full-time agents shipping listings weekly.",
    features: ["Unlimited rewrites", "Photo recognition", "Custom voice training", "Priority generation", "Listing history (forever)", "Email support"],
    cta: "Go Pro",
    href: "#playground",
    highlight: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/ month",
    blurb: "For brokerages standardizing their voice.",
    features: ["Everything in Pro", "5 seats included", "Brokerage voice presets", "Shared listing library", "Onboarding call", "White-glove support"],
    cta: "Talk to Sales",
    href: "mailto:hello@listworks.pro",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" data-testid="pricing-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Pricing</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              <span className="font-light">Start free.</span>{" "}
              <span className="italic">Scale to unlimited.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/15 border border-ink/15">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              data-testid={`pricing-tier-${t.name.toLowerCase()}`}
              className={`p-8 md:p-10 ${t.highlight ? "bg-coal text-oat" : "bg-oat text-ink"} flex flex-col`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[11px] tracking-[0.2em] uppercase ${t.highlight ? "text-vermillion" : "text-ink/50"}`}>
                  Plan No. {String(i + 1).padStart(2, "0")}
                </span>
                {t.highlight && (
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-vermillion text-oat px-2 py-1">Most Picked</span>
                )}
              </div>
              <h3 className="mt-5 font-display text-4xl md:text-5xl tracking-tight">{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl md:text-6xl">{t.price}</span>
                <span className={`font-mono text-xs uppercase tracking-[0.15em] ${t.highlight ? "text-oat/60" : "text-ink/50"}`}>{t.period}</span>
              </div>
              <p className={`mt-4 font-body ${t.highlight ? "text-oat/80" : "text-ink/70"}`}>{t.blurb}</p>

              <ul className="mt-7 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-1 shrink-0 ${t.highlight ? "text-vermillion" : "text-ink"}`} strokeWidth={2} />
                    <span className={`${t.highlight ? "text-oat/85" : "text-ink/85"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={t.href}
                data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                className={`mt-9 inline-flex items-center justify-center px-6 py-4 font-heading text-sm uppercase tracking-[0.15em] transition-all hover:-translate-y-1 ${
                  t.highlight ? "bg-vermillion text-oat hover:bg-[#ff2a0e]" : "btn-ghost-ink"
                }`}
              >
                {t.cta} →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

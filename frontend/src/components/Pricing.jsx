import { Check, Crown, Zap, Flame } from "lucide-react";
import { startCheckout } from "@/lib/checkout";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "For agents trying it on their next listing.",
    features: ["Full playground access", "All 5 output formats", "6 tone modes", "Agent Bio (3 rewrites free)"],
    cta: "Start Free",
    action: { kind: "scroll", href: "#playground" },
    highlight: false,
  },
  {
    name: "List + Bio",
    price: "$29",
    period: "/ month",
    blurb: "Unlimited rewrites, no credit anxiety. Listing copy + your agent brand — everything in one flat rate.",
    features: [
      "Unlimited listing rewrites",
      "31 social templates in your brand voice",
      "30-day content calendar generator",
      "Live market update generator",
      "Post scheduler with email reminders",
      "Any listing URL import (Zillow, Redfin, MLS…)",
      "Fair Housing scanner + CO Act compliance PDF",
      "Agent Bio Generator (3 formats)",
      "Watermark-free videos",
      "Listing history (forever)",
    ],
    cta: "Get List + Bio — $29/mo",
    promoNote: null,
    action: { kind: "checkout", package_id: "pro_month" },
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$299",
    period: "once",
    blurb: "Founding member — pay once, never pay again.",
    features: [
      "Everything in Pro",
      "Forever access (no monthly)",
      "All future features included",
      "Priority support",
      "Founding member badge",
      "AI Video Walkthroughs",
      "Priority video generation",
    ],
    cta: "Lock In Lifetime — $299",
    action: { kind: "checkout", package_id: "lifetime" },
    highlight: false,
    badge: "BEST VALUE",
    icon: Crown,
  },
];

const credits = [
  {
    name: "10 Credits",
    price: "$5",
    blurb: "10 AI rewrites — no expiry.",
    package_id: "credits_10",
  },
  {
    name: "50 Credits",
    price: "$19",
    blurb: "50 AI rewrites — best value pay-as-you-go.",
    package_id: "credits_50",
    save: "Save 24%",
  },
];

export default function Pricing() {

  const onCta = async (action) => {
    if (action.kind === "scroll") {
      document.querySelector(action.href)?.scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "checkout") {
      await startCheckout(action.package_id);
    } else if (action.kind === "mailto") {
      window.location.href = action.href;
    }
  };

  return (
    <section id="pricing" data-testid="pricing-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="flex items-baseline gap-6 mb-6">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Pricing</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">Start free. Scale to unlimited.</span>
        </div>

        {/* Flash sale + flat rate — single compact row */}
        <div className="mb-5 flex flex-wrap items-center gap-px">
          <div className="bg-vermillion text-oat px-4 py-2.5 flex items-center gap-2 flex-1">
            <Flame className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">29% off</span>
          </div>
          <div className="bg-oat border border-ink/15 px-4 py-2.5 flex flex-wrap items-center gap-4">
            {["No credit limits","Flat rate","Unlimited rewrites"].map(label => (
              <span key={label} className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/70">
                <Check className="w-3 h-3 text-vermillion" strokeWidth={2.5} />{label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/15 border border-ink/15">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              data-testid={`pricing-tier-${t.name.toLowerCase()}`}
              className={`p-6 ${t.highlight ? "bg-coal text-oat" : "bg-oat text-ink"} flex flex-col`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[11px] tracking-[0.2em] uppercase ${t.highlight ? "text-vermillion" : "text-ink/50"}`}>
                  Plan No. {String(i + 1).padStart(2, "0")}
                </span>
                {t.highlight && (
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-vermillion text-oat px-2 py-1">Most Picked</span>
                )}
                {t.badge && !t.highlight && (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-ink text-oat px-2 py-1 flex items-center gap-1">
                      {t.icon && <t.icon className="w-3 h-3" strokeWidth={2.5} />}
                      {t.badge}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-4 font-display text-3xl tracking-tight">{t.name}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl md:text-5xl">{t.price}</span>
                <span className={`font-mono text-xs uppercase tracking-[0.15em] ${t.highlight ? "text-oat/60" : "text-ink/50"}`}>{t.period}</span>
              </div>
              <p className={`mt-3 font-body text-sm ${t.highlight ? "text-oat/80" : "text-ink/70"}`}>{t.blurb}</p>

              <ul className="mt-5 space-y-2 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${t.highlight ? "text-vermillion" : "text-ink"}`} strokeWidth={2} />
                    <span className={`text-sm ${t.highlight ? "text-oat/85" : "text-ink/85"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onCta(t.action)}
                data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                className={`mt-6 inline-flex items-center justify-center px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] transition-all hover:-translate-y-0.5 ${
                  t.highlight ? "bg-vermillion text-oat hover:bg-[#ff2a0e]" : "btn-ghost-ink"
                }`}
              >
                {t.cta} →
              </button>
              {t.promoNote && (
                <p className="mt-3 font-mono text-[11px] text-vermillion tracking-[0.12em] uppercase">
                  ✦ {t.promoNote}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] tracking-[0.18em] uppercase text-ink/50 text-center">
          Pro paid monthly · cancel any time · 30-day money-back · billed in USD
        </p>

        {/* Pay-as-you-go credit packs */}
        <div className="mt-8 border-t border-ink/15 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-4 h-4 text-vermillion" strokeWidth={2} />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Credits — pay as you go</span>
            <span className="font-mono text-[10px] text-ink/40 uppercase tracking-wider">· Each credit = one full rewrite · never expire</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/15 border border-ink/15 max-w-3xl">
            {credits.map((c) => (
              <button
                key={c.package_id}
                onClick={() => startCheckout(c.package_id)}
                data-testid={`credits-${c.package_id}`}
                className="group bg-oat hover:bg-coal hover:text-oat transition-colors p-8 md:p-10 text-left flex items-end justify-between gap-6"
              >
                <div>
                  <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50 group-hover:text-oat/60">
                    {c.save || "Pay-as-you-go"}
                  </div>
                  <div className="mt-2 font-display text-4xl md:text-5xl">{c.name}</div>
                  <div className="mt-2 text-ink/65 group-hover:text-oat/80">{c.blurb}</div>
                </div>
                <div className="font-display text-5xl text-vermillion shrink-0">{c.price}</div>
              </button>
            ))}
          </div>

          <p className="mt-6 font-mono text-[11px] tracking-[0.18em] uppercase text-ink/50">
            Need 10+ seats? <a href="mailto:hello@listworks.pro?subject=Brokerage%20Plan" className="text-vermillion underline">Talk to brokerage sales →</a>
          </p>
        </div>
      </div>
    </section>
  );
}

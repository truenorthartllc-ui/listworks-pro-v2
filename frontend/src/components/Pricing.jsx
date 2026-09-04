import { Check, Crown, Zap, Flame } from "lucide-react";
import { startCheckout } from "@/lib/checkout";
import useTranslation from "@/hooks/useTranslation";

const tiers = [
  {
    name: "pricing.free.name",
    price: "$0",
    period: "forever",
    blurb: "pricing.free.desc",
    features: ["Unlimited playground access", "All 5 output formats", "6 tone modes", "Fair Housing scanning", "See results before saving"],
    cta: "pricing.free.cta",
    action: { kind: "scroll", href: "#playground" },
    highlight: false,
  },
  {
    name: "pricing.pro.name",
    price: "$29",
    period: "/ month",
    blurb: "pricing.pro.desc",
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
    cta: "pricing.pro.cta",
    promoNote: null,
    action: { kind: "checkout", package_id: "pro_month" },
    highlight: true,
  },
  {
    name: "pricing.lifetime.name",
    price: "$299",
    period: "once",
    blurb: "pricing.lifetime.desc",
    features: [
      "Everything in Pro",
      "Forever access (no monthly)",
      "All future features included",
      "Priority support",
      "Founding member badge",
      "AI Video Walkthroughs",
      "Priority video generation",
    ],
    cta: "pricing.lifetime.cta",
    action: { kind: "checkout", package_id: "lifetime" },
    highlight: false,
    badge: "pricing.lifetime.tag",
    icon: Crown,
  },
];

const credits = [
  {
    name: "pricing.credits.10.qty",
    price: "$5",
    blurb: "pricing.credits.10.desc",
    package_id: "credits_10",
  },
  {
    name: "pricing.credits.50.qty",
    price: "$19",
    blurb: "pricing.credits.50.desc",
    package_id: "credits_50",
    save: "Save 24%",
  },
];

export default function Pricing() {

  const { t } = useTranslation();

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
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">{t("pricing.sectionLabel")}</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">{t("pricing.headline")}</span>
        </div>

        {/* Flat rate messaging row */}
        <div className="mb-5 flex flex-wrap items-center gap-px">
          <div className="bg-coal text-oat px-4 py-2.5 flex items-center gap-2 flex-1">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">{t("pricing.flatRate")}</span>
          </div>
          <div className="bg-oat border border-ink/15 px-4 py-2.5 flex flex-wrap items-center gap-4">
            {[t("pricing.noLimits"), t("pricing.flatRate"), t("pricing.unlimited")].map(label => (
              <span key={label} className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/70">
                <Check className="w-3 h-3 text-vermillion" strokeWidth={2.5} />{label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/15 border border-ink/15">
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              data-testid={`pricing-tier-${t(tier.name).toLowerCase()}`}
              className={`p-6 ${tier.highlight ? "bg-coal text-oat" : "bg-oat text-ink"} flex flex-col`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[11px] tracking-[0.2em] uppercase ${tier.highlight ? "text-vermillion" : "text-ink/50"}`}>
                  Plan No. {String(i + 1).padStart(2, "0")}
                </span>
                {tier.highlight && (
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-vermillion text-oat px-2 py-1">{t("pricing.pro.tag")}</span>
                )}
                {tier.badge && !tier.highlight && (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-ink text-oat px-2 py-1 flex items-center gap-1">
                      {tier.icon && <tier.icon className="w-3 h-3" strokeWidth={2.5} />}
                      {t(tier.badge)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-4 font-display text-3xl tracking-tight">{t(tier.name)}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl md:text-5xl">{tier.price}</span>
                <span className={`font-mono text-xs uppercase tracking-[0.15em] ${tier.highlight ? "text-oat/60" : "text-ink/50"}`}>{tier.period}</span>
              </div>
              <p className={`mt-3 font-body text-sm ${tier.highlight ? "text-oat/80" : "text-ink/70"}`}>{t(tier.blurb)}</p>

              <ul className="mt-5 space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tier.highlight ? "text-vermillion" : "text-ink"}`} strokeWidth={2} />
                    <span className={`text-sm ${tier.highlight ? "text-oat/85" : "text-ink/85"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onCta(tier.action)}
                data-testid={`pricing-cta-${t(tier.name).toLowerCase()}`}
                className={`mt-6 inline-flex items-center justify-center px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] transition-all hover:-translate-y-0.5 ${
                  tier.highlight ? "bg-vermillion text-oat hover:bg-[#ff2a0e]" : "btn-ghost-ink"
                }`}
              >
                {t(tier.cta)} →
              </button>
              {tier.promoNote && (
                <p className="mt-3 font-mono text-[11px] text-vermillion tracking-[0.12em] uppercase">
                  ✦ {tier.promoNote}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] tracking-[0.18em] uppercase text-ink/50 text-center">
          Pro paid monthly · {t("common.cancelAnytime")} · {t("common.moneyBack30")} · {t("common.billedUSD")}
        </p>

        {/* Pay-as-you-go credit packs */}
        <div className="mt-8 border-t border-ink/15 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-4 h-4 text-vermillion" strokeWidth={2} />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">{t("pricing.credits.label")}</span>
            <span className="font-mono text-[10px] text-ink/40 uppercase tracking-wider">{t("pricing.credits.note")}</span>
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
                  <div className="mt-2 font-display text-4xl md:text-5xl">{t(c.name)}</div>
                  <div className="mt-2 text-ink/65 group-hover:text-oat/80">{t(c.blurb)}</div>
                </div>
                <div className="font-display text-5xl text-vermillion shrink-0">{c.price}</div>
              </button>
            ))}
          </div>

          <p className="mt-6 font-mono text-[11px] tracking-[0.18em] uppercase text-ink/50">
            {t("pricing.brokerage")}
          </p>
        </div>
      </div>
    </section>
  );
}
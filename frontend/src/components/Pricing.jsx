import { useState, useEffect } from "react";
import { Check, Crown, Zap, Flame } from "lucide-react";
import { startCheckout } from "@/lib/checkout";

const PROMO_ENDS = new Date("2026-06-25T23:59:59");

function PromoCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = PROMO_ENDS - Date.now();
      if (diff <= 0) { setTimeLeft(""); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return timeLeft ? <span className="font-mono text-vermillion font-bold">{timeLeft}</span> : null;
}


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
    blurb: "Listing copy AND your agent brand — everything in one plan.",
    features: [
      "Unlimited listing rewrites",
      "Agent Bio Generator (3 formats)",
      "1-click LinkedIn + Instagram share",
      "Local Gems neighborhood data",
      "Spanish + Chinese output",
      "6 tone modes incl. Minimalist",
      "Watermark-free videos",
      "AI Advisor priority access",
      "Listing history (forever)",
    ],
    cta: "Get List + Bio — $29/mo",
    promoNote: "Use COMEBACK29 → first month $20.59",
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

        {/* Flash sale promo banner */}
        <div className="mb-8 bg-vermillion text-oat px-6 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-4 h-4 flex-shrink-0" />
            <span className="font-heading text-sm uppercase tracking-[0.15em]">Flash Sale — 29% off your first month.</span>
            <span className="font-mono text-sm">Use code <strong>COMEBACK29</strong> at checkout.</span>
          </div>
          <div className="font-mono text-xs uppercase tracking-wider opacity-80 flex items-center gap-2">
            Ends Jun 25 — <PromoCountdown />
          </div>
        </div>

        {/* Social proof bar */}
        <div className="mb-10 flex flex-wrap items-center gap-6 font-mono text-[11px] tracking-[0.15em] uppercase text-ink/50">
          <span>★ 4.9 / 5 agent rating</span>
          <span>·</span>
          <span>850+ agents trust us</span>
          <span>·</span>
          <span>24,000+ listings rewritten</span>
          <span>·</span>
          <span className="text-vermillion">Join 850+ agents using it weekly</span>
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
                {t.badge && !t.highlight && (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-ink text-oat px-2 py-1 flex items-center gap-1">
                      {t.icon && <t.icon className="w-3 h-3" strokeWidth={2.5} />}
                      {t.badge}
                    </span>
                  </div>
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

              <button
                onClick={() => onCta(t.action)}
                data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                className={`mt-9 inline-flex items-center justify-center px-6 py-4 font-heading text-sm uppercase tracking-[0.15em] transition-all hover:-translate-y-1 ${
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
        <div className="mt-20 md:mt-24">
          <div className="flex items-baseline gap-3 mb-8">
            <Zap className="w-5 h-5 text-vermillion" strokeWidth={2} />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Credits — pay as you go</span>
          </div>
          <h3 className="font-display text-3xl md:text-5xl tracking-tight leading-[1.05] mb-3 max-w-2xl">
            <span className="font-light">Just need a few?</span>{" "}
            <span className="italic">Buy credits, no subscription.</span>
          </h3>
          <p className="font-body text-ink/65 max-w-xl mb-10">
            Each credit = one full AI rewrite (MLS + IG + FB + 5 headlines + email). Credits never expire.
          </p>

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

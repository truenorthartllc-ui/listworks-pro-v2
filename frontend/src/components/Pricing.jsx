import { useState, useEffect } from "react";
import { Check, Flame, Zap } from "lucide-react";
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
    blurb: "Full playground. 5 formats. 6 tones. 3 rewrites.",
    features: ["Full playground access", "5 output formats", "6 tone modes"],
    cta: "Start Free",
    action: { kind: "scroll", href: "#playground" },
    highlight: false,
  },
  {
    name: "List + Bio",
    price: "$29",
    period: "/mo",
    blurb: "Unlimited rewrites. 31 social templates. Fair Housing scanner. CO Act PDF.",
    features: ["Unlimited rewrites", "31 social templates", "Fair Housing scanner", "CO Act compliance PDF"],
    cta: "Get Pro — $29",
    promoNote: "Use COMEBACK29 → $20.59",
    action: { kind: "checkout", package_id: "pro_month" },
    highlight: true,
  },
];

export default function Pricing() {
  const onCta = async (action) => {
    if (action.kind === "scroll") { document.querySelector(action.href)?.scrollIntoView({ behavior: "smooth" }); }
    else if (action.kind === "checkout") { await startCheckout(action.package_id); }
    else if (action.kind === "mailto") { window.location.href = action.href; }
  };

  return (
    <section id="pricing" data-testid="pricing-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-vermillion">/ Pricing</span>
          <div className="bg-vermillion text-oat px-3 py-1 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3" /> Flash: 29% off — COMEBACK29
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/15 border border-ink/15">
          {tiers.map((t, i) => (
            <div key={t.name} data-testid={`pricing-tier-${t.name.toLowerCase()}`} className={`p-4 md:p-5 ${t.highlight ? "bg-coal text-oat" : "bg-oat text-ink"} flex flex-col`}>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${t.highlight ? "text-vermillion" : "text-ink/40"}`}>No. {String(i + 1).padStart(2, "0")}</span>
                {t.highlight && <span className="font-mono text-[9px] uppercase bg-vermillion text-oat px-2 py-0.5">Most Picked</span>}
              </div>
              <h3 className="mt-2 font-display text-2xl tracking-tight">{t.name}</h3>
              <div className="mt-1 flex items-baseline gap-1"><span className="font-display text-2xl md:text-3xl">{t.price}</span><span className={`font-mono text-[9px] uppercase ${t.highlight ? "text-oat/50" : "text-ink/40"}`}>{t.period}</span></div>
              <p className={`mt-2 font-body text-[11px] ${t.highlight ? "text-oat/60" : "text-ink/50"}`}>{t.blurb}</p>
              <ul className="mt-3 space-y-1 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className={`w-3 h-3 ${t.highlight ? "text-vermillion" : "text-ink"}`} strokeWidth={2} />
                    <span className={`text-[11px] ${t.highlight ? "text-oat/80" : "text-ink/70"}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => onCta(t.action)} data-testid={`pricing-cta-${t.name.toLowerCase()}`} className={`mt-3 inline-flex items-center justify-center px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.15em] transition-all ${t.highlight ? "bg-vermillion text-oat hover:bg-[#ff2a0e]" : "border border-ink/20 hover:-translate-y-1"}`}>
                {t.cta} →
              </button>
              {t.promoNote && <p className="mt-1 font-mono text-[9px] text-vermillion tracking-[0.12em] uppercase">✦ {t.promoNote}</p>}
            </div>
          ))}
        </div>
        <div className="mt-2 text-center">
          <a href="mailto:hello@listworks.pro?subject=Brokerage%20Plan" className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 underline">Lifetime $299 — one time, forever →</a>
        </div>
        <p className="mt-2 font-mono text-[9px] tracking-[0.18em] uppercase text-ink/40 text-center">Pro paid monthly · cancel any time · 30-day money-back</p>
      </div>
    </section>
  );
}

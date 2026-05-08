import { Crown, Zap, X, Check } from "lucide-react";
import { startCheckout } from "@/lib/checkout";

/**
 * PaywallModal — fired when the /api/rewrite endpoint returns a 402 paywall response.
 * Shows the user clean upgrade options: $5 for 10 credits, $49/mo Pro, or $299 lifetime.
 */
export default function PaywallModal({ open, onClose, freeUsed = 3 }) {
  if (!open) return null;

  const options = [
    {
      pkg: "credits_10",
      title: "10 Credits",
      price: "$5",
      sub: "Just enough for your next listing",
      icon: Zap,
      cta: "Buy 10 Credits",
      featured: false,
    },
    {
      pkg: "pro_month",
      title: "Pro — Unlimited",
      price: "$49",
      sub: "/ month · cancel anytime",
      icon: Check,
      cta: "Go Pro",
      featured: true,
      highlights: ["Unlimited rewrites", "Watermark-free reels", "AI Advisor priority"],
    },
    {
      pkg: "lifetime",
      title: "Lifetime",
      price: "$299",
      sub: "once · never pay again",
      icon: Crown,
      cta: "Lock In Lifetime",
      featured: false,
      highlights: ["Founding member"],
    },
  ];

  return (
    <div
      data-testid="paywall-modal"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-oat text-ink border border-ink/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          data-testid="paywall-close"
          aria-label="Close paywall"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center hover:bg-ink/10 transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="p-8 md:p-12">
          <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-3">
            / Free Trial Used Up
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-[1.05] mb-3">
            <span className="font-light">You used your</span>{" "}
            <span className="italic">{freeUsed} free rewrites.</span>
          </h2>
          <p className="font-body text-ink/65 mb-8 max-w-lg">
            Pick an option below to keep generating. Or close this and come back tomorrow — no pressure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/15 border border-ink/15">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.pkg}
                  data-testid={`paywall-option-${opt.pkg}`}
                  className={`p-6 md:p-7 flex flex-col ${opt.featured ? "bg-coal text-oat" : "bg-oat text-ink"}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-5 h-5 ${opt.featured ? "text-vermillion" : "text-ink/60"}`} strokeWidth={2} />
                    {opt.featured && (
                      <span className="font-mono text-[9px] tracking-[0.2em] uppercase bg-vermillion text-oat px-1.5 py-0.5">
                        Best
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl mb-1">{opt.title}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display text-4xl">{opt.price}</span>
                  </div>
                  <div className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-4 ${opt.featured ? "text-oat/60" : "text-ink/50"}`}>
                    {opt.sub}
                  </div>
                  {opt.highlights && (
                    <ul className="text-sm space-y-1.5 mb-5 flex-1">
                      {opt.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2">
                          <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${opt.featured ? "text-vermillion" : "text-ink/60"}`} strokeWidth={2.5} />
                          <span className={opt.featured ? "text-oat/85" : "text-ink/70"}>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => startCheckout(opt.pkg)}
                    data-testid={`paywall-cta-${opt.pkg}`}
                    className={`mt-auto w-full px-5 py-3 font-heading text-xs uppercase tracking-[0.18em] transition-all hover:-translate-y-0.5 ${
                      opt.featured ? "bg-vermillion text-oat hover:bg-[#ff2a0e]" : "bg-ink text-oat hover:bg-vermillion"
                    }`}
                  >
                    {opt.cta} →
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-6 font-mono text-[10px] tracking-[0.2em] uppercase text-ink/45 text-center">
            30-day money-back · Stripe-secure · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

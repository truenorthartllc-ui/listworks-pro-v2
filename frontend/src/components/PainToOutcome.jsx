import { Clock, AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import useTranslation from "@/hooks/useTranslation";

export default function PainToOutcome() {
  const { t } = useTranslation();
  const items = t("painToOutcome.items");
  return (
    <section className="border-b border-ink/15 bg-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="flex items-baseline gap-6 mb-10">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">{t("painToOutcome.sectionLabel")}</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">{t("painToOutcome.headline")}</span>
        </div>
        <div className="grid grid-cols-12 gap-px bg-ink/15">
          <div className="col-span-12 md:col-span-6 bg-oat p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
              </div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-red-600">{t("painToOutcome.painLabel")}</span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl tracking-tight text-ink mb-4">{t("painToOutcome.painTitle")}</h3>
            <ul className="space-y-3">
              {items.filter((_, i) => i < 3).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-red-400 mt-0.5">0{i + 1}</span>
                  <span className="font-body text-sm text-ink/70 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-12 md:col-span-6 bg-oat p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" strokeWidth={1.5} />
              </div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-green-600">{t("painToOutcome.outcomeLabel")}</span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl tracking-tight text-ink mb-4">{t("painToOutcome.outcomeTitle")}</h3>
            <ul className="space-y-3">
              {items.filter((_, i) => i >= 3).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-green-400 mt-0.5">0{i + 4}</span>
                  <span className="font-body text-sm text-ink/70 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
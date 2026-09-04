import { Wand2, ScanLine, Mic, Zap, Layers, ShieldCheck, Box, LayoutGrid, CalendarDays, BarChart3, Clock, Link } from "lucide-react";
import useTranslation from "@/hooks/useTranslation";

const icons = [Wand2, ScanLine, Mic, LayoutGrid, Link, CalendarDays, BarChart3, Clock, ShieldCheck, Zap, Layers, Box];

export default function Features() {
  const { t } = useTranslation();
  const features = t("features.items").map((item, i) => ({ icon: icons[i], title: item.title, body: item.body }));
  return (
    <section data-testid="features-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">{t("features.sectionLabel")}</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              <span className="font-light">{t("features.headline")}</span><br />
              <span className="italic">{t("features.headline2")}</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-px bg-ink/15 border border-ink/15">
          {features.map((f, i) => {
            const Icon = f.icon;
            const span =
              i === 0 ? "col-span-12 md:col-span-6 lg:col-span-5" :
              i === 1 ? "col-span-12 md:col-span-6 lg:col-span-4" :
              i === 2 ? "col-span-12 md:col-span-12 lg:col-span-3" :
              "col-span-12 md:col-span-6 lg:col-span-4";
            return (
              <div key={f.title} data-testid={`feature-${i}`} className={`${span} bg-oat p-7 md:p-9 hover-rise`}>
                <Icon className="w-6 h-6 text-vermillion mb-6" strokeWidth={1.5} />
                <h3 className="font-display text-2xl md:text-3xl tracking-tight leading-tight mb-3">{f.title}</h3>
                <p className="font-body text-ink/70 leading-relaxed">{f.body}</p>
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 block mt-6">No. {String(i + 1).padStart(2, "0")}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

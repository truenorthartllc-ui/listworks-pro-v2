import { useState, useEffect } from "react";
import { ArrowUpRight, X, FileText, Loader2, Lock } from "lucide-react";
import { startCheckout } from "@/lib/checkout";
import useTranslation from "@/hooks/useTranslation";

export default function GuideUpsell() {
  const { t } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const buyGuide = async () => {
    setBuying(true);
    await startCheckout("guide_pdf");
    setBuying(false);
  };

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && setPreviewOpen(false);
    if (previewOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handler);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [previewOpen]);

  return (
    <section id="guide" data-testid="guide-section" className="bg-coal text-oat border-b border-ink/15 relative overflow-hidden">
      <div className="blueprint-bg absolute inset-0 opacity-[0.07] pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16 grid grid-cols-12 gap-6 relative">
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-baseline gap-6 mb-4">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">{t("guide.sectionLabel")}</span>
            <div className="flex-1 h-px bg-oat/10" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter leading-[0.95]">
            {t("guide.heading")}
          </h2>
          <p className="mt-4 font-body text-sm text-oat/70 leading-relaxed max-w-xl">
             {t("guide.desc")}
          </p>

          <ul className="mt-5 space-y-2 font-body text-sm text-oat/80 max-w-xl">
            {t("guide.features").map((f, i) => (
              <li key={i} className="flex items-start gap-3"><span className="font-mono text-vermillion shrink-0">✦</span>{f}</li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              data-testid="guide-buy-btn"
              onClick={buyGuide}
              disabled={buying}
              className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {buying ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t("guide.loading")}</>) : (<>{t("guide.buy")} <ArrowUpRight className="w-4 h-4" /></>)}
            </button>
            <button
              data-testid="guide-preview-btn"
              onClick={() => setPreviewOpen(true)}
              className="px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] border border-oat/40 text-oat hover:bg-oat hover:text-coal transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> {t("guide.preview")}
            </button>
          </div>

          <p className="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-oat/40">
            {t("guide.guarantee")}
          </p>
        </div>

        <aside className="col-span-12 lg:col-span-5 lg:pl-10 lg:border-l lg:border-oat/15">
          <div className="border border-oat/25 p-5 bg-coal/60">
            <div className="flex items-center justify-between mb-4 font-mono text-[10px] tracking-[0.25em] uppercase text-oat/40">
              <span>{t("guide.docRef")}</span>
              <span>{t("guide.rev")}</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                ["45", t("guide.stats").pages],
                ["15", t("guide.stats").prompts],
                ["6", t("guide.stats").rewrites],
                ["$20", t("guide.stats").price],
              ].map(([n, l], i) => (
                <div key={i}>
                  <div className={`font-display text-2xl ${n === "$20" ? "text-vermillion" : ""}`}>{n}</div>
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-oat/40 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {previewOpen && (
        <div
          data-testid="guide-preview-modal"
          className="fixed inset-0 z-[100] bg-coal/95 backdrop-blur-sm flex flex-col animate-rise"
          onClick={(e) => e.target === e.currentTarget && setPreviewOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-oat/20 bg-coal shrink-0">
            <div className="flex items-baseline gap-3">
              <span className="font-display italic text-2xl text-oat">{t("guide.modalTitle")}</span>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">{t("guide.modalPreview")}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                data-testid="modal-buy-btn"
                onClick={buyGuide}
                disabled={buying}
                className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-5 py-2.5 font-heading text-[12px] uppercase tracking-[0.15em] flex items-center gap-2 transition"
              >
                {buying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ArrowUpRight className="w-3.5 h-3.5" /> {t("guide.modalBuy")}</>}
              </button>
              <button
                data-testid="close-preview-btn"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
                className="w-10 h-10 border border-oat/30 text-oat hover:bg-oat hover:text-coal transition flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF teaser — locked to top portion, no interaction */}
          <div className="relative flex-1 bg-[#2a2a2a] overflow-hidden">
            <iframe
              data-testid="guide-pdf-iframe"
              src="/assets/listworks-guide.pdf#toolbar=0&navpanes=0&scrollbar=0&page=2&view=FitH"
              title="ListWorks Guide Preview"
              className="w-full h-full"
              style={{ pointerEvents: "none" }}
            />

            {/* Gradient fade — bottom 20% (shows the goods) */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{ height: "20%", background: "linear-gradient(to bottom, transparent 0%, #1a1a1a 40%, #1a1a1a 100%)" }}
            />

            {/* Paywall block — compact */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-8 px-6 text-center">
              <div className="flex items-center justify-center w-10 h-10 border border-oat/30 mb-3">
                <Lock className="w-4 h-4 text-oat/60" />
              </div>
              <p className="font-display italic text-xl md:text-2xl text-oat mb-1">{t("guide.moreInside")}</p>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-oat/50 mb-4">
                {t("guide.modalDesc")}
              </p>
              <button
                onClick={buyGuide}
                disabled={buying}
                className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-60"
              >
                {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowUpRight className="w-4 h-4" /> {t("guide.modalBuy")}</>}
              </button>
              <p className="mt-3 font-mono text-[9px] tracking-[0.18em] uppercase text-oat/40">{t("guide.modalGuarantee")}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

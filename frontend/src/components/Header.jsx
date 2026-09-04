import { useState, useEffect } from "react";
import GoogleSignIn from "@/components/GoogleSignIn";
import useTranslation from "@/hooks/useTranslation";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { t, isSpanish, setLang } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-header"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-2xl bg-oat/80 border-b border-ink/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <a href="#top" data-testid="logo-link" className="flex items-baseline gap-2">
          <span className="font-display italic text-2xl md:text-3xl font-medium tracking-tight text-ink">
            ListWorks
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-vermillion uppercase">
            /pro
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-9 font-heading text-[13px] uppercase tracking-[0.12em]">
          <a href="#playground" data-testid="nav-playground" className="hover:text-vermillion transition">{t("header.navTool")}</a>
          <a href="#examples" data-testid="nav-examples" className="hover:text-vermillion transition">{t("header.navExamples")}</a>
          <a href="/co-compliance" className="hover:text-vermillion transition">{t("header.navFairHousing")}</a>
          <a href="/listing-presentation.html" data-testid="nav-presentation" className="hover:text-vermillion transition">{t("header.navPresentation")}</a>
          <a href="/blog" className="hover:text-vermillion transition">{t("header.navBlog")}</a>
          <a href="#pricing" data-testid="nav-pricing" className="hover:text-vermillion transition">{t("header.navPricing")}</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={setLang}
            className={`font-heading text-[11px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded transition ${
              isSpanish
                ? "bg-vermillion text-oat"
                : "border border-ink/20 text-ink/60 hover:border-vermillion"
            }`}
            title={t("header.toggleLang", "Toggle language")}
          >
            {isSpanish ? t("header.enToggle") : t("header.esToggle")}
          </button>
          <GoogleSignIn />
          <a
            data-testid="header-cta-btn"
            href="#playground"
            className="btn-vermillion px-5 py-2.5 font-heading text-[13px] uppercase tracking-[0.12em]"
          >
            {t("header.tryFree")}
          </a>
        </div>
      </div>
    </header>
  );
}
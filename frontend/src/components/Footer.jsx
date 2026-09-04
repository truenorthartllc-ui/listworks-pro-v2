import { Link } from "react-router-dom";
import useTranslation from "@/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer data-testid="site-footer" className="bg-coal text-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-12 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display italic text-3xl font-medium tracking-tight">ListWorks</span>
            <span className="font-mono text-[10px] tracking-[0.2em] text-vermillion uppercase">/pro</span>
          </div>
          <p className="mt-3 font-display italic text-xl leading-snug max-w-md">
            {t("footer.tagline").replace("rewritten.", "")}
            <span className="text-vermillion">rewritten.</span>
          </p>
          <p className="mt-3 font-body text-sm text-oat/65 max-w-md">
            {t("footer.desc")}
          </p>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">{t("footer.product")}</div>
          <ul className="space-y-2 font-body text-sm text-oat/85">
            <li><a href="#playground" className="hover:text-vermillion transition">{t("header.navTool")}</a></li>
            <li><a href="#examples" className="hover:text-vermillion transition">{t("header.navExamples")}</a></li>
            <li><a href="/blog" className="hover:text-vermillion transition">{t("header.navBlog")}</a></li>
            <li><a href="/free-tools" className="hover:text-vermillion transition">Free Tools</a></li>
            <li><a href="/market-stats" className="hover:text-vermillion transition">Market Stats</a></li>
            <li><a href="/compare" className="hover:text-vermillion transition">Compare</a></li>
            <li><a href="#pricing" className="hover:text-vermillion transition">{t("header.navPricing")}</a></li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">{t("footer.compliance")}</div>
          <ul className="space-y-2 font-body text-sm text-oat/85">
            <li><Link to="/fair-housing-compliance" className="hover:text-vermillion transition">Fair Housing Guide</Link></li>
            <li><Link to="/compliance" className="hover:text-vermillion transition">50 State Guides</Link></li>
            <li><Link to="/co-compliance" className="hover:text-vermillion transition">CO AI Disclosure</Link></li>
            <li><Link to="/listing-analyzer" className="hover:text-vermillion transition">Listing Analyzer</Link></li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">{t("footer.earn")}</div>
          <ul className="space-y-2 font-body text-sm text-oat/85">
            <li><Link to="/affiliate/signup" className="hover:text-vermillion transition">Become an Affiliate</Link></li>
            <li><Link to="/affiliate/demo" className="hover:text-vermillion transition">Affiliate Dashboard</Link></li>
            <li><a href="mailto:hello@listworks.pro" className="hover:text-vermillion transition">Contact</a></li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">{t("footer.company")}</div>
          <ul className="space-y-2 font-body text-sm text-oat/85">
            <li><Link to="/privacy" className="hover:text-vermillion transition">Privacy</Link></li>
            <li><a href="#" className="hover:text-vermillion transition">Terms</a></li>
          </ul>
        </div>

        <div className="col-span-12 md:col-span-3">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">{t("footer.newsletter")}</div>
          <p className="font-body text-oat/75 mb-4">{t("footer.newsletterDesc")}</p>
          <form
            data-testid="footer-newsletter"
            onSubmit={(e) => e.preventDefault()}
            className="flex border border-oat/30"
          >
            <input
              type="email"
              placeholder={t("footer.newsletterPlaceholder")}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm placeholder:text-oat/40"
            />
            <button className="px-4 bg-vermillion text-oat font-mono text-xs uppercase tracking-[0.15em]">→</button>
          </form>
        </div>

        <div className="col-span-12 mt-6 pt-5 border-t border-oat/15 flex flex-wrap justify-between items-center gap-4 font-mono text-[10px] tracking-[0.2em] uppercase text-oat/45">
          <span>{t("footer.copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
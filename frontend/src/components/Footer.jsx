import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer data-testid="site-footer" className="bg-coal text-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 grid grid-cols-12 gap-10">
        <div className="col-span-12 md:col-span-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display italic text-3xl font-medium tracking-tight">ListWorks</span>
            <span className="font-mono text-[10px] tracking-[0.2em] text-vermillion uppercase">/pro</span>
          </div>
          <p className="mt-5 font-display italic text-2xl md:text-3xl leading-[1.15] max-w-md">
            Real estate copy, <span className="text-vermillion">rewritten.</span>
          </p>
          <p className="mt-6 font-body text-oat/65 max-w-md">
            Built for agents who'd rather sell homes than stare at MLS forms. Try the tool free. Read the guide once. Use it forever.
          </p>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">Product</div>
          <ul className="space-y-3 font-body text-oat/85">
            <li><a href="#playground" className="hover:text-vermillion transition">The Tool</a></li>
            <li><a href="#examples" className="hover:text-vermillion transition">Examples</a></li>
            <li><a href="/blog" className="hover:text-vermillion transition">Blog</a></li>
            <li><a href="/compare" className="hover:text-vermillion transition">Compare</a></li>
            <li><a href="#pricing" className="hover:text-vermillion transition">Pricing</a></li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">Earn</div>
          <ul className="space-y-3 font-body text-oat/85">
            <li><Link to="/affiliate/signup" className="hover:text-vermillion transition">Become an Affiliate</Link></li>
            <li><Link to="/affiliate/demo" className="hover:text-vermillion transition">Affiliate Dashboard</Link></li>
            <li><a href="mailto:hello@listworks.pro" className="hover:text-vermillion transition">Contact</a></li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">Company</div>
          <ul className="space-y-3 font-body text-oat/85">
            <li><a href="#" className="hover:text-vermillion transition">Privacy</a></li>
            <li><a href="#" className="hover:text-vermillion transition">Terms</a></li>
          </ul>
        </div>

        <div className="col-span-12 md:col-span-3">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/50 mb-5">Newsletter</div>
          <p className="font-body text-oat/75 mb-4">One letter / month. The framework, refined. No spam.</p>
          <form
            data-testid="footer-newsletter"
            onSubmit={(e) => e.preventDefault()}
            className="flex border border-oat/30"
          >
            <input
              type="email"
              placeholder="agent@brokerage.com"
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm placeholder:text-oat/40"
            />
            <button className="px-4 bg-vermillion text-oat font-mono text-xs uppercase tracking-[0.15em]">→</button>
          </form>
        </div>

        <div className="col-span-12 mt-10 pt-8 border-t border-oat/15 flex flex-wrap justify-between items-center gap-4 font-mono text-[10px] tracking-[0.2em] uppercase text-oat/45">
          <span>© 2026 ListWorks PRO · Made for agents</span>
          <span>Made for agents who close deals</span>
        </div>
      </div>
    </footer>
  );
}

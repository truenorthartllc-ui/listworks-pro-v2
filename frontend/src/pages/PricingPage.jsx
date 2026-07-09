import { useEffect } from "react";
import Header from "@/components/Header";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";

export default function PricingPage() {
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, []);

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <Header />

      <section className="border-b border-ink/15 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
          <div className="max-w-2xl">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Pricing</span>
            <h1 className="mt-3 font-display text-5xl md:text-6xl tracking-tight leading-[1.05]">
              <span className="font-light">Start free.</span><br />
              <span className="italic font-medium">Scale when ready.</span>
            </h1>
            <p className="mt-4 font-body text-lg text-ink/70 leading-relaxed">
              Try 3 listings free. No credit card. No gotchas. Upgrade to unlimited when you're ready — $29/mo flat rate.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="border border-ink/10 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-vermillion" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-heading text-xs uppercase tracking-[0.15em]">Fair Housing Scan</span>
              </div>
              <p className="font-body text-sm text-ink/60">Every listing checked for violations before you publish.</p>
            </div>

            <div className="border border-ink/10 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-vermillion" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-heading text-xs uppercase tracking-[0.15em]">10-Second Rewrites</span>
              </div>
              <p className="font-body text-sm text-ink/60">Paste raw notes → get MLS copy, captions, headlines instantly.</p>
            </div>

            <div className="border border-ink/10 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-vermillion" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-heading text-xs uppercase tracking-[0.15em]">Flat Rate</span>
              </div>
              <p className="font-body text-sm text-ink/60">No credit anxiety. Unlimited rewrites for one price.</p>
            </div>
          </div>
        </div>
      </section>

      <Pricing />

      <Testimonials />

      <FAQ />

      <section className="border-t border-ink/15 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 text-center">
          <h2 className="font-display text-3xl md:text-4xl tracking-tight italic mb-4">
            Still deciding?
          </h2>
          <p className="font-body text-ink/60 mb-6 max-w-xl mx-auto">
            Try 3 listings free. See the difference yourself. No credit card required.
          </p>
          <a href="/#playground" className="btn-vermillion inline-block px-8 py-3.5 font-heading text-xs uppercase tracking-[0.15em]">
            Start Free Trial →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

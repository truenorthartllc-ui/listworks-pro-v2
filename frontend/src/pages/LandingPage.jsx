import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AIVideoShowcase from "@/components/AIVideoShowcase";
import Playground from "@/components/Playground";
import Marquee from "@/components/Marquee";
import BeforeAfter from "@/components/BeforeAfter";
import Features from "@/components/Features";
import GuideUpsell from "@/components/GuideUpsell";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import FloatingAdvisorButton from "@/components/FloatingAdvisorButton";
import ViralNotifications from "@/components/ViralNotifications";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <ViralNotifications />
      <Header />
      <main>
        <Hero />
        <AIVideoShowcase />
        <Marquee />
        <Playground />
        <BeforeAfter />
        <Features />
        <section className="bg-ink text-oat px-6 md:px-10 py-20">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-oat/40" />
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-oat/50">Fair Housing</span>
            </div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-6">
                <div className="inline-flex items-baseline gap-3 mb-6 border border-vermillion/40 px-5 py-3">
                  <span className="font-display text-3xl md:text-4xl text-vermillion font-bold">$26,262</span>
                  <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-oat/60">minimum HUD fine · first violation · 2025</span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">
                  Every word scanned.
                  <br />
                  <span className="text-vermillion">Every listing protected.</span>
                </h2>
                <p className="font-body text-base md:text-lg text-oat/70 mt-6 max-w-lg leading-relaxed">
                  ChatGPT will write "perfect for families" or "walk to church" — both Fair Housing violations.
                  ListWorks screens every word before it leaves your screen. Not a checkbox. A guarantee.
                </p>
                <div className="mt-8 flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-oat/50">
                  <span>● FHA guidelines</span>
                  <span>● Real-time scan</span>
                  <span>● Auto-fix suggestions</span>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 lg:col-start-8 flex items-center">
                <div className="border border-oat/15 p-8 w-full">
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-green-400 mb-2">Protected</div>
                  <p className="font-display italic text-xl md:text-2xl text-oat/90 leading-relaxed">
                    "Family-friendly neighborhood near top-rated schools"   <span className="text-green-400">✓</span>
                  </p>
                  <div className="mt-4 pt-4 border-t border-oat/10">
                    <p className="font-display italic text-xl md:text-2xl text-ink/40 line-through leading-relaxed">
                      "Perfect for young couples starting a family"
                    </p>
                    <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-red-400 mt-2">Flagged — family status discrimination</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <GuideUpsell />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <FloatingAdvisorButton />
    </div>
  );
}

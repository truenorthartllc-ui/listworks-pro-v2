import Header from "@/components/Header";
import ComplianceHero from "@/components/ComplianceHero";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import AIVideoShowcase from "@/components/AIVideoShowcase";
import Playground from "@/components/Playground";
import Marquee from "@/components/Marquee";
import BeforeAfter from "@/components/BeforeAfter";
import NeighborhoodInsights from "@/components/NeighborhoodInsights";
import Features from "@/components/Features";
import GuideUpsell from "@/components/GuideUpsell";
import QRFeatures from "@/components/QRFeatures";
import ContentEngineFeatures from "@/components/ContentEngineFeatures";
import ContractsShowcase from "@/components/ContractsShowcase";
import DashboardPreview from "@/components/DashboardPreview";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import FloatingAdvisorButton from "@/components/FloatingAdvisorButton";
import ViralNotifications from "@/components/ViralNotifications";
import ExitIntentPopup from "@/components/ExitIntentPopup";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <ExitIntentPopup />
      <ViralNotifications />
      <Header />
      <main>
        <ComplianceHero />
        <Hero />
        <TrustBar />
        <AIVideoShowcase />
        <Marquee />
        <Playground />
        <BeforeAfter />
        <NeighborhoodInsights />
         <GuideUpsell />
         <Features />
         <QRFeatures />
         <ContentEngineFeatures />
         <ContractsShowcase />
         <DashboardPreview />
         <section className="bg-ink text-oat px-6 md:px-10 py-20">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-oat/40" />
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-oat/50">Fair Housing</span>
            </div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-7">
                <h3 className="font-display text-3xl md:text-5xl italic leading-[1.05]">
                  Fair Housing wasn't designed for AI.
                </h3>
                <p className="font-body text-lg md:text-xl text-oat/70 mt-6 leading-relaxed">
                  But the $26,000 HUD fine for a single violation applies to whatever wrote the copy.
                  ChatGPT doesn't scan for FHA red flags. ListWorks PRO does — every rewrite, before it reaches your MLS.
                </p>
              </div>
              <aside className="col-span-12 lg:col-span-5 lg:pl-10 lg:border-l lg:border-oat/15">
                <div className="border border-oat/25 p-8">
                  <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion mb-3">Real example</div>
                  <p className="font-body text-oat/90 leading-relaxed text-sm">
                    <span className="line-through text-oat/40">"Perfect for families with kids and pets"</span><br />
                    <span className="text-green-400 mt-2 inline-block">✓ Refreshing natural light across an open floor plan designed for everyday living.</span>
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-oat/40 mt-4">
                    Same home. Same value. No violation.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <FloatingAdvisorButton />
    </div>
  );
}

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
        {/* Video Hero — ambient background + main video */}
        <section className="relative w-full border-b border-ink/10 overflow-hidden" style={{ height: "30vh", minHeight: "220px" }}>
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" style={{ zIndex: 0 }}>
            <source src="/ad1-v1-ambient.mp4" type="video/mp4" />
          </video>
          <div className="relative z-10 w-full h-full bg-ink/70 flex items-center justify-center">
            <video autoPlay muted loop playsInline className="w-full h-full object-contain max-h-[30vh]">
              <source src="/listworks-fh-ad.mp4" type="video/mp4" />
            </video>
          </div>
        </section>
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
        <section className="bg-ink text-oat px-6 md:px-10 py-8">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-oat/40 mb-2 block">Fair Housing</span>
              <h3 className="font-display text-xl md:text-2xl italic leading-[1.15]">
                Your AI wrote the listing. Did it check for violations?
              </h3>
              <p className="font-body text-sm text-oat/60 mt-2 leading-relaxed">
                The $26,262 HUD fine applies to whatever wrote the copy — including ChatGPT. ListWorks PRO scans every rewrite before it reaches your MLS.
              </p>
            </div>
            <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-oat/15">
              <div className="border border-oat/25 p-5">
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion mb-2">Real example</div>
                <p className="font-body text-oat/80 text-sm leading-relaxed">
                  <span className="line-through text-oat/30">"Perfect for families with kids"</span> → <span className="text-green-400">Open floor plan with natural light for everyday living.</span>
                </p>
                <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-oat/40 mt-2">Same home. Same value. No violation.</p>
              </div>
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

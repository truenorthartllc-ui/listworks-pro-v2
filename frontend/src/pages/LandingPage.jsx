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
    <div className="min-h-screen bg-oat font-body text-ink antialiased">
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
        <Testimonials />
        <Pricing />
        <FAQ />

        <section className="bg-ink text-oat px-6 md:px-10 py-12">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl md:text-3xl leading-tight">
                Fair Housing fines are climbing.<br />
                <span className="text-vermillion">One violation is one too many.</span>
              </h2>
              <p className="mt-4 text-sm text-oat/70 leading-relaxed">
                ListWorks is the only real estate copy tool that scans every word for compliance before you publish.
              </p>
            </div>
            <div className="flex justify-start md:justify-end">
              <a href="#pricing"
                className="btn-vermillion px-6 py-3 font-heading text-sm uppercase tracking-[0.15em]">
                Start Free — 3 Listings
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingAdvisorButton />
      <ViralNotifications />
      <ExitIntentPopup />
    </div>
  );
}

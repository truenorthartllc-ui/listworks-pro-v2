import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Playground from "@/components/Playground";
import PresentationShowcase from "@/components/PresentationShowcase";
import ProofSection from "@/components/ProofSection";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import AIVideoShowcase from "@/components/AIVideoShowcase";
import ContentEngineFeatures from "@/components/ContentEngineFeatures";
import QRFeatures from "@/components/QRFeatures";
import ContractsShowcase from "@/components/ContractsShowcase";
import DashboardPreview from "@/components/DashboardPreview";
import GuideUpsell from "@/components/GuideUpsell";
import Marquee from "@/components/Marquee";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import FloatingAdvisorButton from "@/components/FloatingAdvisorButton";
import ExitIntentPopup from "@/components/ExitIntentPopup";

export default function LandingPageV4() {
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, []);
  return (
    <div className="min-h-screen bg-oat text-ink font-body lp-compact">
      <ExitIntentPopup />
      <Header />

      {/* Colorado Agents — Trust Banner */}
      <div className="bg-vermillion text-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <span className="font-heading text-sm uppercase tracking-[0.15em]">
            Colorado Agents — AI Disclosure Check
          </span>
          <a
            href="/co-compliance"
            className="font-mono text-xs uppercase tracking-[0.1em] underline hover:no-underline"
          >
            Create Your Free Record →
          </a>
        </div>
      </div>

      <main>
        {/* 1. Hook — Fair Housing compliance + listing copy */}
        <Hero />

        {/* 2. Instant credibility */}
        <TrustBar />

        {/* 3. PROOF FIRST — show the difference before asking them to try */}
        <ProofSection />

        {/* 4. Visual wow — show what it makes */}
        <AIVideoShowcase />

        {/* 5. Full listing generator — now they want to try it */}
        <Playground landing />

        {/* 6. Win more listings — presentation template */}
        <PresentationShowcase />

        {/* 7. Social proof before the ask */}
        <Testimonials />

        {/* 7. Low-friction offer while trust is hot */}
        <GuideUpsell />

        {/* 8. The ask */}
        <Pricing />

        {/* 8. Everything else you get */}
        <ContentEngineFeatures />
        <QRFeatures />
        <ContractsShowcase />
        <DashboardPreview />

        {/* 9. Motion */}
        <Marquee />

        {/* 10. Objection handling */}
        <FAQ />
      </main>
      <Footer />
      <FloatingAdvisorButton />
    </div>
  );
}

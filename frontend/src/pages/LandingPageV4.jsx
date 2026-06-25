import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Playground from "@/components/Playground";
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

      {/* Colorado AI Act Deadline Banner */}
      <div className="bg-vermillion text-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <span className="font-heading text-sm uppercase tracking-[0.15em]">
            Colorado AI Act Deadline: June 30 (5 days)
          </span>
          <a
            href="/co-compliance"
            className="font-mono text-xs uppercase tracking-[0.1em] underline hover:no-underline"
          >
            Check Your Listings Free →
          </a>
        </div>
      </div>

      <main>
        {/* 1. Hook — "Fair Housing violations start at $26,262" */}
        <Hero />

        {/* 2. Instant credibility */}
        <TrustBar />

        {/* 3. Visual wow — show what it makes before asking them to try */}
        <AIVideoShowcase />

        {/* 4. Full listing generator — the other core tool */}
        <Playground landing />

        {/* 5. Combined proof: before/after + neighborhood intelligence demo */}
        <ProofSection />

        {/* 6. Social proof before the ask */}
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

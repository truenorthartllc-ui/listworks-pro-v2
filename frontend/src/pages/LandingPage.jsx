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

import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, []);

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <Header />
      <main className="max-w-[760px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="mb-2">
          <Link to="/" className="font-heading text-sm uppercase tracking-[0.12em] text-ink/50 hover:text-vermillion transition">
            ← Back
          </Link>
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mt-6 mb-2">
          Privacy Policy
        </h1>
        <p className="font-mono text-xs tracking-[0.15em] uppercase text-ink/40 mb-10">
          Last updated: August 10, 2026
        </p>

        <div className="space-y-8 text-base md:text-[17px] leading-relaxed text-ink/85">
          <section>
            <h2 className="font-heading text-lg uppercase tracking-[0.12em] text-ink mb-3">What We Collect</h2>
            <ul className="space-y-1.5 list-disc pl-5">
              <li>Listing details you paste (property address, description, features, images)</li>
              <li>No names, no emails, no accounts required for free tier</li>
              <li>Email address only if you create an account or contact us</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg uppercase tracking-[0.12em] text-ink mb-3">How We Use It</h2>
            <ul className="space-y-1.5 list-disc pl-5">
              <li>Generate MLS descriptions, social captions, and email copy</li>
              <li>Run Fair Housing compliance scan on your content</li>
              <li>We do <strong>not</strong> store your listing data after generation is complete</li>
              <li>We do <strong>not</strong> sell your data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg uppercase tracking-[0.12em] text-ink mb-3">AI Processing</h2>
            <p>
              Content is processed through third-party AI APIs (OpenRouter, Anthropic, OpenAI) to generate
              your listing copy. Do not submit sensitive personal information like Social Security numbers
              or financial account details.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg uppercase tracking-[0.12em] text-ink mb-3">Third-Party Services</h2>
            <ul className="space-y-1.5 list-disc pl-5">
              <li>AI/LLM providers for text generation</li>
              <li>Stripe for payment processing (paid plans only)</li>
              <li>Railway for backend hosting</li>
              <li>Netlify for frontend hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg uppercase tracking-[0.12em] text-ink mb-3">Data Security</h2>
            <p>
              We use industry-standard encryption for data in transit (TLS/HTTPS). No credit card data
              is stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg uppercase tracking-[0.12em] text-ink mb-3">Your Rights</h2>
            <p>
              You may request deletion of any data we hold by emailing{" "}
              <a href="mailto:hello@listworks.pro" className="text-vermillion underline hover:no-underline">
                hello@listworks.pro
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg uppercase tracking-[0.12em] text-ink mb-3">Contact</h2>
            <p>
              <a href="mailto:hello@listworks.pro" className="text-vermillion underline hover:no-underline">
                hello@listworks.pro
              </a>
              <br />
              ListWorks PRO / True North Graphics LLC
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

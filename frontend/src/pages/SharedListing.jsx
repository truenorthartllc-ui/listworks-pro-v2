import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Sparkles, ArrowRight, Loader2, Box } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * SharedListing — public page anyone can view via /share/[id]
 * Shows the boring before / killer after side-by-side, with a huge
 * "Try free at listworks.pro" CTA. Built for VIRAL distribution.
 *
 * Every social share = free traffic to your tool.
 */
export default function SharedListing() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mls");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    axios.get(`${API}/share/${id}`)
      .then((r) => { if (mounted) { setListing(r.data); setLoading(false); }})
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  const TABS = [
    { key: "mls", label: "MLS", emoji: "🏡" },
    { key: "instagram", label: "Instagram", emoji: "📸" },
    { key: "facebook", label: "Facebook", emoji: "📘" },
    { key: "headlines", label: "Headlines", emoji: "✏️" },
    { key: "email", label: "Email", emoji: "✉️" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-oat flex items-center justify-center" data-testid="share-loading">
        <Loader2 className="w-6 h-6 animate-spin text-vermillion" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-oat flex flex-col items-center justify-center px-6 text-center" data-testid="share-not-found">
        <h1 className="font-display text-4xl mb-3">This listing flew the coop.</h1>
        <p className="text-ink/65 mb-8">The shared link is invalid or expired.</p>
        <Link to="/" className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em]">
          Make Your Own Free →
        </Link>
      </div>
    );
  }

  const headlines = Array.isArray(listing.headlines) ? listing.headlines : [];
  const tabContent = {
    mls: listing.mls,
    instagram: listing.instagram,
    facebook: listing.facebook,
    headlines: headlines.map((h, i) => `${i + 1}. ${h}`).join("\n\n"),
    email: listing.email,
  };

  return (
    <div className="min-h-screen bg-oat" data-testid="shared-listing-page">
      {/* Top bar with branded CTA — most important pixel on the page */}
      <header className="sticky top-0 z-30 bg-oat/95 backdrop-blur-md border-b border-ink/15">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg tracking-tight" data-testid="share-logo">
            ListWorks <span className="text-vermillion italic">/PRO</span>
          </Link>
          <Link
            to="/#playground"
            data-testid="share-cta-top"
            className="btn-vermillion px-5 py-2.5 font-heading text-xs uppercase tracking-[0.18em] hover:-translate-y-0.5 transition-transform"
          >
            Try Free → 8 Sec
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
        {/* Eyebrow + headline */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-vermillion" strokeWidth={2} />
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">
            AI-REWRITTEN IN 8 SECONDS · {String(listing.tone || "Modern").toUpperCase()} TONE
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] mb-12">
          <span className="font-light">Same listing.</span>{" "}
          <span className="italic">Wildly different result.</span>
        </h1>

        {/* Before / After grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ink/15 border border-ink/15 mb-12">
          {/* BEFORE */}
          <div className="bg-stone-100 p-7 md:p-9">
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/45 mb-4">
              ❌ Before — boring MLS draft
            </div>
            <p className="font-body text-base leading-relaxed text-ink/70 whitespace-pre-wrap">
              {listing.raw_listing}
            </p>
          </div>

          {/* AFTER */}
          <div className="bg-coal text-oat p-7 md:p-9">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-vermillion">
                ✅ After — listworks.pro
              </span>
            </div>

            {/* Tab selector */}
            <div className="flex flex-wrap gap-1 mb-5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  data-testid={`share-tab-${t.key}`}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-all ${
                    tab === t.key
                      ? "bg-vermillion text-oat"
                      : "bg-oat/10 text-oat/70 hover:bg-oat/20"
                  }`}
                >
                  <span className="mr-1.5">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <p className="font-body text-base leading-relaxed text-oat/95 whitespace-pre-wrap min-h-[200px]">
              {tabContent[tab]}
            </p>
          </div>
        </div>

        {/* 360° Virtual Tour embed */}
        {listing?.virtual_tour_url && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Box className="w-5 h-5 text-vermillion" />
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">360° Virtual Tour — Explore the Property</span>
            </div>
            <div className="relative w-full border border-ink/15 overflow-hidden" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={listing.virtual_tour_url}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="fullscreen; vr"
                title="360 Virtual Tour"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Lead Capture — Book a Showing */}
        <div className="bg-oat border border-ink/15 p-8 md:p-12 mb-12">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-display text-2xl md:text-3xl mb-3">Want to see this home?</h3>
            <p className="text-ink/60 mb-6">Book a showing or get pre-approved — we'll connect you with a local agent within 24 hours.</p>
            <form onSubmit={(e) => { e.preventDefault(); setLeadSubmitted(true); }} className="space-y-4">
              {leadSubmitted ? (
                <div className="bg-coal text-oat p-6 text-center">
                  <p className="font-heading text-lg mb-2">We'll be in touch within 24 hours!</p>
                  <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-oat/60">A local agent will reach out shortly</p>
                </div>
              ) : (
                <>
                  <input required type="text" placeholder="Your name" className="w-full px-4 py-3 border border-ink/20 font-body" />
                  <input required type="email" placeholder="Email address" className="w-full px-4 py-3 border border-ink/20 font-body" />
                  <input required type="tel" placeholder="Phone (optional)" className="w-full px-4 py-3 border border-ink/20 font-body" />
                  <input type="text" placeholder="Message (optional)" className="w-full px-4 py-3 border border-ink/20 font-body" />
                  <button type="submit" className="w-full btn-vermillion px-6 py-4 font-heading text-sm uppercase tracking-[0.15em]">
                    Book a Showing →
                  </button>
                </>
              )}
            </form>
            <p className="mt-4 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">
              Get pre-approved faster → <a href="https://www.rocketmortgage.com" target="_blank" rel="noopener" className="text-vermillion hover:underline">Rocket Mortgage</a>
            </p>
          </div>
        </div>

        {/* Bottom CTA — the conversion driver */}
        <div className="bg-coal text-oat p-8 md:p-12 text-center border border-ink/30">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-[1.1] mb-4">
            <span className="italic">Your</span> next listing —{" "}
            <span className="text-vermillion">8 seconds away.</span>
          </h2>
          <p className="font-body text-oat/75 mb-8 max-w-xl mx-auto">
            Paste your draft, pick a tone, hit rewrite. MLS + Instagram + Facebook + 5 headlines + email blast — all in your voice. First 3 are free.
          </p>
          <Link
            to="/#playground"
            data-testid="share-cta-bottom"
            className="inline-flex items-center gap-2 btn-vermillion px-8 py-4 font-heading text-sm uppercase tracking-[0.18em] hover:-translate-y-0.5 transition-transform"
          >
            Try Free at listworks.pro
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      </main>
    </div>
  );
}

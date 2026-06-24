import { useState } from "react";
import { Loader2, Wand2, ScanLine, Mic } from "lucide-react";
import axios from "axios";
import Pricing from "@/components/Pricing";
import BeforeAfter from "@/components/BeforeAfter";
import Footer from "@/components/Footer";
import FloatingAdvisorButton from "@/components/FloatingAdvisorButton";
import ViralNotifications from "@/components/ViralNotifications";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ── Slim Header ──────────────────────────────────────────────────────────────
function SlimHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-oat/95 backdrop-blur border-b border-ink/8">
      <div className="max-w-5xl mx-auto px-5 md:px-8 h-12 flex items-center justify-between">
        <a href="#" className="flex items-baseline gap-1.5">
          <span className="font-display italic text-lg font-medium tracking-tight text-ink">ListWorks</span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-vermillion uppercase">/pro</span>
        </a>
        <nav className="hidden md:flex items-center gap-7 font-heading text-[12px] uppercase tracking-[0.1em] text-ink/60">
          <a href="#demo" className="hover:text-ink transition">Tool</a>
          <a href="#pricing" className="hover:text-ink transition">Pricing</a>
        </nav>
        <a href="#demo" className="bg-vermillion text-oat px-4 py-1.5 font-heading text-[11px] uppercase tracking-[0.12em] hover:bg-[#e02d0e] transition">
          Try Free →
        </a>
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="bg-oat border-b border-ink/10">
      <div className="max-w-5xl mx-auto px-5 md:px-8 pt-10 pb-8">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/40 mb-4">
          Real Estate Copy, Rewritten
        </p>
        <h1 className="font-display text-[2rem] md:text-[3rem] leading-[1.05] tracking-tight text-ink mb-3">
          One violation.{" "}
          <span className="italic text-vermillion">$26,262</span>
          {". "}Every listing.
        </h1>
        <p className="font-body text-sm md:text-base text-ink/60 max-w-xl mb-6 leading-relaxed">
          Scans every listing for Fair Housing violations before you publish. MLS copy, social captions, 5 headlines in 10 seconds.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-7">
          {[
            ["850+", "Agents"],
            ["24k+", "Listings"],
            ["10s", "Avg"],
            ["★4.9", "Rating"],
          ].map(([num, label]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-medium text-ink">{num}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/45">{label}</span>
            </div>
          ))}
        </div>

        <a href="#demo" className="inline-flex items-center gap-2 bg-vermillion text-oat px-6 py-3 font-heading text-sm uppercase tracking-[0.12em] hover:bg-[#e02d0e] transition hover:-translate-y-px">
          Catch violations. Free →
        </a>
      </div>
    </section>
  );
}

// ── Demo Section ─────────────────────────────────────────────────────────────
function Demo() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (text.trim().length < 10) return;
    setLoading(true);
    setResult(null);
    try {
      const session_id = localStorage.getItem("lw_session_id") || "";
      const { data } = await axios.post(`${API}/rewrite`, {
        raw_listing: text.trim(),
        tone: "aspirational",
        session_id,
      });
      setResult(data);
    } catch {
      toast.error("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  return (
    <section id="demo" className="bg-white border-b border-ink/10">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">/demo</span>
          <span className="h-px flex-1 bg-ink/8" />
        </div>

        {!result ? (
          <div className="border border-ink/12 bg-oat/40">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              className="w-full bg-transparent p-4 font-body text-sm text-ink/80 resize-none outline-none placeholder:text-ink/25"
              placeholder="Paste your listing..."
            />
            <div className="border-t border-ink/8 px-4 py-2.5 flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink/35 uppercase tracking-wider">3 free · No card</span>
              <button
                onClick={run}
                disabled={loading || text.trim().length < 10}
                className="bg-ink text-oat hover:bg-vermillion px-5 py-2 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 transition disabled:opacity-30"
              >
                {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Working…</> : "Go"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border border-ink/10 bg-oat/40 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/35 mb-2">MLS Rewrite</p>
              <p className="font-body text-sm text-ink/80 leading-relaxed">{result.mls}</p>
            </div>
            {result.headlines?.[0] && (
              <div className="border border-ink/10 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/35 mb-1">Headline</p>
                <p className="font-display italic text-base text-ink">{result.headlines[0]}</p>
              </div>
            )}
            <button onClick={() => { setResult(null); setText(""); }}
              className="font-mono text-[10px] uppercase tracking-wider text-ink/40 hover:text-ink transition">
              ← Try another listing
            </button>
          </div>
        )}

        {/* Testimonial */}
        <div className="mt-5 border-l-2 border-vermillion pl-4">
          <p className="font-body text-sm text-ink/65 italic">
            "Sold in 3 weeks. Positioning added $15k."
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/35 mt-1">— Austin, TX</p>
        </div>
      </div>
    </section>
  );
}

// ── 3 Features ───────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Wand2, title: "Five-format rewrite", body: "MLS, Instagram, Facebook, headlines, email — one pass, five assets." },
  { icon: ScanLine, title: "Photo recognition", body: "Upload photos. We find hardwood, marble, vaulted ceilings — into feelings." },
  { icon: Mic, title: "Five tone modes", body: "Luxury. Cozy. Modern. Family. Investor. Same property, different buyer." },
];

function ThreeFeatures() {
  return (
    <section className="bg-oat border-b border-ink/10">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border border-ink/10 bg-white p-5">
              <Icon className="w-4 h-4 text-vermillion mb-3" />
              <h3 className="font-heading text-sm font-semibold text-ink mb-1">{title}</h3>
              <p className="font-body text-xs text-ink/55 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Compact Fair Housing ──────────────────────────────────────────────────────
function FairHousing() {
  return (
    <section className="bg-ink text-oat border-b border-oat/10">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8">
        <h2 className="font-display text-xl md:text-2xl italic leading-tight mb-3">
          Your AI wrote the listing. Did it check for violations?
        </h2>
        <p className="font-body text-sm text-oat/60 mb-5 max-w-lg">
          The $26,262 HUD fine applies to whatever wrote the copy — including ChatGPT. ListWorks PRO scans every rewrite before your MLS.
        </p>
        <div className="border border-oat/15 p-4 max-w-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-vermillion mb-2">Real example</p>
          <p className="font-body text-sm text-oat/80 leading-relaxed">
            <span className="line-through text-oat/35">"Perfect for families with kids"</span>
            <span className="text-oat/40"> → </span>
            <span className="text-green-400">Open floor plan with natural light.</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-oat/30 mt-2">
            Same home. Same value. No violation.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPageV3() {
  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <ExitIntentPopup />
      <ViralNotifications />
      <SlimHeader />
      <main>
        <Hero />
        <Demo />
        <BeforeAfter />
        <ThreeFeatures />
        <section id="pricing"><Pricing /></section>
        <FairHousing />
      </main>
      <Footer />
      <FloatingAdvisorButton />
    </div>
  );
}

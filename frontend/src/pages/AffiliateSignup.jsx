import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Check, Loader2, Users, TrendingUp, DollarSign, Share2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BENEFITS = [
  { icon: DollarSign, title: "30% Commission", desc: "On every sale your link brings in — Pro subscriptions, Lifetime deals, everything." },
  { icon: TrendingUp, title: "Monthly Payouts", desc: "Via Stripe. We cut a check every month once you hit $50 earned." },
  { icon: Users, title: "Zero Friction", desc: "Your referrals get 3 free rewrites. They try it risk-free before buying." },
  { icon: Share2, title: "Ready-Made Copy", desc: "AI-crafted posts for X, Facebook, LinkedIn, and text. Just copy and paste." },
];

export default function AffiliateSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const r = await axios.post(`${API}/affiliate/create`, { name, email });
      setResult(r.data);
      toast.success("You're in! Here's your link.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (result?.link) {
      navigator.clipboard.writeText(result.link);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-oat">
      <header className="sticky top-0 z-30 bg-oat/95 backdrop-blur-md border-b border-ink/15">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg tracking-tight">
            ListWorks <span className="text-vermillion italic">/PRO</span>
          </Link>
          <Link to="/" className="font-mono text-xs tracking-[0.2em] uppercase text-ink/55 hover:text-vermillion transition">
            / Home
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-12 gap-12">
          {/* Left — pitch */}
          <div className="col-span-12 md:col-span-6">
            <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-4">
              / Earn with ListWorks PRO
            </div>
            <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-[1.0] mb-6">
              Refer agents.<br />
              <span className="italic">Earn 30%.</span>
            </h1>
            <p className="font-display italic text-2xl text-ink/70 leading-[1.3] mb-10">
              Real estate agents spend hours on listing copy. ListWorks PRO rewrites it in 10 seconds. Your fellow agents need this. And they will pay for it.
            </p>

            <div className="space-y-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-vermillion/10 rounded flex items-center justify-center flex-shrink-0 mt-1">
                    <b.icon className="w-5 h-5 text-vermillion" />
                  </div>
                  <div>
                    <div className="font-heading text-sm tracking-wide mb-1">{b.title}</div>
                    <div className="font-body text-sm text-ink/65">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — signup form */}
          <div className="col-span-12 md:col-span-6">
            <div className="bg-white border border-ink/15 p-8 md:p-10">
              {result ? (
                <div>
                  <div className="flex items-center gap-2 text-vermillion mb-4">
                    <Check className="w-5 h-5" />
                    <span className="font-mono text-[11px] tracking-[0.2em] uppercase">You're in!</span>
                  </div>
                  <h2 className="font-display text-3xl mb-2">Your affiliate link</h2>
                  <p className="font-body text-ink/65 mb-6 text-sm">Share this with anyone. When they buy, you earn.</p>
                  <div className="bg-oat border border-ink/15 p-4 font-mono text-sm break-all mb-4 select-all">
                    {result.link}
                  </div>
                  <button
                    onClick={copyLink}
                    className="w-full bg-vermillion hover:bg-[#ff2a0e] text-oat px-6 py-4 font-heading text-sm uppercase tracking-[0.12em] transition hover:-translate-y-0.5 mb-6"
                  >
                    Copy Link
                  </button>
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/50 text-center">
                    {result.commission_rate}% commission · paid monthly via Stripe
                  </div>

                  <div className="mt-6 pt-6 border-t border-ink/15">
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-3">Your dashboard</div>
                    <Link
                      to={`/affiliate/${result.ref}`}
                      className="block w-full text-center border border-ink/30 hover:border-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.12em] transition"
                    >
                      View My Dashboard →
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="font-display text-3xl mb-2">Sign up free</h2>
                  <p className="font-body text-ink/65 mb-8 text-sm">Get your link in 10 seconds. No approval process.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/55 mb-2 block">
                        Your name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        required
                        className="w-full border border-ink/20 px-4 py-3 font-body text-sm outline-none focus:border-vermillion transition"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/55 mb-2 block">
                        Your email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@realty.com"
                        required
                        className="w-full border border-ink/20 px-4 py-3 font-body text-sm outline-none focus:border-vermillion transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-6 py-4 font-heading text-sm uppercase tracking-[0.12em] transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {loading ? "Creating your link..." : "Get My Affiliate Link →"}
                    </button>
                  </form>
                  <p className="font-body text-xs text-ink/45 mt-4 text-center">
                    No spam. No approval. Just your link and your earnings.
                  </p>
                </div>
              )}
            </div>

            {/* Trust signals */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {[
                { val: "30%", label: "Commission" },
                { val: "$50", label: "Min payout" },
                { val: "Real-time", label: "Dashboard" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-ink/15 p-4">
                  <div className="font-display text-2xl text-vermillion">{s.val}</div>
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink/50 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
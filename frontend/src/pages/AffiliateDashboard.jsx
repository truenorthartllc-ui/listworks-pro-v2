import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Copy, Check, Loader2, DollarSign, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Public affiliate dashboard — anyone with the URL sees their stats.
 * No auth: the URL itself is the secret. Format: /a/mike
 *
 * Why no auth: 1) zero-friction onboarding for affiliates  2) URL is shareable to
 * accountants/teams without provisioning users  3) we mask buyer emails so worst-case
 * leak is "this affiliate brought $X" — not PII.
 */
export default function AffiliateDashboard() {
  const { ref } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const refLink = `https://listworks.pro/?ref=${ref}`;

  useEffect(() => {
    let mounted = true;
    axios.get(`${API}/affiliate/${ref}`)
      .then(r => { if (mounted) { setStats(r.data); setLoading(false); }})
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [ref]);

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-oat flex items-center justify-center" data-testid="affiliate-loading">
        <Loader2 className="w-6 h-6 animate-spin text-vermillion" />
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="min-h-screen bg-oat flex flex-col items-center justify-center px-6 text-center" data-testid="affiliate-not-found">
        <h1 className="font-display text-4xl mb-3">Couldn't load this affiliate.</h1>
        <Link to="/" className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em]">Home →</Link>
      </div>
    );
  }

  const conversion = stats.clicks > 0 ? ((stats.sales_count / stats.clicks) * 100).toFixed(1) : "0.0";

  const tiles = [
    { label: "Clicks", value: stats.clicks, icon: MousePointerClick, sub: "via your ref link" },
    { label: "Sales", value: stats.sales_count, icon: ShoppingCart, sub: `${conversion}% conversion` },
    { label: "Revenue", value: `$${stats.total_revenue.toFixed(2)}`, icon: TrendingUp, sub: "your referrals' total spend" },
    { label: "Commission", value: `$${stats.commission_owed.toFixed(2)}`, icon: DollarSign,
      sub: `at ${(stats.commission_rate * 100).toFixed(0)}%`, featured: true },
  ];

  return (
    <div className="min-h-screen bg-oat" data-testid="affiliate-dashboard">
      <header className="sticky top-0 z-30 bg-oat/95 backdrop-blur-md border-b border-ink/15">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg tracking-tight">
            ListWorks <span className="text-vermillion italic">/PRO</span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/55">
            / Affiliate Dashboard
          </span>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-3">
          / @{stats.ref}
        </div>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] mb-3">
          <span className="font-light">You've earned</span>{" "}
          <span className="italic text-vermillion">${stats.commission_owed.toFixed(2)}</span>
        </h1>
        <p className="font-body text-ink/65 mb-10 max-w-xl">
          30% of every sale referred by your link. Paid out via Stripe at the end of each month (min $50).
        </p>

        {/* Ref link — the asset to share */}
        <div className="bg-coal text-oat p-6 md:p-8 mb-12 border border-ink/30">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-oat/60 mb-3">
            Your unique referral link
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <code data-testid="affiliate-ref-link" className="flex-1 min-w-0 truncate bg-ink/40 px-4 py-3 font-mono text-sm border border-oat/20">
              {refLink}
            </code>
            <button
              onClick={copyLink}
              data-testid="affiliate-copy-btn"
              className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] flex items-center gap-2 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </button>
          </div>
          <p className="mt-4 text-sm text-oat/65">
            Share this in your newsletter, group, podcast, video — anywhere. We attribute every paying customer who first lands via this link.
          </p>
        </div>

        {/* Stats tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink/15 border border-ink/15 mb-12">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className={`p-6 md:p-8 ${t.featured ? "bg-vermillion text-oat" : "bg-oat text-ink"}`}>
                <Icon className={`w-5 h-5 mb-3 ${t.featured ? "text-oat" : "text-ink/55"}`} strokeWidth={2} />
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-65 mb-1">{t.label}</div>
                <div className="font-display text-3xl md:text-4xl mb-1">{t.value}</div>
                <div className={`text-xs ${t.featured ? "text-oat/75" : "text-ink/55"}`}>{t.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Recent sales */}
        <h2 className="font-display text-2xl md:text-3xl tracking-tight mb-4">Recent referred sales</h2>
        {stats.recent_sales?.length === 0 ? (
          <div className="bg-ink/5 border border-ink/15 p-8 text-ink/65 italic">
            No sales yet. Start sharing your link — clicks turn into commissions in 24-72 hours.
          </div>
        ) : (
          <div className="border border-ink/15 divide-y divide-ink/10">
            {stats.recent_sales.map((s, i) => (
              <div key={i} data-testid={`affiliate-sale-${i}`} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-ink/5">
                <div className="col-span-3 font-mono text-xs text-ink/55">
                  {new Date(s.paid_at).toLocaleDateString()}
                </div>
                <div className="col-span-4 font-medium">{s.kind?.toUpperCase() || s.package}</div>
                <div className="col-span-3 text-ink/65 truncate">{s.buyer || "(anon)"}</div>
                <div className="col-span-2 text-right font-display text-lg">
                  +${(s.amount * stats.commission_rate).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-xs text-ink/50">
          Questions? Email <a href="mailto:hello@listworks.pro" className="text-vermillion underline">hello@listworks.pro</a> · Stats refresh every page load.
        </p>
      </main>
    </div>
  );
}

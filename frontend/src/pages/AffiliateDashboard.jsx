import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Copy, Check, Loader2, DollarSign, MousePointerClick, ShoppingCart,
  TrendingUp, Share2, MessageSquare, Send, ExternalLink,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHARE_PLATFORMS = [
  {
    key: "twitter",
    name: "X / Twitter",
    icon: "X",
    color: "bg-gray-900 hover:bg-gray-800 text-white",
    emoji: "𝕏",
    prompt: "Share on X",
    copy_label: "Post to Twitter",
  },
  {
    key: "facebook",
    name: "Facebook",
    icon: "f",
    color: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
    emoji: "f",
    prompt: "Share on Facebook",
    copy_label: "Share on Facebook",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: "in",
    color: "bg-[#0A66C2] hover:bg-[#0958a8] text-white",
    emoji: "in",
    prompt: "Share on LinkedIn",
    copy_label: "Share on LinkedIn",
  },
  {
    key: "text",
    name: "Text / Email",
    icon: "txt",
    color: "bg-ink hover:bg-coal text-oat",
    emoji: "✉",
    prompt: "Copy text",
    copy_label: "Copy as Email",
  },
  {
    key: "copy",
    name: "Copy Link",
    icon: "url",
    color: "bg-vermillion hover:bg-[#ff2a0e] text-oat",
    emoji: "🔗",
    prompt: "Copy link",
    copy_label: "Copy Link",
  },
];

const SHARE_TEXTS = {
  twitter: {
    prefix: "listing copy that actually sells homes 🚀",
    body: "I used this AI tool to rewrite a boring MLS draft in 10 seconds — Instagram caption, FB post, 5 headlines, email blast. First 3 free →",
    hashtags: "#realestate #realestateagent #listings",
  },
  facebook: {
    prefix: "Just tried this for listing copy",
    body: "3 bed 2 bath ranch → Instagram caption + FB post + 5 headlines + email blast, all in 10 seconds. First 3 free.",
    hashtags: "",
  },
  linkedin: {
    prefix: "Sharing a tool that's changed how I do listing copy",
    body: "Paste a boring MLS draft, get publish-ready Instagram, Facebook, 5 headlines, and email blast in 10 seconds. First 3 free.",
    hashtags: "",
  },
  text: {
    prefix: "Check this out",
    body: "ListWorks PRO — paste your boring MLS draft, get publish-ready copy in 10 seconds. Instagram, Facebook, 5 headlines, email. First 3 free.",
    hashtags: "",
  },
};

function getShareText(key, link) {
  const t = SHARE_TEXTS[key] || SHARE_TEXTS.text;
  const parts = [t.prefix, t.body, link].filter(Boolean);
  if (t.hashtags) parts.push(t.hashtags);
  return parts.join("\n\n");
}

export default function AffiliateDashboard() {
  const { ref } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [activePlatform, setActivePlatform] = useState("copy");
  const refLink = `https://listworks.pro/?ref=${ref}`;

  useEffect(() => {
    let mounted = true;
    const endpoint = `${API}/affiliate/dashboard/${ref}`;
    axios.get(endpoint)
      .then(r => { if (mounted) { setStats(r.data); setLoading(false); }})
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [ref]);

  const copyToClipboard = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success(
      key === "copy" ? "Link copied!" :
      key === "twitter" ? "Tweet copied! Paste into X." :
      "Copied!"
    );
    setTimeout(() => setCopied(null), 2500);
  };

  const shareTo = (platform) => {
    const link = refLink;
    if (platform === "copy") {
      copyToClipboard("copy", link);
      return;
    }
    if (platform === "text") {
      copyToClipboard("text", getShareText("text", link));
      return;
    }
    const url = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText("twitter", link))}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    }[platform];
    if (url) window.open(url, "_blank", "noopener");
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

  const conversion = stats.conversion || (stats.clicks > 0 ? parseFloat((stats.sales_count / stats.clicks * 100).toFixed(1)) : 0);
  const tiles = [
    { label: "Clicks", value: stats.clicks || 0, icon: MousePointerClick, sub: "on your ref link" },
    { label: "Sales", value: stats.sales_count || 0, icon: ShoppingCart, sub: `${conversion}% conversion` },
    { label: "Revenue", value: `$${(stats.total_revenue || 0).toFixed(0)}`, icon: TrendingUp, sub: "your referrals' spend" },
    {
      label: "You Earn",
      value: `$${(stats.commission_owed || 0).toFixed(2)}`,
      icon: DollarSign,
      sub: `${(stats.commission_rate * 100).toFixed(0)}% commission`,
      featured: true,
    },
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

        {/* Hero commission banner */}
        <div className="bg-coal text-oat p-8 md:p-12 border border-ink/30 mb-12">
          <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-4">
            / @{stats.ref} · {stats.name || "Affiliate"}
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="font-display text-7xl md:text-8xl leading-none text-vermillion">
                ${(stats.commission_owed || 0).toFixed(0)}
              </div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-oat/55 mt-3">
                earned so far
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <p className="font-display italic text-2xl md:text-3xl leading-tight">
                30% of every sale your link brings in. Paid out monthly via Stripe (min $50).
              </p>
            </div>
            <Link
              to="/#playground"
              data-testid="affiliate-cta"
              className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] transition hover:-translate-y-1 flex items-center gap-2"
            >
              Try ListWorks Free →
            </Link>
          </div>
        </div>

        {/* Share panel */}
        <div className="bg-white border border-ink/15 p-8 md:p-10 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-vermillion" strokeWidth={2} />
            <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-vermillion">
              / Share your link
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tight leading-[1.05] mb-6">
            Pick a platform. <span className="italic">Paste. Earn.</span>
          </h2>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {SHARE_PLATFORMS.map((p) => (
              <button
                key={p.key}
                data-testid={`share-${p.key}-btn`}
                onClick={() => shareTo(p.key)}
                className={`px-5 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 transition-all hover:-translate-y-0.5 ${p.color}`}
              >
                {copied === p.key ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {p.prompt}
              </button>
            ))}
          </div>

          {/* Preview box — shows what will be posted */}
          <div className="border border-ink/15 p-5 bg-oat">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-3">
              Preview — {activePlatform === "copy" ? "link" : `${activePlatform} post`}
            </div>
            <pre className="font-mono text-[12px] text-ink/80 leading-[1.7] whitespace-pre-wrap max-w-2xl">
              {getShareText(activePlatform, refLink)}
            </pre>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => copyToClipboard(activePlatform, getShareText(activePlatform, refLink))}
                className="px-4 py-2 border border-ink/20 hover:border-vermillion font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy for " + SHARE_PLATFORMS.find(p => p.key === activePlatform)?.name}
              </button>
              <div className="flex gap-1.5 items-center">
                {SHARE_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setActivePlatform(p.key)}
                    data-active={activePlatform === p.key}
                    className={`px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                      activePlatform === p.key
                        ? "bg-ink text-oat"
                        : "text-ink/40 hover:text-ink"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Raw link */}
          <div className="mt-5 flex items-center gap-3">
            <code className="flex-1 min-w-0 truncate bg-ink/5 border border-ink/10 px-4 py-3 font-mono text-sm">
              {refLink}
            </code>
            <button
              onClick={() => copyToClipboard("copy", refLink)}
              className="btn-vermillion px-4 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 shrink-0"
            >
              {copied === "copy" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === "copy" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* How to earn section */}
        <div className="bg-oat border border-ink/15 p-8 md:p-10 mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Share your link",
              body: "Every person who clicks your link gets tracked — even if they don't buy today. We'll credit you when they do.",
            },
            {
              step: "02",
              title: "They try it free",
              body: "ListWorks gives every new visitor 3 free rewrites. No credit card needed. Most people try it and upgrade.",
            },
            {
              step: "03",
              title: "You earn 30%",
              body: `Every sale from your link: Guide ($20) = $6, Pro monthly ($49) = $14.70/mo recurring, Lifetime ($299) = $89.70. Paid monthly.`,
            },
          ].map((item) => (
            <div key={item.step}>
              <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-3">
                Step {item.step}
              </div>
              <h3 className="font-display text-2xl tracking-tight mb-3">{item.title}</h3>
              <p className="font-body text-ink/70 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
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
        {(!stats.recent_sales || stats.recent_sales.length === 0) ? (
          <div className="bg-ink/5 border border-ink/15 p-8 text-ink/65 font-display italic text-lg">
            No sales yet. Share your link — commissions start arriving within 24-72 hours of your first click.
          </div>
        ) : (
          <div className="border border-ink/15 divide-y divide-ink/10">
            {stats.recent_sales.map((s, i) => (
              <div key={i} data-testid={`affiliate-sale-${i}`} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-ink/5">
                <div className="col-span-3 font-mono text-xs text-ink/55">
                  {s.paid_at ? new Date(s.paid_at).toLocaleDateString() : "—"}
                </div>
                <div className="col-span-4 font-medium">{s.kind?.toUpperCase() || s.package || "Sale"}</div>
                <div className="col-span-3 text-ink/65 truncate">{s.buyer || "(anon)"}</div>
                <div className="col-span-2 text-right font-display text-lg text-vermillion">
                  +${((s.amount || 0) * (stats.commission_rate || 0.30)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-xs text-ink/50">
          Questions? Email <a href="mailto:hello@listworks.pro" className="text-vermillion underline">hello@listworks.pro</a> · Payout via Stripe, monthly, min $50.
        </p>
      </main>
    </div>
  );
}

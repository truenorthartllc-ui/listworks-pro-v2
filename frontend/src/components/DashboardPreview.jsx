import { useState } from "react";
import { FileText, Package, Palette, Zap } from "lucide-react";

const tabs = [
  {
    icon: Zap,
    label: "Generator",
    preview: [
      { col: "Listing", val: "2841 W 6th St" },
      { col: "Mode", val: "MLS Description" },
      { col: "Tone", val: "Aspirational" },
      { col: "Status", val: "✓ Generated", hi: true },
    ],
    note: "Paste raw notes → get MLS copy, headline, Instagram, email, compliance scan.",
  },
  {
    icon: Package,
    label: "Content Packs",
    preview: [
      { col: "Output", val: "Reel script" },
      { col: "Output", val: "7-day calendar" },
      { col: "Output", val: "6-slide carousel" },
      { col: "Output", val: "Market report" },
    ],
    note: "One rewrite generates 6 publishable assets — scripts, captions, carousels, reports.",
  },
  {
    icon: FileText,
    label: "Contracts",
    preview: [
      { col: "Document", val: "Listing Agreement" },
      { col: "Document", val: "Purchase Agreement" },
      { col: "Document", val: "Seller Disclosure" },
      { col: "Document", val: "Buyer Rep Agreement" },
    ],
    note: "Every field has a plain-English explanation. No more guessing what terms mean.",
  },
  {
    icon: Palette,
    label: "Branding",
    preview: [
      { col: "Element", val: "Brand voice" },
      { col: "Element", val: "Agent bio" },
      { col: "Element", val: "Email signature" },
      { col: "Element", val: "Logo + colors" },
    ],
    note: "Set your brand voice once — every output sounds like you, not a template.",
  },
];

export default function DashboardPreview() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section className="bg-white border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">

        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Dashboard</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">Everything behind one login.</span>
        </div>

        <div className="border border-ink/15">
          {/* Tab bar */}
          <div className="flex border-b border-ink/15 bg-oat">
            {tabs.map((t, i) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.label}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-2 px-4 py-3 font-heading text-[10px] uppercase tracking-[0.15em] border-r border-ink/10 transition-colors ${
                    i === active ? "bg-white text-ink border-b-2 border-b-vermillion -mb-px" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  <Icon className="w-3 h-3" strokeWidth={2} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/10">
            <div className="bg-white p-5">
              <div className="divide-y divide-ink/8">
                {tab.preview.map((r, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40">{r.col}</span>
                    <span className={`font-body text-sm ${r.hi ? "text-vermillion font-medium" : "text-ink"}`}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-oat p-5 flex flex-col justify-between gap-6">
              <p className="font-body text-sm text-ink/70 leading-relaxed">{tab.note}</p>
              <a
                href="/dashboard"
                className="btn-vermillion inline-flex items-center self-start px-5 py-3 font-heading text-xs uppercase tracking-[0.15em]"
              >
                Open Dashboard →
              </a>
            </div>
          </div>
        </div>

        <p className="mt-4 font-mono text-[10px] tracking-[0.1em] uppercase text-ink/35">
          Free account · First 3 rewrites included · No credit card
        </p>

      </div>
    </section>
  );
}

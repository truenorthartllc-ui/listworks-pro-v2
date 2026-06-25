import { useState } from "react";

const outputs = [
  {
    label: "Reel Script",
    file: "reel-script.txt",
    preview: [
      { part: "Hook (0–3s)", text: "This house has a secret — and the backyard is the reason it won't last the weekend." },
      { part: "Middle (3–12s)", text: "Hardwood floors. Granite kitchen. Three bedrooms. Fully fenced yard that backs to silence.\n\nAnd yes — top-rated schools are literally two blocks away." },
      { part: "Close (12–15s)", text: "Scan the QR on my sign for the full tour. Link in bio. DMs open." },
    ],
  },
  {
    label: "Instagram Caption",
    file: "instagram-caption.txt",
    preview: [
      { part: "Caption", text: "Sunday mornings look different here. ☀️\n\nHardwood floors, updated kitchen, fenced backyard — and top-rated schools two blocks away.\n\nThree beds. Two baths. Move-in ready.\n\nThis one won't last. DM me or tap the link in bio.\n\n#realestate #justlisted #homeforsale #listworks #realestateagent #househunting #newlisting" },
    ],
  },
  {
    label: "6-Slide Carousel",
    file: "carousel.txt",
    preview: [
      { part: "Slide 1 — Cover", text: "\"Move-in ready. Truly.\"\n3 bed · 2 bath · 1,840 sqft" },
      { part: "Slide 2 — Location", text: "Top-rated schools 2 blocks. Whole Foods 0.4 mi. Walk Score 91." },
      { part: "Slide 3 — Light", text: "East-facing kitchen. Morning sun hits the granite every day." },
      { part: "Slide 4 — Updates", text: "Updated kitchen. Hardwood throughout. New roof 2022." },
      { part: "Slide 5 — Outdoor", text: "Fully fenced backyard. No neighbors behind. Private." },
      { part: "Slide 6 — CTA", text: "Scan the sign QR or DM me for a showing. Offers reviewed Sunday." },
    ],
  },
  {
    label: "7-Day Calendar",
    file: "weekly-calendar.md",
    preview: [
      { part: "Mon", text: "Reel → backyard reveal hook" },
      { part: "Tue", text: "Carousel → 6-slide story" },
      { part: "Wed", text: "Instagram caption + hashtags" },
      { part: "Thu", text: "Market insight post — local trend" },
      { part: "Fri", text: "Facebook post — family weekend angle" },
      { part: "Sat", text: "Story poll: “Would you live here?”" },
      { part: "Sun", text: "Open house reminder + QR code" },
    ],
  },
  {
    label: "Market Report",
    file: "market-report-post.txt",
    preview: [
      { part: "Local snapshot", text: "78703 median: $685K (+4.2% MoM). Avg days on market: 9. Buyer competition: HIGH — 73% of listings going over ask." },
      { part: "Buyer mood", text: "Rate-sensitive but active. FHA buyers pausing. Cash offers up 12% vs last quarter." },
      { part: "Your CTA", text: "Thinking about listing? Right now, well-priced homes in 78703 are selling in under 2 weeks. DM me for a free comp analysis." },
    ],
  },
  {
    label: "Canva Templates",
    file: "canva-templates.json",
    preview: [
      { part: "Reel cover", text: "canva.com/t/realestate-reel-cover-v3 → Edit your address, swap photo, done." },
      { part: "Carousel template", text: "canva.com/t/listing-carousel-6slide → 6 slides, your brand colors, pre-written slide text loaded." },
      { part: "Market report graphic", text: "canva.com/t/market-update-local → Drop in your stats, auto-formats the bar chart." },
    ],
  },
];

export default function ContentEngineFeatures() {
  const [active, setActive] = useState(0);
  const selected = outputs[active];

  return (
    <section className="bg-oat border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">

        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Output Pack</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">One input. Six publish-ready outputs.</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ink/12 border border-ink/12">
          {/* Selector */}
          <div className="bg-oat divide-y divide-ink/8">
            {outputs.map((o, i) => (
              <button
                key={o.label}
                onClick={() => setActive(i)}
                className={`w-full text-left px-5 py-4 flex items-center justify-between transition-colors ${
                  i === active ? "bg-ink text-oat" : "bg-oat text-ink hover:bg-ink/5"
                }`}
              >
                <span className={`font-heading text-[11px] uppercase tracking-[0.15em] ${i === active ? "text-oat" : "text-ink"}`}>
                  {o.label}
                </span>
                <code className={`font-mono text-[10px] ${i === active ? "text-oat/50" : "text-ink/30"}`}>{o.file}</code>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-white p-6 flex flex-col gap-4">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion mb-1">Example output · {selected.label}</p>
            {selected.preview.map((p) => (
              <div key={p.part} className="border-l-2 border-ink/10 pl-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40 mb-1">{p.part}</div>
                <p className="font-body text-sm text-ink/80 leading-relaxed whitespace-pre-line">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

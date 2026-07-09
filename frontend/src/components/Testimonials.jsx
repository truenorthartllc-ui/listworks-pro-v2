const testimonials = [
  {
    quote: "Three listings in one morning. Two went under contract in under a week.",
    name: "Jessica Martinez",
    role: "RE/MAX \u00b7 Los Angeles",
    sold: "12 homes in 90 days",
    img: "/images/face-jessica.jpg",
  },
  {
    quote: "I was paying $200/mo for a copywriter. This does it better in 10 seconds.",
    name: "Priya Nair",
    role: "Compass \u00b7 Chicago",
    sold: "ROI in week 1",
    img: "/images/face-priya.jpg",
  },
  {
    quote: "The expired scripts alone paid for a year of Pro. 3 FSBO listings from 8 calls.",
    name: "Derek Okafor",
    role: "eXp Realty \u00b7 Atlanta",
    sold: "3 FSBOs in 30 days",
    img: "/images/face-derek.jpg",
  },
  {
    quote: "IG captions stop the scroll. MLS sounds like me but 10x better. Only tool I pay for.",
    name: "Marcus Chen",
    role: "Keller Williams \u00b7 Denver",
    sold: "9 homes since Jan",
    img: "/images/face-marcus.jpg",
  },
];

import { useState } from "react";

export default function Testimonials() {
  const [failedImages, setFailedImages] = useState(new Set());
  const [loadedImages, setLoadedImages] = useState(new Set());

  const handleImgError = (name) => {
    setFailedImages(prev => new Set(prev).add(name));
  };

  const handleImgLoad = (name) => {
    setLoadedImages(prev => new Set(prev).add(name));
  };

  return (
    <section data-testid="testimonials-section" className="bg-white border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">

        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Field Reports</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40 shrink-0">127 agents using ListWorks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/12 border border-ink/12">
          {testimonials.map((t) => (
            <figure key={t.name} className="bg-white p-6 flex flex-col gap-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-vermillion text-xs">\u2605</span>
                ))}
              </div>
              <blockquote className="font-display italic text-base leading-snug text-ink flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="border-t border-ink/8 pt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-vermillion/10 shrink-0 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={t.img}
                    alt={t.name}
                    onLoad={() => handleImgLoad(t.name)}
                    onError={() => handleImgError(t.name)}
                    className={`absolute inset-0 w-full h-full object-cover ${failedImages.has(t.name) ? "hidden" : ""}`}
                  />
                  <span className={`font-heading text-sm font-semibold text-vermillion relative z-10 ${loadedImages.has(t.name) ? "hidden" : ""}`}>
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-[11px] uppercase tracking-[0.1em] text-ink truncate">{t.name}</div>
                  <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink/40 mt-0.5 truncate">{t.role}</div>
                </div>
                <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-vermillion border border-vermillion/30 px-2 py-1 shrink-0">{t.sold}</span>
              </figcaption>
            </figure>
          ))}
        </div>

      </div>
    </section>
  );
}

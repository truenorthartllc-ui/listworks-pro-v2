const testimonials = [
  {
    quote: "Three listings in one morning. Two went under contract in under a week.",
    name: "Jessica Martinez",
    role: "RE/MAX · Los Angeles",
    sold: "12 homes in 90 days",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces",
  },
  {
    quote: "I was paying $200/mo for a copywriter. This does it better in 10 seconds.",
    name: "Priya Nair",
    role: "Compass · Chicago",
    sold: "ROI in week 1",
    img: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop&crop=faces",
  },
  {
    quote: "The expired scripts alone paid for a year of Pro. 3 FSBO listings from 8 calls.",
    name: "Derek Okafor",
    role: "eXp Realty · Atlanta",
    sold: "3 FSBOs in 30 days",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
  },
  {
    quote: "IG captions stop the scroll. MLS sounds like me but 10x better. Only tool I pay for.",
    name: "Marcus Chen",
    role: "Keller Williams · Denver",
    sold: "9 homes since Jan",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  },
];

export default function Testimonials() {
  return (
    <section data-testid="testimonials-section" className="bg-white border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">

        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Field Reports</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40 shrink-0">★ 4.9 · 127 agents · verified</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/12 border border-ink/12">
          {testimonials.map((t) => (
            <figure key={t.name} className="bg-white p-6 flex flex-col gap-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-vermillion text-xs">★</span>
                ))}
              </div>
              <blockquote className="font-display italic text-base leading-snug text-ink flex-1">
                "{t.quote}"
              </blockquote>
              <figcaption className="border-t border-ink/8 pt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-vermillion/10 shrink-0 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="font-heading text-sm font-semibold text-vermillion">
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

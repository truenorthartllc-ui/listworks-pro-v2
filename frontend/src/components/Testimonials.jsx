const testimonials = [
  {
    quote: "Three listings in one morning. Two went under contract in under a week. My IG now gets more DMs than I can handle.",
    name: "Jessica Martinez",
    role: "RE/MAX Premier · Los Angeles",
    city: "Los Angeles",
    img: "https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    sold: "12 homes in 90 days",
  },
  {
    quote: "The Instagram captions stop the scroll. The MLS sounds like I wrote it at 2am — but 10x better. This is the only tool I pay for.",
    name: "Marcus Chen",
    role: "Keller Williams Integrity · Denver",
    city: "Denver",
    img: "https://images.unsplash.com/photo-1624435707004-1e84d9ecbfcf?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    sold: "9 homes since Jan",
  },
  {
    quote: "I was spending $200/month on a copywriter. This does it better in 10 seconds. Cancelled that contract cold.",
    name: "Priya Nair",
    role: "Compass · Chicago",
    city: "Chicago",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    sold: "ROI in week 1",
  },
  {
    quote: "The expired listing scripts alone paid for a year of Pro. Called 8 FSBOs, got 3 listings out of it.",
    name: "Derek Okafor",
    role: "eXp Realty · Atlanta",
    city: "Atlanta",
    img: "https://images.unsplash.com/photo-1531891437562-4301cf35b7e7?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    sold: "3 FSBOs in 30 days",
  },
];

export default function Testimonials() {
  return (
    <section data-testid="testimonials-section" className="bg-oat border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Field Reports</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              <span className="font-light">Agents who use it,</span><br />
              <span className="italic">close faster.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/15 border border-ink/15">
          {testimonials.map((t, i) => (
            <figure key={t.name} data-testid={`testimonial-${i}`} className="bg-oat p-6 md:p-8 flex flex-col hover-rise">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(t.rating)].map((_, si) => (
                  <span key={si} className="text-vermillion text-sm">★</span>
                ))}
              </div>
              <span className="font-display text-vermillion text-4xl leading-none">"</span>
              <blockquote className="mt-1 font-display italic text-lg md:text-xl leading-[1.3] text-ink flex-1">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-ink/10 flex items-center gap-3">
                <img src={t.img} alt={t.name} className="w-11 h-11 object-cover rounded-full grayscale" />
                <div>
                  <div className="font-heading text-xs uppercase tracking-[0.1em]">{t.name}</div>
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink/50 mt-0.5">{t.role}</div>
                  <div className="font-mono text-[10px] tracking-[0.12em] text-vermillion mt-0.5">{t.sold}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 font-mono text-[11px] tracking-[0.15em] uppercase text-ink/50">
          <span>★ 4.9 / 5 from 127 agents</span>
          <span>·</span>
          <span>Verified reviews</span>
          <span>·</span>
          <span>No solicitation</span>
        </div>
      </div>
    </section>
  );
}

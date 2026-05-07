const testimonials = [
  {
    quote: "Saved me 20 minutes on every new listing. My MLS sounds intentional now — not robotic.",
    name: "Sarah Johnson", role: "eXp Realty · Austin",
    img: "https://images.unsplash.com/photo-1633625510483-c177f4308f33?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxyZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3ODExMjkxOHww&ixlib=rb-4.1.0&q=85",
  },
  {
    quote: "The tone sounds more like my brand than ChatGPT. The Instagram captions actually get saves.",
    name: "Marcus Chen", role: "Keller Williams · Denver",
    img: "https://images.unsplash.com/photo-1624435707004-1e84d9ecbfcf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwyfHxyZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3ODExMjkxOHww&ixlib=rb-4.1.0&q=85",
  },
  {
    quote: "Three listings in one morning. Two went under contract in under a week. This is unreal.",
    name: "Jessica Martinez", role: "RE/MAX · Los Angeles",
    img: "https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3ODExMjkxOHww&ixlib=rb-4.1.0&q=85",
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/15 border border-ink/15">
          {testimonials.map((t, i) => (
            <figure key={t.name} data-testid={`testimonial-${i}`} className="bg-oat p-8 md:p-10 hover-rise">
              <span className="font-display text-vermillion text-6xl leading-none">"</span>
              <blockquote className="mt-2 font-display italic text-2xl md:text-[28px] leading-[1.2] text-ink">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-ink/10 flex items-center gap-4">
                <img src={t.img} alt={t.name} className="w-12 h-12 object-cover grayscale" />
                <div>
                  <div className="font-heading text-sm uppercase tracking-[0.12em]">{t.name}</div>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/50 mt-1">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

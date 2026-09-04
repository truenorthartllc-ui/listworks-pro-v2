export default function PresentationShowcase() {
  const sections = [
    "Agent Bio", "Meet the Team", "Testimonials", "Recently Sold",
    "Market Snapshot", "CMA Worksheet", "3 Pricing Strategies", "Net Proceeds Calculator",
    "Commission Breakdown", "Home Value Range", "Marketing Plan", "Marketing Calendar",
    "Staging Guide", "ROI Calculator", "Photo Prep", "Buyer Sources",
    "6-Step Process", "30/60/90 Plan", "Showing Guide", "Offer Strategy",
    "Offer Comparison", "Inspection Guide", "Pre-Inspection", "Appraisal Guide",
    "Closing Timeline", "Moving Checklist", "Home Warranty", "Neighborhood Guide",
    "Pre-Listing Checklist", "Seller Preferences", "NAR Disclosure", "CO AI Act",
    "FAQ", "Digital Analytics", "Referral Program", "Post-Closing",
  ];

  return (
    <section className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-12 gap-6 mb-10">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Win More Listings</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] text-ink mb-3">
              <span className="font-light">55-Page</span>{' '}
              <span className="italic">Listing Presentation</span>
            </h2>
            <p className="font-body text-ink/60 max-w-xl text-base md:text-lg leading-relaxed mb-6">
              Fill-in-the-blank template. CMA worksheets, net proceeds calculator, marketing calendar, compliance pages. Works in your browser — no software needed.
            </p>
            <a
              href="https://buy.stripe.com/dRmbJ36E8f0u6nt0DZafS06"
              className="inline-flex items-center gap-2 bg-ink text-oat hover:bg-vermillion px-6 py-3.5 font-heading text-sm uppercase tracking-[0.15em] transition"
            >
              Buy Template — $27
            </a>
            <a
              href="/listing-presentation.html"
              className="inline-flex items-center gap-2 ml-3 border border-ink/20 hover:border-ink/50 px-6 py-3.5 font-heading text-sm uppercase tracking-[0.15em] transition"
            >
              Preview All Pages →
            </a>
          </div>
        </div>

        <div className="border border-ink/15 bg-oat">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/15">
            <div className="bg-oat p-4 md:p-6">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-vermillion block mb-3">Cover</span>
              <div className="aspect-[3/4] bg-ink/5 border border-ink/10 overflow-hidden">
                <img src="/presentation-pages/page_01.jpg" alt="Listing presentation cover page" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="bg-oat p-4 md:p-6">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-vermillion block mb-3">CMA Worksheet</span>
              <div className="aspect-[3/4] bg-ink/5 border border-ink/10 overflow-hidden">
                <img src="/presentation-pages/page_05.jpg" alt="CMA worksheet page" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="bg-oat p-4 md:p-6">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-vermillion block mb-3">Net Proceeds</span>
              <div className="aspect-[3/4] bg-ink/5 border border-ink/10 overflow-hidden">
                <img src="/presentation-pages/page_13.jpg" alt="Net proceeds calculator page" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="bg-oat p-4 md:p-6">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-vermillion block mb-3">Marketing Calendar</span>
              <div className="aspect-[3/4] bg-ink/5 border border-ink/10 overflow-hidden">
                <img src="/presentation-pages/page_15.jpg" alt="Marketing calendar page" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 block mb-4">36 Fillable Sections</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {sections.map((s) => (
              <span key={s} className="font-body text-sm text-ink/70 before:content-['—'] before:text-ink/20 before:mr-2">{s}</span>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-ink/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink/40">
            Instant download · Editable HTML + PDF · Free updates · 30-day guarantee
          </p>
          <a
            href="/listing-presentation.html"
            className="font-mono text-[11px] tracking-[0.15em] uppercase text-vermillion hover:underline shrink-0"
          >
            View Full Preview & Details →
          </a>
        </div>
      </div>
    </section>
  );
}
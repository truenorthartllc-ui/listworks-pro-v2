export default function Marquee() {
  const items = [
    "EXP REALTY", "KELLER WILLIAMS", "RE/MAX", "COMPASS", "SOTHEBY'S",
    "COLDWELL BANKER", "DOUGLAS ELLIMAN", "CENTURY 21", "CORCORAN", "BERKSHIRE HATHAWAY",
  ];
  return (
    <section data-testid="marquee-section" className="border-b border-ink/15 bg-coal text-oat overflow-hidden marquee">
      <div className="marquee-track py-5">
        {[...items, ...items].map((label, i) => (
          <div key={i} className="flex items-center gap-12 px-6 shrink-0">
            <span className="font-display italic text-xl md:text-2xl text-oat/90 whitespace-nowrap">{label}</span>
            <span className="text-vermillion font-mono text-xs">✦</span>
          </div>
        ))}
      </div>
    </section>
  );
}

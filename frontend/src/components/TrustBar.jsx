const BROKERAGES = [
  "Keller Williams",
  "eXp Realty",
  "Compass",
  "RE/MAX",
  "Coldwell Banker",
  "Century 21",
  "Berkshire Hathaway",
  "Sotheby's Int'l",
];

export default function TrustBar() {
  return (
    <div className="border-b border-ink/10 bg-white/40 py-4 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 whitespace-nowrap shrink-0">
          Trusted by agents at
        </span>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {BROKERAGES.map(b => (
            <span key={b} className="font-heading text-[11px] uppercase tracking-[0.15em] text-ink/25 whitespace-nowrap">
              {b}
            </span>
          ))}
        </div>
        <span className="ml-auto font-mono text-[10px] tracking-[0.15em] text-ink/35 whitespace-nowrap hidden md:block">
          + independent agents nationwide
        </span>
      </div>
    </div>
  );
}

import { Wand2, ScanLine, Mic } from "lucide-react";

const features = [
  { icon: Wand2, title: "Five-format rewrite", body: "MLS, Instagram, Facebook, headlines, email — one pass, five assets." },
  { icon: ScanLine, title: "Photo recognition", body: "Upload photos. We find hardwood, marble, vaulted ceilings — into feelings." },
  { icon: Mic, title: "Five tone modes", body: "Luxury. Cozy. Modern. Family. Investor. Same property, different buyer." },
];

export default function Features() {
  return (
    <section data-testid="features-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex-1 flex items-start gap-3">
                <Icon className="w-4 h-4 text-vermillion mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-base tracking-tight">{f.title}</h3>
                  <p className="font-body text-[11px] text-ink/50 leading-relaxed mt-0.5">{f.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

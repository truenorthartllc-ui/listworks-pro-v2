import { Wand2, ScanLine, Mic, Zap, Layers, ShieldCheck, Box } from "lucide-react";

const features = [
  { icon: Wand2, title: "Five-format rewrite", body: "MLS, Instagram, Facebook, headlines, email — all in one pass. Your boring draft becomes five publish-ready assets." },
  { icon: ScanLine, title: "Photo recognition", body: "Upload listing photos. We surface marble, hardwood, vaulted ceilings — and translate them into feelings." },
  { icon: Mic, title: "Five tone modes", body: "Luxury. Cozy. Modern. Family. Investor. The same property, dialed for the buyer who's actually shopping." },
  { icon: Zap, title: "10-second turnaround", body: "Average generation: ten seconds. Beats your average MLS upload form by a country mile." },
  { icon: Layers, title: "Saved listing history", body: "Every rewrite saved to your session. Revisit, refine, regenerate without re-typing a single word." },
  { icon: ShieldCheck, title: "MLS-compliant by default", body: "Trained on the Feature → Benefit → Feeling framework. No clichés, no fluff, no fair-housing landmines." },
  { icon: Box, title: "360° Virtual Tour embeds", body: "Plug in any Matterport, Kuula, or CloudPano link. Buyers explore the home in immersive 3D right from your listing." },
];

export default function Features() {
  return (
    <section data-testid="features-section" className="border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Specifications</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              <span className="font-light">Built like a tool.</span><br />
              <span className="italic">Reads like a human.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-px bg-ink/15 border border-ink/15">
          {features.map((f, i) => {
            const Icon = f.icon;
            const span = i === 0 ? "col-span-12 md:col-span-6 lg:col-span-5" : i === 1 ? "col-span-12 md:col-span-6 lg:col-span-4" : i === 2 ? "col-span-12 md:col-span-12 lg:col-span-3" : "col-span-12 md:col-span-6 lg:col-span-4";
            return (
              <div key={f.title} data-testid={`feature-${i}`} className={`${span} bg-oat p-7 md:p-9 hover-rise`}>
                <Icon className="w-6 h-6 text-vermillion mb-6" strokeWidth={1.5} />
                <h3 className="font-display text-2xl md:text-3xl tracking-tight leading-tight mb-3">{f.title}</h3>
                <p className="font-body text-ink/70 leading-relaxed">{f.body}</p>
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40 block mt-6">No. {String(i + 1).padStart(2, "0")}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

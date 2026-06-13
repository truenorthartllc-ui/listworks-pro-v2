import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import CITIES from "@/data/cities";

export default function CityPage() {
  const { city } = useParams();
  const data = CITIES.find((c) => c.slug === city);

  useEffect(() => {
    if (data) document.title = `${data.city} MLS Description Generator — ListWorks PRO`;
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen bg-oat flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">City not found</h1>
          <Link to="/" className="text-vermillion underline">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oat text-ink font-body">
      <div className="max-w-[900px] mx-auto px-6 py-20 md:py-28">
        <div className="mb-12">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ {data.city}</span>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05] mt-4">
            <span className="font-light">{data.city} MLS Description Generator</span><br />
            <span className="italic">AI listing copy for {data.city} agents.</span>
          </h1>
          <p className="font-body text-lg text-ink/70 mt-6 max-w-2xl leading-relaxed">
            {data.intro}
          </p>
          <div className="mt-8">
            <a href="/#playground" className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] inline-block">
              Rewrite Your {data.city} Listing Free
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="border border-ink/15 p-6">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">/ Why It Matters</span>
            <p className="font-body text-ink/80 mt-3 leading-relaxed">{data.why_matters}</p>
          </div>
          <div className="border border-ink/15 p-6">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">/ Local Market</span>
            <p className="font-body text-ink/80 mt-3 leading-relaxed">{data.local_market}</p>
          </div>
        </div>

        <h2 className="font-display text-3xl tracking-tight mb-6">What ListWorks PRO Does for {data.city} Agents</h2>
        <div className="space-y-4 mb-12">
          {data.features.map((f, i) => (
            <div key={i} className="border border-ink/15 p-5 flex items-start gap-4">
              <span className="text-vermillion font-bold mt-0.5">✓</span>
              <div>
                <span className="font-display font-medium">{f.title}</span>
                <p className="font-body text-ink/70 text-sm mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-ink text-oat p-8 mb-12">
          <h3 className="font-display text-2xl tracking-tight mb-3">Fair Housing Compliant</h3>
          <p className="font-body text-oat/70 leading-relaxed">
            Every rewrite is automatically scanned for Fair Housing violations. HUD penalties start at $26,262. ListWorks keeps you protected.
          </p>
        </div>

        <div className="text-center border-t border-ink/15 pt-10">
          <p className="font-body text-ink/60 mb-4">3 free rewrites — no credit card needed</p>
          <a href="/#playground" className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] inline-block">
            Try ListWorks PRO Free
          </a>
        </div>

        <div className="mt-16 border-t border-ink/15 pt-10">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40">Other Cities</span>
          <div className="flex flex-wrap gap-3 mt-4">
            {CITIES.filter(c => c.slug !== city).slice(0, 8).map((c) => (
              <Link key={c.slug} to={`/city/${c.slug}`} className="font-mono text-[11px] tracking-[0.1em] uppercase text-vermillion hover:underline border border-ink/15 px-3 py-1.5">
                {c.city}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

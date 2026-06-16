import { useState } from "react";
import axios from "axios";
import { Loader2, MapPin, GraduationCap, Utensils, TreePine } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EXAMPLE = {
  address: "2841 West 6th St, Austin TX 78703",
  schools: "Mathews Elementary — 8/10  ·  0.3 mi",
  dining: "Uchi · Whole Foods · Radio Coffee  ·  walk",
  transit: "Walk Score 91 · 2 parks within 0.5 mi",
  paragraph:
    "Steps from Uchi and some of Austin's best coffee on West 6th, with Mathews Elementary a short walk away and Pease District Park two blocks north. A 91 Walk Score means most errands stay car-free — rare for this price range.",
};

export default function NeighborhoodInsights() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fetch = async () => {
    if (!address.trim() || address.trim().length < 8) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const { data } = await axios.post(`${API}/local-gems`, {
        address: address.trim(),
        session_id: localStorage.getItem("lw_session_id") || undefined,
      });
      setResult(data.paragraph);
    } catch {
      setError("Couldn't fetch neighborhood data — check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  const active = result || (!loading && !error);
  const displayParagraph = result || EXAMPLE.paragraph;
  const isExample = !result;

  return (
    <section className="bg-white border-t border-b border-ink/10 py-24 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-ink" />
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink/50">
                Neighborhood Intelligence
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05] text-ink mb-6">
              Your listing.<br />
              <span className="italic">Their neighborhood,</span> written in.
            </h2>
            <p className="font-body text-base md:text-lg text-ink/70 leading-relaxed max-w-lg">
              Paste any address. ListWorks pulls live school ratings, walkable dining, and transit data —
              then writes it into your listing automatically. No copy-pasting. No guessing. Real data, specific names.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 flex items-end">
            <div className="flex flex-col gap-3 w-full">
              {[
                { icon: GraduationCap, label: "School ratings", detail: "Live GreatSchools data" },
                { icon: Utensils, label: "Nearby dining", detail: "Restaurants, cafes, grocers" },
                { icon: TreePine, label: "Parks & transit", detail: "Walk Score, bike, bus" },
              ].map(({ icon: Icon, label, detail }) => (
                <div key={label} className="flex items-center gap-4 border border-ink/12 px-4 py-3">
                  <Icon className="w-4 h-4 text-ink/40 flex-shrink-0" />
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink">{label}</div>
                    <div className="font-body text-xs text-ink/50 mt-0.5">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive demo */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left — input + data cards */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-oat border border-ink/12 p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-3">
                Try it — any US address
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setResult(null); setError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && fetch()}
                    placeholder="123 Main St, Austin TX"
                    className="w-full pl-9 pr-3 py-3 border border-ink/20 bg-white font-body text-sm text-ink placeholder:text-ink/30 focus:border-ink/60 outline-none"
                  />
                </div>
                <button
                  onClick={fetch}
                  disabled={loading || address.trim().length < 8}
                  className="btn-vermillion px-5 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                </button>
              </div>

              {error && (
                <p className="mt-3 font-body text-xs text-vermillion">{error}</p>
              )}

              {/* Data point chips */}
              <div className="mt-5 space-y-2">
                {[
                  { icon: GraduationCap, value: isExample ? EXAMPLE.schools : null, label: "Schools" },
                  { icon: Utensils, value: isExample ? EXAMPLE.dining : null, label: "Dining" },
                  { icon: TreePine, value: isExample ? EXAMPLE.transit : null, label: "Transit" },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-start gap-3 bg-white border border-ink/10 px-4 py-2.5">
                    <Icon className="w-3.5 h-3.5 text-ink/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 block">{label}</span>
                      <span className="font-body text-sm text-ink leading-snug">
                        {value || <span className="text-ink/25 italic">will appear here</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {isExample && (
                <p className="mt-3 font-mono text-[10px] tracking-[0.1em] text-ink/30 uppercase">
                  Example: {EXAMPLE.address}
                </p>
              )}
            </div>
          </div>

          {/* Right — AI paragraph output */}
          <div className="col-span-12 lg:col-span-7">
            <div className="h-full border border-ink/12 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50">
                  Neighborhood paragraph — ready to paste
                </span>
                {isExample && (
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink/30 border border-ink/15 px-2 py-1">
                    Example output
                  </span>
                )}
                {result && (
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-green-600 border border-green-200 px-2 py-1">
                    Live result
                  </span>
                )}
              </div>

              <blockquote className="flex-1 font-display italic text-xl md:text-2xl text-ink leading-relaxed border-l-2 border-vermillion pl-6">
                {loading ? (
                  <span className="text-ink/30 not-italic font-body text-base">
                    Pulling schools, restaurants, and transit data…
                  </span>
                ) : (
                  displayParagraph
                )}
              </blockquote>

              <div className="mt-8 pt-6 border-t border-ink/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a
                  href="#playground"
                  className="btn-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.15em]"
                >
                  Add this to my listing
                </a>
                <p className="font-body text-xs text-ink/50">
                  Enter any address in the tool above — the neighborhood paragraph is added to your draft automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

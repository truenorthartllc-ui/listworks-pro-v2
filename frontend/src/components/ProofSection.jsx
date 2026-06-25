import { useState, useRef, useCallback } from "react";
import axios from "axios";
import { Loader2, MapPin, GraduationCap, Utensils, TreePine, TrendingUp, ArrowRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BEFORE = "3 bed 2 bath ranch. Updated kitchen with granite. Fenced backyard. Close to top-rated schools. Move-in ready.";
const AFTER_COPY = "Imagine Saturday mornings here: coffee in hand, sunlight pouring across granite countertops while pancakes sizzle and the kids race through the backyard — your backyard, fully fenced, where memories are made and worries stay outside the gate.\n\nMove-in ready means exactly that — no projects, no contractors, just keys and boxes.";
const AFTER_NEIGHBORHOOD = "Steps from Uchi and some of Austin's best coffee on West 6th, with Mathews Elementary a short walk away and Pease District Park two blocks north. A 91 Walk Score means most errands stay car-free — rare for this price range.";

const EXAMPLE_ADDR = "2841 West 6th St, Austin TX 78703";
const EXAMPLE = {
  schools: "Mathews Elementary — 8/10 · 0.3 mi",
  dining: "Uchi · Whole Foods · Radio Coffee · walk",
  transit: "Walk Score 91 · 2 parks within 0.5 mi",
  paragraph: AFTER_NEIGHBORHOOD,
};

function ScoreBar({ score, color }) {
  const pct = Math.round((score / 10) * 100);
  const bar = score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50">Listing Strength</span>
        <span className="font-mono text-sm font-bold" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProofSection() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timerRef = useRef(null);

  const fetchNeighborhood = useCallback(async (addr) => {
    if (!addr || addr.trim().length < 8) return;
    setLoading(true);
    setLiveData(null);
    setError(null);
    setShowSuggestions(false);
    try {
      const { data } = await axios.post(`${API}/local-gems`, {
        address: addr.trim(),
        session_id: localStorage.getItem("lw_session_id") || undefined,
      });
      setLiveData(data);
    } catch {
      setError("Couldn't fetch neighborhood data — check the address and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value) => {
    setAddress(value);
    setLiveData(null);
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/autocomplete`, { params: { q: value } });
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
      } catch { /* ignore */ }
    }, 300);
  };

  const pickSuggestion = (s) => {
    setAddress(s.description);
    setSuggestions([]);
    setShowSuggestions(false);
    fetchNeighborhood(s.description);
  };

  const display = liveData || EXAMPLE;
  const isExample = !liveData;

  return (
    <section className="border-b border-ink/15 bg-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">

        {/* Header */}
        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ Receipts</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">The same listing. Their neighborhood, written in.</span>
        </div>

        {/* Before / After */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/15 border border-ink/15">
          {/* Before */}
          <div className="bg-ink/5 p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 font-semibold">Before</span>
              <span className="flex-1" />
              <span className="font-mono text-[9px] text-ink/25 uppercase tracking-widest">Generic draft</span>
            </div>
            <p className="font-mono text-sm text-ink/50 leading-relaxed italic flex-1">
              "{BEFORE}"
            </p>
            <ScoreBar score={3.5} color="#a0a0a0" />
          </div>

          {/* After */}
          <div className="bg-white p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion font-semibold">After / ListWorks</span>
            </div>
            <p className="font-display text-base leading-relaxed text-ink mb-5 whitespace-pre-line">{AFTER_COPY}</p>

            {/* Neighborhood paragraph callout */}
            <div className="border-l-2 border-vermillion bg-vermillion/5 pl-4 pr-3 py-3 mb-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vermillion block mb-2">
                + Neighborhood Intelligence — auto-added
              </span>
              <p className="font-body text-sm text-ink/80 leading-relaxed italic">{AFTER_NEIGHBORHOOD}</p>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              {[["🎓", "Mathews 8/10"], ["🍽", "Uchi · Whole Foods"], ["🚶", "Walk 91"]].map(([e, t]) => (
                <span key={t} className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">{e} {t}</span>
              ))}
            </div>

            <ScoreBar score={9.2} color="#e84118" />
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a href="#playground"
                className="inline-flex items-center gap-2 bg-vermillion text-oat hover:bg-[#ff2a0e] px-5 py-3 font-heading text-xs uppercase tracking-[0.15em] transition">
                Rewrite Yours <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-green-600 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" /> +56% stronger
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[11px] tracking-[0.18em] uppercase text-ink/50 mb-8">
          3 free rewrites · No credit card · See the difference in 10 seconds
        </p>

        {/* ── Neighborhood Intelligence live demo ── */}
        <div className="border-t border-ink/15 pt-8">
          <div className="flex items-baseline gap-6 mb-6">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink/50 shrink-0">Neighborhood Intelligence</span>
            <div className="flex-1 h-px bg-ink/10" />
            <span className="font-display italic text-base text-ink shrink-0">Try it with any US address.</span>
          </div>
          <div className="mb-6 flex flex-wrap gap-3">
                {[
                  { icon: GraduationCap, label: "School ratings", detail: "Live GreatSchools data" },
                  { icon: Utensils, label: "Nearby dining", detail: "Restaurants, cafes, grocers" },
                  { icon: TreePine, label: "Parks & transit", detail: "Walk Score, bike, bus" },
                ].map(({ icon: Icon, label, detail }) => (
                  <div key={label} className="flex items-center gap-2 border border-ink/12 px-3 py-2 bg-white">
                    <Icon className="w-3.5 h-3.5 text-ink/40 flex-shrink-0" />
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink">{label}</div>
                      <div className="font-body text-[11px] text-ink/50">{detail}</div>
                    </div>
                  </div>
                ))}
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Input + data chips */}
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-white border border-ink/12 p-6">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-3">
                  Try it — any US address
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => handleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (suggestions.length > 0 ? pickSuggestion(suggestions[0]) : fetchNeighborhood(address))}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Start typing any address..."
                      className="w-full pl-9 pr-3 py-3 border border-ink/20 bg-oat/50 font-body text-sm text-ink placeholder:text-ink/30 focus:border-vermillion outline-none transition"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-ink/15 shadow-lg z-50 max-h-60 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <button key={s.place_id || i} onMouseDown={() => pickSuggestion(s)}
                            className="w-full text-left px-4 py-3 font-body text-sm text-ink hover:bg-oat border-b border-ink/5 last:border-0 transition">
                            <MapPin className="inline w-3 h-3 mr-2 text-ink/30" />{s.description}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fetchNeighborhood(address)}
                    disabled={loading || address.trim().length < 8}
                    className="bg-ink text-oat hover:bg-vermillion px-5 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 transition disabled:opacity-40"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                  </button>
                </div>

                {error && <p className="mt-3 font-body text-xs text-vermillion">{error}</p>}

                <div className="mt-5 space-y-2">
                  {[
                    { icon: GraduationCap, value: display.schools, label: "Schools" },
                    { icon: Utensils, value: display.dining, label: "Dining" },
                    { icon: TreePine, value: display.transit, label: "Transit" },
                  ].map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex items-start gap-3 bg-oat border border-ink/10 px-4 py-2.5">
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
                    Example: {EXAMPLE_ADDR}
                  </p>
                )}
              </div>
            </div>

            {/* Paragraph output */}
            <div className="col-span-12 lg:col-span-7">
              <div className="h-full border border-ink/12 bg-white p-8 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50">
                    Neighborhood paragraph — ready to paste
                  </span>
                  <span className={`font-mono text-[9px] tracking-[0.15em] uppercase border px-2 py-1 ${isExample ? "text-ink/30 border-ink/15" : "text-green-600 border-green-200"}`}>
                    {isExample ? "Example output" : "Live result"}
                  </span>
                </div>
                <blockquote className="flex-1 font-display italic text-xl md:text-2xl text-ink leading-relaxed border-l-2 border-vermillion pl-6">
                  {loading ? (
                    <span className="text-ink/30 not-italic font-body text-base">
                      Pulling schools, restaurants, and transit data…
                    </span>
                  ) : display.paragraph}
                </blockquote>
                <div className="mt-8 pt-6 border-t border-ink/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <a href="#playground"
                    className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-6 py-3 font-heading text-xs uppercase tracking-[0.15em] transition">
                    Add this to my listing
                  </a>
                  <p className="font-body text-xs text-ink/50">
                    Enter any address — the neighborhood paragraph is added to your draft automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

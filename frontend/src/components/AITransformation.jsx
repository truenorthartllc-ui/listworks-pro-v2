import { useState, useEffect } from "react";

const MLS = "3 bed 2 bath ranch. Updated kitchen with granite counters. Hardwood floors throughout. Fenced backyard. Close to top-rated schools. Move-in ready.";
const AI_OUTPUT = "Sunlight pours through the front window at 7 a.m. — and that's before you've even reached the kitchen, where granite catches the morning glow and Sunday pancakes practically make themselves. Three bedrooms. Two updated baths. A backyard built for slow weekends and faster dogs.";

export default function AITransformation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="not-prose">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-ink/15">
        <div className={`bg-ink/5 p-6 md:p-8 transition-all duration-700 ${phase >= 1 ? "opacity-40" : "opacity-100"}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/30 font-semibold">MLS Draft</span>
            <span className="flex-1" />
            <span className="font-mono text-[10px] text-ink/20">× boring</span>
          </div>
          <p className="font-mono text-sm text-ink/50 leading-relaxed">{MLS}</p>
        </div>

        <div className={`p-6 md:p-8 transition-all duration-700 ${phase === 0 ? "opacity-0" : phase === 1 ? "opacity-60" : "opacity-100"}`}>
          {phase > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion font-semibold">AI Rewriting</span>
              </div>
              <p className="font-display text-base md:text-lg leading-relaxed text-ink">
                {phase === 1 ? (
                  <span className="text-vermillion">
                    <Typewriter text={AI_OUTPUT} speed={25} onDone={() => setPhase(2)} />
                  </span>
                ) : (
                  AI_OUTPUT
                )}
              </p>
              {phase === 2 && (
                <div className="mt-6 pt-4 border-t border-ink/10 animate-rise">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-green-600 font-semibold">✓ Published</span>
                    <span className="flex-1" />
                    <a href="#playground" className="font-heading text-xs uppercase tracking-[0.15em] text-vermillion hover:text-ink transition">
                      Try it →
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Typewriter({ text, speed, onDone }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return <span>{display}<span className="animate-pulse text-vermillion">|</span></span>;
}

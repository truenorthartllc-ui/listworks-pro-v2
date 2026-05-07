import { useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BeforeAfter() {
  const [examples, setExamples] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    axios.get(`${API}/examples`).then(({ data }) => setExamples(data)).catch(() => {});
  }, []);

  if (!examples.length) return null;
  const ex = examples[active];

  return (
    <section id="examples" data-testid="examples-section" className="border-b border-ink/15 bg-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion">/ Receipts</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              <span className="font-light">The same property,</span><br />
              <span className="italic">two different markets.</span>
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {examples.map((e, i) => (
            <button
              key={e.id}
              data-testid={`example-tab-${i}`}
              onClick={() => setActive(i)}
              data-active={active === i}
              className="tab-pill px-4 py-2 font-heading text-[12px] uppercase tracking-[0.12em]"
            >
              {e.address.split(",")[0]} · {e.tone}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/15 border border-ink/15">
          <div className="bg-white p-7 md:p-10">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50">Before</span>
            <div className="mt-4 h-px bg-ink/10" />
            <p className="mt-6 font-mono text-sm leading-[1.8] text-ink/70">{ex.before}</p>
          </div>
          <div className="bg-coal text-oat p-7 md:p-10 relative grain">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion">After / ListWorks</span>
            <div className="mt-4 h-px bg-oat/15" />
            <p className="mt-6 font-display text-xl md:text-2xl leading-[1.4] italic">{ex.after}</p>
            <p className="mt-6 font-heading text-[11px] uppercase tracking-[0.18em] text-oat/60">{ex.address}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

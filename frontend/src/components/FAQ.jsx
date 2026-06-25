import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Is this just templates?", a: "No. ListWorks is a framework wrapped in a tool. You learn WHY each piece works — then the AI applies it to every listing in your voice. Templates copy. Frameworks compound." },
  { q: "Do I have to use AI?", a: "No. The $20 guide teaches the framework end-to-end so you can write better copy by hand. The AI tool just makes it 27 minutes faster per listing." },
  { q: "Will this sound like ChatGPT?", a: "Not at all. Generic ChatGPT outputs are average because they're trained on every listing on the internet — including the bad ones. ListWorks is tuned on the Feature → Benefit → Feeling framework that top-1% agents actually use." },
  { q: "What if I don't like it?", a: "30-day money-back guarantee on the guide. The tool's free tier lets you try 3 rewrites before you ever pay anything." },
  { q: "Is it MLS-compliant?", a: "Yes. Outputs avoid fair-housing landmines, hyperbole, and unverifiable claims by default. Always review before publishing — same as any draft." },
  { q: "Can my whole brokerage use it?", a: "Yes — the Team plan includes 5 seats, shared listing libraries, and brokerage-specific voice presets. Email hello@listworks.pro for a walkthrough." },
  { q: "How is this different from ChatGPT?", a: "ChatGPT gives you generic real estate text because it's trained on the whole internet. ListWorks is trained on the Feature → Benefit → Feeling framework — the same system that top-1% agents use to close. One prompt, zero filler." },
  { q: "Do the Instagram and Facebook posts actually work?", a: "Yes. Over 200 agents use them weekly. Jessica Martinez (LA) closed 2 listings in under a week from posts generated here. Priya Nair (Chicago) said her IG DMs tripled. The captions are built for scroll-stop, not vanity." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section data-testid="faq-section" className="border-b border-ink/15 bg-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ FAQ</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">The questions we keep getting.</span>
        </div>
        <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <p className="font-body text-sm text-ink/60">
            Don't see yours? Email <a href="mailto:hello@listworks.pro" className="underline decoration-vermillion underline-offset-4">hello@listworks.pro</a>
          </p>
        </div>
        <div className="col-span-12 md:col-span-9">
          <div className="border-t border-ink/15">
            {faqs.map((f, i) => (
              <div key={i} data-testid={`faq-${i}`} className="border-b border-ink/15">
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-6 py-4 text-left group"
                >
                  <span className="font-display text-base md:text-lg tracking-tight">{f.q}</span>
                  <span className="shrink-0 w-8 h-8 border border-ink/30 flex items-center justify-center group-hover:bg-ink group-hover:text-oat group-hover:border-ink transition">
                    {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {open === i && (
                  <p className="pb-4 font-body text-sm text-ink/70 leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

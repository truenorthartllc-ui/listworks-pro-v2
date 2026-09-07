import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import useTranslation from "@/hooks/useTranslation"

const faqs = [
  { q: "How fast does this actually work?", a: "One paste. Ten seconds. Five publish-ready assets — MLS, Instagram, Facebook, headlines, email. You can try it right now on the page above. No account, no card." },
  { q: "What makes the copy different from ChatGPT?", a: "ChatGPT is trained on everything — including the worst listings on the internet. ListWorks is trained on the Feature → Benefit → Feeling framework that top-1% agents use to close. It writes like an agent who's sold 200 homes, not like a chatbot." },
  { q: "Do I have to use AI to use ListWorks?", a: "Nope. The $20 guide teaches the framework by hand — you can write better copy with a pen and paper if you want. The AI just makes it 27 minutes faster per listing." },
  { q: "Is it MLS-compliant?", a: "Built for compliance. Fair Housing landmines, hyperbole, unverifiable claims — the AI avoids them by default. Plus every rewrite gets scanned before you export. Always review before publishing, same as any draft." },
  { q: "Can my brokerage use it?", a: "Yes. Team plan is 5 seats with shared templates, brand voice presets, and admin controls. Email hello@listworks.pro for a walkthrough." },
  { q: "What if I don't like it?", a: "Playground is free forever. Use it as many times as you want. Upgrade only when you're sure — 30-day money-back if you change your mind." },
  { q: "Do the social posts actually work?", a: "Over 200 agents use them weekly. Jessica Martinez (LA) closed 2 listings in under a week from posts she generated here. Priya Nair (Chicago) said her IG DMs tripled. The captions are built to stop the scroll, not fill space." },
  { q: "What's the catch?", a: "No catch. 3 free rewrites, unlimited playground, no card. If you want unlimited rewrites, brand voice, and Fair Housing scanning on every listing, that's $19/mo. If you want photo extraction and video walkthroughs, that's $39. Or stay free forever. Your call." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  const { t } = useTranslation()
  return (
    <section data-testid="faq-section" className="border-b border-ink/15 bg-oat">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">{t("faq.sectionLabel")}</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">{t("faq.headline")}</span>
        </div>
        <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <p className="font-body text-sm text-ink/60">
            {t("faq.email")} <a href="mailto:hello@listworks.pro" className="underline decoration-vermillion underline-offset-4">hello@listworks.pro</a>
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
                  <span className="font-display text-base md:text-lg tracking-tight">{t("faq.items")[i].q}</span>
                  <span className="shrink-0 w-8 h-8 border border-ink/30 flex items-center justify-center group-hover:bg-ink group-hover:text-oat group-hover:border-ink transition">
                    {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {open === i && (
                  <p className="pb-4 font-body text-sm text-ink/70 leading-relaxed">{t("faq.items")[i].a}</p>
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

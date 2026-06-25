import React from 'react';

function QRIcon({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none" className="text-ink">
      <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="3" width="3" height="3" fill="currentColor"/>
      <rect x="13" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="15" y="3" width="3" height="3" fill="currentColor"/>
      <rect x="1" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="15" width="3" height="3" fill="currentColor"/>
      <rect x="13" y="13" width="2" height="2" fill="currentColor"/>
      <rect x="16" y="13" width="2" height="2" fill="currentColor"/>
      <rect x="13" y="16" width="2" height="2" fill="currentColor"/>
      <rect x="16" y="16" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="1" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="4" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="7" width="2" height="2" fill="currentColor"/>
      <rect x="1" y="9" width="2" height="2" fill="currentColor"/>
      <rect x="4" y="9" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="10" width="2" height="2" fill="currentColor"/>
      <rect x="13" y="9" width="2" height="2" fill="currentColor"/>
      <rect x="16" y="9" width="5" height="2" fill="currentColor"/>
    </svg>
  );
}

const tools = [
  {
    label: "Sign QR",
    steps: ["Rewrite any listing", "Download the QR code", "Print on your \"Just Listed\" sign", "Buyer scans → sees listing on phone → you get the lead"],
    badge: "Every sign = a lead magnet",
  },
  {
    label: "Open House Check-in",
    steps: ["Create a check-in event in your dashboard", "Print the QR code", "Tape it to the front door", "Visitors scan → drop name + email → no more paper sign-in sheets"],
    badge: "Auto-captured contacts",
  },
  {
    label: "Showing Feedback",
    steps: ["Print the QR tent card", "Leave it on the counter after a showing", "Buyer scans → rates 1–5 + leaves comment + email", "You get actionable feedback AND a warm lead"],
    badge: "Feedback + lead in one scan",
  },
];

export default function QRFeatures() {
  const [expanded, setExpanded] = React.useState(null);

  return (
    <section className="bg-white border-b border-ink/15">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">

        <div className="flex items-baseline gap-6 mb-8">
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion shrink-0">/ QR Tools</span>
          <div className="flex-1 h-px bg-ink/10" />
          <span className="font-display italic text-lg text-ink shrink-0">Every listing becomes a lead capture point.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/12 border border-ink/12">
          {tools.map((t, idx) => (
            <button
              key={t.label}
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              className="bg-white p-5 flex flex-col gap-4 text-left hover:bg-oat/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-heading text-[11px] uppercase tracking-[0.15em] text-ink block mb-1 group-hover:text-vermillion transition-colors">{t.label}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-vermillion border border-vermillion/30 px-2 py-0.5">{t.badge}</span>
                </div>
                <div className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                  <QRIcon size={52} />
                </div>
              </div>
              <ol className="space-y-1.5">
                {t.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-ink/70 font-body leading-snug">
                    <span className="font-mono text-[10px] text-ink/30 shrink-0 mt-0.5">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              {expanded === idx && (
                <div className="pt-3 border-t border-ink/10 space-y-2">
                  <p className="font-body text-xs text-vermillion font-semibold">What buyers see:</p>
                  <p className="font-body text-xs text-ink/60 leading-relaxed">
                    {idx === 0 && "Full listing page with photos, description, Fair Housing compliant copy, and a contact form. Your lead gets captured the moment they scan."}
                    {idx === 1 && "A mobile-friendly check-in form. Name + email + optional phone. Takes 10 seconds. All leads go straight to your dashboard with timestamp."}
                    {idx === 2 && "A 5-star rating form + comment box + contact capture. Buyers leave feedback anonymously OR drop their info if interested. You get both."}
                  </p>
                  <span className="inline-block font-mono text-[9px] uppercase tracking-[0.1em] text-ink/40 pt-1">Click to collapse ↑</span>
                </div>
              )}
              {expanded !== idx && (
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink/30 pt-1">Click to see what buyers see →</span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-5 font-mono text-[10px] tracking-[0.15em] uppercase text-ink/35">
          No app install required · Works on any phone · Every scan captured to your dashboard
        </p>

      </div>
    </section>
  );
}

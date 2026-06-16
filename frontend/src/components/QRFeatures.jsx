export default function QRFeatures() {
  return (
    <section className="bg-white border-t border-ink/10">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion mb-4 inline-block">QR TOOLS</span>
          <h2 className="font-display text-4xl md:text-5xl leading-tight text-ink mb-4">
            Put your listings everywhere.
          </h2>
          <p className="font-body text-lg text-ink/60 max-w-2xl mx-auto">
            Every rewrite comes with a QR code. Print it on signs, flyers, and cards. 
            Buyers scan — agents get leads.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="border border-ink/15 p-8 rounded-sm">
            <div className="w-12 h-12 bg-ink/5 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="4" height="4"/><rect x="3" y="17" width="4" height="4"/>
                <rect x="17" y="3" width="4" height="4"/><path d="M17 17h4v4h-4z"/>
                <path d="M11 7h2v10h-2z"/><path d="M7 11h10v2H7z"/>
              </svg>
            </div>
            <h3 className="font-display text-xl text-ink mb-2">Sign QR</h3>
            <p className="font-body text-sm text-ink/60 leading-relaxed">
              Generate a QR code for any rewritten listing. Print it on your 
              "Just Listed" sign. Buyers scan to see the listing on their phone.
            </p>
          </div>

          <div className="border border-ink/15 p-8 rounded-sm">
            <div className="w-12 h-12 bg-ink/5 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v4" /><path d="M9 21H5a2 2 0 0 1-2-2v-4" />
                <path d="M21 9v4" /><path d="M3 15v4" /><path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-ink mb-2">Open House Check-in</h3>
            <p className="font-body text-sm text-ink/60 leading-relaxed">
              Create a check-in event, get a QR code, tape it to the door. 
              Visitors scan and leave their name + email. No more paper sign-in sheets.
            </p>
          </div>

          <div className="border border-ink/15 p-8 rounded-sm">
            <div className="w-12 h-12 bg-ink/5 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" />
                <path d="M14 9h2a2 2 0 0 1 2 2v4" /><path d="M10 19h4" />
                <path d="M12 15v3" /><path d="M8 15v3" />
                <path d="M19 11v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-ink mb-2">Showing Feedback</h3>
            <p className="font-body text-sm text-ink/60 leading-relaxed">
              Leave a QR tent card after a showing. Buyers scan, rate the house 
              1–5, leave a comment and their email. You get feedback + a lead.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="font-body text-sm text-ink/40">
            Every scan captures a lead. No app install required. Works on any phone.
          </p>
        </div>
      </div>
    </section>
  );
}

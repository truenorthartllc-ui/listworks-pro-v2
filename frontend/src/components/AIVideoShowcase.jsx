import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Sparkles } from "lucide-react";

/**
 * AIVideoShowcase — the hypnotic homepage demo.
 *
 * 10 aerial photos + female voiceover → one cinematic listing reel
 * generated in seconds. Pure voice + visuals, no music fight.
 */
export default function AIVideoShowcase() {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  // Cache-buster: bump this when re-rendering the demo so browsers pull fresh
  const VIDEO_VERSION = "v9-realmusic";
  const VIDEO_SRC = `/hero-demo.mp4?${VIDEO_VERSION}`;

  // Source photos (small thumbs strip — same Unsplash set the video was built from)
  const sourcePhotos = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=320&q=70&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=320&q=70&auto=format&fit=crop",
  ];

  // Pause when off-screen, resume when visible (saves bandwidth, keeps it feeling alive)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
          setPlaying(true);
        } else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section
      id="showcase"
      data-testid="ai-video-showcase"
      className="relative bg-ink text-oat overflow-hidden border-t border-b border-ink/40"
    >
      {/* subtle warm glow behind video */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,59,34,0.18) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        {/* Section eyebrow */}
        <div className="flex items-center gap-3 mb-8 md:mb-12">
          <span className="h-px w-10 bg-vermillion" />
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-oat/60">
            VIRTUAL TOUR ENGINE — LIVE DEMO
          </span>
        </div>

        <div className="grid grid-cols-12 gap-8 md:gap-12 items-end">
          {/* Headline — left */}
          <div className="col-span-12 lg:col-span-5">
            <h2
              data-testid="showcase-headline"
              className="font-display tracking-tighter leading-[0.95] text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="font-light">Ten photos in.</span>
              <br />
              <span className="italic font-medium">One cinematic reel</span>
              <span className="text-vermillion"> out.</span>
            </h2>
            <p className="mt-8 font-body text-base md:text-lg text-oat/75 leading-relaxed max-w-md">
              No editing software. No after-hours. Just upload your listing
              photos — the AI writes the script, scores the music, and renders
              a 30-second tour ready for Instagram, Facebook, and your email
              blast.
            </p>

            {/* Source photo strip — visual proof */}
            <div className="mt-10">
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-oat/50 mb-3">
                INPUT — 10 RAW PHOTOS
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {sourcePhotos.map((src, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden border border-oat/10 bg-ink/50"
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-vermillion">
                <Sparkles className="w-3 h-3" strokeWidth={2} />
                <span>RENDERED IN 8 SECONDS</span>
              </div>
            </div>
          </div>

          {/* Video — right (dominant) */}
          <div className="col-span-12 lg:col-span-7">
            <div
              data-testid="showcase-video-frame"
              className="relative group aspect-video bg-black border border-oat/15 shadow-[0_30px_120px_-30px_rgba(255,59,34,0.4)] overflow-hidden"
            >
              <video
                ref={videoRef}
                data-testid="showcase-video"
                src={VIDEO_SRC}
                poster="/hero-demo-poster.jpg"
                autoPlay
                muted={muted}
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />

              {/* Tasteful overlay UI — corner badges + controls */}
              {/* Top-left: AI generated badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-ink/70 backdrop-blur-md px-3 py-1.5 border border-oat/15">
                <span className="w-1.5 h-1.5 rounded-full bg-vermillion animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-oat">
                  AI-Voiceover · Live Demo
                </span>
              </div>

              {/* Top-right: ListWorks watermark */}
              <div className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.22em] text-oat/70">
                listworks<span className="text-vermillion">.pro</span>
              </div>

              {/* Center "tap to hear" pulse — only when muted (always-visible CTA) */}
              {muted && (
                <button
                  type="button"
                  onClick={toggleSound}
                  data-testid="showcase-unmute-cta"
                  aria-label="Unmute video"
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group/unmute"
                >
                  <span className="flex items-center gap-3 bg-ink/80 backdrop-blur-md text-oat px-5 py-3 border border-oat/30 shadow-2xl group-hover/unmute:bg-vermillion group-hover/unmute:border-vermillion transition-all">
                    <span className="relative flex w-2.5 h-2.5">
                      <span className="absolute inset-0 rounded-full bg-vermillion opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-vermillion" />
                    </span>
                    <Volume2 className="w-4 h-4" strokeWidth={2} />
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                      Tap · hear me sell this
                    </span>
                  </span>
                </button>
              )}

              {/* Bottom controls — only visible on hover/focus */}
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3 bg-gradient-to-t from-ink/90 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                <button
                  type="button"
                  onClick={togglePlay}
                  data-testid="showcase-toggle-play"
                  aria-label={playing ? "Pause demo video" : "Play demo video"}
                  className="w-10 h-10 flex items-center justify-center bg-oat text-ink hover:bg-vermillion hover:text-oat transition-colors"
                >
                  {playing ? (
                    <Pause className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <Play className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleSound}
                  data-testid="showcase-toggle-sound"
                  aria-label={muted ? "Unmute demo video" : "Mute demo video"}
                  className="w-10 h-10 flex items-center justify-center bg-ink/70 text-oat border border-oat/25 hover:border-vermillion hover:text-vermillion transition-colors"
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <Volume2 className="w-4 h-4" strokeWidth={2} />
                  )}
                </button>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-oat/70">
                  {muted ? "Tap for voiceover" : "Sound on"}
                </span>
              </div>
            </div>

            {/* CTA below video */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href="#playground"
                data-testid="showcase-cta-primary"
                className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] hover:-translate-y-0.5 transition-transform"
              >
                Make My Listing Reel
              </a>
              <a
                href="#pricing"
                data-testid="showcase-cta-secondary"
                className="font-heading text-sm uppercase tracking-[0.18em] text-oat/70 hover:text-vermillion transition-colors underline-offset-4 hover:underline"
              >
                See plans →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom proof bar */}
        <div className="mt-16 md:mt-24 pt-10 border-t border-oat/15 grid grid-cols-2 md:grid-cols-4 gap-px bg-oat/15">
          {[
            { v: "10", l: "Photos In" },
            { v: "30s", l: "Final Length" },
            { v: "1080p", l: "MP4 Quality" },
            { v: "9:16", l: "Reels Format (Pro)" },
          ].map((stat, i) => (
            <div key={i} className="bg-ink p-6">
              <div className="font-display text-4xl md:text-5xl leading-none text-oat">
                {stat.v}
              </div>
              <div className="mt-3 font-heading text-[11px] uppercase tracking-[0.18em] text-oat/55">
                {stat.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

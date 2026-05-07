import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  X, Upload, Play, Pause, Mic, Square, Trash2, Loader2, Film, Download, Lock,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MUSIC_GROUPS = [
  { label: "Dramatic", tracks: [
    { id: "cinematic", name: "Cinematic", emoji: "🎬" },
    { id: "epic", name: "Epic", emoji: "🔥" },
  ]},
  { label: "Smooth", tracks: [
    { id: "luxury", name: "Luxury", emoji: "✨" },
    { id: "piano", name: "Piano", emoji: "🎹" },
  ]},
  { label: "Energy", tracks: [
    { id: "inspiring", name: "Inspiring", emoji: "🚀" },
    { id: "upbeat", name: "Upbeat", emoji: "⚡" },
  ]},
  { label: "Urban", tracks: [
    { id: "modern", name: "Modern", emoji: "🏙" },
    { id: "hiphop", name: "Hip Hop", emoji: "🎤" },
  ]},
  { label: "Silent", tracks: [
    { id: "none", name: "No Music", emoji: "🔇" },
  ]},
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VideoBuilder({ listing, onClose }) {
  const initialSlides = (listing?.headlines || []).slice(0, 3);
  while (initialSlides.length < 4) initialSlides.push("");

  const [photos, setPhotos] = useState([]); // [{name, dataUrl}]
  const [slides, setSlides] = useState(initialSlides.map((s) => s.slice(0, 50)));
  const [musicId, setMusicId] = useState("cinematic");
  const [playingMusicId, setPlayingMusicId] = useState(null);
  const [useAiVoice, setUseAiVoice] = useState(true);
  const [recordedAudio, setRecordedAudio] = useState(null); // dataUrl
  const [recording, setRecording] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentBrokerage, setAgentBrokerage] = useState("");
  const [fmt, setFmt] = useState("16:9");
  const [virtualTour, setVirtualTour] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const previewAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      if (previewAudioRef.current) previewAudioRef.current.pause();
    };
  }, [onClose]);

  const onPhotoUpload = async (files) => {
    const incoming = Array.from(files).slice(0, 12 - photos.length);
    const next = [];
    for (const f of incoming) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const dataUrl = await fileToDataUrl(f);
        next.push({ name: f.name, dataUrl });
      } catch {}
    }
    setPhotos((p) => [...p, ...next].slice(0, 12));
  };

  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const playPreview = (id) => {
    if (id === "none") return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (playingMusicId === id) {
      setPlayingMusicId(null);
      return;
    }
    const a = new Audio(`/assets/music/${id}.mp3`);
    a.volume = 0.6;
    a.play().catch(() => toast.error("Couldn't play preview"));
    a.onended = () => setPlayingMusicId(null);
    previewAudioRef.current = a;
    setPlayingMusicId(id);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recordChunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && recordChunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => setRecordedAudio(reader.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setRecording(true);
      toast("Recording — speak your voiceover.", { duration: 1500 });
    } catch (e) {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleGenerate = async () => {
    if (!photos.length) {
      toast.error("Upload at least one photo.");
      return;
    }
    if (fmt === "9:16") {
      toast.error("9:16 Reels format is a Pro feature. Using 16:9.");
      return;
    }
    setGenerating(true);
    setVideoUrl(null);
    try {
      const payload = {
        listing_id: listing?.id,
        photos: photos.map((p) => p.dataUrl),
        slides: slides.filter((s) => s.trim()).slice(0, 4),
        music_id: musicId,
        voiceover_audio: recordedAudio || null,
        voiceover_text: useAiVoice ? slides.join(". ") : null,
        use_ai_voice: useAiVoice && !recordedAudio,
        agent_name: agentName.trim() || null,
        agent_brokerage: agentBrokerage.trim() || null,
        fmt,
      };
      const { data } = await axios.post(`${API}/video/generate`, payload, { timeout: 240000 });
      const fullUrl = `${process.env.REACT_APP_BACKEND_URL}${data.url}`;
      setVideoUrl(fullUrl);
      toast.success("Your video is ready.");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Video generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      data-testid="video-builder-modal"
      className="fixed inset-0 z-[100] bg-coal/95 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-coal border-b border-oat/15 px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display italic text-2xl md:text-3xl text-oat">Virtual Tour Builder</span>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion">Step 02 · Video</span>
          </div>
          <button
            data-testid="close-video-builder"
            onClick={onClose}
            className="w-10 h-10 border border-oat/30 text-oat hover:bg-oat hover:text-coal transition flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 max-w-[1200px] mx-auto w-full px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 text-oat">
          {/* Left: Photos + Agent + Format */}
          <div className="lg:col-span-7 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-2xl">Photos <span className="text-oat/40 font-mono text-xs ml-2">{photos.length}/12</span></h3>
                <label className="cursor-pointer btn-vermillion px-4 py-2 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> Upload
                  <input
                    data-testid="photo-upload-input"
                    type="file" accept="image/*" multiple
                    onChange={(e) => onPhotoUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
              {photos.length === 0 ? (
                <label
                  data-testid="photo-dropzone"
                  className="block border border-dashed border-oat/30 hover:border-vermillion p-12 text-center cursor-pointer transition"
                >
                  <input type="file" accept="image/*" multiple onChange={(e) => onPhotoUpload(e.target.files)} className="hidden" />
                  <Upload className="w-8 h-8 mx-auto text-oat/50 mb-3" strokeWidth={1.5} />
                  <p className="font-display italic text-xl">Drop photos here</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-oat/50 mt-2">Up to 12 · JPG / PNG</p>
                </label>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} data-testid={`photo-thumb-${i}`} className="relative group aspect-square overflow-hidden border border-oat/15">
                      <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-7 h-7 bg-coal/80 text-oat opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 font-mono text-[9px] tracking-widest uppercase text-oat/80 bg-coal/70 px-1.5">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="font-display text-2xl mb-2">Slides</h3>
              <p className="font-body text-sm text-oat/60 mb-4">Each line becomes its own slide. Keep it punchy — 50 chars max.</p>
              <div className="space-y-3">
                {slides.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-widest text-vermillion w-12">SLIDE {i + 1}</span>
                    <input
                      data-testid={`slide-input-${i}`}
                      value={s}
                      maxLength={50}
                      onChange={(e) => {
                        const next = [...slides]; next[i] = e.target.value; setSlides(next);
                      }}
                      placeholder={i === 0 ? "Where Real Life Feels This Good" : "e.g. Your forever home starts here"}
                      className="flex-1 bg-transparent border border-oat/25 px-3 py-2.5 text-oat placeholder:text-oat/30 outline-none focus:border-vermillion"
                    />
                    <span className="font-mono text-[10px] text-oat/40 w-10 text-right">{s.length}/50</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-display text-2xl mb-4">Agent Info <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-oat/50">shows on final slide</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input data-testid="agent-name-input" placeholder="Agent name" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="bg-transparent border border-oat/25 px-3 py-2.5 placeholder:text-oat/30 outline-none focus:border-vermillion" />
                <input data-testid="agent-brokerage-input" placeholder="Brokerage" value={agentBrokerage} onChange={(e) => setAgentBrokerage(e.target.value)} className="bg-transparent border border-oat/25 px-3 py-2.5 placeholder:text-oat/30 outline-none focus:border-vermillion" />
              </div>
            </section>

            <section>
              <h3 className="font-display text-2xl mb-4">Format</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  data-testid="fmt-16-9-btn"
                  onClick={() => setFmt("16:9")}
                  data-active={fmt === "16:9"}
                  className="px-5 py-3 border font-heading text-[11px] uppercase tracking-[0.12em] transition data-[active=true]:bg-vermillion data-[active=true]:border-vermillion data-[active=true]:text-oat border-oat/30 hover:border-oat"
                >
                  16:9 Landscape
                </button>
                <button
                  data-testid="fmt-9-16-btn"
                  onClick={() => toast("9:16 Reels is a Pro feature.", { duration: 2500 })}
                  className="px-5 py-3 border border-oat/20 text-oat/40 font-heading text-[11px] uppercase tracking-[0.12em] cursor-not-allowed flex items-center gap-2"
                >
                  9:16 Reels <Lock className="w-3 h-3" /> Pro
                </button>
                <label className="px-5 py-3 border border-oat/30 hover:border-oat font-heading text-[11px] uppercase tracking-[0.12em] cursor-pointer flex items-center gap-2">
                  <input type="checkbox" data-testid="virtual-tour-toggle" checked={virtualTour} onChange={(e) => setVirtualTour(e.target.checked)} className="accent-vermillion" />
                  Virtual Tour Mode (AI labels rooms)
                </label>
              </div>
            </section>
          </div>

          {/* Right: Music + Voiceover + Generate */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24 self-start">
            <section>
              <h3 className="font-display text-2xl mb-4">Music Vibe <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-oat/50">tap ▶ to preview</span></h3>
              <div className="space-y-3">
                {MUSIC_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-oat/40 mb-1.5">{group.label}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.tracks.map((t) => (
                        <div key={t.id} className="flex">
                          <button
                            data-testid={`music-${t.id}-btn`}
                            onClick={() => setMusicId(t.id)}
                            data-active={musicId === t.id}
                            className="px-3 py-2 border font-heading text-[11px] uppercase tracking-[0.1em] transition data-[active=true]:bg-vermillion data-[active=true]:border-vermillion data-[active=true]:text-oat border-oat/25 hover:border-oat"
                          >
                            <span className="mr-1">{t.emoji}</span>{t.name}
                          </button>
                          {t.id !== "none" && (
                            <button
                              data-testid={`music-preview-${t.id}`}
                              onClick={() => playPreview(t.id)}
                              className="ml-px w-9 border border-oat/25 hover:border-vermillion text-oat flex items-center justify-center"
                              aria-label={`Preview ${t.name}`}
                            >
                              {playingMusicId === t.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-display text-2xl mb-3">Voiceover</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="ai-voice-toggle"
                    checked={useAiVoice}
                    onChange={(e) => setUseAiVoice(e.target.checked)}
                    className="accent-vermillion w-4 h-4"
                  />
                  <span className="font-body text-sm">Auto AI narration <span className="text-oat/50">(reads your slides aloud)</span></span>
                </label>

                <div className="border border-oat/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-oat/60">Or record your own</span>
                    {recordedAudio && (
                      <button
                        data-testid="clear-recording-btn"
                        onClick={() => setRecordedAudio(null)}
                        className="font-mono text-[10px] uppercase tracking-[0.15em] text-vermillion hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {!recording ? (
                      <button
                        data-testid="record-voiceover-btn"
                        onClick={startRecording}
                        className="border border-oat/30 hover:border-vermillion px-4 py-2 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2"
                      >
                        <Mic className="w-3.5 h-3.5" /> Record
                      </button>
                    ) : (
                      <button
                        data-testid="stop-voiceover-btn"
                        onClick={stopRecording}
                        className="bg-vermillion text-oat px-4 py-2 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5" /> Stop Recording
                      </button>
                    )}
                    {recordedAudio && (
                      <audio data-testid="recorded-audio" src={recordedAudio} controls className="h-8 max-w-[220px]" />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <button
                data-testid="generate-video-btn"
                onClick={handleGenerate}
                disabled={generating || !photos.length}
                className="w-full bg-vermillion hover:bg-[#ff2a0e] text-oat px-7 py-5 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
              >
                {generating ? (<><Loader2 className="w-4 h-4 animate-spin" /> Rendering your video…</>) : (<><Film className="w-4 h-4" /> Generate Listing Video →</>)}
              </button>
              <p className="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase text-oat/50 text-center">
                Photos + AI copy + music = a 30-second listing reel for IG / TikTok / Facebook
              </p>
            </section>

            {videoUrl && (
              <section data-testid="video-result" className="border border-vermillion p-1">
                <video src={videoUrl} controls className="w-full" />
                <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-vermillion">✦ Ready to post</span>
                  <a
                    data-testid="download-video-btn"
                    href={videoUrl}
                    download={`listworks-${listing?.id?.slice(0,8) || 'reel'}.mp4`}
                    className="bg-oat text-coal hover:bg-vermillion hover:text-oat px-4 py-2 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download MP4
                  </a>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

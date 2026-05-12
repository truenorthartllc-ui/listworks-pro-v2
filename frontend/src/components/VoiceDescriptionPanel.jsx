import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, Send, RotateCcw, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VoiceDescriptionPanel({ setRaw, setMode }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [polished, setPolished] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const interimRef = useRef("");

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Your browser doesn't support voice recording. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + " ";
        } else {
          interim += t;
        }
      }
      interimRef.current = interim;
      setTranscript((prev) => {
        const base = prev.replace(interimRef.current, "");
        return base + (final ? final + " " : interim);
      });
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") {
        setError(`Mic error: ${e.error}`);
      }
    };

    recognition.onend = () => {
      if (recording) {
        try { recognition.start(); } catch { setRecording(false); }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setError(null);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  };

  const polish = async () => {
    if (transcript.trim().length < 10) {
      toast.error("Record at least a few words first.");
      return;
    }
    setLoading(true);
    try {
      const session_id = localStorage.getItem("lw_session_id") || "";
      const { data } = await axios.post(`${API}/analyze/voice-description`, {
        transcript: transcript.trim(),
        session_id,
      });
      setPolished(data);
      toast.success("Description polished!");
    } catch {
      toast.error("Polishing failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const useAsInput = () => {
    if (polished?.raw_description) {
      setRaw(polished.raw_description);
      setMode("rewrite");
      toast.success("Loaded into the rewrite tool.");
    }
  };

  const reset = () => { setTranscript(""); setPolished(null); interimRef.current = ""; };

  useEffect(() => () => { if (recognitionRef.current) recognitionRef.current.stop(); }, []);

  return (
    <div className="bg-oat border border-ink/15 p-8 mt-px">
      <div className="flex items-center gap-3 mb-2">
        <Mic className="w-5 h-5 text-vermillion" />
        <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-vermillion">/ Voice-to-Description</span>
      </div>
      <h3 className="font-display text-3xl tracking-tight mb-1">Walk & Talk</h3>
      <p className="font-body text-ink/65 mb-6">Hit record, walk the property, narrate what you see. We'll transcribe and polish it into listing copy.</p>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white border border-ink/15 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60">Live Transcript</span>
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-4 py-2 font-heading text-xs uppercase tracking-[0.12em] transition ${
                  recording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-ink hover:bg-vermillion text-oat"
                }`}
              >
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {recording ? "Stop" : "Start Recording"}
              </button>
            </div>

            <div className="min-h-[180px] bg-oat border border-ink/10 p-4 font-body text-sm leading-relaxed text-ink/80 mb-4">
              {transcript || (
                <span className="text-ink/30 italic">Start talking and your words will appear here...</span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={polish}
                disabled={loading || !transcript.trim()}
                className="flex-1 bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-5 py-3 font-heading text-xs uppercase tracking-[0.12em] transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Polishing..." : "Polish into Listing"}
              </button>
              <button onClick={reset} className="px-4 py-3 border border-ink/20 hover:border-vermillion font-heading text-xs uppercase tracking-[0.12em] transition">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 text-red-600 font-body text-sm">{error}</div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          {polished ? (
            <div className="bg-white border border-ink/15 p-6 h-full">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-vermillion" />
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion">Polished</span>
              </div>
              <div className="font-body text-sm leading-relaxed text-ink/80 whitespace-pre-wrap mb-6">
                {polished.raw_description}
              </div>
              <button
                onClick={useAsInput}
                className="w-full bg-coal hover:bg-ink text-oat px-6 py-3 font-heading text-xs uppercase tracking-[0.12em] transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Use as Input for Rewrite
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8 border-2 border-dashed border-ink/15">
              <div>
                <Mic className="w-10 h-10 text-ink/20 mx-auto mb-3" />
                <div className="font-display italic text-ink/40">Polished description will appear here</div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/30 mt-2">Powered by Claude AI</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
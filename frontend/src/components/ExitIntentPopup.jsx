import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, Zap } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STORAGE_KEY = "lw_exit_shown";

const HEADLINES = [
  "The one where hardwood floors meet Sunday mornings.",
  "Four walls. Infinite weekends.",
  "The kitchen your dinner parties have been waiting for.",
  "Everything you said you'd wait for. It's here.",
  "This is what 'turn-key' actually means.",
  "Space for the life you're building.",
  "More than a home — a head start.",
  "The backyard your summers have been missing.",
  "Priced to move. Built to stay.",
  "Where the commute ends and the life begins.",
];

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const handler = (e) => {
      if (e.clientY < 8) {
        setVisible(true);
        localStorage.setItem(STORAGE_KEY, "1");
        document.removeEventListener("mouseleave", handler);
      }
    };

    // Small delay so it doesn't fire immediately on page load
    const t = setTimeout(() => {
      document.addEventListener("mouseleave", handler);
    }, 8000);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mouseleave", handler);
    };
  }, []);

  const submit = async () => {
    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const session_id = localStorage.getItem("lw_session_id") || "";
      await axios.post(`${API}/capture-email`, { email, session_id });
      setDone(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[999] p-4">
      <div className="bg-oat border border-ink/15 max-w-lg w-full relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-ink/30 hover:text-ink transition"
        >
          <X className="w-4 h-4" />
        </button>

        {!done ? (
          <div className="p-8 md:p-10">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-vermillion">/ Free Download</span>
            <h2 className="mt-2 font-display text-3xl md:text-4xl tracking-tight leading-[1.1]">
              <span className="font-light">Before you go —</span><br />
              <span className="italic">50 headlines that sell.</span>
            </h2>
            <p className="mt-3 font-body text-sm text-ink/60 leading-relaxed">
              50 high-converting MLS headlines, organized by property type. Copy, paste, close more deals. Free.
            </p>

            <div className="mt-5 space-y-1.5 border border-ink/10 p-4 bg-white/40">
              {HEADLINES.slice(0, 5).map((h, i) => (
                <p key={i} className="font-body text-xs text-ink/65 leading-relaxed">
                  <span className="text-vermillion font-mono text-[9px] mr-2">{String(i + 1).padStart(2, "0")}</span>
                  {h}
                </p>
              ))}
              <p className="font-mono text-[9px] text-ink/35 uppercase tracking-widest pt-1">+ 45 more in your inbox</p>
            </div>

            <div className="mt-5 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="your@email.com"
                autoFocus
                className="editorial-input flex-1"
              />
              <button
                onClick={submit}
                disabled={loading}
                className="btn-vermillion px-5 py-2.5 font-heading text-xs uppercase tracking-[0.15em] whitespace-nowrap flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3" />
                {loading ? "Sending…" : "Send Me 50"}
              </button>
            </div>
            <p className="mt-2 font-mono text-[9px] text-ink/35 uppercase tracking-wider">No spam. Unsubscribe anytime.</p>
          </div>
        ) : (
          <div className="p-8 md:p-10 text-center">
            <div className="w-12 h-12 bg-vermillion mx-auto flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-oat" />
            </div>
            <h3 className="font-display text-2xl italic mb-2">On its way.</h3>
            <p className="font-body text-sm text-ink/60 mb-5">Check your inbox for 50 headlines that close.</p>
            <a href="#playground" onClick={() => setVisible(false)}
              className="btn-vermillion inline-block px-6 py-3 font-heading text-xs uppercase tracking-[0.15em]">
              Try 3 Free Rewrites While You Wait →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

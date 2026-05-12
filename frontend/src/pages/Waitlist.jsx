import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, ArrowRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [count] = useState(Math.floor(Math.random() * 200) + 847);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    try {
      await axios.post(`${API}/waitlist/join`, { name, email });
      setDone(true);
      toast.success("You're on the list! Check your email.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-oat flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="font-display text-5xl mb-4">You're in.</h1>
        <p className="font-display italic text-2xl text-ink/70 mb-8 max-w-md">
          {name}, we'll be in touch when your early access is ready. Check your inbox for a welcome note.
        </p>
        <Link to="/" className="bg-vermillion text-oat px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] hover:bg-[#ff2a0e] transition">
          Try the free tool now →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oat">
      <header className="sticky top-0 z-30 bg-oat/95 backdrop-blur-md border-b border-ink/15">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg tracking-tight">
            ListWorks <span className="text-vermillion italic">/PRO</span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/55">/ Early Access</span>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-20 text-center">
        <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-4">
          / {count}+ agents already waiting
        </div>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[1.0] mb-6">
          Stop writing listing copy<br />
          <span className="italic">by hand.</span>
        </h1>
        <p className="font-display italic text-2xl text-ink/70 mb-10 max-w-xl mx-auto">
          ListWorks PRO turns your MLS notes into publish-ready copy in 10 seconds. Instagram, Facebook, headlines, email — all at once.
        </p>

        <div className="bg-white border border-ink/15 p-8 md:p-10 max-w-md mx-auto">
          <h3 className="font-display text-2xl mb-6">Join the early access list</h3>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="text" placeholder="Your name" value={name}
              onChange={e => setName(e.target.value)} required
              className="w-full border border-ink/20 px-4 py-3.5 font-body text-base outline-none focus:border-vermillion transition"
            />
            <input
              type="email" placeholder="Your email" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="w-full border border-ink/20 px-4 py-3.5 font-body text-base outline-none focus:border-vermillion transition"
            />
            <button
              type="submit" disabled={loading}
              className="w-full bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-6 py-4 font-heading text-sm uppercase tracking-[0.12em] transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? "Joining..." : "Get Early Access"}
            </button>
          </form>
          <p className="font-body text-xs text-ink/40 mt-4">No spam. First 3 rewrites free when you get access.</p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto text-center">
          {[
            { val: "3", label: "Free rewrites" },
            { val: "10s", label: "Generation time" },
            { val: "5", label: "Output formats" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-ink/15 p-4">
              <div className="font-display text-3xl text-vermillion">{s.val}</div>
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-10 font-display italic text-ink/40">
          Trusted by agents who are tired of staring at blank MLS description fields.
        </p>
      </main>
    </div>
  );
}
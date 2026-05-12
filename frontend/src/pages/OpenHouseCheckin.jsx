import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Home, Phone, Mail, User, MessageSquare, Send, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OpenHouseCheckin() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    axios.get(`${API}/openhouse/${eventId}/visitors`)
      .then(r => { setEvent(r.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() && !form.email.trim()) {
      toast.error("Please enter at least your name or email.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/openhouse/checkin`, {
        event_id: eventId,
        visitor_name: form.name,
        visitor_phone: form.phone,
        visitor_email: form.email,
        message: form.message,
        source: "qr",
      });
      setDone(true);
      toast.success("You're checked in!");
    } catch {
      toast.error("Check-in failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-oat flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-vermillion" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-oat flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Home className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="font-display text-4xl mb-3">You're checked in!</h1>
        <p className="font-display italic text-xl text-ink/70 mb-8 max-w-md">
          Thanks for visiting. The agent will be in touch soon.
        </p>
        {event?.listing_url ? (
          <a href={event.listing_url} target="_blank" rel="noopener noreferrer"
            className="bg-vermillion text-oat px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] hover:bg-[#ff2a0e] transition">
            View Full Listing →
          </a>
        ) : (
          <Link to="/"
            className="bg-vermillion text-oat px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] hover:bg-[#ff2a0e] transition">
            Try ListWorks PRO Free →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oat">
      <header className="sticky top-0 z-30 bg-oat/95 backdrop-blur-md border-b border-ink/15">
        <div className="max-w-[700px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg tracking-tight">
            ListWorks <span className="text-vermillion italic">/PRO</span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/55">
            / Open House Check-In
          </span>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-vermillion mb-2">
            / {event?.address || "Open House"}
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05] mb-3">
            Hey — welcome<br /><span className="italic">to the open house.</span>
          </h1>
          <p className="font-body text-ink/65 text-lg">
            Leave your info below and the agent will follow up. Takes 10 seconds.
          </p>
        </div>

        <div className="bg-white border border-ink/15 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-ink/20 pl-11 pr-4 py-3.5 font-body text-base outline-none focus:border-vermillion transition"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-ink/20 pl-11 pr-4 py-3.5 font-body text-base outline-none focus:border-vermillion transition"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                type="email"
                placeholder="Email (optional)"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-ink/20 pl-11 pr-4 py-3.5 font-body text-base outline-none focus:border-vermillion transition"
              />
            </div>

            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-ink/40" />
              <textarea
                placeholder="Questions about the property (optional)"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                className="w-full border border-ink/20 pl-11 pr-4 py-3.5 font-body text-base outline-none focus:border-vermillion transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-6 py-4 font-heading text-sm uppercase tracking-[0.12em] transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Checking in..." : "Check In"}
            </button>
          </form>
        </div>

        <p className="font-body text-xs text-ink/40 mt-4 text-center">
          No spam. Your info goes directly to the listing agent.
        </p>
      </main>
    </div>
  );
}
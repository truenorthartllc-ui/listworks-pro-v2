import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Star, ThumbsUp, MessageSquare, Mail, User, Send, Home } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShowingFeedback() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    axios.get(`${API}/qr/showing-feedback/${eventId}`)
      .then(r => { setEvent(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/qr/showing-feedback/submit`, {
        event_id: eventId,
        rating,
        comment: form.comment,
        email: form.email,
        name: form.name,
      });
      setDone(true);
    } catch { setSubmitting(false); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center"><div className="text-amber-400 text-xl animate-pulse">Loading...</div></div>;

  if (done) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-3xl p-8 max-w-md w-full text-center border border-amber-900/30">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ThumbsUp className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Thanks for your feedback!</h1>
        <p className="text-zinc-400 mb-6">{event?.agent_name ? `${event.agent_name} appreciates it.` : "Your agent appreciates the input."}</p>
        {event?.address && <p className="text-zinc-500 text-sm">{event.address}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-3xl p-8 max-w-md w-full border border-amber-900/30">
        <div className="flex items-center gap-3 mb-6">
          <Home className="w-5 h-5 text-amber-400" />
          <div>
            <h1 className="text-lg font-bold text-white">How was the showing?</h1>
            {event?.address && <p className="text-zinc-400 text-sm">{event.address}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-zinc-300 text-sm mb-2">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    n <= (hoverRating || rating) ? "bg-amber-500/20 text-amber-400 scale-110" : "bg-zinc-800 text-zinc-600"
                  }`}>
                  <Star className={`w-6 h-6 ${n <= (hoverRating || rating) ? "fill-amber-400" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 text-sm mb-2">Your name (optional)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50"
                placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 text-sm mb-2">Email (optional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50"
                placeholder="email@example.com" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 text-sm mb-2">Comments</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <textarea className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50 min-h-[80px]"
                placeholder="What did you like? What could be better?" value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} />
            </div>
          </div>

          <button type="submit" disabled={rating === 0 || submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Feedback"} <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-zinc-600 text-xs text-center mt-4">Powered by <Link to="/" className="text-amber-400/70">ListWorks PRO</Link></p>
      </div>
    </div>
  );
}

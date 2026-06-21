import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Clock, Trash2, Plus, CalendarDays } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "Stories", "Twitter/X"];

function toLocalInputValue(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
  } catch { return ""; }
}

export default function SchedulerPanel() {
  const session_id = localStorage.getItem("lw_session_id");
  const [form, setForm] = useState({
    email: localStorage.getItem("lw_email") || "",
    platform: "Instagram",
    content: "",
    note: "",
    scheduled_at: "",
  });
  const [loading, setLoading] = useState(false);
  const [scheduled, setScheduled] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!session_id) return;
    setLoadingList(true);
    axios.get(`${API}/schedule/list/${session_id}`)
      .then(({ data }) => setScheduled(data.posts || []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [session_id]);

  const schedule = async () => {
    if (!form.email || !form.content.trim() || !form.scheduled_at) {
      toast.error("Email, content, and scheduled time are all required");
      return;
    }
    // Convert local datetime to UTC ISO
    const localDt = new Date(form.scheduled_at);
    if (isNaN(localDt.getTime())) { toast.error("Invalid date/time"); return; }
    if (localDt <= new Date()) { toast.error("Scheduled time must be in the future"); return; }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/schedule/post`, {
        session_id: session_id || undefined,
        email: form.email,
        platform: form.platform,
        content: form.content,
        note: form.note || undefined,
        scheduled_at: localDt.toISOString(),
      });
      setScheduled(s => [...s, {
        id: data.id,
        platform: form.platform,
        note: form.note,
        scheduled_at: data.scheduled_at,
        status: "pending",
      }]);
      setForm(f => ({ ...f, content: "", note: "", scheduled_at: "" }));
      toast.success("Scheduled! You'll get a reminder email when it's time to post.");
    } catch (e) {
      const msg = e?.response?.data?.detail;
      toast.error(typeof msg === "string" ? msg : "Scheduling failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    try {
      await axios.delete(`${API}/schedule/${id}`);
      setScheduled(s => s.filter(p => p.id !== id));
      toast.success("Removed from schedule");
    } catch {
      toast.error("Couldn't remove — try again");
    }
  };

  const formatDt = (iso) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="space-y-8 pb-16">

      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Post Scheduler</span>
        <p className="font-body text-sm text-ink/60">
          Schedule any post for later — we'll email you a reminder with the content ready to copy when it's time.
        </p>
      </div>

      {/* New scheduled post form */}
      <div className="space-y-4 border border-ink/10 p-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40 flex items-center gap-2">
          <Plus className="w-3 h-3" /> New Scheduled Post
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Platform</label>
            <select
              value={form.platform}
              onChange={e => set("platform", e.target.value)}
              className="editorial-input w-full text-sm"
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Schedule For</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => set("scheduled_at", e.target.value)}
              className="editorial-input w-full text-sm"
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Post Content</label>
          <textarea
            value={form.content}
            onChange={e => set("content", e.target.value)}
            placeholder="Paste your caption or copy here — generated from any LW PRO tool…"
            rows={5}
            className="editorial-input w-full text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Your Email (for reminder)</label>
            <input
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="you@youragency.com"
              type="email"
              className="editorial-input w-full text-sm"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Note (optional)</label>
            <input
              value={form.note}
              onChange={e => set("note", e.target.value)}
              placeholder="Just Listed — 123 Elm St"
              className="editorial-input w-full text-sm"
            />
          </div>
        </div>

        <button
          onClick={schedule}
          disabled={loading}
          className="btn-vermillion px-7 py-3 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Scheduling…</>
            : <><Clock className="w-4 h-4" />Schedule Post</>
          }
        </button>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink/35">
          You'll get a confirmation email now + a reminder email at post time
        </p>
      </div>

      {/* Upcoming posts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-ink/30" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">Upcoming Posts</span>
        </div>

        {loadingList && (
          <div className="flex items-center gap-2 text-ink/30 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-xs">Loading…</span>
          </div>
        )}

        {!loadingList && scheduled.length === 0 && (
          <p className="font-body text-sm text-ink/35 py-4">No posts scheduled yet.</p>
        )}

        {scheduled.map(post => (
          <div key={post.id} className="flex items-center justify-between border border-ink/10 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border border-ink/15 text-ink/50 shrink-0">
                {post.platform}
              </span>
              <span className="font-body text-sm text-ink/70 truncate">
                {post.note || "Scheduled post"}
              </span>
              <span className="font-mono text-[10px] text-ink/40 shrink-0">
                {formatDt(post.scheduled_at)}
              </span>
              {post.status === "reminder_sent" && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600">sent</span>
              )}
            </div>
            <button
              onClick={() => deletePost(post.id)}
              className="ml-3 p-1.5 text-ink/30 hover:text-red-500 transition-colors shrink-0"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

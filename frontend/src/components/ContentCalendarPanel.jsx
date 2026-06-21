import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check, Download } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLATFORM_COLORS = {
  Instagram: "bg-pink-50 border-pink-200 text-pink-700",
  Facebook: "bg-blue-50 border-blue-200 text-blue-700",
  LinkedIn: "bg-sky-50 border-sky-200 text-sky-700",
  Stories: "bg-purple-50 border-purple-200 text-purple-700",
};

const CATEGORY_COLORS = {
  "Just Listed": "text-vermillion",
  "Market Update": "text-sky-600",
  "Tips": "text-emerald-600",
  "Testimonial": "text-amber-600",
  "Personal": "text-violet-600",
  "Open House": "text-orange-600",
  "Seasonal": "text-teal-600",
  "Engagement": "text-rose-500",
};

export default function ContentCalendarPanel() {
  const session_id = localStorage.getItem("lw_session_id");
  const [form, setForm] = useState({ specialty: "", active_listing: "", month: "" });
  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [copied, setCopied] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    setLoading(true);
    setCalendar(null);
    try {
      const { data } = await axios.post(`${API}/content-calendar`, {
        session_id: session_id || undefined,
        specialty: form.specialty || undefined,
        active_listing: form.active_listing || undefined,
        month: form.month || undefined,
      });
      setCalendar(data);
      setExpandedDay(null);
    } catch {
      toast.error("Calendar generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyDay = (day) => {
    const text = `${day.date} — ${day.platform}\n${day.hook}\n\n${day.caption}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c => ({ ...c, [day.day]: true }));
      toast.success("Copied!");
      setTimeout(() => setCopied(c => ({ ...c, [day.day]: false })), 2000);
    });
  };

  const exportAll = () => {
    if (!calendar) return;
    const lines = calendar.days.map(d =>
      `--- Day ${d.day}: ${d.date} | ${d.platform} | ${d.category} ---\nHOOK: ${d.hook}\n\n${d.caption}\n`
    );
    const blob = new Blob([`${calendar.month} Content Calendar\n\n` + lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${calendar.month.replace(" ", "-")}-content-calendar.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">

      {/* Header */}
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Content Calendar</span>
        <p className="font-body text-sm text-ink/60">
          Generate a full 30-day social media content plan in your brand voice — one click.
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Month</label>
            <input
              value={form.month}
              onChange={e => set("month", e.target.value)}
              placeholder="July 2026 (leave blank for current month)"
              className="editorial-input w-full text-sm"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Your Specialty</label>
            <input
              value={form.specialty}
              onChange={e => set("specialty", e.target.value)}
              placeholder="Luxury, first-time buyers, investors, relocations…"
              className="editorial-input w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 block mb-1.5">Active Listing to Feature</label>
          <input
            value={form.active_listing}
            onChange={e => set("active_listing", e.target.value)}
            placeholder="3BR ranch in Austin, $485K, just listed — weave it into 4-6 posts"
            className="editorial-input w-full text-sm"
          />
          <p className="mt-1 font-mono text-[9px] text-ink/35 uppercase tracking-wider">Optional — leave blank for general content</p>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Building your calendar…</>
            : <><Sparkles className="w-4 h-4" />Generate 30-Day Calendar</>
          }
        </button>
      </div>

      {/* Calendar output */}
      {calendar && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base uppercase tracking-[0.1em]">{calendar.month}</h3>
            <button
              onClick={exportAll}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 border border-ink/20 hover:border-ink/40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {calendar.days.map(day => (
              <div key={day.day} className="border border-ink/10 overflow-hidden">
                {/* Day row — always visible */}
                <button
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-ink/[0.02] transition-colors"
                >
                  <span className="font-mono text-[11px] text-ink/40 w-16 shrink-0">{day.date}</span>
                  <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded-sm ${PLATFORM_COLORS[day.platform] || "bg-ink/5 border-ink/15 text-ink/50"}`}>
                    {day.platform}
                  </span>
                  <span className={`font-mono text-[9px] uppercase tracking-wider ${CATEGORY_COLORS[day.category] || "text-ink/40"}`}>
                    {day.category}
                  </span>
                  <span className="font-body text-sm text-ink/70 truncate flex-1">{day.hook}</span>
                </button>

                {/* Expanded caption */}
                {expandedDay === day.day && (
                  <div className="border-t border-ink/10 p-4 space-y-3 bg-paper">
                    <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{day.caption}</p>
                    <button
                      onClick={() => copyDay(day)}
                      className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 border border-ink/20 hover:border-vermillion hover:text-vermillion transition-colors"
                    >
                      {copied[day.day] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied[day.day] ? "Copied" : "Copy post"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

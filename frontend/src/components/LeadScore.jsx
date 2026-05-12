import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Target, TrendingUp, TrendingDown, Minus, Loader2, ArrowRight, CheckCircle,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIMELINES = [
  { value: "browsing", label: "Just browsing" },
  { value: "90d", label: "Within 90 days" },
  { value: "60d", label: "Within 60 days" },
  { value: "30d", label: "Within 30 days" },
];

const SOURCES = [
  { value: "referral", label: "Referral" },
  { value: "zillow", label: "Zillow / Realtor.com" },
  { value: "fb", label: "Facebook / IG" },
  { value: "web", label: "Website inquiry" },
  { value: "cold", label: "Cold call / door knock" },
];

const SCORE_TIER = {
  hot: { color: "bg-red-50 border-red-300", badge: "bg-red-500 text-white", label: "HOT", icon: TrendingUp },
  warm: { color: "bg-amber-50 border-amber-300", badge: "bg-amber-500 text-white", label: "WARM", icon: Minus },
  cold: { color: "bg-blue-50 border-blue-300", badge: "bg-blue-500 text-white", label: "COLD", icon: TrendingDown },
};

export default function LeadScore() {
  const [form, setForm] = useState({
    lead_name: "", lead_contact: "", budget: "", timeline: "90d",
    lead_source: "web", prequalified: false, messages_count: 0, showings_scheduled: 0,
    listing_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [listings, setListings] = useState([]);

  useState(() => {
    axios.get(`${API}/seller/listings?session_id=${localStorage.getItem("lw_session_id")}`)
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => {});
  });

  const submit = async () => {
    if (!form.lead_name || !form.listing_id) {
      toast.error("Enter lead name and select a listing");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/leads/score`, {
        ...form,
        session_id: localStorage.getItem("lw_session_id"),
      });
      setScore(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Scoring failed");
    } finally {
      setLoading(false);
    }
  }

  const t = score ? SCORE_TIER[score.tier] : null;
  const TierIcon = t?.icon || TrendingUp;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-coal flex items-center justify-center">
          <Target className="w-5 h-5 text-vermillion" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-display text-2xl">Lead Scoring</h3>
          <p className="font-body text-ink/60 text-sm">Score a buyer lead's close probability. Know who to chase first.</p>
        </div>
      </div>

      <div className="p-8 border border-ink/15 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Lead name</label>
              <input value={form.lead_name} onChange={(e) => setForm({ ...form, lead_name: e.target.value })} className="editorial-input w-full" placeholder="First Last" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Email or phone</label>
              <input value={form.lead_contact} onChange={(e) => setForm({ ...form, lead_contact: e.target.value })} className="editorial-input w-full" placeholder="buyer@email.com" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Listing they're interested in</label>
              <select value={form.listing_id} onChange={(e) => setForm({ ...form, listing_id: e.target.value })} className="editorial-input w-full">
                <option value="">Select listing</option>
                {listings.map((l) => <option key={l.id} value={l.id}>{l.address || l.id.slice(0, 8)}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Budget range</label>
              <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="editorial-input w-full" placeholder="$350k-$450k" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Lead source</label>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <button key={s.value} onClick={() => setForm({ ...form, lead_source: s.value })} data-active={form.lead_source === s.value} className="mode-btn px-3 py-1.5 text-[11px]">{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Timeline</label>
              <div className="flex flex-wrap gap-2">
                {TIMELINES.map((s) => (
                  <button key={s.value} onClick={() => setForm({ ...form, timeline: s.value })} data-active={form.timeline === s.value} className="mode-btn px-3 py-1.5 text-[11px]">{s.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Messages received</label>
                <input type="number" value={form.messages_count} onChange={(e) => setForm({ ...form, messages_count: +e.target.value })} className="editorial-input w-full" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Showings scheduled</label>
                <input type="number" value={form.showings_scheduled} onChange={(e) => setForm({ ...form, showings_scheduled: +e.target.value })} className="editorial-input w-full" />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.prequalified} onChange={(e) => setForm({ ...form, prequalified: e.target.checked })} className="accent-vermillion w-4 h-4" />
              <span className="font-heading text-xs uppercase tracking-[0.1em]">Prequalified / pre-approved buyer</span>
            </label>
          </div>
        </div>

        <button onClick={submit} disabled={loading} className="mt-6 btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Scoring…</> : <><Target className="w-4 h-4" />Score This Lead</>}
        </button>
      </div>

      {score && t && (
        <div className={`mt-6 border-2 ${t.color} p-8`}>
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className={`${t.badge} w-20 h-20 flex flex-col items-center justify-center`}>
                <TierIcon className="w-6 h-6 text-white mb-1" strokeWidth={2.5} />
                <span className="font-display text-3xl leading-none">{score.score}</span>
              </div>
              <span className="absolute -top-2 -right-2 font-mono text-[9px] uppercase tracking-widest bg-coal text-oat px-1.5 py-0.5">{t.label}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-display text-2xl mb-3">Lead: {form.lead_name}</h4>
              {score.signals?.length > 0 && (
                <div className="mb-4">
                  {score.signals.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-vermillion shrink-0" />
                      <span className="font-body text-sm text-ink/80">{s}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-white border border-ink/10 p-4">
                <p className="font-heading text-xs uppercase tracking-[0.12em] text-vermillion mb-2">Agent recommendation</p>
                <p className="font-body text-sm text-ink/80 leading-relaxed">{score.recommendation}</p>
                <div className="mt-3 pt-3 border-t border-ink/10">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Next step: </span>
                  <span className="font-body text-sm text-ink">{score.next_action}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

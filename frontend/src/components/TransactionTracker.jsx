import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Calendar, Clock, AlertTriangle, CheckCircle, ChevronRight, Loader2, Plus,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const URGENCY = {
  overdue: { color: "bg-red-50 border-red-300 text-red-900", badge: "bg-red-500 text-white", icon: AlertTriangle },
  today: { color: "bg-amber-50 border-amber-300 text-amber-900", badge: "bg-amber-500 text-white", icon: Clock },
  soon: { color: "bg-orange-50 border-orange-200 text-orange-900", badge: "bg-orange-500 text-white", icon: Clock },
  normal: { color: "", badge: "", icon: Calendar },
};

export default function TransactionTracker() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    address: "", closing_date: "", inspection_date: "", financing_date: "",
    appraisal_date: "", due_diligence_date: "", agent_name: "", agent_email: "",
  });
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetch = () => {
    axios.get(`${API}/transactions?session_id=${localStorage.getItem("lw_session_id")}`)
      .then(({ data }) => { setTxs(data.transactions || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const submit = async () => {
    if (!form.address || !form.closing_date) {
      toast.error("Address and closing date required");
      return;
    }
    setCreating(true);
    try {
      await axios.post(`${API}/transaction/create`, {
        ...form,
        session_id: localStorage.getItem("lw_session_id"),
      });
      setShowCreate(false);
      setForm({ address: "", closing_date: "", inspection_date: "", financing_date: "", appraisal_date: "", due_diligence_date: "", agent_name: "", agent_email: "" });
      fetch();
      toast.success("Transaction tracked — deadlines loaded");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create transaction");
    } finally {
      setCreating(false);
    }
  };

  const completeTask = async (txId, task) => {
    try {
      await axios.post(`${API}/transaction/deadline-complete`, {
        transaction_id: txId,
        task,
      });
      fetch();
      toast.success("Task completed");
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-vermillion" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-coal flex items-center justify-center">
            <Calendar className="w-5 h-5 text-vermillion" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-display text-2xl">Transaction Tracker</h3>
            <p className="font-body text-ink/60 text-sm">Never miss a deadline again. Auto-generated from your closing date.</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-vermillion hover:bg-[#ff2a0e] text-oat px-5 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 transition">
          <Plus className="w-4 h-4" /> New transaction
        </button>
      </div>

      {txs.length === 0 && !showCreate && (
        <div className="border border-ink/15 p-10 text-center">
          <p className="font-display italic text-2xl text-ink/50 mb-3">No active transactions.</p>
          <p className="font-body text-ink/60 text-sm mb-5">Track a closing to auto-generate your full deadline checklist.</p>
          <button onClick={() => setShowCreate(true)} className="btn-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.15em]">
            + Track a closing
          </button>
        </div>
      )}

      {showCreate && (
        <div className="border border-ink/15 bg-white p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-display text-xl">New transaction</h4>
            <button onClick={() => setShowCreate(false)} className="text-ink/40 hover:text-ink text-2xl leading-none">&times;</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Property address *</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="editorial-input w-full" placeholder="123 Main St, City ST 00000" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Closing date *</label>
              <input type="date" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} className="editorial-input w-full" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Inspection date</label>
              <input type="date" value={form.inspection_date} onChange={(e) => setForm({ ...form, inspection_date: e.target.value })} className="editorial-input w-full" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Financing deadline</label>
              <input type="date" value={form.financing_date} onChange={(e) => setForm({ ...form, financing_date: e.target.value })} className="editorial-input w-full" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Appraisal date</label>
              <input type="date" value={form.appraisal_date} onChange={(e) => setForm({ ...form, appraisal_date: e.target.value })} className="editorial-input w-full" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 block mb-2">Agent email</label>
              <input type="email" value={form.agent_email} onChange={(e) => setForm({ ...form, agent_email: e.target.value })} className="editorial-input w-full" placeholder="agent@brokerage.com" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={submit} disabled={creating} className="btn-vermillion px-6 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-60">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Calendar className="w-4 h-4" />Track this closing</>}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-3 border border-ink/20 font-heading text-xs uppercase tracking-[0.12em]">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {txs.map((tx) => {
          const overdue = tx.overdue_count || 0;
          const soon = tx.soon_count || 0;
          const urg = overdue > 0 ? "overdue" : soon > 0 ? "soon" : "normal";
          const u = URGENCY[urg];
          return (
            <div key={tx.id} className={`border-2 ${u.color} p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-display text-xl">{tx.address}</h4>
                    {overdue > 0 && (
                      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest bg-red-500 text-white px-2 py-1">
                        <AlertTriangle className="w-3 h-3" /> {overdue} overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[11px] text-ink/50">
                    <span>Close: {tx.closing_date}</span>
                    <span className={urg === "soon" ? "text-amber-600" : urg === "overdue" ? "text-red-600" : ""}>
                      {tx.days_to_close}d to close
                    </span>
                  </div>
                </div>
                <button onClick={() => setExpanded(expanded === tx.id ? null : tx.id)} className="font-heading text-xs uppercase tracking-[0.12em] flex items-center gap-1 hover:text-vermillion transition">
                  {expanded === tx.id ? "Collapse" : "View deadlines"} <ChevronRight className={`w-4 h-4 transition ${expanded === tx.id ? "rotate-90" : ""}`} />
                </button>
              </div>

              {expanded === tx.id && (
                <div className="mt-4 border-t border-ink/15 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(tx.deadlines || []).map((d, i) => {
                      const du = URGENCY[d.urgency] || URGENCY.normal;
                      const DIcon = du.icon;
                      return (
                        <div key={i} className={`flex items-start gap-3 p-4 ${d.urgency === "overdue" ? "bg-red-50 border border-red-200" : d.urgency === "soon" ? "bg-amber-50 border border-amber-200" : "bg-oat border border-ink/10"}`}>
                          <button
                            onClick={() => !d.completed && completeTask(tx.id, d.task)}
                            className={`mt-0.5 shrink-0 w-5 h-5 border-2 flex items-center justify-center transition ${d.completed ? "bg-vermillion border-vermillion" : "border-ink/30 hover:border-vermillion"}`}
                          >
                            {d.completed && <CheckCircle className="w-3.5 h-3.5 text-oat" />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DIcon className={`w-3.5 h-3.5 ${d.urgency === "overdue" ? "text-red-500" : d.urgency === "soon" ? "text-amber-500" : "text-ink/40"}`} />
                              <span className={`font-body text-sm ${d.completed ? "line-through text-ink/40" : "text-ink"}`}>{d.task}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-ink/40 uppercase tracking-widest">
                              <span>Due: {d.deadline}</span>
                              <span className={d.urgency === "overdue" ? "text-red-500" : d.urgency === "soon" ? "text-amber-500" : ""}>
                                {d.days_until > 0 ? `${d.days_until}d` : d.days_until === 0 ? "today" : `${Math.abs(d.days_until)}d ago`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

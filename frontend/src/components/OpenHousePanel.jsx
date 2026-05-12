import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Home, QrCode, Copy, Check, Link, Loader2, User, Phone, Mail } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OpenHousePanel({ result, setResult }) {
  const [form, setForm] = useState({ address: "", agent_name: "", agent_phone: "", agent_email: "" });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const session_id = localStorage.getItem("lw_session_id");

  const create = async () => {
    if (!form.address.trim() || !form.agent_name.trim() || !form.agent_phone.trim() || !form.agent_email.trim()) {
      toast.error("Fill in all fields to create your open house.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/openhouse/create`, { ...form, session_id });
      setResult(data);
      toast.success("Open house ready! Share the QR code.");
    } catch {
      toast.error("Failed to create open house.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-oat border border-ink/15 p-8 mt-px">
      <div className="flex items-center gap-3 mb-2">
        <Home className="w-5 h-5 text-vermillion" />
        <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-vermillion">/ Open House Check-In</span>
      </div>
      <h3 className="font-display text-3xl tracking-tight mb-1">Generate a QR check-in</h3>
      <p className="font-body text-ink/65 mb-6">Visitors scan, leave their info, and go into your drip campaign automatically.</p>

      {!result ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6 space-y-4">
            <div className="relative">
              <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input type="text" placeholder="Property address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-ink/20 pl-11 pr-4 py-3 font-body text-sm outline-none focus:border-vermillion transition" />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input type="text" placeholder="Your name" value={form.agent_name} onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))} className="w-full border border-ink/20 pl-11 pr-4 py-3 font-body text-sm outline-none focus:border-vermillion transition" />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input type="tel" placeholder="Your phone" value={form.agent_phone} onChange={e => setForm(f => ({ ...f, agent_phone: e.target.value }))} className="w-full border border-ink/20 pl-11 pr-4 py-3 font-body text-sm outline-none focus:border-vermillion transition" />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input type="email" placeholder="Your email" value={form.agent_email} onChange={e => setForm(f => ({ ...f, agent_email: e.target.value }))} className="w-full border border-ink/20 pl-11 pr-4 py-3 font-body text-sm outline-none focus:border-vermillion transition" />
            </div>
            <button onClick={create} disabled={loading} className="w-full bg-vermillion hover:bg-[#ff2a0e] disabled:opacity-50 text-oat px-6 py-3.5 font-heading text-sm uppercase tracking-[0.12em] transition hover:-translate-y-0.5 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate QR Code"}
            </button>
          </div>
          <div className="col-span-12 md:col-span-6 flex items-center justify-center">
            <div className="text-center text-ink/30 font-mono text-sm">QR code preview will appear here</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-5">
            <div className="bg-white border-2 border-ink/20 p-6 text-center">
              <QrCode className="w-40 h-40 mx-auto text-ink mb-3" />
              <div className="font-display text-lg">{result.address}</div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mt-1">Scan to check in</div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 flex flex-col justify-center space-y-4">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-2">Check-in link</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-ink/20 px-4 py-3 font-mono text-sm break-all">{result.checkin_url}</div>
                <button onClick={() => copyLink(result.checkin_url)} className="bg-ink text-oat px-4 py-3 hover:bg-vermillion transition flex-shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-2">Share link</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-ink/20 px-4 py-3 font-mono text-sm break-all">{result.share_link}</div>
                <button onClick={() => copyLink(result.share_link)} className="bg-ink text-oat px-4 py-3 hover:bg-vermillion transition flex-shrink-0">
                  <Link className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4">
              <div className="font-heading text-sm text-emerald-800 mb-1">Print this QR code and tape it to the door</div>
              <div className="font-body text-xs text-emerald-700">Visitors scan it, leave their info, and get an email with listing details. No app needed — works on any phone camera.</div>
            </div>
            <button onClick={() => { setResult(null); setForm({ address: "", agent_name: "", agent_phone: "", agent_email: "" }); }} className="text-center border border-ink/20 hover:border-vermillion px-4 py-3 font-heading text-xs uppercase tracking-[0.12em] transition">
              Create Another Open House +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
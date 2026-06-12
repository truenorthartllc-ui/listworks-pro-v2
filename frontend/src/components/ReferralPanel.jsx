import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Check, Gift, Users } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ReferralPanel() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const session_id = localStorage.getItem("lw_session_id");

  useEffect(() => {
    if (!session_id) return;
    axios.get(`${API}/referral/link/${session_id}`)
      .then(r => setData(r.data))
      .catch(() => {});
  }, [session_id]);

  const copyLink = () => {
    if (!data?.link) return;
    navigator.clipboard.writeText(data.link).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    if (!data?.link) return;
    const text = encodeURIComponent(
      `I've been using ListWorks PRO to rewrite listing copy in 10 seconds — MLS, Instagram, Facebook, headlines. First 3 free, no card. Check it out: ${data.link}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareText = () => {
    if (!data?.link) return;
    const msg = `Try ListWorks PRO — AI rewrites your listings in 10 seconds. First 3 free: ${data.link}`;
    window.open(`sms:?&body=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!session_id) return null;

  const count = data?.count ?? 0;
  const threshold = data?.threshold ?? 3;
  const granted = data?.granted ?? false;

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Referral Program</span>
        <p className="font-body text-sm text-ink/60">Refer 3 agents → get a free Pro month. No purchase required on their end — just try it.</p>
      </div>

      {granted ? (
        <div className="bg-coal text-oat p-6 flex items-start gap-4">
          <Gift className="w-6 h-6 text-vermillion shrink-0 mt-0.5" />
          <div>
            <p className="font-heading text-sm uppercase tracking-[0.15em]">Free month unlocked</p>
            <p className="font-body text-sm text-oat/70 mt-1">3 agents signed up via your link. Your next Pro month is on us — no action needed.</p>
          </div>
        </div>
      ) : (
        <div className="border border-ink/15 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <Users className="w-4 h-4" />
              <span>Progress</span>
            </div>
            <span className="font-heading text-sm">
              <span className="text-vermillion font-bold">{count}</span>
              <span className="text-ink/40"> / {threshold} agents</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-ink/10 w-full">
            <div
              className="h-full bg-vermillion transition-all duration-500"
              style={{ width: `${Math.min((count / threshold) * 100, 100)}%` }}
            />
          </div>

          <p className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
            {threshold - count > 0
              ? `${threshold - count} more agent${threshold - count > 1 ? "s" : ""} to go`
              : "Checking…"}
          </p>
        </div>
      )}

      {/* Referral link */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">Your link</span>
        <div className="flex gap-2">
          <div className="flex-1 border border-ink/20 px-3 py-2 font-mono text-[11px] text-ink/60 truncate bg-ink/3">
            {data?.link || "Loading…"}
          </div>
          <button
            onClick={copyLink}
            disabled={!data}
            className="border border-ink/20 px-3 py-2 hover:border-vermillion hover:text-vermillion transition flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] shrink-0"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={shareWhatsApp}
          disabled={!data}
          className="border border-ink/20 px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] hover:bg-coal hover:text-oat hover:border-coal transition"
        >
          WhatsApp
        </button>
        <button
          onClick={shareText}
          disabled={!data}
          className="border border-ink/20 px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] hover:bg-coal hover:text-oat hover:border-coal transition"
        >
          Text Message
        </button>
        <button
          onClick={() => {
            if (!data?.link) return;
            const text = encodeURIComponent(`I've been using @listworkspro to rewrite listing copy in seconds. First 3 rewrites free: ${data.link}`);
            window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
          }}
          disabled={!data}
          className="border border-ink/20 px-4 py-2 font-heading text-[10px] uppercase tracking-[0.12em] hover:bg-coal hover:text-oat hover:border-coal transition"
        >
          X / Twitter
        </button>
      </div>

      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/35">
        Free month is applied automatically when 3 agents use your link — no purchase required on their end.
      </p>
    </div>
  );
}

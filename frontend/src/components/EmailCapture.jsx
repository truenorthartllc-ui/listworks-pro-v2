import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Mail, Gift } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EmailCapture({ onClose, onBonusGranted }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const session_id = localStorage.getItem("lw_session_id") || "";
      await axios.post(`${API}/capture-email`, { email, session_id });
      toast.success("3 bonus rewrites unlocked!");
      if (onBonusGranted) onBonusGranted();
      else onClose();
    } catch {
      toast.error("Something went wrong — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-oat border border-ink/15 max-w-md w-full">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-vermillion flex items-center justify-center">
              <Gift className="w-5 h-5 text-oat" />
            </div>
            <div>
              <h3 className="font-heading text-base uppercase tracking-[0.12em]">You've got 1 rewrite left</h3>
              <p className="text-ink/55 text-sm font-body">Enter your email — unlock 3 more, free.</p>
            </div>
          </div>

          <p className="font-body text-sm text-ink/70 mb-5 leading-relaxed">
            No spam. No card. Just your email in exchange for 3 bonus rewrites — and occasional tips on what's working for agents right now.
          </p>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="your@email.com"
            autoFocus
            className="editorial-input w-full mb-4"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-vermillion w-full py-3 font-heading text-sm uppercase tracking-[0.15em]"
          >
            {loading ? "Unlocking..." : "Unlock 3 More Free Rewrites →"}
          </button>

          <button onClick={onClose} className="w-full text-center text-ink/40 text-xs mt-3 hover:text-ink/60 font-body transition">
            No thanks — just upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

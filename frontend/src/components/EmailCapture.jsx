import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EmailCapture({ onClose, remainingFree }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const session_id = localStorage.getItem("lw_session_id") || uuid();
      localStorage.setItem("lw_session_id", session_id);
      await axios.post(`${API}/capture-email`, { email, session_id });
      toast.success("Email saved! You are on the list — upgrade anytime.");
      onClose();
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-vermillion/10 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-vermillion" />
          </div>
          <div>
            <h3 className="font-heading text-lg text-ink">Save Your Progress</h3>
            <p className="text-ink/60 text-sm">Upgrade to Pro to keep going</p>
          </div>
        </div>

        <p className="text-ink/70 mb-4 text-sm">
          Enter your email to save your listings and get <span className="text-vermillion font-bold">3 more free generations</span>. No spam, ever.
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="editorial-input w-full mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-vermillion w-full py-3 font-heading text-sm uppercase tracking-[0.15em]"
        >
          {loading ? "Saving..." : "Save & Continue Free"}
        </button>

        <button onClick={onClose} className="w-full text-center text-ink/50 text-sm mt-3 hover:underline">
          No thanks, just let me upgrade
        </button>
      </div>
    </div>
  );
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
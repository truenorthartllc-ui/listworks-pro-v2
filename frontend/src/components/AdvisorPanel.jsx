import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, Send, Bot, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STARTERS = [
  "Give me 3 hooks for a luxury lakefront listing.",
  "What's the most common mistake agents make in MLS copy?",
  "Write a price-drop script that keeps buyer interest.",
  "How do I handle a stubborn seller who overpriced?",
  "Suggest 5 listing presentation talking points.",
  "What should I say at an open house to get leads?",
  "Write a follow-up email to a cold lead from 6 months ago.",
  "Critique my MLS copy against the framework.",
];

export default function AdvisorPanel({ listingId, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I'm the ListWorks AI Advisor. I'll critique your listing against the framework — banned words, weak hooks, missing FBF, dead CTAs. Ask me anything, or pick a starter below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/advisor`, {
        listing_id: listingId,
        question: q,
        history: messages.slice(-6),
      });
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      toast.error("Advisor unavailable. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="advisor-panel"
      className="fixed inset-0 z-[100] bg-coal/80 backdrop-blur-sm flex justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside className="w-full max-w-[480px] bg-oat h-full flex flex-col border-l border-ink/20 animate-rise">
        {/* Header */}
        <div className="border-b border-ink/15 px-5 py-4 flex items-center justify-between bg-coal text-oat">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-vermillion flex items-center justify-center">
              <Bot className="w-4 h-4 text-oat" />
            </div>
            <div>
              <div className="font-display italic text-xl">AI Advisor</div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-oat/60">Powered by ListWorks AI</div>
            </div>
          </div>
          <button
            data-testid="close-advisor-btn"
            onClick={onClose}
            className="w-9 h-9 border border-oat/30 hover:bg-oat hover:text-coal transition flex items-center justify-center"
            aria-label="Close advisor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} data-testid={`advisor-msg-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-4 py-3 ${
                m.role === "user"
                  ? "bg-coal text-oat font-body text-sm"
                  : "border border-ink/15 bg-white text-ink font-body text-sm leading-relaxed"
              }`}>
                {m.content.split("\n").map((p, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-2" : ""}>{p}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="border border-ink/15 bg-white px-4 py-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink/60">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking
              </div>
            </div>
          )}
        </div>

        {/* Starters */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {STARTERS.map((s, i) => (
              <button
                key={i}
                data-testid={`advisor-starter-${i}`}
                onClick={() => send(s)}
                className="text-left text-[12px] font-body border border-ink/15 hover:border-vermillion hover:text-vermillion px-3 py-1.5 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-ink/15 p-3 flex items-center gap-2 bg-white">
          <input
            data-testid="advisor-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your listing…"
            className="flex-1 bg-transparent border border-ink/15 px-3 py-2.5 outline-none focus:border-vermillion font-body text-sm"
          />
          <button
            data-testid="advisor-send-btn"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-vermillion text-oat hover:bg-[#ff2a0e] px-4 py-2.5 font-heading text-[11px] uppercase tracking-[0.12em] flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </div>
  );
}

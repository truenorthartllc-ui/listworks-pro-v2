import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SUGGESTIONS = [
  "Give me 5 reasons a buyer should see this house",
  "Write a text to someone who viewed this property",
  "What features aren't we marketing well?",
  "Create a 15-second TikTok script",
  "Write an open house announcement",
  "Why hasn't this sold yet?",
];

export default function AskListingChat({ rawListing, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I've analyzed your listing. Ask me anything about it — copy ideas, buyer objections, marketing angles, whatever helps." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function ask(question) {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const history = messages.filter(m => m.role !== "system").slice(-10);
      const { data } = await axios.post(`${API}/listings/ask`, {
        raw_listing: rawListing,
        question: q,
        history: history.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I hit an error. Try again?" }]);
    }
    setLoading(false);
  }

  return (
    <div className="border border-ink/10 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-vermillion" />
          <span className="font-medium text-sm">Ask My Listing</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-ink/30 hover:text-ink/60">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-80 p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-ink text-white" : "bg-vermillion/10 text-vermillion"}`}>
              {m.role === "user" ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={`max-w-[85%] text-xs leading-relaxed ${m.role === "user" ? "bg-ink text-white px-3 py-2 rounded-lg" : "text-ink/80"}`}>
              {m.content}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => ask(s)}
                className="text-[10px] px-2 py-1 border border-ink/10 rounded-full hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors"
              >
                <Sparkles size={10} className="inline mr-1" />
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-ink/40">
            <Loader2 size={12} className="animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-ink/5 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ask(input)}
            placeholder="Ask anything about this listing..."
            className="flex-1 text-xs px-3 py-2 border border-ink/10 rounded focus:outline-none focus:border-ink/30"
            disabled={loading}
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-ink text-white rounded hover:bg-ink/90 disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
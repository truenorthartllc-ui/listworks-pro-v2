import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2, User, Bot as BotIcon, Clock } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STARTER_PROMPTS = [
  "Is this still available?",
  "Can I schedule a showing?",
  "What's the neighborhood like?",
  "Does it have a garage?",
  "When can I move in?",
];

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function LeadNurture() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", contact: "", listing_id: "" });
  const [listings, setListings] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/seller/listings?session_id=${localStorage.getItem("lw_session_id")}`)
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => {});
    fetchThreads();
  }, []);

  useEffect(() => {
    if (activeThread) {
      setMessages(activeThread.messages || []);
    }
  }, [activeThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchThreads = () => {
    axios.get(`${API}/nurture/threads?session_id=${localStorage.getItem("lw_session_id")}`)
      .then(({ data }) => setThreads(data.threads || []))
      .catch(() => {});
  };

  const createThread = async () => {
    if (!newLead.name || !newLead.contact) {
      toast.error("Enter lead name and contact");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/nurture/thread`, {
        ...newLead,
        channel: "telegram",
        tone: "friendly",
        session_id: localStorage.getItem("lw_session_id"),
      });
      setMessages([{ role: "assistant", content: data.first_message }]);
      setActiveThread({ id: data.thread_id, lead_name: newLead.name, messages: [{ role: "assistant", content: data.first_message }] });
      setShowNew(false);
      setNewLead({ name: "", contact: "", listing_id: "" });
      fetchThreads();
      toast.success("Thread started — AI is ready to nurture this lead");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to start thread");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!input.trim() || !activeThread) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "lead", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/nurture/reply`, {
        thread_id: activeThread.id,
        message: userMsg,
      });
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      toast.error("AI reply failed");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const starterReply = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-coal flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-vermillion" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-display text-2xl">Lead Nurturing</h3>
          <p className="font-body text-ink/60 text-sm">AI conversations with buyer leads — pre-qualify, answer questions, book showings.</p>
        </div>
      </div>

      <div className="border border-ink/15">
        <div className="grid grid-cols-12 divide-x divide-ink/15">
          {/* Thread list */}
          <div className="col-span-4 bg-oat min-h-[500px]">
            <div className="p-4 border-b border-ink/15 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Threads</span>
              <button
                onClick={() => setShowNew(true)}
                className="bg-vermillion text-oat px-3 py-1.5 text-[11px] font-heading uppercase tracking-[0.1em] hover:bg-[#ff2a0e] transition"
              >
                + New
              </button>
            </div>

            {showNew && (
              <div className="p-4 border-b border-ink/15 bg-white">
                <p className="font-mono text-[10px] uppercase tracking-widest text-vermillion mb-3">New lead thread</p>
                <input
                  placeholder="Lead name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="editorial-input w-full mb-2 text-sm"
                />
                <input
                  placeholder="Contact (email or @telegram)"
                  value={newLead.contact}
                  onChange={(e) => setNewLead({ ...newLead, contact: e.target.value })}
                  className="editorial-input w-full mb-2 text-sm"
                />
                <select
                  value={newLead.listing_id}
                  onChange={(e) => setNewLead({ ...newLead, listing_id: e.target.value })}
                  className="editorial-input w-full mb-3 text-sm"
                >
                  <option value="">Select listing</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>{l.address || "Listing " + l.id.slice(0, 8)}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={createThread} disabled={loading} className="flex-1 btn-vermillion py-2 text-xs uppercase tracking-[0.1em] font-heading disabled:opacity-60">
                    {loading ? "Starting…" : "Start thread"}
                  </button>
                  <button onClick={() => setShowNew(false)} className="px-3 py-2 border border-ink/20 text-ink/60 text-xs">Cancel</button>
                </div>
              </div>
            )}

            <div className="divide-y divide-ink/10">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveThread(t)}
                  data-active={activeThread?.id === t.id}
                  className="w-full text-left p-4 hover:bg-ink/5 transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-ink/40" />
                    <span className="font-heading text-xs uppercase tracking-[0.1em] truncate">{t.lead_name}</span>
                    <span className={`ml-auto font-mono text-[9px] px-1.5 py-0.5 ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/40"}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-ink/40 truncate">
                    {(t.messages?.[-1]?.content || "").slice(0, 40)}…
                  </p>
                </button>
              ))}
              {threads.length === 0 && !showNew && (
                <div className="p-8 text-center">
                  <p className="font-body text-sm text-ink/50 italic">No threads yet.</p>
                  <button onClick={() => setShowNew(true)} className="mt-3 text-vermillion text-xs font-heading uppercase tracking-[0.1em] hover:underline">
                    Start a new lead thread →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="col-span-8 bg-white flex flex-col">
            {!activeThread ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="w-10 h-10 text-ink/20 mb-4" />
                <p className="font-display italic text-2xl text-ink/40">Pick a thread to continue</p>
                <p className="font-body text-sm text-ink/50 mt-2">Or start a new conversation with a buyer lead</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-ink/15 flex items-center gap-3">
                  <User className="w-4 h-4 text-vermillion" />
                  <div>
                    <p className="font-heading text-sm uppercase tracking-[0.1em]">{activeThread.lead_name}</p>
                    <p className="font-mono text-[10px] text-ink/40">{activeThread.messages?.length || 0} messages</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === "lead" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-5 py-3 ${
                        m.role === "assistant"
                          ? "bg-oat text-ink border border-ink/15"
                          : "bg-coal text-oat border border-coal/50"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {m.role === "assistant" ? <BotIcon className="w-3 h-3 text-vermillion" /> : <User className="w-3 h-3 text-oat/60" />}
                          <span className="font-mono text-[9px] uppercase tracking-widest text-ink/40">
                            {m.role === "assistant" ? "AI" : activeThread.lead_name}
                          </span>
                          {m.sent_at && <span className="font-mono text-[9px] text-ink/30 ml-2">{formatTime(m.sent_at)}</span>}
                        </div>
                        <p className="font-body text-sm leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="bg-oat border border-ink/15 px-5 py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-vermillion" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Starter prompts */}
                {messages.length === 1 && (
                  <div className="px-6 pb-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-2">Try:</p>
                    <div className="flex flex-wrap gap-2">
                      {STARTER_PROMPTS.map((p) => (
                        <button key={p} onClick={() => starterReply(p)} className="px-3 py-1.5 border border-ink/20 hover:border-vermillion font-body text-xs text-ink/70 transition">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 border-t border-ink/15 flex gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                    placeholder="Ask about the listing, pricing, schedule…"
                    className="flex-1 editorial-input text-sm"
                  />
                  <button
                    onClick={sendReply}
                    disabled={loading || !input.trim()}
                    className="btn-vermillion px-4 py-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

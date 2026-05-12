import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Check, Loader2, Phone, Mail, MessageSquare, DoorOpen } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SCRIPT_TABS = [
  { key: "cold_call", label: "Cold Call", icon: Phone },
  { key: "voicemail", label: "Voicemail", icon: Mail },
  { key: "text", label: "Text", icon: MessageSquare },
  { key: "door_knock", label: "Door Knock", icon: DoorOpen },
];

export default function ExpiredListingScripts({ onImportComplete }) {
  const [form, setForm] = useState({
    address: "",
    price: "",
    beds: "",
    baths: "",
    sqft: "",
    seller_name: "",
    days_on_market: "",
    original_price: "",
    listing_reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("cold_call");
  const [copiedKey, setCopiedKey] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generateScripts = async () => {
    if (!form.address.trim()) {
      toast.error("Please enter the property address");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/expired-scripts`, form);
      setResult(data);
      setActiveTab("cold_call");
      toast.success("Scripts generated — start your outreach.");
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail?.message || "Failed to generate scripts. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (key, text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 1600);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const getCurrentScript = () => {
    if (!result) return "";
    const map = {
      cold_call: result.cold_call_script,
      voicemail: result.voicemail_script,
      text: result.text_message,
      door_knock: result.door_knock_script,
    };
    return map[activeTab] || "";
  };

  const LISTING_REASONS = [
    { value: "", label: "Not sure / Unknown" },
    { value: "relocating", label: "Relocating for work" },
    { value: "priced_too_high", label: "Priced too high" },
    { value: "not_selling", label: "Changed mind about selling" },
    { value: "other", label: "Other reason" },
  ];

  return (
    <div className="expired-scripts-container">
      <div className="mb-8">
        <h3 className="font-heading text-xl tracking-wide text-ink mb-2">Expired Listing Scripts</h3>
        <p className="text-ink/60 text-sm">Get outreach scripts for properties that didn't sell. Turn expired listings into new opportunities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="col-span-full">
          <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Property Address *</label>
          <input
            type="text"
            placeholder="123 Main St, City, State ZIP"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="editorial-input w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Listing Price</label>
            <input
              type="text"
              placeholder="$500,000"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="editorial-input w-full"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Days on Market</label>
            <input
              type="text"
              placeholder="90"
              value={form.days_on_market}
              onChange={(e) => handleChange("days_on_market", e.target.value)}
              className="editorial-input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Beds</label>
            <input
              type="text"
              placeholder="3"
              value={form.beds}
              onChange={(e) => handleChange("beds", e.target.value)}
              className="editorial-input w-full"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Baths</label>
            <input
              type="text"
              placeholder="2"
              value={form.baths}
              onChange={(e) => handleChange("baths", e.target.value)}
              className="editorial-input w-full"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Sqft</label>
            <input
              type="text"
              placeholder="2000"
              value={form.sqft}
              onChange={(e) => handleChange("sqft", e.target.value)}
              className="editorial-input w-full"
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Seller Name</label>
          <input
            type="text"
            placeholder="John & Jane Smith"
            value={form.seller_name}
            onChange={(e) => handleChange("seller_name", e.target.value)}
            className="editorial-input w-full"
          />
        </div>

        <div>
          <label className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-2">Likely Reason for Not Selling</label>
          <select
            value={form.listing_reason}
            onChange={(e) => handleChange("listing_reason", e.target.value)}
            className="editorial-input w-full"
          >
            {LISTING_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={generateScripts}
        disabled={loading || !form.address.trim()}
        className="btn-vermillion px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60 w-full md:w-auto"
      >
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Generating Scripts…</>) : "Generate Outreach Scripts"}
      </button>

      {result && (
        <div className="mt-8 bg-white border border-ink/10 p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {SCRIPT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  data-active={activeTab === tab.key}
                  className="tab-pill px-3.5 py-2 font-heading text-[12px] uppercase tracking-[0.1em] flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="bg-cream p-5 font-serif text-ink leading-relaxed whitespace-pre-wrap">
            {getCurrentScript()}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => copyText(activeTab, getCurrentScript())}
              className="flex items-center gap-2 px-4 py-2 bg-ink text-white font-mono text-[11px] uppercase tracking-[0.12em] hover:bg-ink/80 transition"
            >
              {copiedKey === activeTab ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedKey === activeTab ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
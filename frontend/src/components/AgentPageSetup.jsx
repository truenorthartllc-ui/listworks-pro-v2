import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check, ExternalLink, User, MapPin, Globe, Linkedin, Instagram } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SID = () => localStorage.getItem("lw_session_id");

export default function AgentPageSetup() {
  const [form, setForm] = useState({
    name: "", slug: "", title: "Real Estate Agent", brokerage: "",
    phone: "", email: "", photo_url: "", bio: "",
    specialties: "", social_linkedin: "", social_instagram: "",
    social_facebook: "", website: "",
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/agent/profile/${SID()}`);
        if (data && data.name) {
          setProfile(data);
          setForm(data);
        }
      } catch {} finally {
        setFetching(false);
      }
    })();
  }, []);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Enter your name first."); return; }
    setLoading(true);
    try {
      if (profile) {
        const { data } = await axios.put(`${API}/agent/profile/${SID()}`, form);
        if (data.ok) toast.success("Profile updated!");
      } else {
        const { data } = await axios.post(`${API}/agent/profile`, { ...form, session_id: SID() });
        setProfile(data);
        toast.success("Page created! Share the link.");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Couldn't save profile.");
    } finally {
      setLoading(false);
    }
  };

  const pubUrl = profile?.public_url || (form.slug ? `https://listworks.pro/a/${form.slug}` : "");

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Agent Landing Page</span>
        <p className="font-body text-sm text-ink/60">Get your own page at listworks.pro/a/your-name — with your listings, bio, and contact.</p>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-vermillion" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Full name *" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })}
            className="editorial-input text-sm col-span-2" />
          <input placeholder="Title (default: Real Estate Agent)" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} className="editorial-input text-sm col-span-2" />
          <input placeholder="Brokerage" value={form.brokerage}
            onChange={(e) => setForm({ ...form, brokerage: e.target.value })} className="editorial-input text-sm" />
          <input placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} className="editorial-input text-sm" />
          <input placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} className="editorial-input text-sm col-span-2" />
          <input placeholder="Photo URL (headshot)" value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })} className="editorial-input text-sm col-span-2" />
          <textarea placeholder="Bio — tell your story in a few paragraphs" value={form.bio} rows={4}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} className="editorial-input text-sm col-span-2 resize-none" />
          <input placeholder="Specialties (comma-separated)" value={form.specialties}
            onChange={(e) => setForm({ ...form, specialties: e.target.value })} className="editorial-input text-sm col-span-2" />
          <input placeholder="LinkedIn URL" value={form.social_linkedin}
            onChange={(e) => setForm({ ...form, social_linkedin: e.target.value })} className="editorial-input text-sm col-span-2" />
          <div className="col-span-2 flex gap-2">
            <input placeholder="Instagram URL" value={form.social_instagram}
              onChange={(e) => setForm({ ...form, social_instagram: e.target.value })} className="editorial-input text-sm flex-1" />
            <input placeholder="Website URL" value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })} className="editorial-input text-sm flex-1" />
          </div>
        </div>
      )}

      <button onClick={save} disabled={loading || !form.name.trim()}
        className="btn-vermillion w-full px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Sparkles className="w-4 h-4" />{profile ? "Update My Page" : "Create My Page"}</>}
      </button>

      {pubUrl && (
        <div className="border border-ink/15 p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40">Your Public Page</span>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(pubUrl); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 1600); }}
                className="flex items-center gap-1 border border-ink/20 px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.12em] transition hover:border-vermillion">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
              <a href={pubUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 bg-coal text-oat px-3 py-1.5 font-heading text-[10px] uppercase tracking-[0.12em] hover:bg-vermillion transition">
                <ExternalLink className="w-3 h-3" /> Preview
              </a>
            </div>
          </div>
          <div className="font-body text-sm text-vermillion underline break-all">{pubUrl}</div>
        </div>
      )}
    </div>
  );
}

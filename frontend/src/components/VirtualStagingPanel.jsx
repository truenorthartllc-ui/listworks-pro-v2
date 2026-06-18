import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles, Upload, Download, RefreshCcw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STYLES = [
  { id: "modern", label: "Modern", icon: "✦" },
  { id: "coastal", label: "Coastal", icon: "🌊" },
  { id: "luxury", label: "Luxury", icon: "💎" },
  { id: "midcentury", label: "Mid-Century", icon: "🪑" },
  { id: "farmhouse", label: "Farmhouse", icon: "🏡" },
  { id: "minimalist", label: "Minimalist", icon: "◻" },
  { id: "boho", label: "Boho", icon: "🌿" },
  { id: "industrial", label: "Industrial", icon: "🏗" },
];
const ROOMS = ["living room", "bedroom", "kitchen", "dining room", "bathroom", "home office", "basement", "patio"];

export default function VirtualStagingPanel() {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [style, setStyle] = useState("modern");
  const [roomType, setRoomType] = useState("living room");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please upload an image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target.result);
      setPreview(e.target.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!photo) { toast.error("Upload a room photo first."); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/virtual-stage`, {
        image_base64: photo,
        style,
        room_type: roomType,
      });
      setResult(data.image_base64);
      toast.success(`${style} staging generated!`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Staging generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Virtual Staging</span>
        <p className="font-body text-sm text-ink/60">Upload an empty room photo — AI furnishes it in your chosen style.</p>
      </div>

      {/* Photo Upload */}
      <div
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition ${
          dragging ? "border-vermillion bg-vermillion/5" : "border-ink/20 hover:border-ink/40"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e.target.files[0])} />
        {preview ? (
          <img src={preview} alt="Uploaded room" className="max-h-64 mx-auto object-contain" />
        ) : (
          <div className="py-8">
            <Upload className="w-10 h-10 text-ink/30 mx-auto mb-3" />
            <p className="font-body text-sm text-ink/60">Drop a room photo here, or click to browse</p>
            <p className="font-mono text-[10px] text-ink/40 mt-2">PNG, JPG · Empty rooms work best</p>
          </div>
        )}
      </div>

      {/* Style Picker */}
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-3">Staging Style</span>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button key={s.id} onClick={() => setStyle(s.id)}
              data-active={style === s.id}
              className="tone-pill flex items-center gap-1.5">
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room Type */}
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/60 block mb-3">Room Type</span>
        <div className="flex flex-wrap gap-2">
          {ROOMS.map((r) => (
            <button key={r} onClick={() => setRoomType(r)}
              data-active={roomType === r}
              className="tone-pill">{r}</button>
          ))}
        </div>
      </div>

      <button onClick={generate} disabled={loading || !photo}
        className="btn-vermillion w-full px-7 py-4 font-heading text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Staging room…</> : <><Sparkles className="w-4 h-4" />Generate Staged Photo</>}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3 animate-rise">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40">Before</span>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/40">After — {style}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <img src={preview} alt="Before" className="w-full h-48 object-cover border border-ink/15 opacity-70" />
            <img src={result} alt="After" className="w-full h-48 object-cover border border-vermillion/30" />
          </div>
          <button onClick={() => {
            const a = document.createElement("a");
            a.href = result;
            a.download = `staged-${style}-${Date.now()}.png`;
            a.click();
            toast.success("Downloaded!");
          }}
            className="w-full border border-ink/20 hover:bg-ink hover:text-oat px-4 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition">
            <Download className="w-3.5 h-3.5" /> Download Staged Photo
          </button>
          <button onClick={() => { setPhoto(null); setPreview(null); setResult(null); }}
            className="w-full border border-ink/20 px-4 py-3 font-heading text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition hover:text-vermillion">
            <RefreshCcw className="w-3.5 h-3.5" /> Try a Different Room
          </button>
        </div>
      )}
    </div>
  );
}

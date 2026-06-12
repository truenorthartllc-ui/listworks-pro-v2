import { useState, useRef } from "react";
import axios from "axios";
import { Loader2, Upload, Sparkles, Camera } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PhotoToListing({ onFeaturesDetected }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const processFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      setLoading(true);
      setResult(null);
      try {
        const { data } = await axios.post(`${API}/analyze-photo`, { image_base64: base64 });
        setResult(data);
        const featuresText = data.features?.join(", ") || "";
        const draft = `${data.style ? data.style + ". " : ""}${featuresText}.${data.suggested_headline ? " " + data.suggested_headline : ""}`;
        onFeaturesDetected(draft);
        toast.success("Photo analyzed — features added to your listing draft.");
      } catch {
        toast.error("Photo analysis failed. Try again.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-vermillion block mb-1">/ Photo → Listing</span>
        <p className="font-body text-sm text-ink/60">Upload a listing photo. AI detects features and adds them to your draft.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed cursor-pointer transition-all p-8 flex flex-col items-center justify-center gap-3 ${
          dragging ? "border-vermillion bg-vermillion/5" : "border-ink/20 hover:border-vermillion"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => processFile(e.target.files[0])} />
        {preview ? (
          <img src={preview} alt="Listing preview" className="max-h-48 object-contain" />
        ) : (
          <>
            <Camera className="w-8 h-8 text-ink/30" />
            <span className="font-heading text-xs uppercase tracking-[0.15em] text-ink/50">Drop a photo or click to upload</span>
          </>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink/50 uppercase tracking-wider">
          <Loader2 className="w-3 h-3 animate-spin text-vermillion" />
          Analyzing photo…
        </div>
      )}

      {result && (
        <div className="border border-ink/15 p-4 space-y-3 animate-rise">
          {result.style && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">Style</span>
              <p className="font-heading text-sm text-ink mt-0.5">{result.style}</p>
            </div>
          )}
          {result.features?.length > 0 && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">Detected Features</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {result.features.map((f) => (
                  <span key={f} className="border border-ink/20 px-2 py-0.5 font-mono text-[10px] text-ink/70">{f}</span>
                ))}
              </div>
            </div>
          )}
          {result.suggested_headline && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40">Suggested Headline</span>
              <p className="font-display italic text-base text-ink mt-0.5">{result.suggested_headline}</p>
            </div>
          )}
          <button
            onClick={() => { inputRef.current.value = ""; setPreview(null); setResult(null); }}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/40 hover:text-vermillion transition"
          >
            ↺ Upload another photo
          </button>
        </div>
      )}
    </div>
  );
}

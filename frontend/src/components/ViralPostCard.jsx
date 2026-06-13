import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function ViralPostCard({ rawListing, rewrittenListing, tone = "Modern" }) {
  const [downloading, setDownloading] = useState(false);

  const wrapText = (text, maxWidth, fontSize) => {
    if (!text) return [];
    const words = (text || "").toString().split(" ");
    const lines = [];
    let current = "";
    const charW = fontSize * 0.52;
    const maxChars = Math.floor(maxWidth / charW);
    words.forEach(w => {
      if ((current + " " + w).trim().length <= maxChars) {
        current = (current + " " + w).trim();
      } else {
        if (current) lines.push(current);
        current = w;
      }
    });
    if (current) lines.push(current);
    return lines.slice(0, 9);
  };

  const generateCard = async () => {
    setDownloading(true);
    await new Promise(r => setTimeout(r, 50));

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 1200;
      canvas.height = 630;

      // Background
      ctx.fillStyle = "#F4F3EF";
      ctx.fillRect(0, 0, 1200, 630);

      // Left half — before
      ctx.fillStyle = "#E8E4DA";
      ctx.fillRect(0, 0, 600, 560);

      // Right half — after
      ctx.fillStyle = "#1A1A1A";
      ctx.fillRect(600, 0, 600, 560);

      // Divider
      ctx.fillStyle = "#FF3B22";
      ctx.fillRect(596, 20, 8, 540);

      // BEFORE label
      ctx.fillStyle = "#9A9590";
      ctx.font = "13px monospace";
      ctx.fillText("❌  BEFORE  —  BORING MLS DRAFT", 30, 52);

      // BEFORE text
      ctx.fillStyle = "#4A4540";
      ctx.font = "17px sans-serif";
      const beforeLines = wrapText(rawListing, 540, 18);
      let y = 90;
      beforeLines.forEach(line => { ctx.fillText(line, 30, y); y += 28; });

      // AFTER label
      ctx.fillStyle = "#FF3B22";
      ctx.font = "13px monospace";
      ctx.fillText("✅  AFTER  —  LISTWORKS.PRO", 630, 52);

      // AFTER text
      ctx.fillStyle = "#F4F3EF";
      ctx.font = "19px sans-serif";
      const afterLines = wrapText(rewrittenListing, 540, 20);
      y = 90;
      afterLines.forEach(line => { ctx.fillText(line, 630, y); y += 30; });

      // Top label
      ctx.fillStyle = "#FF3B22";
      ctx.font = "bold 11px monospace";
      ctx.fillText("LISTWORKS PRO", 30, 28);
      ctx.fillStyle = "#9A9590";
      ctx.font = "11px monospace";
      ctx.fillText(" / LISTING TRANSFORMATION", 128, 28);

      // Full-width footer bar — uncropable, centered URL
      ctx.fillStyle = "#FF3B22";
      ctx.fillRect(0, 560, 1200, 70);

      // Left stat
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px monospace";
      ctx.fillText("AI-REWRITTEN IN 8 SECONDS  ·  " + (tone || "Modern").toUpperCase() + " TONE", 30, 588);

      // Center: listworks.pro — big and centered
      ctx.font = "bold 30px sans-serif";
      const urlText = "listworks.pro";
      const urlW = ctx.measureText(urlText).width;
      ctx.fillText(urlText, (1200 - urlW) / 2, 602);

      // Right: try free
      ctx.font = "bold 12px monospace";
      const cta = "Try free →";
      const ctaW = ctx.measureText(cta).width;
      ctx.fillText(cta, 1200 - ctaW - 30, 588);

      const link = document.createElement("a");
      link.download = "listworks-transformation.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("ViralPostCard download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-oat border border-ink/15 overflow-hidden">
      <div>
        <div className="grid grid-cols-2">
          <div className="bg-stone-100 p-6">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-3">
              ❌ Before — boring MLS draft
            </div>
            <p className="font-body text-sm text-ink/70 whitespace-pre-wrap line-clamp-6">
              {rawListing}
            </p>
          </div>
          <div className="bg-coal p-6">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion mb-3">
              ✅ After — listworks.pro
            </div>
            <p className="font-body text-sm text-oat/90 whitespace-pre-wrap line-clamp-6">
              {rewrittenListing}
            </p>
          </div>
        </div>
        <div className="bg-vermillion px-6 py-2.5 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/80">
            AI-Rewritten · {(tone || "Modern").toUpperCase()} Tone
          </span>
          <span className="font-heading text-sm font-bold tracking-wide text-white">
            listworks.pro
          </span>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/80">
            Try free →
          </span>
        </div>
      </div>

      <div className="p-4 bg-oat border-t border-ink/10">
        <button
          onClick={generateCard}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 bg-vermillion text-oat px-4 py-3 font-heading text-xs uppercase tracking-[0.15em] hover:bg-[#ff2a0e] transition disabled:opacity-60"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? "Generating…" : "Download Social Card (1200×630)"}
        </button>
      </div>
    </div>
  );
}

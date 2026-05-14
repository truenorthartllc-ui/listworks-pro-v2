import { useState, useRef } from "react";
import { Download, Share2, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function ShareCard({ rawListing, rewrittenListing, tone = "Modern" }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const handleCopyShareText = () => {
    const text = `My listing went from boring to brilliant:\n\n❌ ${rawListing}\n\n✅ ${rewrittenListing}\n\nTry it free → listworks.pro`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 1200;
      canvas.height = 630;
      
      ctx.fillStyle = "#F4F3EF";
      ctx.fillRect(0, 0, 1200, 630);
      
      ctx.fillStyle = "#D4D0C4";
      ctx.fillRect(0, 0, 600, 630);
      
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(600, 0, 600, 630);
      
      ctx.fillStyle = "#6B6560";
      ctx.font = "14px monospace";
      ctx.fillText("❌ BEFORE — BORING MLS DRAFT", 40, 60);
      
      ctx.fillStyle = "#4A4540";
      ctx.font = "18px sans-serif";
      const beforeLines = wrapText(rawListing, 520, 24);
      let y = 100;
      beforeLines.forEach(line => {
        ctx.fillText(line, 40, y);
        y += 30;
      });
      
      ctx.fillStyle = "#FF3B22";
      ctx.font = "14px monospace";
      ctx.fillText("✅ AFTER — LISTWORKS.PRO", 660, 60);
      
      ctx.fillStyle = "#F4F3EF";
      ctx.font = "20px sans-serif";
      const afterLines = wrapText(rewrittenListing, 520, 28);
      y = 100;
      afterLines.forEach(line => {
        ctx.fillText(line, 640, y);
        y += 34;
      });
      
      ctx.fillStyle = "#FF3B22";
      ctx.font = "12px monospace";
      ctx.fillText("AI-REWRITTEN IN 8 SECONDS · " + tone.toUpperCase() + " TONE", 40, 560);
      
      ctx.fillStyle = "#F4F3EF";
      ctx.font = "12px monospace";
      ctx.fillText("Made with ListWorks PRO", 900, 580);
      ctx.fillText("Try free → listworks.pro", 900, 600);
      
      ctx.fillStyle = "#FF3B22";
      ctx.fillRect(598, 40, 4, 550);
      
      const link = document.createElement("a");
      link.download = "listworks-transformation.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-oat border border-ink/15 overflow-hidden">
      <div ref={cardRef} className="relative">
        <div className="grid grid-cols-2">
          <div className="bg-stone-100 p-6">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/50 mb-3">
              ❌ Before — boring MLS draft
            </div>
            <p className="font-body text-sm text-ink/70 whitespace-pre-wrap">
              {rawListing}
            </p>
          </div>
          
          <div className="bg-coal p-6">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-vermillion mb-3">
              ✅ After — listworks.pro
            </div>
            <p className="font-body text-sm text-oat/90 whitespace-pre-wrap">
              {rewrittenListing}
            </p>
          </div>
        </div>
        
        <div className="bg-ink/5 px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/50">
            AI-REWRITTEN IN 8 SECONDS · {tone.toUpperCase()} TONE
          </span>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/30">
            Made with ListWorks PRO
          </span>
        </div>
      </div>
      
      <div className="p-4 bg-oat border-t border-ink/10 flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-coal text-oat px-4 py-2.5 font-heading text-xs uppercase tracking-[0.15em] hover:bg-ink transition"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Download Card
        </button>
        
        <button
          onClick={handleCopyShareText}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-vermillion text-oat px-4 py-2.5 font-heading text-xs uppercase tracking-[0.15em] hover:bg-vermillion/90 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              Copy Share Text
            </>
          )}
        </button>
        
        <Link
          to="/#playground"
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-oat border border-ink/20 text-ink px-4 py-2.5 font-heading text-xs uppercase tracking-[0.15em] hover:bg-ink/5 transition"
        >
          Try Free →
        </Link>
      </div>
    </div>
  );
}

function wrapText(text, maxWidth, fontSize) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  const charWidth = fontSize * 0.5;
  const maxChars = Math.floor(maxWidth / charWidth);
  
  words.forEach(word => {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  
  return lines.slice(0, 15);
}
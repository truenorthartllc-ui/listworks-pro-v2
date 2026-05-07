import { useState } from "react";
import { Bot, X } from "lucide-react";
import AdvisorPanel from "@/components/AdvisorPanel";

export default function FloatingAdvisorButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          data-testid="floating-advisor-btn"
          onClick={() => setOpen(true)}
          className="fixed bottom-[72px] right-5 z-[60] group flex items-center gap-3 pl-4 pr-5 py-3.5 bg-vermillion text-oat font-heading text-[12px] uppercase tracking-[0.14em] shadow-[6px_6px_0_0_#0A0A0A] hover:shadow-[8px_8px_0_0_#0A0A0A] hover:-translate-y-0.5 transition-all"
          aria-label="Open AI Advisor"
        >
          <span className="relative flex h-7 w-7 items-center justify-center bg-coal">
            <Bot className="w-3.5 h-3.5 text-vermillion" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-oat rounded-full animate-pulse" />
          </span>
          <span className="hidden sm:inline">AI Advisor</span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-oat/75 hidden md:inline">Claude</span>
        </button>
      )}
      {open && (
        <AdvisorPanel listingId={null} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

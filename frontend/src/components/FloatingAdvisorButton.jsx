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
          className="fixed bottom-16 right-6 z-[60] group flex items-center gap-4 pl-5 pr-7 py-3 bg-vermillion text-oat font-heading text-sm uppercase tracking-[0.14em] shadow-[8px_8px_0_0_#0A0A0A] hover:shadow-[10px_10px_0_0_#0A0A0A] hover:-translate-y-0.5 transition-all"
          aria-label="Open AI Advisor"
        >
          <span className="relative flex h-9 w-9 items-center justify-center bg-coal">
            <Bot className="w-5 h-5 text-vermillion" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-oat rounded-full animate-pulse" />
          </span>
          <span className="hidden sm:inline text-sm">AI Advisor</span>
          
        </button>
      )}
      {open && (
        <AdvisorPanel listingId={null} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

const NOTIFICATIONS = [
  { name: "Jessica M.", city: "Los Angeles", action: "generated a listing", ago: "2m ago" },
  { name: "Marcus C.", city: "Denver", action: "generated a listing", ago: "5m ago" },
  { name: "Priya N.", city: "Chicago", action: "generated a listing", ago: "8m ago" },
  { name: "Derek O.", city: "Atlanta", action: "generated a listing", ago: "11m ago" },
  { name: "Sarah K.", city: "Seattle", action: "generated a listing", ago: "14m ago" },
  { name: "James T.", city: "Austin", action: "generated a listing", ago: "18m ago" },
  { name: "Alicia R.", city: "Miami", action: "generated a listing", ago: "22m ago" },
  { name: "Chris W.", city: "Boston", action: "generated a listing", ago: "27m ago" },
  { name: "Nina P.", city: "Phoenix", action: "generated a listing", ago: "31m ago" },
  { name: "Tom B.", city: "Portland", action: "generated a listing", ago: "35m ago" },
  { name: "Rachel S.", city: "Nashville", action: "generated a listing", ago: "41m ago" },
  { name: "Luis M.", city: "San Diego", action: "generated a listing", ago: "47m ago" },
];

const CITIES_LAST_SEEN_KEY = "lw_notif_idx";
const NOTIF_INTERVAL = 8000;

function getNextIndex() {
  const stored = localStorage.getItem(CITIES_LAST_SEEN_KEY);
  const last = stored ? parseInt(stored, 10) : -1;
  const next = (last + 1) % NOTIFICATIONS.length;
  localStorage.setItem(CITIES_LAST_SEEN_KEY, String(next));
  return next;
}

export default function ViralNotifications() {
  const [notif, setNotif] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const delay = 4000 + Math.random() * 4000;
    const timer = setTimeout(() => {
      const idx = getNextIndex();
      setNotif(NOTIFICATIONS[idx]);
    }, delay);

    const interval = setInterval(() => {
      const idx = getNextIndex();
      setNotif(NOTIFICATIONS[idx]);
      setDismissed(false);
    }, NOTIF_INTERVAL);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!notif || dismissed) return null;

  return (
    <div
      data-testid="viral-notification"
      className="fixed top-20 right-4 z-[70] max-w-[280px] bg-white border border-ink/20 shadow-[4px_4px_0_0_#0A0A0A] p-4 animate-rise"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-ink/40 hover:text-ink transition"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-vermillion/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-vermillion" strokeWidth={2} />
        </div>
        <div>
          <p className="font-body text-[12px] leading-snug text-ink pr-4">
            <span className="font-medium">{notif.name}</span> from{" "}
            <span className="font-medium">{notif.city}</span>{" "}
            {notif.action}
          </p>
          <p className="font-mono text-[10px] text-ink/40 mt-1 tracking-wider uppercase">{notif.ago}</p>
        </div>
      </div>
    </div>
  );
}

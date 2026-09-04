import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import useTranslation from "@/hooks/useTranslation";

const NOTIFICATIONS = [
    { name: "Jessica M.", city: "Los Angeles", actionKey: "viralNotifications.action", ago: "2m ago" },
    { name: "Marcus C.", city: "Denver", actionKey: "viralNotifications.action", ago: "5m ago" },
    { name: "Priya N.", city: "Chicago", actionKey: "viralNotifications.action", ago: "8m ago" },
    { name: "Derek O.", city: "Atlanta", actionKey: "viralNotifications.action", ago: "11m ago" },
    { name: "Sarah K.", city: "Seattle", actionKey: "viralNotifications.action", ago: "14m ago" },
    { name: "James T.", city: "Austin", actionKey: "viralNotifications.action", ago: "18m ago" },
    { name: "Alicia R.", city: "Miami", actionKey: "viralNotifications.action", ago: "22m ago" },
    { name: "Chris W.", city: "Boston", actionKey: "viralNotifications.action", ago: "27m ago" },
    { name: "Nina P.", city: "Phoenix", actionKey: "viralNotifications.action", ago: "31m ago" },
    { name: "Tom B.", city: "Portland", actionKey: "viralNotifications.action", ago: "35m ago" },
    { name: "Rachel S.", city: "Nashville", actionKey: "viralNotifications.action", ago: "41m ago" },
    { name: "Luis M.", city: "San Diego", actionKey: "viralNotifications.action", ago: "47m ago" },
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
  const { t } = useTranslation();
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
        aria-label={t("viralNotifications.dismiss")}
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-vermillion/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-vermillion" strokeWidth={2} />
        </div>
        <div>
          <p className="font-body text-[12px] leading-snug text-ink pr-4">
            <span className="font-medium">{notif.name}</span>{" "}
            {t("viralNotifications.from", "from")}{" "}
            <span className="font-medium">{notif.city}</span>{" "}
            {t(notif.actionKey)}
          </p>
          <p className="font-mono text-[10px] text-ink/40 mt-1 tracking-wider uppercase">{notif.ago}</p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import en from "@/locales/en";
import es from "@/locales/es";

const locales = { en, es };

export default function useTranslation() {
  const [lang, setLang] = useState(() => localStorage.getItem("lw_language") || "English");
  const locale = lang === "Spanish" ? es : en;

  useEffect(() => {
    const handler = () => {
      const current = localStorage.getItem("lw_language") || "English";
      setLang(current);
    };
    window.addEventListener("languagechange", handler);
    return () => window.removeEventListener("languagechange", handler);
  }, []);

  const t = (path, fallback = "") => {
    const keys = path.split(".");
    let val = locale;
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined || val === null) return typeof fallback === "string" ? fallback : path;
    }
    if (typeof val === "string") {
      // Interpolate {Key} / {key} placeholders from the 2nd-arg vars object.
      if (fallback && typeof fallback === "object") {
        for (const [k, v] of Object.entries(fallback)) {
          if (typeof v === "string" || typeof v === "number") {
            val = val.split(`{${k}}`).join(String(v)).split(`{${k.toUpperCase()}}`).join(String(v));
          }
        }
      }
      return val;
    }
    return val;
  };

  const toggleLanguage = () => {
    const next = lang === "Spanish" ? "English" : "Spanish";
    localStorage.setItem("lw_language", next);
    window.location.reload();
  };

  return { t, lang, setLang: toggleLanguage, isSpanish: lang === "Spanish" };
}
"use client";
import { useLang } from "@/context/LanguageContext";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      onClick={toggleLang}
      aria-label="Toggle language"
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200
                 bg-white/80 backdrop-blur-sm text-slate-700 text-sm font-semibold
                 hover:bg-blue-50/60 hover:border-blue-500/30 hover:text-blue-600 transition-all duration-200 shadow-sm"
    >
      <Languages className="w-4 h-4 text-blue-500" />
      <span>{lang === "en" ? "اردو" : "English"}</span>
    </button>
  );
}

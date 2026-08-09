"use client";
import { createContext, useContext, useState } from "react";
import { dictionaries } from "@/lib/dictionary";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");
  const toggleLang = () => setLang((l) => (l === "en" ? "ur" : "en"));
  const t = dictionaries[lang];
  const isRtl = lang === "ur";
  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

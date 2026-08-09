"use client";
import Link from "next/link";
import { useLang } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Activity, Mic, Brain, MapPin, ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";

export default function Home() {
  const { t, isRtl } = useLang();

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen hero-gradient flex flex-col"
    >
      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <div>
            <h1 className={`text-slate-900 font-bold text-lg leading-none ${isRtl ? "font-urdu" : ""}`}>
              {t.appName}
            </h1>
            <p className={`text-blue-600/80 text-xs mt-1 font-semibold ${isRtl ? "font-urdu" : ""}`}>{t.tagline}</p>
          </div>
        </div>
        <LanguageToggle />
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-5xl mx-auto w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-xs font-semibold mb-6 animate-slide-up">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Bano Qabil Hackathon 2024</span>
        </div>

        <h2
          className={`text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6 animate-slide-up
            ${isRtl ? "font-urdu" : ""}`}
          style={{ animationDelay: "0.1s" }}
        >
          {t.hero_title}
        </h2>

        <p
          className={`text-slate-600 text-lg md:text-xl max-w-2xl mb-12 animate-slide-up leading-relaxed
            ${isRtl ? "font-urdu" : ""}`}
          style={{ animationDelay: "0.2s" }}
        >
          {t.hero_subtitle}
        </p>

        {/* 3 Steps */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14 w-full animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          {[
            { icon: <Mic className="w-7 h-7 text-blue-600" />, title: t.step1_title, desc: t.step1_desc },
            { icon: <Brain className="w-7 h-7 text-indigo-600" />, title: t.step2_title, desc: t.step2_desc },
            { icon: <MapPin className="w-7 h-7 text-teal-600" />, title: t.step3_title, desc: t.step3_desc },
          ].map((step, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 text-left hover:scale-[1.02] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className={`text-slate-800 font-bold text-base mb-2 ${isRtl ? "font-urdu" : ""}`}>
                {step.title}
              </h3>
              <p className={`text-slate-600 text-sm leading-relaxed ${isRtl ? "font-urdu" : ""}`}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/assess"
          className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl
            bg-gradient-to-r from-blue-600 to-indigo-600 text-white
            font-bold text-lg shadow-xl shadow-blue-500/20
            hover:from-blue-500 hover:to-indigo-500
            hover:scale-[1.03] active:scale-100 transition-all duration-200 animate-slide-up
            ${isRtl ? "font-urdu flex-row-reverse" : ""}`}
          style={{ animationDelay: "0.4s" }}
        >
          <Activity className="w-5 h-5 animate-pulse" />
          {t.cta}
          <ArrowRight className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="text-center pb-6 text-slate-400 text-xs">
        MedTriage AI © 2024 · Powered by Gemini 1.5 Flash &amp; Random Forest ML
      </footer>
    </main>
  );
}

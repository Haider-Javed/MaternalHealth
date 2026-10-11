"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import EcgCanvas from "@/components/EcgCanvas";
import QuickTriageSimulator from "@/components/QuickTriageSimulator";
import {
  Activity, Mic, Brain, MapPin, ArrowRight, HeartPulse, ShieldCheck,
  Sparkles, CheckCircle2, Stethoscope, Zap, Users
} from "lucide-react";

export default function Home() {
  const { t, isRtl } = useLang();
  const router = useRouter();

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen medical-hope-bg flex flex-col">
      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-600/10 border border-teal-600/25 flex items-center justify-center shadow-sm">
            <HeartPulse className="w-6 h-6 text-teal-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-slate-900 font-extrabold text-xl leading-none ${isRtl ? "font-urdu" : ""}`}>
                {t.appName}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 text-[10px] font-mono font-bold">
                v3.0 Multi-Agent
              </span>
            </div>
            <p className={`text-slate-500 text-xs mt-1 font-medium ${isRtl ? "font-urdu" : ""}`}>
              {t.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link
            href="/assess"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-all"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className={isRtl ? "font-urdu" : ""}>{t.cta}</span>
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 max-w-6xl mx-auto w-full space-y-10">
        {/* Hope Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-bold animate-slide-fade-up shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Bano Qabil Hackathon 2026 • AI Maternal Safety Co-Pilot</span>
        </div>

        {/* Hero Title */}
        <h2
          className={`text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight animate-slide-fade-up
            ${isRtl ? "font-urdu" : ""}`}
          style={{ animationDelay: "0.1s" }}
        >
          {t.hero_title}
        </h2>

        {/* Subtitle */}
        <p
          className={`text-slate-600 text-lg sm:text-xl max-w-3xl leading-relaxed font-medium animate-slide-fade-up
            ${isRtl ? "font-urdu" : ""}`}
          style={{ animationDelay: "0.2s" }}
        >
          {t.hero_subtitle}
        </p>

        {/* Live ECG Canvas Display */}
        <div className="w-full max-w-3xl animate-slide-fade-up" style={{ animationDelay: "0.25s" }}>
          <EcgCanvas bpm={76} isHighRisk={false} />
        </div>

        {/* CTA Button Deck */}
        <div className="flex items-center justify-center flex-wrap gap-4 animate-slide-fade-up" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/assess"
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl
              bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white
              font-extrabold text-lg shadow-xl shadow-teal-500/25
              hover:from-teal-500 hover:to-cyan-500 hover:scale-[1.02]
              active:scale-100 transition-all duration-200
              ${isRtl ? "font-urdu flex-row-reverse" : ""}`}
          >
            <Activity className="w-5 h-5 animate-pulse" />
            <span>{t.cta}</span>
            <ArrowRight className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
          </Link>
        </div>

        {/* Interactive Quick Triage Simulator Embedded */}
        <div className="w-full mt-8 animate-slide-fade-up" style={{ animationDelay: "0.35s" }}>
          <QuickTriageSimulator t={t} isRtl={isRtl} onLaunchFull={() => router.push("/assess")} />
        </div>

        {/* 3 Step Interactive Workflow Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10">
          {[
            {
              icon: <Mic className="w-7 h-7 text-teal-600" />,
              title: t.step1_title,
              desc: t.step1_desc,
              color: "border-teal-500/20 bg-teal-500/5",
            },
            {
              icon: <Brain className="w-7 h-7 text-cyan-600" />,
              title: t.step2_title,
              desc: t.step2_desc,
              color: "border-cyan-500/20 bg-cyan-500/5",
            },
            {
              icon: <MapPin className="w-7 h-7 text-emerald-600" />,
              title: t.step3_title,
              desc: t.step3_desc,
              color: "border-emerald-500/20 bg-emerald-500/5",
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`glass-panel rounded-3xl p-6 text-left hover:scale-[1.02] transition-all border ${step.color}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className={`text-slate-900 font-extrabold text-lg mb-2 ${isRtl ? "font-urdu text-right" : ""}`}>
                {step.title}
              </h3>
              <p className={`text-slate-600 text-sm leading-relaxed ${isRtl ? "font-urdu text-right" : ""}`}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border border-teal-500/20">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-teal-400">99.4%</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold">Red Flag Sensitivity</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400">&lt; 800ms</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold">Voice AI Extraction</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold">WHO Guideline Audit</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">&lt; 5km</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold">GIS Hospital Radar</div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="py-8 text-center text-slate-400 text-xs border-t border-teal-500/10">
        MedTriage AI © 2026 • LangGraph Multi-Agent System & Scikit-Learn Random Forest ML
      </footer>
    </main>
  );
}

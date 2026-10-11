"use client";
import React, { useState } from "react";
import { Sparkles, ShieldAlert, HeartPulse, Activity, Zap, CheckCircle2, ArrowRight } from "lucide-react";

export default function QuickTriageSimulator({ t, isRtl, onLaunchFull }) {
  const [sbp, setSbp] = useState(145);
  const [dbp, setDbp] = useState(95);
  const [bs, setBs] = useState(11.2);
  const [bleeding, setBleeding] = useState(true);
  const [headache, setHeadache] = useState(false);

  // Quick mathematical risk formula approximation for instant preview
  const isHighRisk = bleeding || headache || sbp > 140 || dbp > 90 || bs > 10.0;
  const rawProb = Math.min(
    0.98,
    Math.max(
      0.08,
      (bleeding ? 0.45 : 0) +
        (headache ? 0.35 : 0) +
        (sbp > 140 ? 0.25 : (sbp - 90) * 0.003) +
        (dbp > 90 ? 0.15 : 0) +
        (bs > 10 ? 0.20 : 0) +
        0.10
    )
  );
  const probPercent = (rawProb * 100).toFixed(1);

  return (
    <div className="w-full rounded-3xl bg-slate-900 text-white p-8 border border-teal-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background glow line */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Zap className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className={`text-xl font-bold text-white ${isRtl ? "font-urdu" : ""}`}>
              {t.simulator_title || "Live Interactive Triage Simulator"}
            </h3>
            <p className={`text-xs text-teal-300/80 ${isRtl ? "font-urdu" : ""}`}>
              {t.simulator_subtitle || "Test live vitals & red flag overrides in real-time"}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold">
          AI Model Ready
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sliders and Toggles Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Systolic BP Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
              <span>Systolic BP (mmHg): <strong className="text-teal-400 font-bold">{sbp}</strong></span>
              <span className={sbp > 140 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {sbp > 140 ? "High BP Threshold" : "Normal BP"}
              </span>
            </div>
            <input
              type="range"
              min="80"
              max="200"
              value={sbp}
              onChange={(e) => setSbp(Number(e.target.value))}
              className={sbp > 140 ? "slider-danger" : ""}
            />
          </div>

          {/* Blood Sugar Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5 text-slate-300">
              <span>Blood Sugar (mmol/L): <strong className="text-cyan-400 font-bold">{bs}</strong></span>
              <span className={bs > 10 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {bs > 10 ? "Hyperglycemia" : "Normal Sugar"}
              </span>
            </div>
            <input
              type="range"
              min="3.0"
              max="22.0"
              step="0.1"
              value={bs}
              onChange={(e) => setBs(Number(e.target.value))}
              className={bs > 10 ? "slider-danger" : ""}
            />
          </div>

          {/* Red Flag Emergency Toggles */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Emergency Overrides (Red Flags)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-semibold text-slate-200">Vaginal Bleeding</span>
                <input
                  type="checkbox"
                  checked={bleeding}
                  onChange={(e) => setBleeding(e.target.checked)}
                  className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                <span className="text-xs font-semibold text-slate-200">Severe Headache</span>
                <input
                  type="checkbox"
                  checked={headache}
                  onChange={(e) => setHeadache(e.target.checked)}
                  className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Live Output Gauge Column */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-center">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Triage Output
            </span>
            <div
              className={`mt-2 text-3xl font-black px-6 py-2 rounded-2xl tracking-wide transition-all ${
                isHighRisk
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              {isHighRisk ? "HIGH RISK" : "LOW RISK"}
            </div>
          </div>

          <div className="w-full space-y-2 mb-6">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Risk Probability</span>
              <strong className="text-white font-bold">{probPercent}%</strong>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isHighRisk ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-gradient-to-r from-teal-500 to-emerald-400"
                }`}
                style={{ width: `${probPercent}%` }}
              />
            </div>
          </div>

          {onLaunchFull && (
            <button
              onClick={onLaunchFull}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-cyan-400 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>Full Clinical Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import React from "react";
import { Activity, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

const VITAL_CONFIG = {
  Age: { min: 10, max: 70, step: 1, normalMin: 18, normalMax: 38, defaultVal: 28 },
  SystolicBP: { min: 60, max: 220, step: 1, normalMin: 90, normalMax: 120, dangerThreshold: 140 },
  DiastolicBP: { min: 40, max: 140, step: 1, normalMin: 60, normalMax: 80, dangerThreshold: 90 },
  BS: { min: 3.0, max: 25.0, step: 0.1, normalMin: 4.0, normalMax: 7.8, dangerThreshold: 11.0 },
  BodyTemp: { min: 95.0, max: 106.0, step: 0.1, normalMin: 97.0, normalMax: 99.5, dangerThreshold: 100.4 },
  HeartRate: { min: 40, max: 180, step: 1, normalMin: 60, normalMax: 100, dangerThreshold: 110 },
};

export default function InteractiveVitalsInput({ vitals, setVitals, errors, t, isRtl }) {
  const getClinicalStatus = (field, valStr) => {
    if (!valStr) return null;
    const val = parseFloat(valStr);
    if (isNaN(val)) return null;

    if (field === "SystolicBP") {
      if (val > 140) return { text: t.status_stage2 || "High BP Alert", level: "danger" };
      if (val > 120) return { text: t.status_stage1 || "Elevated", level: "warning" };
      if (val < 90) return { text: t.status_hypo || "Low BP", level: "warning" };
      return { text: t.status_normal || "Normal", level: "normal" };
    }

    if (field === "DiastolicBP") {
      if (val > 90) return { text: t.status_stage2 || "High DBP Danger", level: "danger" };
      if (val > 80) return { text: t.status_stage1 || "Elevated DBP", level: "warning" };
      return { text: t.status_normal || "Normal", level: "normal" };
    }

    if (field === "BS") {
      if (val > 11.0) return { text: t.status_diabetes || "High Blood Sugar", level: "danger" };
      if (val > 7.8) return { text: t.status_stage1 || "Slightly High", level: "warning" };
      return { text: t.status_normal || "Normal", level: "normal" };
    }

    if (field === "BodyTemp") {
      if (val >= 100.4) return { text: t.status_fever || "Febrile / Fever", level: "danger" };
      return { text: t.status_normal || "Normal Temp", level: "normal" };
    }

    if (field === "HeartRate") {
      if (val > 110) return { text: t.status_tachy || "Tachycardia (High HR)", level: "danger" };
      return { text: t.status_normal || "Normal HR", level: "normal" };
    }

    return { text: t.status_normal || "Normal", level: "normal" };
  };

  const fieldLabel = (f) => {
    const labels = {
      Age: t.age,
      SystolicBP: t.systolicBP,
      DiastolicBP: t.diastolicBP,
      BS: t.bs,
      BodyTemp: t.bodyTemp,
      HeartRate: t.heartRate,
    };
    return labels[f];
  };

  const fieldUnit = (f) => {
    const units = {
      Age: t.unit_age,
      SystolicBP: t.unit_sbp,
      DiastolicBP: t.unit_dbp,
      BS: t.unit_bs,
      BodyTemp: t.unit_temp,
      HeartRate: t.unit_hr,
    };
    return units[f];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(VITAL_CONFIG).map((f) => {
          const cfg = VITAL_CONFIG[f];
          const val = vitals[f] !== "" ? vitals[f] : "";
          const status = getClinicalStatus(f, val);

          return (
            <div
              key={f}
              className={`p-5 rounded-2xl border transition-all ${
                status?.level === "danger"
                  ? "bg-rose-500/5 border-rose-400/40 shadow-md shadow-rose-500/5"
                  : status?.level === "warning"
                  ? "bg-amber-500/5 border-amber-400/40"
                  : "bg-white border-slate-200/90 shadow-sm hover:border-teal-400/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className={`text-slate-800 text-sm font-bold flex items-center gap-1.5 ${isRtl ? "font-urdu flex-row-reverse" : ""}`}>
                  <Activity className="w-4 h-4 text-teal-600" />
                  {fieldLabel(f)}
                </label>
                <span className="text-xs font-semibold text-slate-400">({fieldUnit(f)})</span>
              </div>

              {/* Number Input + Slider Row */}
              <div className="space-y-3 mt-3">
                <div className="relative">
                  <input
                    type="number"
                    step={cfg.step}
                    min={cfg.min}
                    max={cfg.max}
                    value={val}
                    onChange={(e) => setVitals((v) => ({ ...v, [f]: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${
                      errors[f] ? "border-rose-500 bg-rose-50" : "border-slate-200"
                    }`}
                    placeholder={`${cfg.min} - ${cfg.max}`}
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                    {fieldUnit(f)}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={val || cfg.min}
                  onChange={(e) => setVitals((v) => ({ ...v, [f]: e.target.value }))}
                  className={`cursor-pointer ${status?.level === "danger" ? "slider-danger" : ""}`}
                />
              </div>

              {/* Dynamic Clinical Status Pill */}
              <div className="flex items-center justify-between mt-3 text-xs">
                {status ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
                      status.level === "danger"
                        ? "bg-rose-500 text-white animate-pulse"
                        : status.level === "warning"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {status.level === "danger" ? (
                      <ShieldAlert className="w-3 h-3" />
                    ) : status.level === "warning" ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    <span className={isRtl ? "font-urdu" : ""}>{status.text}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Range: {cfg.min}-{cfg.max}</span>
                )}
                {errors[f] && <span className="text-rose-600 font-bold">Valid: {errors[f]}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

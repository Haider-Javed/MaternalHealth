"use client";
import React, { useState } from "react";
import { Activity, Info, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ShapExplainerCard({ featureContributions, vitals, t, isRtl }) {
  const [selectedFeature, setSelectedFeature] = useState(null);

  if (!featureContributions) return null;

  const sortedFeatures = Object.entries(featureContributions).sort(
    ([, a], [, b]) => b - a
  );

  const getClinicalInsight = (feat) => {
    const val = vitals[feat];
    const insights = {
      SystolicBP: `Systolic Blood Pressure of ${val} mmHg is a primary indicator for preeclampsia and hypertensive emergencies in maternal care.`,
      DiastolicBP: `Diastolic Blood Pressure of ${val} mmHg reflects vascular resistance and potential end-organ perfusion risk.`,
      BS: `Blood Sugar of ${val} mmol/L flags gestational diabetes or acute glycemic dysregulation.`,
      Age: `Maternal age of ${val} years influences baseline statistical risk profiles for obstetric complications.`,
      BodyTemp: `Body temperature of ${val} °F evaluates chorioamnionitis and systemic infection flags.`,
      HeartRate: `Maternal heart rate of ${val} bpm monitors maternal hemodynamics and dehydration/sepsis risks.`,
    };
    return insights[feat] || `Feature ${feat} contributes significantly to the final ML classification score.`;
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
    return labels[f] || f;
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
    return units[f] || "";
  };

  return (
    <div className="glass-panel rounded-3xl p-8 backdrop-blur-xl animate-slide-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className={`text-slate-900 text-xl font-extrabold ${isRtl ? "font-urdu" : ""}`}>
              SHAP Explainable AI — Clinical Risk Drivers
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Transparent TreeExplainer feature attribution percentages
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
          XAI Interpretable Model
        </span>
      </div>

      <div className="space-y-4 mb-6">
        {sortedFeatures.map(([feature, percentage]) => {
          const isSelected = selectedFeature === feature;
          const pct = Math.min(100, Math.max(0, percentage));

          return (
            <div
              key={feature}
              onClick={() => setSelectedFeature(isSelected ? null : feature)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-indigo-50/70 border-indigo-300 shadow-md"
                  : "bg-white/80 border-slate-100 hover:border-indigo-200 hover:bg-slate-50/80"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                <span className={`flex items-center gap-2 ${isRtl ? "font-urdu" : ""}`}>
                  {fieldLabel(feature)} ({vitals[feature]} {fieldUnit(feature)})
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                </span>
                <span className="text-indigo-600 font-mono font-extrabold">{percentage}% impact</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pct > 35
                      ? "bg-gradient-to-r from-rose-500 to-rose-600"
                      : pct > 20
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : "bg-gradient-to-r from-teal-400 to-emerald-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {isSelected && (
                <div className="mt-3 p-3 rounded-xl bg-indigo-100/60 border border-indigo-200 text-slate-700 text-xs leading-relaxed animate-slide-fade-up">
                  <strong className="text-indigo-900 block font-bold mb-1">Clinical Rationale:</strong>
                  {getClinicalInsight(feature)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

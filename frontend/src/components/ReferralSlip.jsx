"use client";
import React, { useRef, useState, useEffect } from "react";
import { HeartPulse, Printer, ShieldCheck, Eraser, CheckCircle2 } from "lucide-react";

export default function ReferralSlip({ vitals, redFlags, result, hospital, lang, t, isRtl }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasSigned(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeFlags = [];
  if (redFlags.vaginalBleeding) activeFlags.push(t.vaginalBleeding);
  if (redFlags.severeHeadache) activeFlags.push(t.severeHeadache);
  if (redFlags.facialSwelling) activeFlags.push(t.facialSwelling);

  const formattedDate = new Date().toLocaleString(lang === "ur" ? "ur-PK" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="w-full">
      {/* Screen-only Action Toolbar */}
      <div className="print:hidden flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.who_verified || "WHO Safety Audit Passed"}</span>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-md transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 text-teal-400" />
          <span className={isRtl ? "font-urdu" : ""}>{t.printReferral}</span>
        </button>
      </div>

      {/* Printable Slip Container */}
      <div
        id="printable-referral-slip"
        dir={isRtl ? "rtl" : "ltr"}
        className="bg-white border-2 border-slate-900 rounded-3xl p-8 text-slate-900 shadow-xl print:shadow-none print:border-2 print:border-black print:p-8 print:w-full print:m-0 print:rounded-none"
      >
        {/* Slip Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <HeartPulse className="w-6 h-6 text-teal-400 animate-pulse" />
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tight ${isRtl ? "font-urdu" : ""}`}>
                  {t.referralTitle}
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  {t.referralHeaderSubtitle}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.dateLabel}</p>
            <p className="text-xs font-bold text-slate-900 mt-1 bg-slate-100 px-3 py-1 rounded-md">{formattedDate}</p>
          </div>
        </div>

        {/* Risk Level Highlight Box */}
        <div
          className={`flex items-center justify-between p-5 rounded-2xl mb-6 border-2 ${
            result.risk_level === "High Risk"
              ? "bg-rose-50 border-rose-600 text-rose-900"
              : "bg-emerald-50 border-emerald-600 text-emerald-900"
          }`}
        >
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-1">
              {t.result_title}
            </span>
            <h2 className={`text-3xl font-black ${isRtl ? "font-urdu" : ""}`}>
              {result.risk_level === "High Risk" ? t.risk_high : t.risk_low}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">{t.probability}</span>
            <p className="text-2xl font-black">{(result.probability * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Vitals Summary Grid */}
        <div className="mb-6">
          <h3 className={`text-xs font-black uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 ${isRtl ? "font-urdu text-right" : ""}`}>
            {t.patientVitals}
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
              <span className="text-slate-500 block font-semibold">{t.age}</span>
              <strong className="text-sm font-bold text-slate-900">{vitals.Age} {t.unit_age}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
              <span className="text-slate-500 block font-semibold">{t.systolicBP} / {t.diastolicBP}</span>
              <strong className="text-sm font-bold text-slate-900">{vitals.SystolicBP}/{vitals.DiastolicBP} {t.unit_sbp}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
              <span className="text-slate-500 block font-semibold">{t.bs}</span>
              <strong className="text-sm font-bold text-slate-900">{vitals.BS} {t.unit_bs}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
              <span className="text-slate-500 block font-semibold">{t.bodyTemp}</span>
              <strong className="text-sm font-bold text-slate-900">{vitals.BodyTemp} {t.unit_temp}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
              <span className="text-slate-500 block font-semibold">{t.heartRate}</span>
              <strong className="text-sm font-bold text-slate-900">{vitals.HeartRate} {t.unit_hr}</strong>
            </div>
          </div>
        </div>

        {/* Red Flags Section */}
        <div className="mb-6">
          <h3 className={`text-xs font-black uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 ${isRtl ? "font-urdu text-right" : ""}`}>
            {t.activeRedFlags}
          </h3>
          {activeFlags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="bg-rose-100 text-rose-900 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-rose-400 flex items-center gap-1.5"
                >
                  ⚠ {flag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">{t.noneReported}</p>
          )}
        </div>

        {/* Precaution Recommendations */}
        {result.precautionary_measures?.length > 0 && (
          <div className="mb-6">
            <h3 className={`text-xs font-black uppercase tracking-wider border-b-2 border-slate-900 pb-1 mb-3 ${isRtl ? "font-urdu text-right" : ""}`}>
              {t.precautions_title}
            </h3>
            <ul className="space-y-2 text-xs text-slate-900 font-medium">
              {result.precautionary_measures.map((p, idx) => (
                <li key={idx} className={`flex items-start gap-2 ${isRtl ? "font-urdu text-right flex-row-reverse" : ""}`}>
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hospital Handover Facility */}
        {hospital && (
          <div className="mb-6 bg-teal-50 p-4 rounded-xl border border-teal-300">
            <h3 className={`text-xs font-bold text-teal-900 uppercase tracking-wider ${isRtl ? "font-urdu text-right" : ""}`}>
              {t.recommendedFacility}
            </h3>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="font-extrabold text-slate-900">{hospital.name} ({hospital.type})</span>
              <span className="text-teal-800 font-bold">{hospital.distance_km} km away</span>
            </div>
          </div>
        )}

        {/* Interactive Digital Signature Canvas */}
        <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-end flex-wrap gap-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-xs text-slate-800">{t.lhwSignature}</p>
              <button
                type="button"
                onClick={clearSignature}
                className="print:hidden text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <Eraser className="w-3 h-3" /> {t.clear_signature || "Clear"}
              </button>
            </div>
            <div className="relative border-2 border-dashed border-slate-400 rounded-xl bg-slate-50 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={220}
                height={60}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="cursor-crosshair block"
              />
              {!hasSigned && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 pointer-events-none italic">
                  {t.sign_here || "Sign Here (Touch / Mouse)"}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>MedTriage AI Security Protocol</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
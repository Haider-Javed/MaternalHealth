"use client";
import React from "react";
import { HeartPulse, Printer } from "lucide-react";

export default function ReferralSlip({ vitals, redFlags, result, hospital, lang, t, isRtl }) {
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
            {/* Screen-only Print Trigger Button */}
            <div className="print:hidden flex justify-end mb-4">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-md transition-all cursor-pointer"
                >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span className={isRtl ? "font-urdu" : ""}>{t.printReferral}</span>
                </button>
            </div>

            {/* Printable Area (Styled for both screen view & browser print window) */}
            <div
                id="printable-referral-slip"
                dir={isRtl ? "rtl" : "ltr"}
                className="bg-white border-2 border-slate-900 rounded-2xl p-6 text-slate-900 shadow-sm print:shadow-none print:border-2 print:border-black print:p-8 print:w-full print:m-0 print:rounded-none"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <HeartPulse className="w-6 h-6 text-slate-900" />
                            <h1 className={`text-xl font-black tracking-tight ${isRtl ? "font-urdu" : ""}`}>
                                {t.referralTitle}
                            </h1>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                            {t.referralHeaderSubtitle}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-500">{t.dateLabel}</p>
                        <p className="text-xs font-semibold text-slate-900 mt-0.5">{formattedDate}</p>
                    </div>
                </div>

                {/* Risk Badge */}
                <div className="flex items-center justify-between bg-slate-100 p-4 rounded-xl mb-5 border border-slate-300">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {t.result_title}
                        </span>
                        <h2
                            className={`text-2xl font-black ${result.risk_level === "High Risk" ? "text-rose-700" : "text-emerald-700"
                                } ${isRtl ? "font-urdu" : ""}`}
                        >
                            {result.risk_level === "High Risk" ? t.risk_high : t.risk_low}
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-500">{t.probability}</span>
                        <p className="text-base font-bold text-slate-900">
                            {(result.probability * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Vitals Summary Grid */}
                <div className="mb-5">
                    <h3 className={`text-sm font-bold border-b border-slate-300 pb-1 mb-2.5 ${isRtl ? "font-urdu text-right" : ""}`}>
                        {t.patientVitals}
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block font-medium">{t.age}:</span>
                            <strong className="text-sm font-bold text-slate-900">{vitals.Age} {t.unit_age}</strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block font-medium">{t.systolicBP} / {t.diastolicBP}:</span>
                            <strong className="text-sm font-bold text-slate-900">{vitals.SystolicBP}/{vitals.DiastolicBP} {t.unit_sbp}</strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block font-medium">{t.bs}:</span>
                            <strong className="text-sm font-bold text-slate-900">{vitals.BS} {t.unit_bs}</strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block font-medium">{t.bodyTemp}:</span>
                            <strong className="text-sm font-bold text-slate-900">{vitals.BodyTemp} {t.unit_temp}</strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-slate-500 block font-medium">{t.heartRate}:</span>
                            <strong className="text-sm font-bold text-slate-900">{vitals.HeartRate} {t.unit_hr}</strong>
                        </div>
                    </div>
                </div>

                {/* Active Red Flags Section */}
                <div className="mb-5">
                    <h3 className={`text-sm font-bold border-b border-slate-300 pb-1 mb-2 ${isRtl ? "font-urdu text-right" : ""}`}>
                        {t.activeRedFlags}
                    </h3>
                    {activeFlags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {activeFlags.map((flag, idx) => (
                                <span
                                    key={idx}
                                    className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-300"
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
                {result.precautionary_measures.length > 0 && (
                    <div className="mb-5">
                        <h3 className={`text-sm font-bold border-b border-slate-300 pb-1 mb-2 ${isRtl ? "font-urdu text-right" : ""}`}>
                            {t.precautions_title}
                        </h3>
                        <ul className="list-disc list-inside text-xs space-y-1 text-slate-800 font-medium">
                            {result.precautionary_measures.map((p, idx) => (
                                <li key={idx} className={isRtl ? "font-urdu text-right" : ""}>
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Referral Hospital Details (If present) */}
                {hospital && (
                    <div className="mb-6 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                        <h3 className={`text-xs font-bold text-blue-900 ${isRtl ? "font-urdu text-right" : ""}`}>
                            {t.recommendedFacility}
                        </h3>
                        <div className="flex justify-between items-center text-xs mt-1">
                            <span className="font-bold text-slate-900">{hospital.name} ({hospital.type})</span>
                            <span className="text-blue-700 font-bold">{hospital.distance_km} km away</span>
                        </div>
                    </div>
                )}

                {/* Signature Line */}
                <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-xs">
                    <div>
                        <p className="font-bold text-slate-700">{t.lhwSignature}</p>
                        <div className="w-48 border-b-2 border-slate-800 mt-8"></div>
                    </div>
                    <div className="text-slate-400 font-medium text-[10px]">
                        Generated via MedTriage AI Co-Pilot
                    </div>
                </div>
            </div>
        </div>
    );
}
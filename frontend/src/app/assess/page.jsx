"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import HospitalMap from "@/components/HospitalMap";
import ReferralSlip from "@/components/ReferralSlip";
import {
  HeartPulse, Mic, MicOff, RefreshCw, Sparkles, Loader2,
  AlertTriangle, CheckCircle, ArrowLeft, Hospital, Phone, MapPinned,
  ShieldAlert, Activity
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const PRESET = { Age: "35", SystolicBP: "145", DiastolicBP: "95", BS: "11.2", BodyTemp: "100.1", HeartRate: "102" };
const FIELDS = ["Age", "SystolicBP", "DiastolicBP", "BS", "BodyTemp", "HeartRate"];

export default function AssessPage() {
  const { t, lang, isRtl } = useLang();
  const router = useRouter();

  const [vitals, setVitals] = useState({ Age: "", SystolicBP: "", DiastolicBP: "", BS: "", BodyTemp: "", HeartRate: "" });
  const [redFlags, setRedFlags] = useState({ vaginalBleeding: false, severeHeadache: false, facialSwelling: false });
  const [errors, setErrors] = useState({});

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("audio/webm");

  useEffect(() => {
    if (typeof window !== "undefined" && typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeTypeRef.current = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeTypeRef.current = "audio/mp4";
      } else {
        mimeTypeRef.current = "audio/webm";
      }
    }
  }, []);

  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [hospitals, setHospitals] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const fieldLabel = (f) => {
    const labels = { Age: t.age, SystolicBP: t.systolicBP, DiastolicBP: t.diastolicBP, BS: t.bs, BodyTemp: t.bodyTemp, HeartRate: t.heartRate };
    return labels[f];
  };

  const fieldUnit = (f) => {
    const units = { Age: t.unit_age, SystolicBP: t.unit_sbp, DiastolicBP: t.unit_dbp, BS: t.unit_bs, BodyTemp: t.unit_temp, HeartRate: t.unit_hr };
    return units[f];
  };

  const validate = () => {
    const errs = {};
    if (!vitals.Age || +vitals.Age < 10 || +vitals.Age > 70) errs.Age = "10–70";
    if (!vitals.SystolicBP || +vitals.SystolicBP < 60 || +vitals.SystolicBP > 220) errs.SystolicBP = "60–220";
    if (!vitals.DiastolicBP || +vitals.DiastolicBP < 40 || +vitals.DiastolicBP > 140) errs.DiastolicBP = "40–140";
    if (!vitals.BS || +vitals.BS < 3 || +vitals.BS > 25) errs.BS = "3–25";
    if (!vitals.BodyTemp || +vitals.BodyTemp < 95 || +vitals.BodyTemp > 106) errs.BodyTemp = "95–106";
    if (!vitals.HeartRate || +vitals.HeartRate < 40 || +vitals.HeartRate > 180) errs.HeartRate = "40–180";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: mimeTypeRef.current });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = handleAudioStop;
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setVoiceStatus("listening");
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    setVoiceStatus("processing");
  };

  const handleAudioStop = async () => {
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    const form = new FormData();
    form.append("file", blob, mimeTypeRef.current.includes("mp4") ? "vitals.mp4" : "vitals.webm");
    try {
      const res = await fetch(`${API}/api/process-audio`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (data.vitals) {
        setVitals(v => ({
          ...v,
          Age: data.vitals.Age !== null && data.vitals.Age !== undefined ? String(data.vitals.Age) : v.Age,
          SystolicBP: data.vitals.SystolicBP !== null && data.vitals.SystolicBP !== undefined ? String(data.vitals.SystolicBP) : v.SystolicBP,
          DiastolicBP: data.vitals.DiastolicBP !== null && data.vitals.DiastolicBP !== undefined ? String(data.vitals.DiastolicBP) : v.DiastolicBP,
          BS: data.vitals.BS !== null && data.vitals.BS !== undefined ? String(data.vitals.BS) : v.BS,
          BodyTemp: data.vitals.BodyTemp !== null && data.vitals.BodyTemp !== undefined ? String(data.vitals.BodyTemp) : v.BodyTemp,
          HeartRate: data.vitals.HeartRate !== null && data.vitals.HeartRate !== undefined ? String(data.vitals.HeartRate) : v.HeartRate,
        }));

        setRedFlags({
          vaginalBleeding: Boolean(data.vitals.vaginal_bleeding),
          severeHeadache: Boolean(data.vitals.severe_headache),
          facialSwelling: Boolean(data.vitals.facial_swelling),
        });
      }
    } catch (e) {
      alert(`Voice processing failed: ${e.message}`);
    } finally {
      setVoiceStatus("idle");
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);
    setHospitals([]);
    setUserCoords(null);

    try {
      const body = {
        Age: parseInt(vitals.Age), SystolicBP: parseInt(vitals.SystolicBP),
        DiastolicBP: parseInt(vitals.DiastolicBP), BS: parseFloat(vitals.BS),
        BodyTemp: parseFloat(vitals.BodyTemp), HeartRate: parseInt(vitals.HeartRate),
        vaginal_bleeding: redFlags.vaginalBleeding,
        severe_headache: redFlags.severeHeadache,
        facial_swelling: redFlags.facialSwelling,
        language: lang,
      };
      const res = await fetch(`${API}/api/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);

      if (data.risk_level === "High Risk") {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            setUserCoords({ lat, lng });
            setLoadingHospitals(true);
            try {
              const hRes = await fetch(`${API}/api/nearby-hospitals?lat=${lat}&lng=${lng}`);
              const hData = await hRes.json();
              setHospitals(hData.hospitals || []);
            } catch { /* empty */ }
            finally { setLoadingHospitals(false); }
          },
          () => {
            setUserCoords({ lat: 33.7204, lng: 73.0576 });
            fetch(`${API}/api/nearby-hospitals?lat=33.7204&lng=73.0576`)
              .then(r => r.json()).then(d => setHospitals(d.hospitals || [])).catch(() => { });
          }
        );
      }
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setVitals({ Age: "", SystolicBP: "", DiastolicBP: "", BS: "", BodyTemp: "", HeartRate: "" });
    setRedFlags({ vaginalBleeding: false, severeHeadache: false, facialSwelling: false });
    setErrors({});
    setResult(null);
    setHospitals([]);
    setUserCoords(null);
    setSubmitError(null);
  };

  const isHighRisk = result?.risk_level === "High Risk";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/60 to-slate-100 pb-16">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 max-w-5xl mx-auto print:hidden">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">
          <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          <span className={`text-sm font-semibold ${isRtl ? "font-urdu" : ""}`}>{t.back_to_form}</span>
        </button>
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-teal-600 animate-pulse" />
          <span className={`text-slate-800 font-bold ${isRtl ? "font-urdu" : ""}`}>{t.appName}</span>
        </div>
        <LanguageToggle />
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {!result && (
          <div className="glass-card rounded-3xl p-8 backdrop-blur-md animate-slide-up">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <h2 className={`text-slate-900 text-2xl font-bold ${isRtl ? "font-urdu" : ""}`}>{t.form_title}</h2>
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={voiceStatus === "processing"}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all select-none shadow-sm cursor-pointer
                  ${voiceStatus === "processing" ? "bg-slate-200 text-slate-500 cursor-wait" : isRecording ? "bg-rose-500 text-white pulse-ring" : "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-500/10"}`}
              >
                {voiceStatus === "processing" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> <span className={isRtl ? "font-urdu" : ""}>{t.voice_processing}</span></>
                ) : isRecording ? (
                  <><MicOff className="w-4 h-4" /> <span className={isRtl ? "font-urdu" : ""}>{t.voice_listening}</span></>
                ) : (
                  <><Mic className="w-4 h-4 text-teal-200" /> <span className={isRtl ? "font-urdu" : ""}>{t.voice_hold}</span></>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {FIELDS.map((f) => (
                <div key={f}>
                  <label className={`block text-slate-700 text-sm font-medium mb-1.5 ${isRtl ? "font-urdu text-right" : ""}`}>
                    {fieldLabel(f)} <span className="text-slate-400 ml-1">({fieldUnit(f)})</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={vitals[f]}
                    onChange={(e) => {
                      setVitals(v => ({ ...v, [f]: e.target.value }));
                      setErrors(er => ({ ...er, [f]: undefined }));
                    }}
                    className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${errors[f] ? "border-rose-500" : "border-slate-200"}`}
                    placeholder={fieldUnit(f)}
                  />
                  {errors[f] && <p className="text-rose-600 text-xs mt-1 font-medium">Valid range: {errors[f]}</p>}
                </div>
              ))}
            </div>

            <div className="mb-8 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className={`text-slate-900 font-bold text-base ${isRtl ? "font-urdu" : ""}`}>{t.redFlagsTitle}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <span className={`text-sm font-semibold text-slate-800 ${isRtl ? "font-urdu" : ""}`}>{t.vaginalBleeding}</span>
                  <input type="checkbox" checked={redFlags.vaginalBleeding} onChange={(e) => setRedFlags(rf => ({ ...rf, vaginalBleeding: e.target.checked }))} className="w-5 h-5 text-rose-600" />
                </label>
                <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <span className={`text-sm font-semibold text-slate-800 ${isRtl ? "font-urdu" : ""}`}>{t.severeHeadache}</span>
                  <input type="checkbox" checked={redFlags.severeHeadache} onChange={(e) => setRedFlags(rf => ({ ...rf, severeHeadache: e.target.checked }))} className="w-5 h-5 text-rose-600" />
                </label>
                <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <span className={`text-sm font-semibold text-slate-800 ${isRtl ? "font-urdu" : ""}`}>{t.facialSwelling}</span>
                  <input type="checkbox" checked={redFlags.facialSwelling} onChange={(e) => setRedFlags(rf => ({ ...rf, facialSwelling: e.target.checked }))} className="w-5 h-5 text-rose-600" />
                </label>
              </div>
            </div>

            <div className={`flex flex-wrap gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-base shadow-lg shadow-teal-500/15 cursor-pointer hover:from-teal-500 hover:to-cyan-500 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-teal-200" />}
                <span className={isRtl ? "font-urdu" : ""}>{t.run_assessment}</span>
              </button>
              <button onClick={() => { setVitals(PRESET); setRedFlags({ vaginalBleeding: true, severeHeadache: false, facialSwelling: false }); }} className="px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer">
                <span className={isRtl ? "font-urdu" : ""}>{t.preset}</span>
              </button>
              <button onClick={handleReset} className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-400 hover:bg-slate-50 text-sm font-medium cursor-pointer">
                <RefreshCw className="w-4 h-4" /> <span className={isRtl ? "font-urdu" : ""}>{t.reset}</span>
              </button>
            </div>
            {submitError && <div className="mt-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-700 text-sm font-medium">⚠ {submitError}</div>}
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-slide-up">
            <div className={`rounded-3xl p-8 border ${isHighRisk ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {isHighRisk ? <AlertTriangle className="w-12 h-12 text-rose-600" /> : <CheckCircle className="w-12 h-12 text-emerald-600" />}
                  <div>
                    <p className="text-slate-500 text-sm font-semibold">{t.result_title}</p>
                    <h3 className={`text-3xl font-black mt-1 ${isHighRisk ? "text-rose-600" : "text-emerald-600"} ${isRtl ? "font-urdu" : ""}`}>
                      {isHighRisk ? t.risk_high : t.risk_low}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">{t.probability}: <span className="text-slate-800 font-bold">{(result.probability * 100).toFixed(1)}%</span></p>
                  </div>
                </div>
                <button onClick={handleReset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold shadow-sm bg-white cursor-pointer">
                  <RefreshCw className="w-4 h-4" /> <span className={isRtl ? "font-urdu" : ""}>{t.back_to_form}</span>
                </button>
              </div>
            </div>

            {/* SHAP Explainable AI (XAI) Risk Contribution Breakdown */}
            {result.feature_contributions && (
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-5">
                  <Activity className="w-6 h-6 text-indigo-600" />
                  <h3 className={`text-slate-900 text-xl font-bold ${isRtl ? "font-urdu" : ""}`}>
                    SHAP Explainable AI — Clinical Risk Drivers
                  </h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(result.feature_contributions)
                    .sort(([, a], [, b]) => b - a)
                    .map(([feature, percentage]) => (
                      <div key={feature} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{fieldLabel(feature) || feature} ({vitals[feature]} {fieldUnit(feature)})</span>
                          <span>{percentage}% impact</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${percentage > 35 ? "bg-rose-500" : percentage > 20 ? "bg-amber-500" : "bg-teal-500"}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {result.precautionary_measures.length > 0 && (
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-5">
                  <Sparkles className="w-6 h-6 text-teal-600" />
                  <h3 className={`text-slate-900 text-xl font-bold ${isRtl ? "font-urdu" : ""}`}>{t.precautions_title}</h3>
                </div>
                <ul className="space-y-3.5">
                  {result.precautionary_measures.map((p, i) => (
                    <li key={i} className={`flex gap-3 text-slate-700 leading-relaxed ${isRtl ? "font-urdu flex-row-reverse text-right" : ""}`}>
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/10 text-teal-700 text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                      <span className="font-medium">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isHighRisk && (
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-5">
                  <MapPinned className="w-6 h-6 text-rose-600" />
                  <h3 className={`text-slate-900 text-xl font-bold ${isRtl ? "font-urdu" : ""}`}>{t.hospital_map_title}</h3>
                </div>
                {loadingHospitals ? (
                  <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className={isRtl ? "font-urdu" : ""}>{t.loading_hospitals}</span>
                  </div>
                ) : userCoords ? (
                  <>
                    <HospitalMap userLat={userCoords.lat} userLng={userCoords.lng} hospitals={hospitals} />
                    {hospitals.length > 0 && (
                      <div className="mt-6 space-y-2">
                        {hospitals.slice(0, 5).map((h) => (
                          <div key={h.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <Hospital className="w-4 h-4 text-teal-600 flex-shrink-0" />
                              <div>
                                <p className={`text-slate-800 text-sm font-bold ${isRtl ? "font-urdu" : ""}`}>{h.name}</p>
                                <p className="text-slate-400 text-xs font-medium">{h.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-teal-600 text-sm font-bold">{h.distance_km} km</p>
                              {h.phone !== "—" && (
                                <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5 font-medium">
                                  <Phone className="w-3 h-3 text-teal-500" /> {h.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            <div className="glass-card rounded-3xl p-8">
              <ReferralSlip vitals={vitals} redFlags={redFlags} result={result} hospital={hospitals.length > 0 ? hospitals[0] : null} lang={lang} t={t} isRtl={isRtl} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
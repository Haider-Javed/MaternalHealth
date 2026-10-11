"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import HospitalMap from "@/components/HospitalMap";
import ReferralSlip from "@/components/ReferralSlip";
import EcgCanvas from "@/components/EcgCanvas";
import AudioWaveform from "@/components/AudioWaveform";
import InteractiveVitalsInput from "@/components/InteractiveVitalsInput";
import ShapExplainerCard from "@/components/ShapExplainerCard";
import {
  HeartPulse, Mic, MicOff, RefreshCw, Sparkles, Loader2,
  AlertTriangle, CheckCircle, ArrowLeft, Hospital, Phone, MapPinned,
  ShieldAlert, Activity, CheckCircle2, Zap
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const PRESET_NORMAL = { Age: "25", SystolicBP: "115", DiastolicBP: "75", BS: "5.5", BodyTemp: "98.6", HeartRate: "72" };
const PRESET_HIGH_RISK = { Age: "35", SystolicBP: "155", DiastolicBP: "98", BS: "11.2", BodyTemp: "100.2", HeartRate: "105" };

export default function AssessPage() {
  const { t, lang, isRtl } = useLang();
  const router = useRouter();

  const [vitals, setVitals] = useState({ Age: "", SystolicBP: "", DiastolicBP: "", BS: "", BodyTemp: "", HeartRate: "" });
  const [redFlags, setRedFlags] = useState({ vaginalBleeding: false, severeHeadache: false, facialSwelling: false });
  const [errors, setErrors] = useState({});

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceNotice, setVoiceNotice] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("audio/webm");
  const startTimeRef = useRef(0);

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
    if (isRecording || voiceStatus === "processing") return;
    setVoiceNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: mimeTypeRef.current });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = handleAudioStop;
      mediaRecorderRef.current = mr;
      startTimeRef.current = Date.now();
      mr.start(100);
      setIsRecording(true);
      setVoiceStatus("listening");
    } catch {
      setVoiceNotice("Microphone access denied. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    try {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    } catch {
      /* empty */
    }
    setIsRecording(false);
    setVoiceStatus("processing");
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAudioStop = async () => {
    const duration = Date.now() - startTimeRef.current;
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });

    if (duration < 500 || blob.size < 500) {
      setVoiceNotice(t.voice_too_short || "Audio recording was too brief. Please speak clearly into the microphone.");
      setVoiceStatus("idle");
      setIsRecording(false);
      return;
    }

    const form = new FormData();
    form.append("file", blob, mimeTypeRef.current.includes("mp4") ? "vitals.mp4" : "vitals.webm");

    try {
      const res = await fetch(`${API}/api/process-audio`, { method: "POST", body: form });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: "Audio upload failed" }));
        throw new Error(errJson.detail || "Audio processing error");
      }

      const data = await res.json();

      if (data.vitals) {
        setVitals((v) => ({
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

        setVoiceNotice("✓ Voice vitals extracted successfully!");
        setTimeout(() => setVoiceNotice(null), 4000);
      }
    } catch (e) {
      setVoiceNotice(`Voice processing notice: ${e.message}`);
    } finally {
      setVoiceStatus("idle");
      setIsRecording(false);
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
        Age: parseInt(vitals.Age),
        SystolicBP: parseInt(vitals.SystolicBP),
        DiastolicBP: parseInt(vitals.DiastolicBP),
        BS: parseFloat(vitals.BS),
        BodyTemp: parseFloat(vitals.BodyTemp),
        HeartRate: parseInt(vitals.HeartRate),
        vaginal_bleeding: redFlags.vaginalBleeding,
        severe_headache: redFlags.severeHeadache,
        facial_swelling: redFlags.facialSwelling,
        language: lang,
      };

      const res = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Server status ${res.status}`);
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
            } catch {
              /* empty */
            } finally {
              setLoadingHospitals(false);
            }
          },
          () => {
            // Default Islamabad coords fallback
            setUserCoords({ lat: 33.7204, lng: 73.0576 });
            fetch(`${API}/api/nearby-hospitals?lat=33.7204&lng=73.0576`)
              .then((r) => r.json())
              .then((d) => setHospitals(d.hospitals || []))
              .catch(() => {});
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
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen medical-hope-bg pb-16">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 max-w-6xl mx-auto print:hidden">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors cursor-pointer font-bold text-sm"
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          <span className={isRtl ? "font-urdu" : ""}>{t.back_to_form}</span>
        </button>
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-teal-600 animate-pulse" />
          <span className={`text-slate-900 font-extrabold text-base ${isRtl ? "font-urdu" : ""}`}>{t.appName} Studio</span>
        </div>
        <LanguageToggle />
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Voice Waveform Overlay Component */}
        <AudioWaveform
          isRecording={isRecording}
          isProcessing={voiceStatus === "processing"}
          statusText={voiceStatus === "processing" ? t.voice_processing : t.voice_listening}
          isRtl={isRtl}
        />

        {!result && (
          <div className="glass-panel rounded-3xl p-8 backdrop-blur-xl animate-slide-fade-up space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200/80 pb-6">
              <div>
                <h2 className={`text-slate-900 text-2xl font-black ${isRtl ? "font-urdu" : ""}`}>{t.form_title}</h2>
                <p className="text-slate-500 text-xs mt-1 font-semibold">
                  Hold microphone button for hands-free Urdu/English AI voice extraction or use interactive sliders
                </p>
              </div>

              {/* Voice AI Button */}
              <button
                onClick={toggleRecording}
                disabled={voiceStatus === "processing"}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all select-none shadow-lg cursor-pointer
                  ${
                    voiceStatus === "processing"
                      ? "bg-slate-200 text-slate-500 cursor-wait"
                      : isRecording
                      ? "bg-rose-600 text-white voice-recording-pulse"
                      : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/20 hover:from-teal-500 hover:to-emerald-500"
                  }`}
              >
                {voiceStatus === "processing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className={isRtl ? "font-urdu" : ""}>{t.voice_processing}</span>
                  </>
                ) : isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className={isRtl ? "font-urdu" : ""}>{t.voice_listening}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-teal-200" />
                    <span className={isRtl ? "font-urdu" : ""}>{t.voice_hold}</span>
                  </>
                )}
              </button>
            </div>

            {voiceNotice && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold transition-all border ${
                  voiceNotice.startsWith("✓")
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-900 border-amber-300"
                }`}
              >
                {voiceNotice}
              </div>
            )}

            {/* Dual Input Vitals Entry Deck */}
            <InteractiveVitalsInput vitals={vitals} setVitals={setVitals} errors={errors} t={t} isRtl={isRtl} />

            {/* Red Flag Emergency Override Matrix */}
            <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-400/20 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className={`text-slate-900 font-extrabold text-base ${isRtl ? "font-urdu" : ""}`}>{t.redFlagsTitle}</h3>
                  <p className="text-xs text-rose-700/80 font-medium">{t.redFlagsSubtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${redFlags.vaginalBleeding ? "bg-rose-50 border-rose-400 shadow-sm" : "bg-white border-slate-200"}`}>
                  <span className={`text-xs font-bold text-slate-800 ${isRtl ? "font-urdu" : ""}`}>{t.vaginalBleeding}</span>
                  <input
                    type="checkbox"
                    checked={redFlags.vaginalBleeding}
                    onChange={(e) => setRedFlags((rf) => ({ ...rf, vaginalBleeding: e.target.checked }))}
                    className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                  />
                </label>

                <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${redFlags.severeHeadache ? "bg-rose-50 border-rose-400 shadow-sm" : "bg-white border-slate-200"}`}>
                  <span className={`text-xs font-bold text-slate-800 ${isRtl ? "font-urdu" : ""}`}>{t.severeHeadache}</span>
                  <input
                    type="checkbox"
                    checked={redFlags.severeHeadache}
                    onChange={(e) => setRedFlags((rf) => ({ ...rf, severeHeadache: e.target.checked }))}
                    className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                  />
                </label>

                <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${redFlags.facialSwelling ? "bg-rose-50 border-rose-400 shadow-sm" : "bg-white border-slate-200"}`}>
                  <span className={`text-xs font-bold text-slate-800 ${isRtl ? "font-urdu" : ""}`}>{t.facialSwelling}</span>
                  <input
                    type="checkbox"
                    checked={redFlags.facialSwelling}
                    onChange={(e) => setRedFlags((rf) => ({ ...rf, facialSwelling: e.target.checked }))}
                    className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                  />
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className={`flex flex-wrap gap-4 pt-4 border-t border-slate-200/80 ${isRtl ? "flex-row-reverse" : ""}`}>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white font-black text-base shadow-xl shadow-teal-500/20 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-60 cursor-pointer transition-all"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-teal-200" />}
                <span className={isRtl ? "font-urdu" : ""}>{t.run_assessment}</span>
              </button>

              <button
                onClick={() => {
                  setVitals(PRESET_HIGH_RISK);
                  setRedFlags({ vaginalBleeding: true, severeHeadache: false, facialSwelling: false });
                }}
                className="px-5 py-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                <span className={isRtl ? "font-urdu" : ""}>{t.preset}</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-4 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span className={isRtl ? "font-urdu" : ""}>{t.reset}</span>
              </button>
            </div>

            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                ⚠ {submitError}
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {result && (
          <div className="space-y-8 animate-slide-fade-up">
            {/* Live ECG Pulse Canvas Banner */}
            <EcgCanvas bpm={isHighRisk ? 110 : 72} isHighRisk={isHighRisk} />

            {/* Risk Banner Card */}
            <div
              className={`rounded-3xl p-8 border-2 transition-all ${
                isHighRisk ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/10 border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-5">
                  {isHighRisk ? (
                    <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <AlertTriangle className="w-8 h-8 animate-bounce" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                      {t.result_title}
                    </span>
                    <h3 className={`text-3xl sm:text-4xl font-black mt-1 ${isHighRisk ? "text-rose-600" : "text-emerald-600"} ${isRtl ? "font-urdu" : ""}`}>
                      {isHighRisk ? t.risk_high : t.risk_low}
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      {t.probability}: <strong className="text-slate-900 font-bold">{(result.probability * 100).toFixed(1)}%</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-teal-600" />
                  <span className={isRtl ? "font-urdu" : ""}>{t.back_to_form}</span>
                </button>
              </div>
            </div>

            {/* SHAP XAI Feature Contribution Card */}
            {result.feature_contributions && (
              <ShapExplainerCard featureContributions={result.feature_contributions} vitals={vitals} t={t} isRtl={isRtl} />
            )}

            {/* Actionable Gemini Precaution List */}
            {result.precautionary_measures?.length > 0 && (
              <div className="glass-panel rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-200/80 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-slate-900 text-xl font-extrabold ${isRtl ? "font-urdu" : ""}`}>{t.precautions_title}</h3>
                    <p className="text-xs text-slate-500 font-medium">WHO-audited first-responder care instructions</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {result.precautionary_measures.map((p, i) => (
                    <li key={i} className={`flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm leading-relaxed ${isRtl ? "font-urdu flex-row-reverse text-right" : ""}`}>
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-800 text-sm font-semibold">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* GIS Emergency Hospital Map (If High Risk) */}
            {isHighRisk && (
              <div className="glass-panel rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-200/80 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                    <MapPinned className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-slate-900 text-xl font-extrabold ${isRtl ? "font-urdu" : ""}`}>{t.hospital_map_title}</h3>
                    <p className="text-xs text-slate-500 font-medium">OpenStreetMap Overpass GIS proximity scan (&lt; 5km)</p>
                  </div>
                </div>

                {loadingHospitals ? (
                  <div className="flex items-center gap-3 text-slate-600 p-6">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className={isRtl ? "font-urdu" : ""}>{t.loading_hospitals}</span>
                  </div>
                ) : userCoords ? (
                  <div className="space-y-6">
                    <HospitalMap userLat={userCoords.lat} userLng={userCoords.lng} hospitals={hospitals} />

                    {hospitals.length > 0 && (
                      <div className="space-y-3">
                        {hospitals.slice(0, 5).map((h) => (
                          <div key={h.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                                <Hospital className="w-5 h-5" />
                              </div>
                              <div>
                                <p className={`text-slate-900 text-sm font-black ${isRtl ? "font-urdu" : ""}`}>{h.name}</p>
                                <p className="text-slate-500 text-xs font-semibold">{h.type}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <p className="text-teal-700 text-sm font-black">{h.distance_km} km</p>
                                {h.phone !== "—" && (
                                  <a href={`tel:${h.phone}`} className="flex items-center gap-1 text-slate-600 text-xs font-bold hover:text-teal-600 mt-0.5">
                                    <Phone className="w-3 h-3 text-teal-500" /> {h.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Referral Slip Container with Signature Pad */}
            <div className="glass-panel rounded-3xl p-8">
              <ReferralSlip vitals={vitals} redFlags={redFlags} result={result} hospital={hospitals.length > 0 ? hospitals[0] : null} lang={lang} t={t} isRtl={isRtl} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
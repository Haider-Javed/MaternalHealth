"use client";
import React, { useEffect, useState } from "react";
import { Mic, Volume2 } from "lucide-react";

export default function AudioWaveform({ isRecording, isProcessing, statusText, isRtl }) {
  const [barHeights, setBarHeights] = useState([12, 24, 18, 36, 15, 28, 42, 20, 30, 14, 25, 38]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setBarHeights(
        Array.from({ length: 14 }, () => Math.floor(Math.random() * 45) + 8)
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isRecording && !isProcessing) return null;

  return (
    <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-teal-900/90 via-slate-900 to-slate-900 border border-teal-500/30 text-white shadow-2xl animate-slide-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRecording ? "bg-rose-500 voice-recording-pulse" : "bg-teal-600 animate-spin"}`}>
            {isRecording ? <Mic className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <p className={`text-sm font-bold text-teal-200 ${isRtl ? "font-urdu" : ""}`}>
                {statusText || (isRecording ? "Voice AI Active" : "Processing Audio...")}
              </p>
            </div>
            <p className="text-xs text-slate-300">
              Groq Whisper-large-v3 Speech Engine
            </p>
          </div>
        </div>

        {/* Animated Soundwave Frequency Bars */}
        <div className="flex items-center gap-1.5 h-12 bg-slate-950/60 px-4 py-2 rounded-xl border border-teal-500/20">
          {barHeights.map((h, idx) => (
            <div
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-100 ${
                isRecording
                  ? idx % 2 === 0
                    ? "bg-gradient-to-t from-teal-500 to-emerald-300"
                    : "bg-gradient-to-t from-rose-500 to-amber-300"
                  : "bg-teal-500/40"
              }`}
              style={{ height: `${isRecording ? h : 10}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

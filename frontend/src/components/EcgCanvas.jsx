"use client";
import React, { useEffect, useRef, useState } from "react";

export default function EcgCanvas({ bpm = 75, isHighRisk = false }) {
  const canvasRef = useRef(null);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = 140);

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 140;
      }
    };
    window.addEventListener("resize", handleResize);

    // ECG points buffer
    let x = 0;
    const points = [];
    const maxPoints = Math.floor(width / 2);

    const strokeColor = isHighRisk ? "#f43f5e" : "#0d9488";
    const glowColor = isHighRisk ? "rgba(244, 63, 94, 0.4)" : "rgba(13, 148, 136, 0.4)";

    // ECG wave generator function
    const getEcgY = (step) => {
      const midY = height / 2;
      const cycle = step % 80;

      if (cycle === 30) return midY - 12; // P wave
      if (cycle === 32) return midY + 4;
      if (cycle === 38) return midY + 14; // Q wave
      if (cycle === 40) return midY - 55; // R peak (Main heartbeat spike)
      if (cycle === 43) return midY + 28; // S wave
      if (cycle === 50) return midY - 18; // T wave
      if (cycle === 53) return midY + 4;
      return midY + (Math.random() - 0.5) * 2; // Baseline noise
    };

    let stepCounter = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background medical grid
      ctx.strokeStyle = "rgba(13, 148, 136, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 16;
      for (let gx = 0; gx < width; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Add new ECG point
      stepCounter += 1;
      const y = getEcgY(stepCounter);

      if (stepCounter % 80 === 40) {
        setPulseCount((prev) => prev + 1);
      }

      points.push({ x, y });
      if (points.length > maxPoints) {
        points.shift();
      }

      // Move x forward
      x += 2;
      if (x > width) {
        x = 0;
        points.length = 0;
      }

      // Draw glowing ECG line
      if (points.length > 1) {
        ctx.save();
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";

        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Lead pulse head dot
        const lastPt = points[points.length - 1];
        if (lastPt) {
          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [bpm, isHighRisk]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900/90 backdrop-blur-md p-4 border border-teal-500/20 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full animate-ping ${isHighRisk ? "bg-rose-500" : "bg-emerald-400"}`} />
          <span className="text-xs font-mono font-semibold tracking-wider uppercase text-teal-300">
            Realtime ECG Monitor — {isHighRisk ? "High Risk Alert" : "Stable Pulse"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">BPM: <strong className="text-emerald-400 font-bold">{bpm}</strong></span>
          <span className="text-xs text-slate-400 font-mono">Pulses: <strong className="text-teal-300 font-bold">{pulseCount}</strong></span>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-[120px] block cursor-pointer" />
    </div>
  );
}

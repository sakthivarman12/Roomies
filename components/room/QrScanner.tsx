"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

/** Reads a QR code from the camera (or an uploaded photo) and hands the decoded text to onScan. */
export function QrScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  // Keep the latest callback without restarting the camera on every render.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let done = false;
    const finish = (text: string) => { if (done) return; done = true; onScanRef.current(text); };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (done || !video || !canvas || video.readyState < 2) { raf = requestAnimationFrame(tick); return; }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hit = jsQR(img.data, img.width, img.height);
      if (hit?.data) finish(hit.data);
      else raf = requestAnimationFrame(tick);
    };

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) { videoRef.current.srcObject = s; void videoRef.current.play(); }
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setError("Camera not available. Upload a photo of the QR code instead."));

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const fromFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx?.drawImage(img, 0, 0);
      const data = ctx?.getImageData(0, 0, img.width, img.height);
      const hit = data ? jsQR(data.data, data.width, data.height) : null;
      URL.revokeObjectURL(url);
      if (hit?.data) onScanRef.current(hit.data);
      else setError("No QR code found in that photo.");
    };
    img.src = url;
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <label className="block text-center text-sm font-semibold text-primary">
        <span className="cursor-pointer underline">Upload a photo instead</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) fromFile(f); }} />
      </label>
      <button type="button" onClick={onClose} className="w-full text-sm font-semibold text-muted">Cancel</button>
    </div>
  );
}

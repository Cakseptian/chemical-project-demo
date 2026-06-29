"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

const IconCamera = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconStop = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const IconUpload = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M12 12V4m0 0L8 8m4-4 4 4" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
);

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = "reader";
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!qrCodeRef.current) {
      qrCodeRef.current = new Html5Qrcode(containerId);
    }
    startScanner();

    return () => {
      if (qrCodeRef.current?.isScanning) {
        qrCodeRef.current.stop().catch((err) => console.error("Failed to stop scanner on unmount", err));
      }
    };
  }, []);

  const startScanner = async () => {
    if (!qrCodeRef.current || qrCodeRef.current.isScanning) return;
    try {
      setError(null);
      await qrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (decodedText) => {
          stopScanner().then(() => onScanSuccess(decodedText));
        },
        () => {}
      );
      setIsStarted(true);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.");
      setIsStarted(false);
    }
  };

  const stopScanner = async () => {
    if (qrCodeRef.current?.isScanning) {
      try {
        await qrCodeRef.current.stop();
        setIsStarted(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !qrCodeRef.current) return;
    try {
      setError(null);
      if (qrCodeRef.current.isScanning) await stopScanner();
      const decodedText = await qrCodeRef.current.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error("File scan error:", err);
      setError("Gagal membaca QR Code dari gambar. Pastikan gambar jelas dan tidak buram.");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Viewfinder */}
      <div className="relative bg-navy-900">
        <div
          id={containerId}
          className="w-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-none [&_canvas]:hidden"
          style={{ minHeight: "260px", aspectRatio: "1/1" }}
        />
        {/* Scanning indicator */}
        {isStarted && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold text-white">Scanning</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex flex-col gap-3">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        {/* Camera toggle */}
        {!isStarted ? (
          <button
            onClick={startScanner}
            className="w-full inline-flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all active:scale-95 text-sm"
          >
            <IconCamera />
            Mulai Scan
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-lg transition-all active:scale-95 text-sm border border-slate-200"
          >
            <IconStop />
            Stop Kamera
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400 font-medium">atau upload gambar</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* File upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-semibold py-2.5 px-4 rounded-lg transition-all active:scale-95 text-sm border border-slate-200 hover:border-slate-300"
        >
          <IconUpload />
          Upload QR Image
        </button>
      </div>
    </div>
  );
}

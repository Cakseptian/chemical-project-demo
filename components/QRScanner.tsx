"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

// Extend Window type for BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap) => Promise<Array<{ rawValue: string }>>;
    };
  }
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

/**
 * Pick the best rear camera deviceId for the current device.
 *
 * Strategy (in priority order):
 *   1. Label contains "wide" (explicit wide-angle label)
 *   2. Label matches "camera2 0" or ends with " 0, facing back" (Android camera2 API index 0 = wide)
 *   3. Label contains "back 0" or "rear 0"
 *   4. First camera whose label contains "back" or "rear" (lowest index wins)
 *   5. First videoinput device (single-camera fallback)
 *
 * On Huawei multi-camera setups, the wide lens is always camera index 0.
 * facingMode: "environment" incorrectly picks a higher-index telephoto lens.
 */
async function pickWideCameraId(): Promise<string | null> {
  try {
    // We need a live stream first to unlock device labels in the browser
    const permStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    permStream.getTracks().forEach((t) => t.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");

    if (videoInputs.length === 0) return null;
    if (videoInputs.length === 1) return videoInputs[0].deviceId;

    const label = (d: MediaDeviceInfo) => d.label.toLowerCase();

    // Priority 1: explicit "wide" in label
    const wide = videoInputs.find((d) => label(d).includes("wide"));
    if (wide) return wide.deviceId;

    // Priority 2: Android camera2 index 0 — "camera2 0, facing back"
    const cam2zero = videoInputs.find((d) => /camera2 0.*back/i.test(d.label) || /back.*camera2 0/i.test(d.label));
    if (cam2zero) return cam2zero.deviceId;

    // Priority 3: "back 0" or "rear 0"
    const backZero = videoInputs.find((d) => /back\s*0|rear\s*0/i.test(d.label));
    if (backZero) return backZero.deviceId;

    // Priority 4: first device whose label mentions "back" or "rear" (lowest array index = widest)
    const firstBack = videoInputs.find((d) => /back|rear|environment/i.test(d.label));
    if (firstBack) return firstBack.deviceId;

    // Priority 5: last resort — first device in the list
    return videoInputs[0].deviceId;
  } catch {
    return null; // Permission denied or enumeration failed — fall back to facingMode
  }
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const detectorRef = useRef<InstanceType<NonNullable<Window["BarcodeDetector"]>> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const fallbackId = "qr-fallback-reader";

  useEffect(() => {
    if (typeof window !== "undefined" && window.BarcodeDetector) {
      try {
        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detectorRef.current = null;
      }
    }
    startScanner();
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanLoop = useCallback((video: HTMLVideoElement) => {
    const detector = detectorRef.current;
    if (!detector) return;

    const tick = async () => {
      if (!video || video.readyState < 2 || video.paused || video.ended) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          const value = barcodes[0].rawValue;
          stopScanner();
          onScanSuccess(value);
          return;
        }
      } catch {
        // Detection frames with no QR code — expected, ignore
      }
      scanLoopRef.current = requestAnimationFrame(tick);
    };

    scanLoopRef.current = requestAnimationFrame(tick);
  }, [onScanSuccess]);

  const startScanner = async () => {
    if (isStarted) return;
    setError(null);

    if (typeof window !== "undefined" && !window.BarcodeDetector) {
      setError("Kamera langsung tidak tersedia di browser ini. Gunakan fitur upload gambar QR di bawah.");
      return;
    }

    try {
      // Try to enumerate cameras and pick the wide-angle lens by deviceId.
      // This is the reliable fix for Huawei multi-camera devices where
      // facingMode:"environment" incorrectly selects a telephoto lens.
      const wideCameraId = await pickWideCameraId();

      const videoConstraints: MediaTrackConstraints = wideCameraId
        ? {
          deviceId: { exact: wideCameraId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
        : {
          // Fallback for single-camera devices or enumeration failure
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setIsStarted(true);
        startScanLoop(videoRef.current);
      }
    } catch (err: unknown) {
      console.error("Failed to start camera:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser Anda.");
      } else {
        setError("Tidak dapat mengakses kamera. Pastikan kamera tersedia dan izin sudah diberikan.");
      }
      setIsStarted(false);
    }
  };

  const stopScanner = () => {
    if (scanLoopRef.current !== null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStarted(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopScanner();
    try {
      setError(null);
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode(fallbackId);
      }
      const decodedText = await html5QrRef.current.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error("File scan error:", err);
      setError("Gagal membaca QR Code dari gambar. Pastikan gambar jelas dan tidak buram.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Hidden div for html5-qrcode file scanning fallback */}
      <div id={fallbackId} className="hidden" />

      {/* Viewfinder */}
      <div className="relative bg-black w-full overflow-hidden" style={{ minHeight: "260px" }}>
        <video
          ref={videoRef}
          className="w-full h-auto block"
          muted
          playsInline
          autoPlay
        />

        {/* Scan target overlay */}
        {isStarted && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00ed64] rounded-tl-sm" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00ed64] rounded-tr-sm" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00ed64] rounded-bl-sm" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00ed64] rounded-br-sm" />
                <span className="absolute left-1 right-1 h-px bg-[#00ed64]/70 animate-[scan_2s_ease-in-out_infinite]" style={{ top: "50%" }} />
              </div>
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#00ed64] rounded-full animate-pulse" />
              <span className="text-[11px] font-semibold text-white">Scanning</span>
            </div>
          </>
        )}

        {/* Placeholder when camera is off */}
        {!isStarted && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40" style={{ minHeight: "260px" }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-xs font-medium">Kamera belum aktif</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex flex-col gap-3">

        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        {!isStarted ? (
          <button
            onClick={startScanner}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#001e2b] hover:bg-[#00293b] text-white font-semibold py-2.5 px-4 rounded-lg transition-all active:scale-95 text-sm"
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

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400 font-medium">atau upload gambar</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

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

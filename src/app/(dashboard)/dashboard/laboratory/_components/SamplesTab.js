"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { laboratoryApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { getStatusStyle, formatApiError } from "./utils";

export default function SamplesTab() {
  const [barcode, setBarcode] = useState("");
  const [sampleData, setSampleData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [rejectReason, setRejectReason] = useState("haemolysed");
  const [showReject, setShowReject] = useState(false);

  // Camera scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      toast("Point camera at barcode label then click 'Capture'", { icon: "📷" });
    } catch {
      toast.error("Camera not accessible. Please type the barcode manually.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    toast("Frame captured. For full OCR decoding, connect a hardware barcode scanner.", { icon: "ℹ️" });
    stopCamera();
  };

  const handleScan = async (e) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    setScanning(true);
    setSampleData(null);
    try {
      const res = await laboratoryApi.scanBarcode(code);
      // Response: { code, status, message, data: { sample: {...}, order: {...} } }
      const payload = res?.data?.data;
      setSampleData(payload);
      toast.success("Sample found!");
    } catch (err) {
      setSampleData(null);
      const msg = formatApiError(err);
      // Clarify the "not found" case
      if (err.response?.status === 404) {
        toast.error(`Barcode "${code}" not found. Please enter the exact barcode printed on the tube label (e.g. SMP-20260823-0E2544).`);
      } else {
        toast.error(msg);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!sampleData?.sample?.id) return;
    try {
      await laboratoryApi.rejectSample(sampleData.sample.id, { reason: rejectReason });
      toast.success("Sample rejected. Recollection request issued!");
      setShowReject(false);
      setSampleData(prev => prev ? { ...prev, sample: { ...prev.sample, status: "rejected" } } : null);
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="space-y-5">
      {/* Scanner UI */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">🏷️ Barcode Scanner</h3>
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <p className="font-bold">📌 Which barcode to enter?</p>
            <p>Enter the <strong>Sample Barcode</strong> — a code printed on the specimen tube label after sample collection.</p>
            <p>Format: <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded">SMP-YYYYMMDD-XXXXXX</span> &nbsp;e.g. <span className="font-mono">SMP-20260825-B8E32A</span></p>
            <p>🔎 You can find the barcode in the <strong>Worklist & Orders</strong> tab under the <strong>"Sample Barcodes"</strong> column (shown after a sample is collected).</p>
            <p>You can also plug in a USB barcode scanner — it will type directly into the field below.</p>
          </div>
        </div>

        <form onSubmit={handleScan} className="flex gap-3">
          <input
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="Type or scan barcode, e.g. SMP-20260823-0E2544"
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={scanning} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
            {scanning ? "Searching…" : "Search"}
          </button>
          <button type="button" onClick={cameraActive ? stopCamera : startCamera}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl border transition ${cameraActive ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
            {cameraActive ? "⏹ Stop Camera" : "📷 Camera Scan"}
          </button>
        </form>

        {/* Camera viewfinder */}
        {cameraActive && (
          <div className="relative rounded-xl overflow-hidden bg-black border-2 border-blue-500">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-56 object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2/3 h-16 border-2 border-blue-400 rounded opacity-70" />
            </div>
            <button onClick={captureFrame} className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg">
              📷 Capture
            </button>
          </div>
        )}

        {/* Result */}
        {sampleData && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">Barcode: {sampleData.sample?.barcode}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specimen: {sampleData.sample?.specimen_type} | Container: {sampleData.sample?.container_type}
                </p>
                {sampleData.order && (
                  <p className="text-xs text-slate-500 mt-0.5">Patient: <span className="font-semibold text-slate-700 dark:text-slate-300">{sampleData.order?.patient?.full_name || sampleData.sample?.order}</span></p>
                )}
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(sampleData.sample?.status)}`}>
                {sampleData.sample?.status?.toUpperCase()}
              </span>
            </div>

            {/* Chain of custody */}
            {sampleData.sample?.chain_of_custody_json?.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Chain of Custody:</p>
                <div className="space-y-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {sampleData.sample.chain_of_custody_json.map((log, i) => (
                    <div key={i} className="flex gap-4 flex-wrap">
                      <span className="text-slate-400">{log.timestamp}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action?.toUpperCase()}</span>
                      {log.reason && <span className="text-red-500">Reason: {log.reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sampleData.sample?.status !== "rejected" && (
              <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                <button onClick={() => setShowReject(true)} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition">Reject Specimen</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-red-600">Reject Specimen</h3>
            <form onSubmit={handleReject} className="space-y-4">
              <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm">
                <option value="haemolysed">Haemolysed</option>
                <option value="insufficient">Insufficient Sample</option>
                <option value="clotted">Clotted</option>
                <option value="mislabelled">Mislabelled</option>
                <option value="wrong_container">Wrong Container</option>
                <option value="other">Other</option>
              </select>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowReject(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { Calculator, Sparkles, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { notificationsApi } from "@/lib/tenant-api";

export default function SMSCalculatorPage() {
  const [text, setText] = useState("প্রিয় রোগী, আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে।");
  const [calcResult, setCalcResult] = useState({
    char_count: 0,
    segment_count: 1,
    is_unicode: true,
  });
  const [loading, setLoading] = useState(false);

  const calculateSegments = async (inputStr) => {
    if (!inputStr) {
      setCalcResult({ char_count: 0, segment_count: 0, is_unicode: false });
      return;
    }
    setLoading(true);
    try {
      const res = await notificationsApi.previewSegments({ text: inputStr });
      setCalcResult(res.data);
    } catch {
      // Local fallback calculation if offline
      const isUni = /[^\x00-\x7F]/.test(inputStr);
      const len = inputStr.length;
      let segs = 1;
      if (isUni) {
        segs = len <= 70 ? 1 : Math.ceil(len / 67);
      } else {
        segs = len <= 160 ? 1 : Math.ceil(len / 153);
      }
      setCalcResult({ char_count: len, segment_count: segs, is_unicode: isUni });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateSegments(text);
    }, 200);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          SMS Segment Calculator & Bangla Preview
        </h1>
        <p className="text-sm text-default-500 mt-1">
          Calculate exact segment counts for Bangla Unicode vs GSM ASCII SMS content before dispatching.
        </p>
      </div>

      {/* Main Interactive Tool */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-default-900 text-base">Message Content</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setText("Dear Patient, your appointment with Dr. Karim is confirmed on 2026-08-20.")}
                className="text-[11px] px-2.5 py-1 rounded bg-default-100 text-default-700 font-semibold hover:bg-default-200"
              >
                Sample English
              </button>
              <button
                onClick={() => setText("প্রিয় রোগী, ডা. করিমের সাথে আপনার অ্যাপয়েন্টমেন্ট ২০-০৮-২০২৬ তারিখে নির্ধারিত রয়েছে।")}
                className="text-[11px] px-2.5 py-1 rounded bg-primary/10 text-primary font-semibold hover:bg-primary/20"
              >
                Sample Bangla
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your SMS body text here..."
            className="w-full p-4 rounded-xl border border-input bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <div className="flex items-center justify-between text-xs text-default-500 pt-2">
            <span>Character Count: <strong className="text-default-900">{calcResult.char_count}</strong></span>
            {calcResult.is_unicode ? (
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold uppercase">
                Unicode Bangla Detected
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold uppercase">
                GSM 7-bit ASCII
              </span>
            )}
          </div>
        </div>

        {/* Live Metrics Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-default-900 text-base border-b border-border pb-2">
              Segment Analysis
            </h3>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-default-500">Calculated Segments</p>
              <p className="text-4xl font-black text-primary">{calcResult.segment_count}</p>
              <p className="text-[11px] text-default-400">SMS Credit(s) per Recipient</p>
            </div>

            <div className="space-y-2 text-xs text-default-600">
              <div className="flex justify-between py-1 border-b border-border">
                <span>Encoding standard:</span>
                <span className="font-bold text-default-900">
                  {calcResult.is_unicode ? "UCS-2 (Unicode)" : "GSM-7 (ASCII)"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span>Max chars per segment:</span>
                <span className="font-bold text-default-900">
                  {calcResult.is_unicode
                    ? calcResult.segment_count > 1 ? "67 chars/seg" : "70 chars"
                    : calcResult.segment_count > 1 ? "153 chars/seg" : "160 chars"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span>Estimated Quota Deduction:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {calcResult.segment_count} Credit(s)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-default-50 rounded-xl border border-border text-[11px] text-default-500 space-y-1">
            <p className="font-bold text-default-700">Bangla Unicode Rule (FR-COM-003):</p>
            <p>Single Bangla SMS = 70 characters max. Multi-part Bangla SMS = 67 characters per segment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

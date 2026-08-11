"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Tv, Activity, Clock, Stethoscope, Building2 } from "lucide-react";

import { schedulingApi } from "@/lib/tenant-api";

export default function PublicWaitingRoomDisplayPage({ params }) {
  const unwrappedParams = use(params);
  const branchId = unwrappedParams.branchId;
  const doctorId = unwrappedParams.doctorId;

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPublicQueue = useCallback(async () => {
    try {
      const res = await schedulingApi.getPublicQueueDisplay(branchId, doctorId);
      if (res.data?.data) {
        setQueueData(res.data.data);
      }
    } catch (err) {
      // Handled silently for public display TV
    } finally {
      setLoading(false);
    }
  }, [branchId, doctorId]);

  useEffect(() => {
    fetchPublicQueue();
    // Auto-refresh every 5 seconds for live TV display
    const interval = setInterval(fetchPublicQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchPublicQueue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-2xl font-mono">Loading Chamber Display...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-8 font-sans select-none overflow-hidden">
      {/* ── TV Display Top Header ── */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {queueData?.doctor_name || "Doctor Chamber"}
            </h1>
            <p className="text-sm font-semibold text-slate-400 mt-1">
              {queueData?.doctor_qualification} | {queueData?.branch_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-800">
          <Tv className="w-6 h-6 text-indigo-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            LIVE TV MONITOR
          </span>
        </div>
      </header>

      {/* ── Center Stage: Giant Current Serial Token (NO PHI - FR-APT-009) ── */}
      <main className="my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Current Token Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-indigo-950/60 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-12 text-center shadow-2xl shadow-indigo-950/50 flex flex-col items-center justify-center space-y-6">
          <span className="px-6 py-2 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-sm uppercase tracking-widest border border-indigo-500/30">
            NOW SERVING IN CHAMBER
          </span>

          <div className="text-9xl font-black text-white font-mono tracking-tighter leading-none text-shadow-lg shadow-indigo-500/20">
            {queueData?.current_serial ? `#${queueData.current_serial}` : "—"}
          </div>

          <p className="text-lg text-slate-400 font-semibold">
            Please proceed to chamber when your serial is displayed above.
          </p>
        </div>

        {/* Upcoming Serials Grid */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              UPCOMING SERIALS
            </h3>
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300">
              {queueData?.waiting_count || 0} WAITING
            </span>
          </div>

          {queueData?.upcoming_serials && queueData.upcoming_serials.length > 0 ? (
            <div className="flex flex-col gap-3">
              {queueData.upcoming_serials.map((serial, idx) => {
                // Support both old number format and new object format
                const position = typeof serial === "object" ? serial.position : serial;
                const isReordered = typeof serial === "object" ? serial.is_reordered : false;
                const reorderReason = typeof serial === "object" ? serial.reorder_reason : null;

                return (
                  <div
                    key={idx}
                    className={`border rounded-xl px-4 py-3 flex items-center justify-between font-mono text-lg font-bold ${
                      isReordered
                        ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                        : "bg-slate-800/80 border-slate-700 text-slate-200"
                    }`}
                  >
                    <span>#{position}</span>
                    {isReordered && reorderReason && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 ml-2">
                        ⚡ {reorderReason}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm font-semibold">
              No upcoming serials in waiting queue.
            </div>
          )}
        </div>
      </main>

      {/* ── Footer Ticker ── */}
      <footer className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-medium text-slate-500">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>MEDITEK Smart Waiting Room Monitor — Realtime Synchronized</span>
        </div>
        <div className="font-mono">{new Date().toLocaleTimeString()}</div>
      </footer>
    </div>
  );
}

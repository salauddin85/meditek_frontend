"use client";
import { useState } from "react";
import { laboratoryApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { formatApiError } from "./utils";

/**
 * CriticalAlertSerializer returns flat fields at the top level:
 *   alert.patient_name     — from order.patient.full_name
 *   alert.test_name        — from result.order_item.test.name
 *   alert.result_value     — from result.result_value
 *   alert.doctor_name      — from ordering_doctor.full_name (prefixed "Dr.")
 *   alert.alert_type       — "critical_low" | "critical_high"
 *   alert.detected_at      — ISO timestamp
 *   alert.order            — UUID of the order
 */
export default function AlertsTab({ alerts, onRefresh }) {
  const [notified, setNotified] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);

  const handleAck = async (e) => {
    e.preventDefault();
    try {
      await laboratoryApi.acknowledgeCriticalAlert(selectedAlert.id, {
        notified_person_name: notified.trim(),
      });
      toast.success("Critical alert acknowledged and recorded!");
      setSelectedAlert(null);
      setNotified("");
      onRefresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  // Format detected_at nicely
  const formatTime = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-BD", {
        dateStyle: "medium", timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  // Format order short ID
  const shortOrder = (orderId) => {
    if (!orderId) return "—";
    const s = String(orderId);
    return s.length >= 8 ? `#${s.substring(0, 8).toUpperCase()}` : `#${s}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          🚨 Critical Value Alerts
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Must be acknowledged within 15 minutes. Record the name of the physician notified.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
          ✅ No active unacknowledged critical alerts.
        </div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 bg-red-500/10 border-2 border-red-500/40 rounded-xl flex flex-wrap justify-between items-start gap-4"
          >
            <div className="space-y-1.5">
              {/* Alert type badge */}
              <span className="px-2 py-0.5 text-xs font-extrabold bg-red-600 text-white rounded tracking-wide">
                {alert.alert_type?.replace("_", " ").toUpperCase()}
              </span>

              {/* Test + Result value */}
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {alert.test_name || "Unknown Test"} ={" "}
                <span className="text-red-600 dark:text-red-400 text-base">
                  {alert.result_value ?? "—"}
                </span>
              </p>

              {/* Patient + Order ID */}
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Patient:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {alert.patient_name || "—"}
                </strong>
                <span className="ml-2 text-slate-400 font-mono">
                  (Order {shortOrder(alert.order)})
                </span>
              </p>

              {/* Referring doctor */}
              {alert.doctor_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ordered by: <span className="font-semibold">{alert.doctor_name}</span>
                </p>
              )}

              {/* Detected at */}
              <p className="text-xs text-slate-400 font-mono">
                Detected: {formatTime(alert.detected_at)}
              </p>
            </div>

            <button
              onClick={() => setSelectedAlert(alert)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Acknowledge & Record Call
            </button>
          </div>
        ))
      )}

      {/* Acknowledge Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-red-600">Acknowledge Critical Alert</h3>
            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl space-y-1">
              <p><strong className="text-slate-700 dark:text-slate-300">Patient:</strong> {selectedAlert.patient_name}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Test:</strong> {selectedAlert.test_name}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Result:</strong> {selectedAlert.result_value}</p>
            </div>
            <form onSubmit={handleAck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Doctor / Person Notified
                </label>
                <input
                  type="text"
                  value={notified}
                  onChange={(e) => setNotified(e.target.value)}
                  placeholder="e.g. Dr. Rahman (called at 11:45 AM)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setSelectedAlert(null); setNotified(""); }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl">
                  Confirm Acknowledgment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import {
  Clock,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Eye,
  X,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationsApi } from "@/lib/tenant-api";

function LogDetailModal({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 my-8">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-default-900 text-lg">Notification Payload Detail</h3>
            <p className="text-xs font-mono text-primary">ID: {log.id}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-default-100 text-default-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-default-50 p-2.5 rounded-lg border border-border">
              <span className="text-default-400 font-semibold uppercase text-[10px]">Channel</span>
              <p className="font-bold text-default-900 uppercase">{log.channel}</p>
            </div>
            <div className="bg-default-50 p-2.5 rounded-lg border border-border">
              <span className="text-default-400 font-semibold uppercase text-[10px]">Status</span>
              <p className="font-bold text-default-900 capitalize">{log.status}</p>
            </div>
          </div>

          <div>
            <span className="font-semibold text-default-700">Recipient Target:</span>{" "}
            <span className="font-mono text-default-900">
              {log.recipient_phone || log.recipient_email || log.recipient_user_name || "N/A"}
            </span>
          </div>

          {log.subject && (
            <div>
              <span className="font-semibold text-default-700">Subject:</span>{" "}
              <span className="text-default-900 font-medium">{log.subject}</span>
            </div>
          )}

          <div>
            <span className="font-semibold text-default-700">Rendered Body:</span>
            <div className="mt-1 p-3 bg-default-50 rounded-lg border border-border font-mono text-xs text-default-800 whitespace-pre-wrap">
              {log.body_rendered}
            </div>
          </div>

          {log.sms_segment_count && (
            <div>
              <span className="font-semibold text-default-700">SMS Segments:</span>{" "}
              <span className="font-mono font-bold text-primary">{log.sms_segment_count} segment(s)</span>
            </div>
          )}

          {log.failed_reason && (
            <div>
              <span className="font-semibold text-rose-600">Failure Cause:</span>
              <div className="mt-1 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-700 dark:text-rose-400 font-mono text-xs">
                {log.failed_reason}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] text-default-400 pt-2 border-t border-border">
            <p>Retry Count: {log.retry_count}</p>
            <p>Created: {new Date(log.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const extractList = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.results)) return resData.results;
  if (Array.isArray(resData?.data?.results)) return resData.data.results;
  return [];
};

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [detailLog, setDetailLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getLogs({
        search,
        status: selectedStatus || undefined,
        channel: selectedChannel || undefined,
      });
      const list = extractList(res.data);
      setLogs(list);
    } catch {
      toast.error("Failed to load delivery logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedStatus, selectedChannel]);

  const handleRetry = async (logId) => {
    try {
      await notificationsApi.retryLog(logId);
      toast.success("Notification re-queued for delivery attempt.");
      fetchLogs();
    } catch {
      toast.error("Failed to retry notification delivery.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Notification Delivery Logs
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Real-time delivery status, segment counts, and manual re-queuing for failed alerts.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="h-10 px-4 rounded-lg border border-input bg-card text-default-700 text-sm font-semibold flex items-center gap-2 hover:bg-default-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
            placeholder="Search template code, phone, email, text..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-default-700"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="dead_lettered">Dead Lettered</option>
        </select>

        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-default-700"
        >
          <option value="">All Channels</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
          <option value="push">Push</option>
          <option value="in_app">In-App</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-default-50/50">
              <tr>
                <th className="h-11 px-4 text-left font-semibold text-default-800">Template / Channel</th>
                <th className="h-11 px-4 text-left font-semibold text-default-800">Recipient</th>
                <th className="h-11 px-4 text-left font-semibold text-default-800">Message Snippet</th>
                <th className="h-11 px-4 text-left font-semibold text-default-800">Status / Retries</th>
                <th className="h-11 px-4 text-left font-semibold text-default-800">Sent At</th>
                <th className="h-11 px-4 text-right font-semibold text-default-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-40 text-center text-default-400">
                    No notification logs found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-default-50/50 transition">
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-default-900">
                          {log.template_code || "AD_HOC"}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] uppercase font-bold">
                            {log.channel}
                          </span>
                          {log.sms_segment_count && (
                            <span className="text-[10px] text-default-400">
                              ({log.sms_segment_count} seg)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-default-800">
                      {log.recipient_phone || log.recipient_email || log.recipient_user_name || "—"}
                    </td>

                    <td className="p-4 max-w-xs">
                      <p className="truncate text-default-700">{log.body_rendered}</p>
                      {log.failed_reason && (
                        <p className="text-[11px] text-rose-500 truncate mt-0.5 font-mono">
                          Err: {log.failed_reason}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.status === "sent" || log.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : log.status === "failed" || log.status === "dead_lettered"
                              ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {log.status}
                        </span>
                        <p className="text-[10px] text-default-400">Retries: {log.retry_count}/3</p>
                      </div>
                    </td>

                    <td className="p-4 text-default-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailLog(log)}
                          className="p-1.5 rounded-lg hover:bg-default-100 text-default-600"
                          title="View Payload"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(log.status === "failed" || log.status === "dead_lettered") && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
                            title="Retry Delivery"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailLog && <LogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />}
    </div>
  );
}

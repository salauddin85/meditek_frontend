"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings,
  Calculator,
  RefreshCw,
  Plus,
  Loader2,
  Mail,
  Smartphone,
  MessageSquare,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationsApi } from "@/lib/tenant-api";

const extractList = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.results)) return resData.results;
  if (Array.isArray(resData?.data?.results)) return resData.data.results;
  return [];
};

function SendTestModal({ templates, onClose, onSent }) {
  const safeTemplates = extractList(templates);
  const [loading, setLoading] = useState(false);
  const [templateCode, setTemplateCode] = useState(safeTemplates[0]?.code || "APPT_REMINDER_24H");
  const [channel, setChannel] = useState("sms");
  const [recipientPhone, setRecipientPhone] = useState("+8801700000000");
  const [recipientEmail, setRecipientEmail] = useState("user@meditek.com");
  const [language, setLanguage] = useState("en");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await notificationsApi.sendTest({
        template_code: templateCode,
        channel,
        recipient_phone: recipientPhone,
        recipient_email: recipientEmail,
        language,
        context: {
          patient_name: "Test Patient",
          doctor_name: "Dr. Karim",
          appt_date: "2026-08-20",
          appt_time: "10:30 AM",
          result_link: "https://meditek.com/r/82910",
        },
      });
      toast.success("Test notification queued & sent!");
      onSent();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to dispatch test notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-default-900 text-lg">Send Test Notification</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-default-100 text-default-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-default-700">Template Code</label>
            <select
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs"
            >
              {safeTemplates.map((t) => (
                <option key={t.id || t.code} value={t.code}>
                  {t.code} ({t.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="in_app">In-App</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-default-700">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="en">English (en)</option>
                <option value="bn">Bangla (bn)</option>
              </select>
            </div>
          </div>

          {channel === "sms" && (
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Recipient Phone</label>
              <input
                type="text"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs"
              />
            </div>
          )}

          {channel === "email" && (
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Recipient Email</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs"
              />
            </div>
          )}

          <div className="p-3 bg-default-50 rounded-lg border border-border space-y-1 text-[11px] text-default-500">
            <p className="font-semibold text-default-700">Default Mock Context Applied:</p>
            <p>patient_name: "Test Patient"</p>
            <p>doctor_name: "Dr. Karim"</p>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-input font-semibold hover:bg-default-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Dispatch Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotificationHubPage() {
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
  });
  const [templates, setTemplates] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestModal, setShowTestModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tmplRes, logRes] = await Promise.all([
        notificationsApi.getTemplates(),
        notificationsApi.getLogs(),
      ]);

      const tmplList = extractList(tmplRes.data);
      setTemplates(tmplList);

      const logsList = extractList(logRes.data);
      setRecentLogs(logsList);

      const total = logsList.length;
      const sent = logsList.filter((l) => l.status === "sent").length;
      const delivered = logsList.filter((l) => l.status === "delivered").length;
      const failed = logsList.filter((l) => l.status === "failed" || l.status === "dead_lettered").length;

      setStats({ total, sent, delivered, failed });
    } catch {
      toast.error("Failed to load notification hub metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notification Engine Hub
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Bangla Unicode SMS, Email, Web Push, and In-App delivery infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTestModal(true)}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4" />
            Send Test Alert
          </button>
          <button
            onClick={fetchData}
            className="h-10 w-10 rounded-lg border border-input flex items-center justify-center hover:bg-default-50 transition text-default-500"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-default-400">Total Dispatch Attempts</p>
            <p className="text-2xl font-black text-default-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-default-400">Sent / In Flight</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.sent}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-default-400">Delivered</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.delivered}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-default-400">Failed / Dead Letter</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.failed}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/notifications/templates"
          className="bg-card border border-border p-5 rounded-xl hover:border-primary/50 transition group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-default-900 text-sm">Templates</h3>
              <p className="text-xs text-default-400">{templates.length} active templates</p>
            </div>
          </div>
          <p className="text-xs text-default-500">Manage versioned Bangla & English message templates.</p>
        </Link>

        <Link
          href="/dashboard/notifications/logs"
          className="bg-card border border-border p-5 rounded-xl hover:border-primary/50 transition group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-default-900 text-sm">Delivery Logs</h3>
              <p className="text-xs text-default-400">Audit trail & retries</p>
            </div>
          </div>
          <p className="text-xs text-default-500">Track real-time delivery status across SMS, Email, and Push.</p>
        </Link>

        <Link
          href="/dashboard/notifications/preferences"
          className="bg-card border border-border p-5 rounded-xl hover:border-primary/50 transition group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-default-900 text-sm">Preferences</h3>
              <p className="text-xs text-default-400">Quiet Hours settings</p>
            </div>
          </div>
          <p className="text-xs text-default-500">Configure quiet hours & channel suppression preferences.</p>
        </Link>

        <Link
          href="/dashboard/notifications/calculator"
          className="bg-card border border-border p-5 rounded-xl hover:border-primary/50 transition group flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-default-900 text-sm">SMS Calculator</h3>
              <p className="text-xs text-default-400">Bangla segment counter</p>
            </div>
          </div>
          <p className="text-xs text-default-500">Calculate exact SMS segments for ASCII vs Unicode Bangla text.</p>
        </Link>
      </div>

      {/* Recent Logs Table */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-default-900 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Delivery Logs
          </h2>
          <Link
            href="/dashboard/notifications/logs"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All Logs &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-default-50/50">
              <tr>
                <th className="h-10 px-3 text-left font-semibold text-default-700">Code / Channel</th>
                <th className="h-10 px-3 text-left font-semibold text-default-700">Recipient</th>
                <th className="h-10 px-3 text-left font-semibold text-default-700">Rendered Content</th>
                <th className="h-10 px-3 text-left font-semibold text-default-700">Status</th>
                <th className="h-10 px-3 text-right font-semibold text-default-700">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-28 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-28 text-center text-default-400">
                    No notification logs recorded yet. Send a test alert above.
                  </td>
                </tr>
              ) : (
                recentLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-default-50/50">
                    <td className="p-3 font-mono font-semibold text-default-900">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">
                          {(log.channel || "sms").toUpperCase()}
                        </span>
                        <span>{log.template_code || "AD_HOC"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-default-700 font-mono">
                      {log.recipient_phone || log.recipient_email || log.recipient_user_name || "—"}
                    </td>
                    <td className="p-3 text-default-600 truncate max-w-xs">{log.body_rendered}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === "sent" || log.status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : log.status === "failed" || log.status === "dead_lettered"
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-default-400 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTestModal && (
        <SendTestModal
          templates={templates}
          onClose={() => setShowTestModal(false)}
          onSent={fetchData}
        />
      )}
    </div>
  );
}

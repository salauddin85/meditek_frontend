"use client";
import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Mail,
  Smartphone,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationsApi } from "@/lib/tenant-api";

export default function UserNotificationPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    appt_sms: true,
    appt_email: true,
    appt_push: true,
    lab_sms: true,
    lab_email: true,
    billing_sms: false,
    billing_email: true,
    quiet_start: "22:00:00",
    quiet_end: "07:00:00",
  });

  useEffect(() => {
    notificationsApi
      .getPreferences()
      .then((res) => {
        const pData = res.data?.data || res.data;
        if (pData) {
          setPrefs({
            appt_sms: pData.appt_sms ?? true,
            appt_email: pData.appt_email ?? true,
            appt_push: pData.appt_push ?? true,
            lab_sms: pData.lab_sms ?? true,
            lab_email: pData.lab_email ?? true,
            billing_sms: pData.billing_sms ?? false,
            billing_email: pData.billing_email ?? true,
            quiet_start: pData.quiet_start || "22:00:00",
            quiet_end: pData.quiet_end || "07:00:00",
          });
        }
      })
      .catch(() => toast.error("Failed to load preferences."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await notificationsApi.updatePreferences(prefs);
      toast.success("Notification preferences saved successfully!");
    } catch {
      toast.error("Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          User Notification Preferences
        </h1>
        <p className="text-sm text-default-500 mt-1">
          Customize alert channels and quiet hours schedule for non-critical notifications.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Safety-Critical Override (FR-COM-007)</p>
          <p className="mt-0.5 text-default-600">
            Critical alerts (e.g. Code Alerts, Emergency Lab Panic Values) bypass quiet hours and user suppression preferences automatically to ensure patient safety.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Category Toggles */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="font-bold text-default-900 text-base flex items-center gap-2 border-b border-border pb-3">
            <Bell className="w-5 h-5 text-primary" />
            Category Channel Preferences
          </h2>

          {/* Appointment Alerts */}
          <div className="space-y-3">
            <h3 className="font-bold text-default-800 text-sm">Appointment & Scheduling Notifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-default-50/50 cursor-pointer hover:border-primary/50">
                <span className="font-semibold text-default-700">SMS Alerts</span>
                <input
                  type="checkbox"
                  checked={prefs.appt_sms}
                  onChange={(e) => setPrefs((p) => ({ ...p, appt_sms: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-default-50/50 cursor-pointer hover:border-primary/50">
                <span className="font-semibold text-default-700">Email Reminders</span>
                <input
                  type="checkbox"
                  checked={prefs.appt_email}
                  onChange={(e) => setPrefs((p) => ({ ...p, appt_email: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-default-50/50 cursor-pointer hover:border-primary/50">
                <span className="font-semibold text-default-700">Mobile Push</span>
                <input
                  type="checkbox"
                  checked={prefs.appt_push}
                  onChange={(e) => setPrefs((p) => ({ ...p, appt_push: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
            </div>
          </div>

          {/* Lab Result Alerts */}
          <div className="space-y-3">
            <h3 className="font-bold text-default-800 text-sm">Diagnostic & Lab Result Alerts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-default-50/50 cursor-pointer hover:border-primary/50">
                <span className="font-semibold text-default-700">SMS Result Link</span>
                <input
                  type="checkbox"
                  checked={prefs.lab_sms}
                  onChange={(e) => setPrefs((p) => ({ ...p, lab_sms: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-default-50/50 cursor-pointer hover:border-primary/50">
                <span className="font-semibold text-default-700">Email Notification</span>
                <input
                  type="checkbox"
                  checked={prefs.lab_email}
                  onChange={(e) => setPrefs((p) => ({ ...p, lab_email: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
            </div>
          </div>

          {/* Billing Alerts */}
          <div className="space-y-3">
            <h3 className="font-bold text-default-800 text-sm">Billing & Payment Receipt Alerts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-default-50/50 cursor-pointer hover:border-primary/50">
                <span className="font-semibold text-default-700">SMS Receipt</span>
                <input
                  type="checkbox"
                  checked={prefs.billing_sms}
                  onChange={(e) => setPrefs((p) => ({ ...p, billing_sms: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-default-50/50 cursor-pointer hover:border-primary/50">
                <span className="font-semibold text-default-700">Email Invoice PDF</span>
                <input
                  type="checkbox"
                  checked={prefs.billing_email}
                  onChange={(e) => setPrefs((p) => ({ ...p, billing_email: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-default-900 text-base flex items-center gap-2 border-b border-border pb-3">
            <Clock className="w-5 h-5 text-primary" />
            Quiet Hours Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Quiet Hours Start</label>
              <input
                type="time"
                value={prefs.quiet_start || ""}
                onChange={(e) => setPrefs((p) => ({ ...p, quiet_start: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-default-700">Quiet Hours End</label>
              <input
                type="time"
                value={prefs.quiet_end || ""}
                onChange={(e) => setPrefs((p) => ({ ...p, quiet_end: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { notificationsApi } from "@/lib/tenant-api";

function TemplateModal({ template, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: template?.code || "",
    name: template?.name || "",
    channel: template?.channel || "sms",
    language: template?.language || "en",
    subject: template?.subject || "",
    body: template?.body || "",
    is_critical: template?.is_critical ?? false,
    is_active: template?.is_active ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (template?.id) {
        await notificationsApi.updateTemplate(template.id, form);
        toast.success("Notification template updated!");
      } else {
        await notificationsApi.createTemplate(form);
        toast.success("Notification template created!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 my-8">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-default-900 text-lg">
              {template?.id ? "Edit Notification Template" : "Create Notification Template"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-default-100 text-default-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Template Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. APPT_REMINDER_24H"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-default-700">Display Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Appointment Reminder SMS"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Channel *</label>
              <select
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="push">Push Notification</option>
                <option value="in_app">In-App Inbox</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-default-700">Language *</label>
              <select
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="en">English (en)</option>
                <option value="bn">Bangla (bn)</option>
              </select>
            </div>
          </div>

          {form.channel === "email" && (
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Email Subject Line</label>
              <input
                type="text"
                placeholder="Subject of the email"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-default-700">Template Body * (Supports Jinja {"{{ var }}"})</label>
            <textarea
              rows={4}
              required
              placeholder="Dear {{ patient_name }}, your appointment is scheduled at {{ appt_time }}."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full p-3 rounded-lg border border-input bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-600 dark:text-amber-400">Safety Critical Alert (Bypass Quiet Hours)</p>
                <p className="text-[11px] text-default-500">
                  Critical alerts (e.g. Code Alerts, Emergency Labs) override user suppression and quiet hours (FR-COM-007).
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.is_critical}
                onChange={(e) => setForm((f) => ({ ...f, is_critical: e.target.checked }))}
                className="w-4 h-4 rounded text-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded text-primary"
            />
            <label htmlFor="is_active" className="font-semibold text-default-700">
              Template Is Active
            </label>
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
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save Template
            </button>
          </div>
        </form>
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

export default function TemplatesManagerPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [editTemplate, setEditTemplate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getTemplates({
        search,
        channel: selectedChannel || undefined,
        language: selectedLanguage || undefined,
      });
      const list = extractList(res.data);
      setTemplates(list);
    } catch {
      toast.error("Failed to load notification templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedChannel, selectedLanguage]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate template '${name}'?`)) return;
    try {
      await notificationsApi.deleteTemplate(id);
      toast.success("Template deactivated.");
      fetchTemplates();
    } catch {
      toast.error("Failed to deactivate template.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Notification Templates Manager
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Configure Bangla and English templates for SMS, Email, Push, and In-App delivery.
          </p>
        </div>

        <button
          onClick={() => {
            setEditTemplate(null);
            setShowModal(true);
          }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Template
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
            onKeyDown={(e) => e.key === "Enter" && fetchTemplates()}
            placeholder="Search code, name, body..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

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

        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-default-700"
        >
          <option value="">All Languages</option>
          <option value="en">English (en)</option>
          <option value="bn">Bangla (bn)</option>
        </select>

        <button
          onClick={fetchTemplates}
          className="h-9 w-9 rounded-lg border border-input flex items-center justify-center hover:bg-default-50 transition text-default-500 ml-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full h-40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full h-40 flex items-center justify-center text-default-400 text-sm">
            No notification templates found. Click "New Template" to create one.
          </div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {t.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-default-100 text-default-700">
                      {t.channel}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-default-100 text-default-700">
                      {t.language}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-default-900 text-base">{t.name}</h3>

                {t.is_critical && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[10px] font-bold uppercase">
                    <AlertTriangle className="w-3 h-3" /> Safety Critical
                  </div>
                )}

                {t.subject && (
                  <p className="text-xs font-semibold text-default-700 truncate">Subject: {t.subject}</p>
                )}

                <div className="p-3 bg-default-50/70 rounded-lg border border-border text-xs font-mono text-default-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {t.body}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                <span className="text-default-400">v{t.version}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditTemplate(t);
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-default-100 text-default-600"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                    title="Deactivate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TemplateModal
          template={editTemplate}
          onClose={() => setShowModal(false)}
          onSaved={fetchTemplates}
        />
      )}
    </div>
  );
}

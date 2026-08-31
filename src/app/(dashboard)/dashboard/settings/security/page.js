"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Loader2, Shield, Key, Monitor, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";
import { useRouter } from "next/navigation";

function SessionCard({ session, onRevoke, isLoading }) {
  const isCurrent = session.is_current;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCurrent ? "bg-primary/10" : "bg-default-100"}`}>
        <Monitor className={`w-5 h-5 ${isCurrent ? "text-primary" : "text-default-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-default-900 truncate">
            {session.device_info
              ? session.device_info.substring(0, 60) + (session.device_info.length > 60 ? "..." : "")
              : "Unknown device"}
          </p>
          {isCurrent && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
              Current
            </span>
          )}
        </div>
        <p className="text-xs text-default-400 mt-0.5">
          IP: {session.ip_address || "Unknown"} •{" "}
          Signed in {new Date(session.login_at).toLocaleString("en-BD", { dateStyle: "short", timeStyle: "short" })}
        </p>
        {session.last_seen_at && (
          <p className="text-xs text-default-400">
            Last active: {new Date(session.last_seen_at).toLocaleString("en-BD", { dateStyle: "short", timeStyle: "short" })}
          </p>
        )}
      </div>
      {!isCurrent && (
        <button
          onClick={() => onRevoke(session.id)}
          disabled={isLoading}
          className="shrink-0 h-8 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Revoke
        </button>
      )}
    </div>
  );
}

function ChangePasswordForm() {
  const router = useRouter();
  const logout = useTenantAuthStore((s) => s.logout);
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ old_password: false, new_password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleShow = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.old_password) errs.old_password = "Current password is required.";
    if (!form.new_password) errs.new_password = "New password is required.";
    else if (form.new_password.length < 8) errs.new_password = "Minimum 8 characters.";
    if (form.new_password !== form.confirm) errs.confirm = "Passwords do not match.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await iamApi.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      });
      toast.success("Password changed. Please log in again.");
      logout();
      router.push("/auth/tenant-login");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to change password.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-default-900 flex items-center gap-2 mb-4">
        <Key className="w-4 h-4 text-primary" />
        Change Password
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        {[
          { id: "old_password", label: "Current Password", field: "old_password" },
          { id: "new_password", label: "New Password", field: "new_password" },
          { id: "confirm_password", label: "Confirm New Password", field: "confirm" },
        ].map(({ id, label, field }) => (
          <div key={field} className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-semibold text-default-700">
              {label}
            </label>
            <div className="relative">
              <input
                id={id}
                type={showPasswords[field] ? "text" : "password"}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className={`w-full h-9 pl-3 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors[field] ? "border-destructive" : "border-input"
                }`}
              />
              <button
                type="button"
                onClick={() => toggleShow(field)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-default-400 hover:text-default-700 focus:outline-none"
                title={showPasswords[field] ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <Icon
                  icon={showPasswords[field] ? "heroicons:eye-slash" : "heroicons:eye"}
                  className="w-4 h-4"
                />
              </button>
            </div>
            {errors[field] && <p className="text-destructive text-xs">{errors[field]}</p>}
          </div>
        ))}
        <button
          type="submit"
          id="change-password-submit"
          disabled={loading}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-60 hover:bg-primary/90 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon icon="heroicons:check" className="w-4 h-4" />}
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

export default function SecurityPage() {
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await iamApi.getSessions();
      setSessions(res.data.data || []);
    } catch {
      toast.error("Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleRevoke = async (sessionId) => {
    setRevokingId(sessionId);
    try {
      await iamApi.revokeSession(sessionId);
      toast.success("Session revoked.");
      fetchSessions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to revoke session.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Security Settings
        </h1>
        <p className="text-sm text-default-500 mt-1">
          Manage your password, active sessions, and security preferences.
        </p>
      </div>

      {/* Change Password */}
      <ChangePasswordForm />

      {/* Active Sessions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-default-900 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            Active Sessions
          </h3>
          <button
            onClick={fetchSessions}
            className="text-xs text-default-500 hover:text-primary flex items-center gap-1 transition"
          >
            <Icon icon="heroicons:arrow-path" className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loadingSessions ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-default-500 text-center py-8">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onRevoke={handleRevoke}
                isLoading={revokingId === s.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

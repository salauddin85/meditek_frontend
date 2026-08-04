"use client";
import { useState, useEffect, useTransition } from "react";
import { Icon } from "@iconify/react";
import { Loader2, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { iamApi } from "@/lib/tenant-api";

const ACTION_COLORS = {
  "user.login": "success",
  "user.logout": "info",
  "user.created": "primary",
  "user.deactivated": "destructive",
  "user.password_changed": "warning",
  "user.password_reset_requested": "warning",
  "user.unlocked": "success",
  "role.created": "primary",
  "role.permissions_updated": "warning",
  "user.role_assigned": "info",
  "user.session_revoked": "destructive",
};

const colorClass = (action) => {
  const c = ACTION_COLORS[action] || "default";
  return {
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    default: "bg-default-100 text-default-600",
  }[c];
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isPending, startTransition] = useTransition();

  const fetchLogs = async (p = 1, q = search, rt = resourceType) => {
    setLoading(true);
    try {
      const params = { page: p, page_size: 20 };
      if (q) params.action = q;
      if (rt) params.resource_type = rt;
      const res = await iamApi.getAuditLogs(params);
      const { results, count } = res.data.data;
      setLogs(results || []);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / 20));
    } catch {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
          <Icon icon="heroicons:clipboard-document-list" className="w-6 h-6 text-primary" />
          Audit Log
        </h1>
        <p className="text-sm text-default-500 mt-1">
          Immutable record of all actions. Logs are flushed from Redis to DB every 5 minutes.
          <span className="ml-1 text-default-400">({total} total records)</span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-40 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              startTransition(() => { setPage(1); fetchLogs(1, e.target.value, resourceType); });
            }}
            placeholder="Search by action..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={resourceType}
          onChange={(e) => {
            setResourceType(e.target.value);
            startTransition(() => { setPage(1); fetchLogs(1, search, e.target.value); });
          }}
          className="h-9 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
        >
          <option value="">All resource types</option>
          {["user", "role", "session", "user_branch_role"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={() => fetchLogs(page)}
          className="h-9 w-9 rounded-lg border border-input flex items-center justify-center hover:bg-default-50 transition text-default-500"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-default-50/50">
              <tr>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Action</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">User</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Resource</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">IP Address</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Path</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Timestamp</th>
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
                  <td colSpan={6} className="h-40 text-center text-default-500">
                    No audit logs found. Logs are flushed every 5 minutes.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-default-300 hover:bg-default-50/50 transition">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colorClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-default-600 text-xs">{log.user_email || "—"}</td>
                    <td className="p-4 text-xs">
                      {log.resource_type && (
                        <div>
                          <span className="font-medium text-default-700">{log.resource_type}</span>
                          {log.resource_id && (
                            <p className="text-default-400 font-mono text-[10px]">
                              {log.resource_id.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-default-500 font-mono text-xs">{log.ip_address || "—"}</td>
                    <td className="p-4 text-default-500 text-xs truncate max-w-[120px]">
                      {log.request_method && <span className="font-bold mr-1">{log.request_method}</span>}
                      {log.request_path || "—"}
                    </td>
                    <td className="p-4 text-default-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-BD", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-default-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); fetchLogs(p); }}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-input disabled:opacity-40 hover:bg-default-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchLogs(p); }}
                disabled={page >= totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-input disabled:opacity-40 hover:bg-default-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

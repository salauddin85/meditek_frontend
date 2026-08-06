"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  FileCheck,
  FileX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePlatformAuthStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

/* ────────── helpers ────────── */
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const STATUS_LABELS = {
  pending_verification: "Pending Verification",
  pending_payment: "Pending Payment",
  provisioning: "Provisioning",
  trial: "Trial",
  active: "Active",
  grace: "Grace Period",
  suspended: "Suspended",
  terminated: "Terminated",
  purged: "Purged",
};

const STATUS_BADGE = {
  pending_verification: "bg-amber-50 text-amber-700 ring-amber-200",
  pending_payment: "bg-orange-50 text-orange-700 ring-orange-200",
  provisioning: "bg-sky-50 text-sky-700 ring-sky-200",
  trial: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  grace: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  suspended: "bg-red-50 text-red-700 ring-red-200",
  terminated: "bg-slate-50 text-slate-600 ring-slate-200",
  purged: "bg-slate-50 text-slate-500 ring-slate-200",
};

const ORG_LABELS = {
  hospital: "Hospital",
  clinic: "Clinic",
  diagnostic_center: "Diagnostic Center",
  multispecialty: "Multispecialty",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending_verification", label: "Pending Verification" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "grace", label: "Grace" },
  { value: "suspended", label: "Suspended" },
  { value: "terminated", label: "Terminated" },
];

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[status] || STATUS_BADGE.terminated}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/* ────────── ExpandedRow ────────── */
function ExpandedRow({ tenant, onAction, actionLoading }) {
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/platform/tenants/${tenant.id}/`);
        if (!cancelled) setDetail(res.data.data);
      } catch {
        if (!cancelled) toast.error("Failed to load tenant details.");
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenant.id]);

  if (loadingDetail) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const reg = detail?.registration;
  const steps = [
    { label: "Organization Info", done: reg?.step_org_completed },
    { label: "Email Verified", done: reg?.step_email_verified },
    { label: "Documents Uploaded", done: reg?.step_docs_uploaded },
    { label: "Documents Verified", done: reg?.step_docs_verified },
    { label: "Plan Selected", done: reg?.step_plan_selected },
    { label: "Payment Completed", done: reg?.step_payment_completed },
  ];

  const docReviewStatus = reg?.doc_review_status || "pending";

  return (
    <div className="space-y-5 px-2 py-4">
      {/* Registration Progress */}
      <div>
        <h4 className="text-sm font-bold text-foreground">Registration Progress</h4>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Document Review */}
      {reg && (
        <div>
          <h4 className="text-sm font-bold text-foreground">Document Review</h4>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={docReviewStatus === "approved" ? "active" : docReviewStatus === "rejected" ? "suspended" : "pending_verification"} />
            {reg.doc_review_notes && (
              <span className="text-xs text-muted-foreground italic">"{reg.doc_review_notes}"</span>
            )}
          </div>
          {/* Documents list */}
          {reg.documents && reg.documents.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {reg.documents.map((doc) => (
                <span key={doc.id} className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                  {doc.doc_type.replace(/_/g, " ")} {doc.is_malware_clean ? "✓" : "⚠"}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div>
        <h4 className="text-sm font-bold text-foreground">Quick Actions</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => onAction(tenant.id, "approve-docs")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <FileCheck className="h-3.5 w-3.5" /> Approve Docs
          </button>
          <button
            onClick={() => onAction(tenant.id, "reject-docs")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <FileX className="h-3.5 w-3.5" /> Reject Docs
          </button>
          <button
            onClick={() => onAction(tenant.id, "grant-trial")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" /> Grant Trial
          </button>
          <button
            onClick={() => onAction(tenant.id, "suspend")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            <Pause className="h-3.5 w-3.5" /> Suspend
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── Page ────────── */
export default function AdminTenantsPage() {
  const router = useRouter();
  const { isAuthenticated, logout, hasHydrated } = usePlatformAuthStore();

  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const debounceRef = useRef(null);

  const loadTenants = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await apiClient.get(`/platform/tenants/?${params.toString()}`);
      const data = res.data.data;
      setTenants(data.results || []);
      setPagination({
        count: data.pagination?.count || 0,
        page: data.pagination?.page || page,
        pages: data.pagination?.pages || 1,
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        router.push("/auth/platform-login");
      } else {
        toast.error("Failed to load tenants.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, logout, router]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/auth/platform-login");
      return;
    }
    loadTenants();
  }, [hasHydrated, isAuthenticated, loadTenants, router]);

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadTenants(1);
    }, 500);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    // Will trigger loadTenants via useEffect dependency change
  };

  // Re-fetch when statusFilter changes
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      loadTenants(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAction = async (tenantId, action) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/platform/tenants/${tenantId}/${action}/`, { notes: "" });
      toast.success(`Action '${action.replace("-", " ")}' completed.`);
      loadTenants(pagination.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Tenant Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tenant registrations, document reviews, and lifecycle actions.
          </p>
        </div>
        <button
          onClick={() => loadTenants(pagination.page)}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Controls bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or slug..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No tenants found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="w-8 px-4 py-3" />
                  <th className="px-4 py-3 font-medium text-muted-foreground">Organization</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Location</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((t) => {
                  const isExpanded = expandedId === t.id;
                  return (
                    <Fragment key={t.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.slug}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {ORG_LABELS[t.org_type] || t.org_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-muted-foreground">{t.email}</p>
                          <p className="text-xs text-muted-foreground">{t.phone}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.district}{t.division ? `, ${t.division}` : ""}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.created_at)}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-muted/10 px-4">
                            <ExpandedRow tenant={t} onAction={handleAction} actionLoading={actionLoading} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && tenants.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages} · {pagination.count} total tenants
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadTenants(pagination.page - 1)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadTenants(pagination.page + 1)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

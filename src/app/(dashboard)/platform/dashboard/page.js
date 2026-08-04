"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  HeartPulse,
  Users,
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Gift,
  PauseCircle,
  Trash2,
  LogOut,
  Loader2,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import { usePlatformAuthStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

// Status badge — uses semantic colors only, no hardcoded brand colors
const STATUS_STYLES = {
  pending_verification: "bg-default-100 text-default-600",
  pending_payment:      "bg-warning/10 text-warning",
  provisioning:         "bg-info/10 text-light-foreground",
  trial:                "bg-secondary/20 text-secondary-foreground",
  active:               "bg-success/10 text-success",
  grace:                "bg-warning/20 text-warning",
  suspended:            "bg-destructive/10 text-destructive",
  terminated:           "bg-default-100 text-muted-foreground",
  purged:               "bg-default-100 text-muted-foreground",
};

const STATUS_LABELS = {
  pending_verification: "Pending Verification",
  pending_payment:      "Pending Payment",
  provisioning:         "Provisioning",
  trial:                "Trial",
  active:               "Active",
  grace:                "Grace Period",
  suspended:            "Suspended",
  terminated:           "Terminated",
  purged:               "Purged",
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] || "bg-default-100 text-default-600"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function TenantDetailModal({ tenantId, onClose }) {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    apiClient
      .get(`/platform/tenants/${tenantId}/`)
      .then((res) => setTenant(res.data.data))
      .catch(() => toast.error("Failed to load tenant details."))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const doAction = async (action, payload = {}) => {
    setActionLoading(action);
    try {
      await apiClient.post(`/platform/tenants/${tenantId}/${action}/`, payload);
      toast.success(`Action '${action}' completed.`);
      const res = await apiClient.get(`/platform/tenants/${tenantId}/`);
      setTenant(res.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-2xl p-8 border border-border">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!tenant) return null;
  const reg = tenant.registration;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header — uses primary color via CSS var */}
        <div className="bg-primary p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-xl font-bold text-primary-foreground cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/dashboard?tenant=${tenant.slug}`)}
              >
                {tenant.name}
              </h2>
              <p className="text-primary-foreground/60 text-sm mt-1">{tenant.slug}.meditek.com</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard?tenant=${tenant.slug}`)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground text-xs font-semibold rounded-lg transition-colors border border-primary-foreground/20"
                title="Go to Tenant Dashboard"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <StatusBadge status={tenant.status} />
              <button onClick={onClose} className="text-primary-foreground/60 hover:text-primary-foreground p-1 ml-2 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Organization Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <span className="font-medium text-foreground capitalize">{tenant.org_type?.replace("_", " ")}</span></div>
              <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium text-foreground">{tenant.contact_person}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{tenant.email}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{tenant.phone}</span></div>
              <div><span className="text-muted-foreground">District:</span> <span className="font-medium text-foreground">{tenant.district}</span></div>
              <div><span className="text-muted-foreground">Division:</span> <span className="font-medium text-foreground">{tenant.division}</span></div>
            </div>
          </div>

          {/* Registration Steps */}
          {reg && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Registration Progress</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Email Verified", reg.step_email_verified],
                  ["Docs Uploaded", reg.step_docs_uploaded],
                  ["Docs Verified", reg.step_docs_verified],
                  ["Plan Selected", reg.step_plan_selected],
                  ["Payment Done", reg.step_payment_completed],
                ].map(([label, done]) => (
                  <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {label}
                  </div>
                ))}
              </div>

              {/* Document Review */}
              {reg.step_docs_uploaded && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">Document Review</span>
                    <StatusBadge status={reg.doc_review_status} />
                  </div>
                  {reg.documents?.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {reg.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 text-xs text-foreground bg-muted px-3 py-2 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                          <span className="capitalize">{doc.doc_type.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground ml-auto truncate max-w-[150px]">{doc.original_filename}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(reg.doc_review_status === "under_review" || reg.doc_review_status === "pending") ? (
                    <div className="space-y-3">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional review notes..."
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => doAction("approve-docs", { notes })}
                          disabled={actionLoading === "approve-docs"}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-success text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {actionLoading === "approve-docs" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve Docs
                        </button>
                        <button
                          onClick={() => doAction("reject-docs", { notes })}
                          disabled={actionLoading === "reject-docs"}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-destructive text-destructive-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {actionLoading === "reject-docs" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Reject Docs
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Lifecycle Actions */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lifecycle Actions</h3>
            <div className="flex flex-wrap gap-2">
              {(tenant.status === "pending_verification" || tenant.status === "pending_payment") && (
                <button
                  onClick={() => doAction("grant-trial")}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {actionLoading === "grant-trial" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Grant 14-day Trial
                </button>
              )}
              {(tenant.status === "active" || tenant.status === "trial") && (
                <button
                  onClick={() => { if (confirm("Suspend this tenant?")) doAction("suspend"); }}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-warning/10 text-warning border border-warning/30 text-sm font-semibold rounded-lg hover:bg-warning/20 transition-all disabled:opacity-50"
                >
                  {actionLoading === "suspend" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                  Suspend
                </button>
              )}
              {tenant.status !== "terminated" && tenant.status !== "purged" && (
                <button
                  onClick={() => { if (confirm("Terminate this tenant? This starts the export window.")) doAction("terminate"); }}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {actionLoading === "terminate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Terminate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlatformDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = usePlatformAuthStore();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/auth/platform-login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiClient.get(`/platform/tenants/?${params}`);
      setTenants(res.data.data.results || []);
      setPagination(res.data.data.pagination);
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
  }, [page, search, statusFilter, logout, router]);

  useEffect(() => {
    if (isAuthenticated) fetchTenants();
  }, [fetchTenants, isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push("/auth/platform-login");
  };

  if (!hasHydrated || !isAuthenticated) return null;

  const statusOptions = [
    "pending_verification", "pending_payment", "provisioning",
    "trial", "active", "grace", "suspended", "terminated",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav — uses primary CSS var so it respects theme color */}
      <header className="bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeartPulse className="h-7 w-7 text-primary-foreground/80" strokeWidth={2.5} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-primary-foreground">
                  Meditek
                </span>
                <span className="text-xs bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/20 px-2 py-0.5 rounded-full font-medium">
                  Platform Admin
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold border border-primary-foreground/20">
                {user?.full_name?.charAt(0) || "A"}
              </div>
              <span className="text-primary-foreground/80 text-sm font-medium">{user?.full_name || "Admin"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tenants</p>
              <p className="text-xl font-black text-foreground">{pagination?.count || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-black text-foreground">
                {tenants.filter((t) => t.status === "active" || t.status === "trial").length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
              <p className="text-xl font-black text-foreground">
                {tenants.filter((t) => t.status === "pending_verification").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-foreground">Tenant Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage all registered healthcare organizations</p>
          </div>
          <button
            onClick={fetchTenants}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Search by name, email, or slug..."
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-6 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground appearance-none min-w-[160px]"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tenants found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Organization</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Type</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Location</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Registered</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        onClick={() => router.push(`/dashboard?tenant=${tenant.slug}`)}
                        className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
                      >
                        {tenant.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{tenant.slug}.meditek.com</div>
                      <div className="text-xs text-muted-foreground">{tenant.email}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">
                      {tenant.org_type?.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {tenant.district}, {tenant.division}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString("en-BD")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard?tenant=${tenant.slug}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-all"
                          title="Navigate to Tenant Dashboard"
                        >
                          <HeartPulse className="w-3.5 h-3.5" />
                          Dashboard
                        </button>
                        <button
                          onClick={() => setSelectedTenantId(tenant.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.count} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.previous}
                className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.next}
                className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Tenant Detail Modal */}
      {selectedTenantId && (
        <TenantDetailModal
          tenantId={selectedTenantId}
          onClose={() => {
            setSelectedTenantId(null);
            fetchTenants();
          }}
        />
      )}
    </div>
  );
}

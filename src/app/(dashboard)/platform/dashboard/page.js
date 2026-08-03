"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  HeartPulse,
  Shield,
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

// Status badge colors
const STATUS_COLORS = {
  pending_verification: "bg-slate-100 text-slate-600",
  pending_payment: "bg-amber-100 text-amber-700",
  provisioning: "bg-blue-100 text-blue-700",
  trial: "bg-purple-100 text-purple-700",
  active: "bg-teal-100 text-teal-700",
  grace: "bg-orange-100 text-orange-700",
  suspended: "bg-red-100 text-red-700",
  terminated: "bg-slate-100 text-slate-500",
  purged: "bg-gray-100 text-gray-400",
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

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status] || "bg-slate-100 text-slate-600"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function TenantDetailModal({ tenantId, onClose }) {
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
      // Refresh tenant
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
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!tenant) return null;
  const reg = tenant.registration;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{tenant.name}</h2>
              <p className="text-slate-400 text-sm mt-1">{tenant.slug}.meditek.com</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={tenant.status} />
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1 ml-2">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Organization Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Type:</span> <span className="font-medium capitalize">{tenant.org_type?.replace("_", " ")}</span></div>
              <div><span className="text-slate-500">Contact:</span> <span className="font-medium">{tenant.contact_person}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-medium">{tenant.email}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{tenant.phone}</span></div>
              <div><span className="text-slate-500">District:</span> <span className="font-medium">{tenant.district}</span></div>
              <div><span className="text-slate-500">Division:</span> <span className="font-medium">{tenant.division}</span></div>
            </div>
          </div>

          {/* Registration Steps */}
          {reg && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Registration Progress</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Email Verified", reg.step_email_verified],
                  ["Docs Uploaded", reg.step_docs_uploaded],
                  ["Docs Verified", reg.step_docs_verified],
                  ["Plan Selected", reg.step_plan_selected],
                  ["Payment Done", reg.step_payment_completed],
                ].map(([label, done]) => (
                  <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${done ? "bg-teal-50 text-teal-700" : "bg-slate-50 text-slate-500"}`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {label}
                  </div>
                ))}
              </div>

              {/* Document Review */}
              {reg.step_docs_uploaded && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-600">Document Review</span>
                    <StatusBadge status={reg.doc_review_status} />
                  </div>
                  {reg.documents?.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {reg.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span className="capitalize">{doc.doc_type.replace(/_/g, " ")}</span>
                          <span className="text-slate-400 ml-auto truncate max-w-[150px]">{doc.original_filename}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {reg.doc_review_status === "under_review" || reg.doc_review_status === "pending" ? (
                    <div className="space-y-3">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional review notes..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => doAction("approve-docs", { notes })}
                          disabled={actionLoading === "approve-docs"}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-all disabled:opacity-50"
                        >
                          {actionLoading === "approve-docs" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve Docs
                        </button>
                        <button
                          onClick={() => doAction("reject-docs", { notes })}
                          disabled={actionLoading === "reject-docs"}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
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
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Lifecycle Actions</h3>
            <div className="flex flex-wrap gap-2">
              {(tenant.status === "pending_verification" || tenant.status === "pending_payment") && (
                <button
                  onClick={() => doAction("grant-trial")}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {actionLoading === "grant-trial" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Grant 14-day Trial
                </button>
              )}
              {(tenant.status === "active" || tenant.status === "trial") && (
                <button
                  onClick={() => { if (confirm("Suspend this tenant?")) doAction("suspend"); }}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50"
                >
                  {actionLoading === "suspend" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                  Suspend
                </button>
              )}
              {tenant.status !== "terminated" && tenant.status !== "purged" && (
                <button
                  onClick={() => { if (confirm("Terminate this tenant? This starts the export window.")) doAction("terminate"); }}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
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
  const { user, isAuthenticated, logout } = usePlatformAuthStore();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/platform-login");
    }
  }, [isAuthenticated, router]);

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

  if (!isAuthenticated) return null;

  const statusOptions = [
    "pending_verification", "pending_payment", "provisioning",
    "trial", "active", "grace", "suspended", "terminated",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeartPulse className="h-7 w-7 text-teal-400" strokeWidth={2.5} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">
                  Medi<span className="text-teal-400">tek</span>
                </span>
                <span className="text-xs bg-teal-600/20 text-teal-400 border border-teal-600/30 px-2 py-0.5 rounded-full font-medium">
                  Platform Admin
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.full_name?.charAt(0) || "A"}
              </div>
              <span className="text-slate-300 text-sm font-medium">{user?.full_name || "Admin"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Tenants</p>
              <p className="text-xl font-black text-slate-900">{pagination?.count || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active</p>
              <p className="text-xl font-black text-slate-900">
                {tenants.filter((t) => t.status === "active" || t.status === "trial").length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pending Review</p>
              <p className="text-xl font-black text-slate-900">
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
            <h1 className="text-2xl font-black text-slate-900">Tenant Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage all registered healthcare organizations</p>
          </div>
          <button
            onClick={fetchTenants}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              placeholder="Search by name, email, or slug..."
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-6 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white appearance-none min-w-[160px]"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tenants found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">Organization</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">Location</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">Registered</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{tenant.name}</div>
                      <div className="text-xs text-slate-400">{tenant.slug}.meditek.com</div>
                      <div className="text-xs text-slate-400">{tenant.email}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-600">
                      {tenant.org_type?.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {tenant.district}, {tenant.division}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(tenant.created_at).toLocaleDateString("en-BD")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedTenantId(tenant.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
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
            <p className="text-sm text-slate-500">
              Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.count} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.previous}
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.next}
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
            fetchTenants(); // Refresh list after modal closes
          }}
        />
      )}
    </div>
  );
}

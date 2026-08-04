"use client";
import { useState, useEffect, useTransition } from "react";
import { Icon } from "@iconify/react";
import { Loader2, UserPlus, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

// Status badge
const StatusBadge = ({ isActive }) =>
  isActive ? (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-success/10 text-success">
      Active
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive">
      Inactive
    </span>
  );

// Role chip
const RoleChip = ({ name }) => (
  <span className="capitalize px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
    {name?.replace(/_/g, " ").toLowerCase()}
  </span>
);

// Invite / Create modal
function InviteModal({ onClose, onSuccess, roles }) {
  const [form, setForm] = useState({
    email: "", full_name: "", role_name: "", branch_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isAdmin = useTenantAuthStore((s) => s.isAdmin());
  const branchId = useTenantAuthStore((s) => s.branchId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = "Email is required.";
    if (!form.full_name) errs.full_name = "Full name is required.";
    if (!form.role_name) errs.role_name = "Role is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await iamApi.inviteUser({
        ...form,
        branch_id: branchId,
        role_name: form.role_name,
      });
      toast.success("Invite sent! User will receive credentials via email.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-default-900">Invite Team Member</h2>
              <p className="text-sm text-default-500 mt-0.5">Send login credentials via email.</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-full hover:bg-default-100 transition text-default-400"
            >
              <Icon icon="heroicons:x-mark" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-default-700">Work Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="colleague@hospital.com"
              className={`w-full h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.email ? "border-destructive" : "border-input"}`}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-default-700">Full Name *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Dr. Rahim Uddin"
              className={`w-full h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.full_name ? "border-destructive" : "border-input"}`}
            />
            {errors.full_name && <p className="text-destructive text-xs">{errors.full_name}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-default-700">Role *</label>
            <select
              value={form.role_name}
              onChange={(e) => setForm((f) => ({ ...f, role_name: e.target.value }))}
              className={`w-full h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors.role_name ? "border-destructive" : "border-input"}`}
            >
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.display_name}
                </option>
              ))}
            </select>
            {errors.role_name && <p className="text-destructive text-xs">{errors.role_name}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-input text-sm font-medium hover:bg-default-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              id="invite-user-submit"
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [isPending, startTransition] = useTransition();
  const isAdmin = useTenantAuthStore((s) => s.isAdmin());

  const fetchUsers = async (p = 1, q = search) => {
    setLoading(true);
    try {
      const res = await iamApi.getUsers({ page: p, search: q, page_size: 15 });
      const { results, count } = res.data.data;
      setUsers(results || []);
      setTotalPages(Math.ceil((count || 0) / 15));
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await iamApi.getRoles();
      setRoles(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    startTransition(() => {
      setPage(1);
      fetchUsers(1, v);
    });
  };

  const handleDeactivate = async (userId) => {
    if (!confirm("Deactivate this user? They will lose access immediately.")) return;
    setActionLoading(userId);
    try {
      await iamApi.deactivateUser(userId);
      toast.success("User deactivated.");
      fetchUsers(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (userId) => {
    setActionLoading(userId);
    try {
      await iamApi.unlockUser(userId);
      toast.success("User unlocked.");
      fetchUsers(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unlock user.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:users" className="w-6 h-6 text-primary" />
            Team Members
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Manage users, roles, and access across your organization.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            id="open-invite-modal"
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or email..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => fetchUsers(page)}
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
                <th className="h-14 px-4 text-left font-semibold text-default-800">Name</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Email</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Roles</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Status</th>
                <th className="h-14 px-4 text-left font-semibold text-default-800">Last Login</th>
                {isAdmin && (
                  <th className="h-14 px-4 text-right font-semibold text-default-800">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-40 text-center text-default-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-default-300 transition-colors hover:bg-default-50/50 ${
                      actionLoading === user.id ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-default-900 whitespace-nowrap">
                            {user.full_name}
                          </p>
                          {user.employee_id && (
                            <p className="text-xs text-default-400">{user.employee_id}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-default-600">{user.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.branch_roles?.slice(0, 2).map((br) => (
                          <RoleChip key={br.id} name={br.role_name} />
                        ))}
                        {user.branch_roles?.length > 2 && (
                          <span className="text-xs text-default-400">
                            +{user.branch_roles.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <StatusBadge isActive={user.is_active} />
                        {user.locked_until && new Date(user.locked_until) > new Date() && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-warning/10 text-warning">
                            Locked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-default-500 text-xs whitespace-nowrap">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleString("en-BD", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "Never"}
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.locked_until && new Date(user.locked_until) > new Date() && (
                            <button
                              onClick={() => handleUnlock(user.id)}
                              className="px-2.5 py-1 rounded bg-warning/10 text-warning text-xs font-semibold hover:bg-warning/20 transition"
                              title="Unlock account"
                            >
                              Unlock
                            </button>
                          )}
                          {user.is_active && (
                            <button
                              onClick={() => handleDeactivate(user.id)}
                              className="px-2.5 py-1 rounded bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setPage(p => p - 1); fetchUsers(page - 1); }}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-input disabled:opacity-40 hover:bg-default-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setPage(p => p + 1); fetchUsers(page + 1); }}
                disabled={page >= totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-input disabled:opacity-40 hover:bg-default-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => fetchUsers(page)}
          roles={roles}
        />
      )}
    </div>
  );
}

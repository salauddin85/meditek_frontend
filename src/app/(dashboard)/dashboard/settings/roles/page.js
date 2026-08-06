"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  Loader2,
  Shield,
  Plus,
  ChevronDown,
  ChevronRight,
  Info,
  Lock,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

// ─── helpers ──────────────────────────────────────────────────────────────────

function groupByModule(permissions) {
  return permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});
}

const MODULE_ICONS = {
  iam:        "heroicons:user-group",
  clinical:   "heroicons:heart",
  laboratory: "heroicons:beaker",
  pharmacy:   "heroicons:archive-box",
  finance:    "heroicons:banknotes",
  reception:  "heroicons:calendar",
  hr:         "heroicons:briefcase",
  radiology:  "heroicons:camera",
  admin:      "heroicons:cog-6-tooth",
};

// ─── PermissionMatrix ─────────────────────────────────────────────────────────

function PermissionMatrix({ role, allPermissions, onUpdate, isAdmin }) {
  const [expanded, setExpanded]  = useState(false);
  const [selected, setSelected]  = useState(new Set(role.permissions || []));
  const [saving,   setSaving]    = useState(false);
  const [showDel,  setShowDel]   = useState(false);
  const [deleting, setDeleting]  = useState(false);
  const grouped  = groupByModule(allPermissions);
  const readOnly = role.is_system || !isAdmin;

  useEffect(() => {
    setSelected(new Set(role.permissions || []));
  }, [role]);

  const toggle = (code) => {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await iamApi.updateRolePermissions(role.id, {
        permission_codes: Array.from(selected),
      });
      toast.success("Permissions updated.");
      onUpdate();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await iamApi.deleteRole(role.id);
      toast.success(`Role "${role.display_name}" deleted.`);
      onUpdate();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete role.");
    } finally {
      setDeleting(false);
      setShowDel(false);
    }
  };

  const isDirty =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify([...(role.permissions || [])].sort());

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Role header */}
      <div className="w-full flex items-center justify-between px-4 py-3.5 bg-card">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-default-900 text-sm flex items-center gap-2">
              {role.display_name}
              {role.is_system && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-bold uppercase">
                  <Lock className="w-2.5 h-2.5" />
                  System
                </span>
              )}
            </p>
            <p className="text-xs text-default-400">
              {role.permissions?.length || 0} permission
              {(role.permissions?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-default-400 ml-2" />
          ) : (
            <ChevronRight className="w-4 h-4 text-default-400 ml-2" />
          )}
        </button>

        {/* Delete button — only for non-system roles */}
        {isAdmin && !role.is_system && (
          <button
            onClick={() => setShowDel(true)}
            title="Delete role"
            className="ml-3 w-8 h-8 rounded-lg border border-danger/20 flex items-center justify-center text-danger hover:bg-danger/10 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Permission matrix */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-5 bg-default-50/30">
          {role.is_system && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20 text-warning text-xs">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                System role permissions are fixed and cannot be edited.
                To customise, create a new role and assign the permissions you need.
              </span>
            </div>
          )}

          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-default-500 mb-2 flex items-center gap-1.5">
                <Icon
                  icon={MODULE_ICONS[module] || "heroicons:cube"}
                  className="w-3.5 h-3.5"
                />
                {module}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms.map((p) => (
                  <label
                    key={p.code}
                    title={p.description || p.code}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition ${
                      readOnly
                        ? "cursor-not-allowed opacity-80"
                        : "cursor-pointer"
                    } ${
                      selected.has(p.code)
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent bg-card hover:border-default-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.code)}
                      onChange={() => toggle(p.code)}
                      disabled={readOnly}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-default-800">
                        {p.description || `${p.resource}.${p.action}`}
                        {p.scope && (
                          <span className="ml-1 text-default-400">({p.scope})</span>
                        )}
                      </p>
                      <p className="text-[10px] text-default-400 font-mono mt-0.5">
                        {p.code}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {isAdmin && !role.is_system && (
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon icon="heroicons:check" className="w-4 h-4" />
                )}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="font-semibold text-default-900">Delete Role</h3>
                <p className="text-xs text-default-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-default-700">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{role.display_name}</span>? All users
              must be re-assigned before deletion.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDel(false)}
                className="h-9 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-default-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 px-4 rounded-lg bg-danger text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 hover:bg-danger/90 transition"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [roles,      setRoles]      = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRole,    setNewRole]    = useState({ name: "", display_name: "", description: "" });
  const [creating,   setCreating]   = useState(false);
  const isAdmin = useTenantAuthStore((s) => s.isAdmin());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        iamApi.getRoles(),
        iamApi.getPermissions(),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data || []);
    } catch {
      toast.error("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRole.name || !newRole.display_name) {
      toast.error("Role key and display name are required.");
      return;
    }
    setCreating(true);
    try {
      await iamApi.createRole({
        name:         newRole.name.toUpperCase().replace(/\s+/g, "_"),
        display_name: newRole.display_name,
        description:  newRole.description,
      });
      toast.success("Custom role created. Assign permissions below.");
      setShowCreate(false);
      setNewRole({ name: "", display_name: "", description: "" });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create role.");
    } finally {
      setCreating(false);
    }
  };

  const systemRoles = roles.filter((r) => r.is_system);
  const customRoles  = roles.filter((r) => !r.is_system);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Roles &amp; Permissions
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Define what each role can do. Permissions are fixed by the system
            and cannot be created or deleted.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        )}
      </div>

      {/* Static-permissions info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm text-default-700">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-primary">Static permission model</p>
          <p className="text-xs text-default-500">
            All available permissions are pre-defined by the system (
            {permissions.length} total). You can create custom roles and choose
            which of these permissions to grant. You cannot create, rename, or
            delete individual permissions.
          </p>
        </div>
      </div>

      {/* Create Role form */}
      {showCreate && (
        <div className="bg-card border border-primary/20 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-default-900">New Custom Role</h3>
          <form onSubmit={handleCreateRole} className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-40 space-y-1.5">
                <label className="text-xs font-semibold text-default-700">
                  Role Key <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. SENIOR_NURSE"
                  className="w-full h-9 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex-1 min-w-40 space-y-1.5">
                <label className="text-xs font-semibold text-default-700">
                  Display Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newRole.display_name}
                  onChange={(e) => setNewRole((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Senior Nurse"
                  className="w-full h-9 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-default-700">Description (optional)</label>
              <input
                type="text"
                value={newRole.description}
                onChange={(e) => setNewRole((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this role's responsibilities"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-9 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-default-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roles list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* System roles */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-default-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              System Roles ({systemRoles.length})
            </h2>
            {systemRoles.map((role) => (
              <PermissionMatrix
                key={role.id}
                role={role}
                allPermissions={permissions}
                onUpdate={fetchData}
                isAdmin={isAdmin}
              />
            ))}
          </section>

          {/* Custom roles */}
          {customRoles.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-default-500 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Custom Roles ({customRoles.length})
              </h2>
              {customRoles.map((role) => (
                <PermissionMatrix
                  key={role.id}
                  role={role}
                  allPermissions={permissions}
                  onUpdate={fetchData}
                  isAdmin={isAdmin}
                />
              ))}
            </section>
          )}

          {roles.length === 0 && (
            <div className="text-center py-12 text-default-400 text-sm">
              No roles found. This tenant may need to be re-provisioned.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

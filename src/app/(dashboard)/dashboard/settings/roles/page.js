"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Loader2, Shield, Plus, ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

// Group permissions by module
function groupByModule(permissions) {
  return permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});
}

function PermissionMatrix({ role, allPermissions, onUpdate, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(new Set(role.permissions || []));
  const [saving, setSaving] = useState(false);
  const grouped = groupByModule(allPermissions);

  useEffect(() => {
    setSelected(new Set(role.permissions || []));
  }, [role]);

  const toggle = (code) => {
    if (!isAdmin || role.is_system) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
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

  const isDirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...(role.permissions || [])].sort());

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Role header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-card hover:bg-default-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-default-900 text-sm">{role.display_name}</p>
            <p className="text-xs text-default-400">
              {role.permissions?.length || 0} permissions
              {role.is_system && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-bold uppercase">
                  System
                </span>
              )}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-default-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-default-400" />
        )}
      </button>

      {/* Permission matrix */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-default-50/30">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-default-500 mb-2 flex items-center gap-1.5">
                <Icon icon="heroicons:cube" className="w-3.5 h-3.5" />
                {module}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms.map((p) => (
                  <label
                    key={p.code}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      selected.has(p.code)
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent bg-card hover:border-default-200"
                    } ${role.is_system || !isAdmin ? "cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.code)}
                      onChange={() => toggle(p.code)}
                      disabled={role.is_system || !isAdmin}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-default-800">
                        {p.resource}.{p.action}
                        {p.scope && <span className="text-default-400"> ({p.scope})</span>}
                      </p>
                      <p className="text-[10px] text-default-400 font-mono">{p.code}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {isAdmin && !role.is_system && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon icon="heroicons:check" className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", display_name: "" });
  const [creating, setCreating] = useState(false);
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
      toast.error("Name and display name are required.");
      return;
    }
    setCreating(true);
    try {
      await iamApi.createRole({
        name: newRole.name.toUpperCase().replace(/\s+/g, "_"),
        display_name: newRole.display_name,
      });
      toast.success("Custom role created.");
      setShowCreate(false);
      setNewRole({ name: "", display_name: "" });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create role.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Define what each role can do across the platform.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        )}
      </div>

      {/* Create Role Form */}
      {showCreate && (
        <div className="bg-card border border-primary/20 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-default-900">New Custom Role</h3>
          <form onSubmit={handleCreateRole} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40 space-y-1.5">
              <label className="text-xs font-semibold text-default-700">Role Key</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. SENIOR_NURSE"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex-1 min-w-40 space-y-1.5">
              <label className="text-xs font-semibold text-default-700">Display Name</label>
              <input
                type="text"
                value={newRole.display_name}
                onChange={(e) => setNewRole((f) => ({ ...f, display_name: e.target.value }))}
                placeholder="e.g. Senior Nurse"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </form>
        </div>
      )}

      {/* Roles list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <PermissionMatrix
              key={role.id}
              role={role}
              allPermissions={permissions}
              onUpdate={fetchData}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

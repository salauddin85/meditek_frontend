"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import { iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

export default function ProfilePage() {
  const { user, setAuth, roles, branchId, permissions } = useTenantAuthStore();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    full_name_bn: user?.full_name_bn || "",
    phone: user?.phone || "",
    employee_id: user?.employee_id || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const updateUser = useTenantAuthStore((s) => s.updateUser);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await iamApi.updateMe({
        full_name: form.full_name.trim(),
        full_name_bn: form.full_name_bn.trim(),
        phone: form.phone.trim(),
        employee_id: form.employee_id.trim(),
      });
      updateUser({
        full_name: form.full_name.trim(),
        full_name_bn: form.full_name_bn.trim(),
        phone: form.phone.trim(),
        employee_id: form.employee_id.trim(),
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { id: "full_name", label: "Full Name", name: "full_name", type: "text", required: true, icon: "heroicons:user" },
    { id: "full_name_bn", label: "Full Name (Bangla)", name: "full_name_bn", type: "text", required: false, icon: "heroicons:language" },
    { id: "phone", label: "Phone Number", name: "phone", type: "tel", required: false, icon: "heroicons:phone" },
    { id: "employee_id", label: "Employee ID", name: "employee_id", type: "text", required: false, icon: "heroicons:identification" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          My Profile
        </h1>
        <p className="text-sm text-default-500 mt-1">
          Update your personal information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Avatar + meta */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl font-bold text-primary">
                {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <h2 className="font-bold text-default-900 text-lg">{user?.full_name}</h2>
            <p className="text-sm text-default-500 mt-0.5">{user?.email}</p>
            {user?.employee_id && (
              <p className="text-xs text-default-400 mt-1 font-mono">{user.employee_id}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {roles.map((r) => (
                <span key={r} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="bg-card border border-border rounded-xl p-5 mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-default-500 uppercase tracking-wider mb-3">Account Info</h4>
            {[
              { label: "Email", value: user?.email },
              { label: "Status", value: user?.is_active ? "Active" : "Inactive" },
              { label: "MFA", value: user?.is_mfa_enabled ? "Enabled" : "Disabled" },
              { label: "Last Login", value: user?.last_login ? new Date(user.last_login).toLocaleDateString("en-BD") : "N/A" },
              { label: "Member Since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-BD") : "N/A" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-default-500 font-medium">{label}</span>
                <span className="text-default-800 font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Edit form */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-default-900 mb-5">Edit Information</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(({ id, label, name, type, required, icon }) => (
                  <div key={id} className="space-y-1.5">
                    <label htmlFor={id} className="block text-sm font-semibold text-default-700 flex items-center gap-1.5">
                      <Icon icon={icon} className="w-3.5 h-3.5 text-primary" />
                      {label} {required && <span className="text-destructive">*</span>}
                    </label>
                    <input
                      id={id}
                      name={name}
                      type={type}
                      value={form[name]}
                      onChange={handleChange}
                      className={`w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
                        errors[name] ? "border-destructive" : "border-input"
                      }`}
                    />
                    {errors[name] && (
                      <p className="text-destructive text-xs italic">{errors[name]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Read-only email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-default-700 flex items-center gap-1.5">
                  <Icon icon="heroicons:envelope" className="w-3.5 h-3.5 text-primary" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-default-50 text-default-400 cursor-not-allowed"
                />
                <p className="text-xs text-default-400">Email cannot be changed. Contact your administrator.</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="update-profile-submit"
                  disabled={loading}
                  className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-60 hover:bg-primary/90 transition"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon icon="heroicons:check" className="w-5 h-5 text-primary-foreground me-1" />
                  )}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

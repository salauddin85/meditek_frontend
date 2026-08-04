"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import { Loader2, Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

export default function TenantLoginPage() {
  const router = useRouter();
  const setAuth = useTenantAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await iamApi.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { user, branch_id, roles } = res.data.data;

      // Fetch full permissions
      let permissions = [];
      try {
        const meRes = await iamApi.getMe();
        permissions = meRes.data.data.permissions || [];
      } catch (_) {}

      setAuth({ user, branchId: branch_id, roles, permissions });
      toast.success(`Welcome back, ${user.full_name}!`);
      router.push("/dashboard");
    } catch (err) {
      const code = err?.response?.status;
      const msg = err?.response?.data?.message || "Login failed.";
      if (code === 401) {
        setErrors({ password: "Invalid email or password." });
      } else if (code === 429) {
        toast.error("Account locked. Please try again later.", { duration: 6000 });
      } else if (code === 403) {
        toast.error("Account deactivated. Contact your administrator.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-indigo-900 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 shadow-2xl mb-4">
            <Shield className="w-8 h-8 text-violet-300" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MEDITek</h1>
          <p className="text-violet-300 mt-1 text-sm font-medium tracking-wide uppercase">
            Hospital Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Sign in to your workspace</h2>
          <p className="text-violet-300/80 text-sm mb-6">
            Enter your credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" id="tenant-login-form">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-violet-200">
                Work Email
              </label>
              <div className="relative">
                <Icon
                  icon="heroicons:envelope"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@hospital.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition ${
                    errors.email
                      ? "border-red-400/70"
                      : "border-white/20 hover:border-white/40"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-violet-200">
                  Password
                </label>
                <Link
                  href="/auth/tenant-login/reset-password"
                  className="text-xs text-violet-400 hover:text-violet-200 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Icon
                  icon="heroicons:lock-closed"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition ${
                    errors.password
                      ? "border-red-400/70"
                      : "border-white/20 hover:border-white/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-200 transition"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="tenant-login-submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-transparent px-3 text-violet-400">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-violet-300/70">
            Platform Administrator?{" "}
            <Link
              href="/auth/platform-login"
              className="text-violet-300 font-semibold hover:text-white transition"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-violet-400/60 mt-6">
          © {new Date().getFullYear()} MEDITek. Secure hospital management.
        </p>
      </div>
    </div>
  );
}

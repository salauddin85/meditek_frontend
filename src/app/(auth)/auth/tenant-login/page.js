"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import { Loader2, Eye, EyeOff, LogIn, Building2 } from "lucide-react";
import { iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

// Primary color from landing page (Lab: 55.0223 -41.0774 -3.90277 ≈ #00A67E)
const PRIMARY = "#00A67E";
const PRIMARY_LIGHT = "#33C2A0";
const PRIMARY_DARK = "#008A6A";
const PRIMARY_GLOW = "rgba(0, 166, 126, 0.25)";

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements from landing page */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-[#00A67E]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-[#00A67E]/5 to-transparent rounded-full blur-3xl" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,166,126,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,166,126,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand - Matching landing page style */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00A67E]/10 border border-[#00A67E]/20 shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-[#00A67E]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A2E35] tracking-tight">
            Meditek
          </h1>
          <p className="text-[#00A67E] mt-1 text-sm font-medium tracking-wide">
            Cloud-Native Healthcare Platform
          </p>
        </div>

        {/* Card - Clean white design like landing page */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8">
          <h2 className="text-xl font-bold text-[#1A2E35] mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm mb-6">
            Access your Meditek workspace
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" id="tenant-login-form">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#1A2E35]">
                Work Email
              </label>
              <div className="relative">
                <Icon
                  icon="heroicons:envelope"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@hospital.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-[#1A2E35] placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A67E]/30 focus:border-[#00A67E] transition ${
                    errors.email
                      ? "border-red-400"
                      : "border-gray-200 hover:border-[#00A67E]/30"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-[#1A2E35]">
                  Password
                </label>
                <Link
                  href="/auth/tenant-login/reset-password"
                  className="text-xs text-[#00A67E] hover:text-[#008A6A] transition font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Icon
                  icon="heroicons:lock-closed"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white text-[#1A2E35] placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A67E]/30 focus:border-[#00A67E] transition ${
                    errors.password
                      ? "border-red-400"
                      : "border-gray-200 hover:border-[#00A67E]/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1A2E35] transition"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
            </div>

            {/* Submit - Green button matching landing page CTAs */}
            <button
              type="submit"
              id="tenant-login-submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00A67E] hover:bg-[#008A6A] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,166,126,0.35)] hover:shadow-[0_6px_20px_rgba(0,166,126,0.45)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            Tenant Registration?{" "}
            <Link
              href="/auth/register"
              className="text-[#00A67E] font-semibold hover:text-[#008A6A] transition"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Meditek. All rights reserved.
        </p>
      </div>
    </div>
  );
}
"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, HeartPulse, Shield, Eye, EyeOff } from "lucide-react";
import { usePlatformAuthStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

export default function PlatformLoginPage() {
  const router = useRouter();
  const { login } = usePlatformAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/platform/login/", {
        email: data.email,
        password: data.password,
      });
      const { access, user } = res.data.data;
      login({ user, access });
      toast.success(`Welcome back, ${user.full_name}!`);
      router.push("/platform/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <HeartPulse className="h-10 w-10 text-teal-400" strokeWidth={2.5} />
            <span className="text-3xl font-black text-white tracking-tight">
              Medi<span className="text-teal-400">tek</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-teal-400" />
            <span className="text-teal-400 font-semibold text-sm uppercase tracking-wider">
              Platform Admin
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Control Plane Access</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage tenants and platform settings</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Admin Email
              </label>
              <input
                {...register("email", { required: "Email is required" })}
                type="email"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500"
                placeholder="admin@meditek.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password", { required: "Password is required" })}
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to Platform"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}

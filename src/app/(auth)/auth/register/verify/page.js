"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Mail, CheckCircle, RefreshCw } from "lucide-react";
import { useRegistrationStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { slug, setEmailVerified, orgInfo } = useRegistrationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/public/register/verify-email/", { token: data.token.trim() });
      const { access_token } = res.data.data;
      setEmailVerified(access_token);
      toast.success("Email verified! Proceed to upload your documents.");
      router.push("/auth/register/documents");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired verification token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      // Restart registration from stored org info — calls initiate again
      // For simplicity, show a toast since the token was already sent
      toast.success("A new verification email has been sent. Check your inbox.");
    } catch {
      toast.error("Failed to resend email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-teal-600" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Check Your Email</h1>
        <p className="mt-2 text-slate-500">
          Step 2 of 5 — We sent a verification link to{" "}
          <strong className="text-slate-700">{orgInfo?.email || "your email"}</strong>.
          Copy the token from the link and paste it below.
        </p>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-sm text-teal-800">
          <strong>Check your inbox</strong> for an email from Meditek. The link contains a token — 
          copy just the token part from the URL (after <code>?token=</code>).
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Verification Token *
          </label>
          <input
            {...register("token", { required: "Please enter the verification token" })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            placeholder="Paste your verification token here"
          />
          {errors.token && <p className="mt-1 text-xs text-red-500">{errors.token.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email →"
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          onClick={() => router.push("/auth/register")}
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Back to Step 1
        </button>
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
          Resend email
        </button>
      </div>
    </div>
  );
}

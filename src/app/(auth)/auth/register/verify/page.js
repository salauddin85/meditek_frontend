"use client";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Mail, CheckCircle, RefreshCw } from "lucide-react";
import { useRegistrationStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  const { slug, setEmailVerified, orgInfo } = useRegistrationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      token: tokenParam || "",
    },
  });

  useEffect(() => {
    if (tokenParam) {
      setValue("token", tokenParam);
    }
  }, [tokenParam, setValue]);

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
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-black text-foreground">Check Your Email</h1>
        <p className="mt-2 text-muted-foreground">
          Step 2 of 5 — We sent a verification link to{" "}
          <strong className="text-foreground">{orgInfo?.email || "your email"}</strong>.
          {tokenParam ? " Your verification token has been populated automatically below." : " Copy the token from the link and paste it below."}
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-foreground">
          <strong>Check your inbox</strong> for an email from Meditek. The token will auto-populate when clicking the link, or you can paste it below.
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Verification Token *
          </label>
          <input
            {...register("token", { required: "Please enter the verification token" })}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            placeholder="Paste your verification token here"
          />
          {errors.token && <p className="mt-1 text-xs text-destructive">{errors.token.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to Step 1
        </button>
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
          Resend email
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}

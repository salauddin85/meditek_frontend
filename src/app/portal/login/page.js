"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle,
  Building2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { portalService } from "@/lib/portal-api";
import { usePortalAuthStore } from "@/store/portal-auth";

export default function PortalLoginPage() {
  const router = useRouter();
  const setSession = usePortalAuthStore((s) => s.setSession);
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);

  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [debugOtp, setDebugOtp] = useState("");

  // OTP inputs
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(300);
  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/portal/dashboard");
    }
  }, [isAuthenticated, router]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Expiry countdown timer
  useEffect(() => {
    let timer;
    if (step === "otp" && expirySeconds > 0) {
      timer = setInterval(() => setExpirySeconds((e) => e - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const payload = { email: trimmedEmail };
      if (tenantSlug.trim()) {
        payload.tenant_slug = tenantSlug.trim().toLowerCase();
      }

      const res = await portalService.requestOtp(payload);
      const data = res.data?.data || {};

      setStep("otp");
      setCooldown(data.cooldown_seconds || 60);
      setExpirySeconds(data.expires_in_seconds || 300);
      setOtpDigits(["", "", "", "", "", ""]);

      if (data.debug_otp) {
        setDebugOtp(data.debug_otp);
      }

      toast.success("Verification code sent to your email!");
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.message || err.userMessage || "Failed to send verification code.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg("");

    // Auto-advance
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    const completeCode = newDigits.join("");
    if (completeCode.length === 6 && !newDigits.includes("")) {
      handleVerifyOtp(completeCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtpDigits(digits);
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const fullOtp = typeof codeToVerify === "string" ? codeToVerify : otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      };
      if (tenantSlug.trim()) {
        payload.tenant_slug = tenantSlug.trim().toLowerCase();
      }

      const res = await portalService.verifyOtp(payload);
      const data = res.data?.data || {};

      setSession({
        sessionToken: data.session_token,
        sessionExpiresAt: data.session_expires_at,
        patient: data.patient,
      });

      toast.success("Welcome back! Loading your portal...");
      router.push("/portal/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.userMessage || "Verification failed. Invalid code.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setErrorMsg("");
    try {
      const res = await portalService.demoLogin();
      const data = res.data?.data || {};

      setSession({
        sessionToken: data.session_token,
        sessionExpiresAt: data.session_expires_at,
        patient: data.patient,
      });

      toast.success("Welcome! Loading the evaluation portal…");
      router.push("/portal/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.userMessage ||
        "Demo login failed. Please try the normal login.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">

        {/* ── Evaluation Quick-Login Banner ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
            border: "1px solid rgba(99,179,237,0.25)",
            borderRadius: "1rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.25rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#93c5fd",
              marginBottom: "0.35rem",
            }}
          >
            🎓 Project Evaluation Mode
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#cbd5e1",
              marginBottom: "1rem",
              lineHeight: 1.5,
            }}
          >
            Skip the OTP flow and explore the Patient Portal instantly with a demo account.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.65rem 1rem",
              borderRadius: "0.625rem",
              border: "none",
              background: demoLoading
                ? "rgba(59,130,246,0.4)"
                : "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: demoLoading ? "not-allowed" : "pointer",
              boxShadow: demoLoading ? "none" : "0 2px 12px rgba(59,130,246,0.45)",
              transition: "opacity 0.2s, box-shadow 0.2s",
            }}
          >
            {demoLoading ? (
              <RefreshCw style={{ height: "1rem", width: "1rem", animation: "spin 1s linear infinite" }} />
            ) : (
              <Zap style={{ height: "1rem", width: "1rem" }} />
            )}
            <span>{demoLoading ? "Signing in…" : "Evaluator? Click here to login directly"}</span>
          </button>
        </div>

        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
            <HeartPulse className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Patient Portal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Secure, passwordless access to your medical records & appointments
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {debugOtp && step === "otp" && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
              <span>Demo code: <strong className="font-mono text-sm tracking-widest">{debugOtp}</strong></span>
              <button
                type="button"
                onClick={() => {
                  const digits = debugOtp.split("");
                  setOtpDigits(digits);
                  handleVerifyOtp(debugOtp);
                }}
                className="font-medium underline hover:text-emerald-900"
              >
                Auto-fill
              </button>
            </div>
          )}

          {step === "email" ? (
            /* STEP 1: Email Entry */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Hospital / Clinic Slug <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    placeholder="e.g. greenlife"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-Digit OTP Entry */
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {email}
                </p>
              </div>

              {/* 6 Digit Input Group */}
              <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 w-11 sm:h-13 sm:w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  />
                ))}
              </div>

              {/* Timer info */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Expires in:{" "}
                    <strong className={expirySeconds < 60 ? "text-rose-500" : ""}>
                      {formatTime(expirySeconds)}
                    </strong>
                  </span>
                </div>

                {cooldown > 0 ? (
                  <span>Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={loading}
                    className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otpDigits.join("").length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setErrorMsg("");
                  setDebugOtp("");
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ← Change email address
              </button>
            </div>
          )}

          {/* Security Assurance */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Multi-tenant encrypted patient session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import apiClient from "@/lib/api-client";

const STEP_LABELS = {
  validate_payload: "Validating registration",
  prepare_tenant_storage: "Setting up storage",
  seed_reference_data: "Seeding reference data",
  init_subscription: "Initializing subscription",
  emit_provisioned_event: "Finalizing provisioning",
  send_welcome_email: "Sending welcome email",
  activate_tenant: "Activating workspace",
};

function StatusIcon({ status }) {
  if (status === "completed") return <CheckCircle className="w-5 h-5 text-teal-500" />;
  if (status === "failed") return <XCircle className="w-5 h-5 text-red-500" />;
  if (status === "running") return <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />;
  return <Clock className="w-5 h-5 text-slate-300" />;
}

function ProvisioningContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationId = searchParams.get("registration_id");

  const [tenantStatus, setTenantStatus] = useState(null);
  const [provisioningLogs, setProvisioningLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [tenantSlug, setTenantSlug] = useState(null);
  const [polling, setPolling] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!registrationId) return;
    try {
      // Fetch registration status using stored token
      const res = await apiClient.get("/public/register/status/");
      const data = res.data.data;
      setTenantStatus(data.tenant_status);
      setTenantSlug(data.slug);

      if (data.tenant_status === "active" || data.tenant_status === "trial") {
        setIsComplete(true);
        setPolling(false);
      }
    } catch {
      // Token may have expired or not set
    }
  }, [registrationId]);

  useEffect(() => {
    fetchStatus();
    if (!polling) return;
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus, polling]);

  if (isComplete) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Your Workspace is Ready! 🎉
        </h2>
        <p className="text-slate-500 mb-2">
          Welcome to Meditek! Your hospital workspace has been provisioned successfully.
        </p>
        {tenantSlug && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-6">
            <p className="text-sm text-teal-700">
              Your workspace URL:{" "}
              <strong>{tenantSlug}.meditek.com</strong>
            </p>
          </div>
        )}
        <a
          href={tenantSlug ? `http://${tenantSlug}.meditek.com` : "/"}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Go to Your Workspace
        </a>
      </div>
    );
  }

  const PROVISIONING_STEPS = [
    "validate_payload",
    "prepare_tenant_storage",
    "seed_reference_data",
    "init_subscription",
    "emit_provisioned_event",
    "send_welcome_email",
    "activate_tenant",
  ];

  const logMap = {};
  provisioningLogs.forEach((l) => { logMap[l.step] = l.status; });

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Setting Up Your Workspace
        </h2>
        <p className="text-slate-500 mt-1">
          This usually takes 1-2 minutes. Please don&apos;t close this page.
        </p>
      </div>

      <div className="space-y-2 mb-6">
        {PROVISIONING_STEPS.map((step, idx) => {
          const status = logMap[step] || "pending";
          return (
            <div
              key={step}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                status === "completed"
                  ? "bg-teal-50"
                  : status === "running"
                  ? "bg-blue-50"
                  : status === "failed"
                  ? "bg-red-50"
                  : "bg-slate-50"
              }`}
            >
              <StatusIcon status={status} />
              <span
                className={`text-sm font-medium ${
                  status === "completed"
                    ? "text-teal-700"
                    : status === "running"
                    ? "text-blue-700"
                    : status === "failed"
                    ? "text-red-700"
                    : "text-slate-400"
                }`}
              >
                {STEP_LABELS[step] || step}
              </span>
              {status === "completed" && (
                <span className="ml-auto text-xs text-teal-500 font-semibold">Done</span>
              )}
              {status === "running" && (
                <span className="ml-auto text-xs text-blue-500 font-semibold">In Progress</span>
              )}
              {status === "failed" && (
                <span className="ml-auto text-xs text-red-500 font-semibold">Failed</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-slate-400">
        Current status:{" "}
        <span className="font-semibold text-slate-600 capitalize">
          {tenantStatus || "checking..."}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400">
          You&apos;ll receive a welcome email when your workspace is ready. 
          You can safely close this page and come back later.
        </p>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Provisioning</h1>
        <p className="mt-2 text-slate-500">
          Step 6 of 5 — Setting up your hospital workspace.
        </p>
      </div>
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>}>
        <ProvisioningContent />
      </Suspense>
    </div>
  );
}

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
  if (status === "completed") return <CheckCircle className="w-5 h-5 text-primary" />;
  if (status === "failed") return <XCircle className="w-5 h-5 text-destructive" />;
  if (status === "running") return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
  return <Clock className="w-5 h-5 text-muted-foreground" />;
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
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">
          Your Workspace is Ready! 🎉
        </h2>
        <p className="text-muted-foreground mb-2">
          Welcome to Meditek! Your hospital workspace has been provisioned successfully.
        </p>
        {tenantSlug && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-6">
            <p className="text-sm text-foreground">
              Your workspace URL:{" "}
              <strong>{tenantSlug}.meditek.com</strong>
            </p>
          </div>
        )}
        <a
          href={tenantSlug ? `http://${tenantSlug}.meditek.com` : "/"}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
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
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Setting Up Your Workspace
        </h2>
        <p className="text-muted-foreground mt-1">
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
                  ? "bg-primary/5"
                  : status === "running"
                  ? "bg-info/10"
                  : status === "failed"
                  ? "bg-destructive/10"
                  : "bg-muted"
              }`}
            >
              <StatusIcon status={status} />
              <span
                className={`text-sm font-medium ${
                  status === "completed"
                    ? "text-primary"
                    : status === "running"
                    ? "text-info"
                    : status === "failed"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {STEP_LABELS[step] || step}
              </span>
              {status === "completed" && (
                <span className="ml-auto text-xs text-primary font-semibold">Done</span>
              )}
              {status === "running" && (
                <span className="ml-auto text-xs text-info font-semibold">In Progress</span>
              )}
              {status === "failed" && (
                <span className="ml-auto text-xs text-destructive font-semibold">Failed</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Current status:{" "}
        <span className="font-semibold text-muted-foreground capitalize">
          {tenantStatus || "checking..."}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
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
        <h1 className="text-3xl font-black text-foreground">Provisioning</h1>
        <p className="mt-2 text-muted-foreground">
          Step 6 of 5 — Setting up your hospital workspace.
        </p>
      </div>
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
        <ProvisioningContent />
      </Suspense>
    </div>
  );
}

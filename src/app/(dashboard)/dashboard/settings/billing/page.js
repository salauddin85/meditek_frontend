"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { billingApi } from "@/lib/tenant-api";

// Status Badge Helper
const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    trial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    grace: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    past_due: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    suspended: "bg-red-500/10 text-red-600 border-red-500/20",
    cancelled: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };
  const label = status ? status.toUpperCase() : "UNKNOWN";
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
        styles[status] || styles.cancelled
      }`}
    >
      {label}
    </span>
  );
};

// Quota Meter Component
const QuotaMeter = ({ label, used, limit, unlimited, unit = "" }) => {
  const percentage = unlimited || !limit || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isHigh = percentage >= 85;

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-default-600">
        <span>{label}</span>
        <span className="font-mono text-default-900">
          {used} / {unlimited ? "Unlimited" : `${limit} ${unit}`}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-default-100 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            unlimited
              ? "bg-primary"
              : isHigh
              ? "bg-amber-500"
              : "bg-primary"
          }`}
          style={{ width: unlimited ? "100%" : `${percentage}%` }}
        />
      </div>
    </div>
  );
};

function BillingOverviewContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await billingApi.getSubscription();
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    if (searchParams) {
      const status = searchParams.get("status");
      const invoiceNumber = searchParams.get("invoice_number");

      if (status === "success") {
        toast.success(
          invoiceNumber
            ? `Payment successful! Invoice ${invoiceNumber} paid and subscription plan updated.`
            : "Payment successful! Your subscription plan has been upgraded.",
          { duration: 6000 }
        );
        window.history.replaceState({}, "", "/dashboard/settings/billing");
      } else if (status === "fail") {
        toast.error("Payment failed. Please try again or choose a different payment method.", { duration: 6000 });
        window.history.replaceState({}, "", "/dashboard/settings/billing");
      } else if (status === "cancel") {
        toast.error("Payment process was cancelled.", { duration: 5000 });
        window.history.replaceState({}, "", "/dashboard/settings/billing");
      }
    }
  }, [searchParams]);

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await billingApi.cancelSubscription({ reason: cancelReason });
      toast.success("Subscription cancelled.");
      setShowCancelModal(false);
      fetchSubscription();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sub = data?.subscription;
  const usage = data?.usage;
  const plan = sub?.plan;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            Subscription & Billing
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Manage your tenant subscription plan, quota usage metrics, and invoicing history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings/billing/invoices"
            className="h-10 px-4 rounded-xl border border-input text-sm font-semibold flex items-center gap-2 hover:bg-default-50 transition"
          >
            <FileText className="w-4 h-4 text-default-500" />
            Invoices History
          </Link>
          <Link
            href="/dashboard/settings/billing/upgrade"
            id="upgrade-plan-btn"
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/25"
          >
            <Zap className="w-4 h-4" />
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Plan Hero Card */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={sub?.status} />
              <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                {sub?.billing_cycle} Billing Cycle
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-default-900">
                {sub?.plan_name || "Diagnostic Center Plan"}
              </h2>
              <p className="text-sm text-default-500 mt-1">
                Full healthcare management capability configured for your organization.
              </p>
            </div>
            {sub?.current_period_end && (
              <div className="flex items-center gap-2 text-xs font-medium text-default-600 pt-2">
                <Clock className="w-4 h-4 text-primary" />
                Current cycle ends on:{" "}
                <span className="font-bold text-default-900">
                  {new Date(sub.current_period_end).toLocaleDateString("en-BD", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/dashboard/settings/billing/upgrade"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Change or Upgrade Plan
            </Link>
            {sub?.status === "active" && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quota Usage Meters */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-default-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Resource Quota & Usage Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuotaMeter
            label="Branches"
            used={usage?.branches?.used || 0}
            limit={usage?.branches?.limit}
            unlimited={usage?.branches?.unlimited}
          />
          <QuotaMeter
            label="Doctors & Staff"
            used={usage?.doctors?.used || 0}
            limit={usage?.doctors?.limit}
            unlimited={usage?.doctors?.unlimited}
          />
          <QuotaMeter
            label="Active Patients"
            used={usage?.active_patients?.used || 0}
            limit={usage?.active_patients?.limit}
            unlimited={usage?.active_patients?.unlimited}
          />
          <QuotaMeter
            label="Monthly Appointments"
            used={usage?.appointments_monthly?.used || 0}
            limit={usage?.appointments_monthly?.limit}
            unlimited={usage?.appointments_monthly?.unlimited}
          />
          <QuotaMeter
            label="Monthly SMS Credits"
            used={usage?.sms_monthly?.used || 0}
            limit={usage?.sms_monthly?.limit}
            unlimited={usage?.sms_monthly?.unlimited}
          />
          <QuotaMeter
            label="Storage Space"
            used={usage?.storage_gb?.used_gb || 0}
            limit={usage?.storage_gb?.limit_gb}
            unit="GB"
          />
        </div>
      </div>

      {/* Feature Flags Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-default-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Included Module Features
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { key: "telemedicine", label: "Telemedicine" },
            { key: "pharmacy", label: "Pharmacy Module" },
            { key: "laboratory", label: "Laboratory Module" },
            { key: "radiology", label: "Radiology Module" },
            { key: "ipd", label: "Inpatient (IPD)" },
            { key: "ot", label: "Operation Theater" },
            { key: "hr_payroll", label: "HR & Payroll" },
            { key: "insurance", label: "Insurance & Corporate" },
            { key: "api_access", label: "REST API Access" },
            { key: "custom_domain", label: "Custom Domain" },
            { key: "white_label", label: "White Labeling" },
          ].map(({ key, label }) => {
            const isEnabled = usage?.features?.[key];
            return (
              <div
                key={key}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  isEnabled
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-default-50 border-default-200 text-default-400"
                }`}
              >
                {isEnabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-default-400 shrink-0" />
                )}
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Cancel Subscription</h3>
            </div>
            <p className="text-sm text-default-600">
              Are you sure you want to cancel your subscription? Your access will be restricted at the end of the billing period.
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-default-700">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know how we can improve..."
                className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-input text-sm font-semibold hover:bg-default-50 transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-destructive/90 transition disabled:opacity-60"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillingOverviewContent />
    </Suspense>
  );
}

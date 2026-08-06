"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Building2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Clock,
  CreditCard,
  Ban,
  Banknote,
  ChevronRight,
  FileSearch,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { usePlatformAuthStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

/* ────────── helpers ────────── */
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtCurrency = (amount) => {
  const n = Number(amount) || 0;
  return `৳${n.toLocaleString()}`;
};

const STATUS_COLORS = {
  pending_verification: { bg: "bg-amber-500", text: "text-amber-600", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  pending_payment: { bg: "bg-orange-500", text: "text-orange-600", badge: "bg-orange-50 text-orange-700 ring-orange-200" },
  provisioning: { bg: "bg-sky-500", text: "text-sky-600", badge: "bg-sky-50 text-sky-700 ring-sky-200" },
  trial: { bg: "bg-blue-500", text: "text-blue-600", badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  active: { bg: "bg-emerald-500", text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  grace: { bg: "bg-yellow-500", text: "text-yellow-600", badge: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
  suspended: { bg: "bg-red-500", text: "text-red-600", badge: "bg-red-50 text-red-700 ring-red-200" },
  terminated: { bg: "bg-slate-400", text: "text-slate-600", badge: "bg-slate-50 text-slate-600 ring-slate-200" },
  purged: { bg: "bg-slate-300", text: "text-slate-500", badge: "bg-slate-50 text-slate-500 ring-slate-200" },
};

const ORG_COLORS = {
  hospital: "#6366f1",
  clinic: "#3b82f6",
  diagnostic_center: "#10b981",
  multispecialty: "#f59e0b",
};

const ORG_LABELS = {
  hospital: "Hospital",
  clinic: "Clinic",
  diagnostic_center: "Diagnostic Center",
  multispecialty: "Multispecialty",
};

const STATUS_LABELS = {
  pending_verification: "Pending Verification",
  pending_payment: "Pending Payment",
  provisioning: "Provisioning",
  trial: "Trial",
  active: "Active",
  grace: "Grace Period",
  suspended: "Suspended",
  terminated: "Terminated",
  purged: "Purged",
};

/* ────────── StatusBadge ────────── */
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.terminated;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${c.badge}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/* ────────── OrgBadge ────────── */
function OrgBadge({ type }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {ORG_LABELS[type] || type}
    </span>
  );
}

/* ────────── Main ────────── */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = usePlatformAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Try the new aggregated stats endpoint first
      const res = await apiClient.get("/platform/dashboard/stats/");
      setStats(res.data.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        router.push("/auth/platform-login");
        return;
      }
      // Fallback: compute from tenant list
      try {
        const res = await apiClient.get("/platform/tenants/?page=1&page_size=200");
        const items = res.data.data.results || [];
        const statusCounts = {};
        const orgTypeCounts = {};
        items.forEach((t) => {
          statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
          orgTypeCounts[t.org_type] = (orgTypeCounts[t.org_type] || 0) + 1;
        });
        setStats({
          total_tenants: res.data.data.pagination?.count || items.length,
          status_counts: statusCounts,
          org_type_counts: orgTypeCounts,
          registration_pipeline: {},
          doc_review_counts: {},
          pending_reviews: [],
          recent_registrations: items.slice(0, 10),
          revenue: { total_paid: "0", paid_invoices: 0 },
        });
      } catch {
        toast.error("Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/auth/platform-login");
      return;
    }
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isAuthenticated]);

  if (!hasHydrated || !isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sc = stats?.status_counts || {};
  const activeCount = (sc.active || 0) + (sc.trial || 0);
  const totalBar = Object.values(sc).reduce((a, b) => a + b, 0) || 1;
  const pipeline = stats?.registration_pipeline || {};
  const orgCounts = stats?.org_type_counts || {};
  const pendingReviews = stats?.pending_reviews || [];
  const recentRegs = stats?.recent_registrations || [];
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  /* ── KPI cards ── */
  const kpiCards = [
    { title: "Total Tenants", value: stats?.total_tenants ?? 0, icon: Building2, iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
    { title: "Active", value: activeCount, icon: ShieldCheck, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { title: "Pending Verification", value: sc.pending_verification || 0, icon: Clock, iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
    { title: "Pending Payment", value: sc.pending_payment || 0, icon: CreditCard, iconBg: "bg-orange-500/10", iconColor: "text-orange-600" },
    { title: "Suspended", value: sc.suspended || 0, icon: Ban, iconBg: "bg-red-500/10", iconColor: "text-red-600" },
    { title: "Revenue", value: fmtCurrency(stats?.revenue?.total_paid), icon: Banknote, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
  ];

  /* ── Pipeline steps ── */
  const pipelineSteps = [
    { label: "Org Created", key: "org_completed" },
    { label: "Email Verified", key: "email_verified" },
    { label: "Docs Uploaded", key: "docs_uploaded" },
    { label: "Docs Verified", key: "docs_verified" },
    { label: "Plan Selected", key: "plan_selected" },
    { label: "Payment Done", key: "payment_completed" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Control Plane</p>
            <h1 className="mt-2 text-3xl font-black text-foreground">Welcome back, {user?.full_name || "Admin"}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {todayStr}
            </div>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{card.title}</p>
              <p className="mt-1 text-2xl font-black text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Distribution */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Tenant Status Distribution</h2>
            <p className="mt-1 text-sm text-muted-foreground">Visual breakdown of all tenants by lifecycle status</p>
            {/* Stacked bar */}
            <div className="mt-5 flex h-6 overflow-hidden rounded-full bg-muted">
              {Object.entries(sc).filter(([, v]) => v > 0).map(([status, count]) => {
                const c = STATUS_COLORS[status] || STATUS_COLORS.terminated;
                const pct = (count / totalBar) * 100;
                return (
                  <div
                    key={status}
                    className={`${c.bg} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${STATUS_LABELS[status] || status}: ${count}`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {Object.entries(sc).filter(([, v]) => v > 0).map(([status, count]) => {
                const c = STATUS_COLORS[status] || STATUS_COLORS.terminated;
                return (
                  <div key={status} className="flex items-center gap-2 text-sm">
                    <span className={`h-3 w-3 rounded-full ${c.bg}`} />
                    <span className="text-muted-foreground">{STATUS_LABELS[status] || status}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration Pipeline */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Registration Pipeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">Conversion funnel through the registration wizard</p>
            <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-2">
              {pipelineSteps.map((step, i) => {
                const count = pipeline[step.key] || 0;
                const maxCount = Math.max(...Object.values(pipeline).map(Number), 1);
                const pct = Math.max((count / maxCount) * 100, 10);
                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex min-w-[100px] flex-col items-center">
                      <div
                        className="mb-2 flex h-12 items-end justify-center rounded-lg bg-primary/10"
                        style={{ width: "80px" }}
                      >
                        <div className="w-full rounded-lg bg-primary/80 transition-all" style={{ height: `${pct}%` }} />
                      </div>
                      <p className="text-lg font-black text-foreground">{count}</p>
                      <p className="mt-0.5 text-center text-xs text-muted-foreground leading-tight">{step.label}</p>
                    </div>
                    {i < pipelineSteps.length - 1 && (
                      <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-6">
          {/* Organization Types */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Organization Types</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(orgCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ORG_COLORS[type] || "#94a3b8" }} />
                    <span className="text-sm text-muted-foreground">{ORG_LABELS[type] || type}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
              {Object.keys(orgCounts).length === 0 && (
                <p className="text-sm text-muted-foreground">No tenants yet</p>
              )}
            </div>
          </div>

          {/* Document Review Queue */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Document Review</h2>
              <Link
                href="/admin_dashboard/tenants"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {pendingReviews.length > 0 ? (
                pendingReviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{ORG_LABELS[r.org_type] || r.org_type}</p>
                    </div>
                    <Link href="/admin_dashboard/tenants" className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">
                      Review
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <FileSearch className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No pending reviews</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Registrations Table ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Recent Registrations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Latest tenant registrations across the platform</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-6 py-3 font-medium text-muted-foreground">Organization</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Type</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">District</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentRegs.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-3">
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.slug}</p>
                  </td>
                  <td className="px-6 py-3"><OrgBadge type={t.org_type} /></td>
                  <td className="px-6 py-3 text-muted-foreground">{t.email}</td>
                  <td className="px-6 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-6 py-3 text-muted-foreground">{t.district || "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{fmtDate(t.created_at)}</td>
                </tr>
              ))}
              {recentRegs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No registrations yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

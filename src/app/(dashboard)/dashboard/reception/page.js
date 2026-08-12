"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  UserCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Wallet,
  ArrowRight,
  RefreshCw,
  Plus,
  Tv,
  Users,
  CreditCard,
  Building2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import { receptionApi, branchesApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const safeFormatDate = (dateStr, pattern = "hh:mm a") => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return format(d, pattern);
  } catch {
    return "—";
  }
};

export default function ReceptionCommandCenterPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [overview, setOverview] = useState(null);
  const [recentTokens, setRecentTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await branchesApi.getBranches();
        if (res.data?.data?.length > 0) {
          setBranches(res.data.data);
          setSelectedBranchId(res.data.data[0].id);
        }
      } catch {
        toast.error("Failed to load branches.");
      }
    }
    loadBranches();
  }, []);

  // Fetch overview stats & recent check-ins
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, tokensRes] = await Promise.all([
        receptionApi.getOverview({ branch_id: selectedBranchId || undefined }),
        receptionApi.getVisitTokens({
          branch_id: selectedBranchId || undefined,
          date_from: format(new Date(), "yyyy-MM-dd"),
          date_to: format(new Date(), "yyyy-MM-dd"),
        }),
      ]);

      if (overviewRes.data?.data) {
        setOverview(overviewRes.data.data);
      }
      if (tokensRes.data?.data) {
        setRecentTokens(tokensRes.data.data.slice(0, 8));
      }
    } catch {
      toast.error("Failed to load reception overview.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const activeDrawer = overview?.active_drawer_session;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Branch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Reception & Front Desk Command Center
          </h1>
          <p className="text-xs text-default-500 mt-1">
            Realtime front desk check-ins, visit tokens, live drawer status, and split payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchOverview}
            className="gap-2 font-bold h-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Check-ins Today */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-default-500 uppercase">Check-ins Today</p>
              <h3 className="text-2xl font-black text-default-900 mt-1">
                {overview?.total_checkins_today ?? 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Waiting in Queue */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-default-500 uppercase">Waiting in Queue</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {overview?.waiting_in_queue ?? 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* In Chamber */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-default-500 uppercase">In Chamber</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {overview?.in_chamber ?? 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Cash Drawer Status */}
        <Card
          className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${
            activeDrawer
              ? activeDrawer.status === "disputed"
                ? "border-l-rose-500 bg-rose-50/20"
                : "border-l-indigo-500 bg-indigo-50/20"
              : "border-l-default-300"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-default-500 uppercase">Drawer Status</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-lg font-black text-default-900">
                  {activeDrawer ? `৳${activeDrawer.expected_cash}` : "No Session"}
                </h3>
                {activeDrawer && (
                  <Badge
                    color={activeDrawer.status === "disputed" ? "destructive" : "success"}
                    className="text-[10px] uppercase font-bold"
                  >
                    {activeDrawer.status}
                  </Badge>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/reception/checkin">
          <Card className="hover:border-primary cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-default-900 group-hover:text-primary transition-colors flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Front Desk Check-In
                </span>
                <p className="text-xs text-default-500">QR Scan, Fast New Register, or Appointments</p>
              </div>
              <ArrowRight className="w-4 h-4 text-default-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reception/tokens">
          <Card className="hover:border-primary cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-default-900 group-hover:text-primary transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Visit Tokens
                </span>
                <p className="text-xs text-default-500">Directory & Thermal Receipt Print (58mm/80mm)</p>
              </div>
              <ArrowRight className="w-4 h-4 text-default-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reception/cash_drawer">
          <Card className="hover:border-primary cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-default-900 group-hover:text-primary transition-colors flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  Cash Drawer Manager
                </span>
                <p className="text-xs text-default-500">Open/close float, transactions & supervisor gate</p>
              </div>
              <ArrowRight className="w-4 h-4 text-default-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reception/payments">
          <Card className="hover:border-primary cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-default-900 group-hover:text-primary transition-colors flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-500" />
                  Split Payment Counter
                </span>
                <p className="text-xs text-default-500">Cash, Card, bKash, Nagad, Insurance split</p>
              </div>
              <ArrowRight className="w-4 h-4 text-default-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid: Recent Check-ins & Active Drawer Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Issued Tokens Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Today's Issued Visit Tokens
            </CardTitle>
            <Link href="/dashboard/reception/tokens">
              <Button size="xs" variant="outline" className="font-bold gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTokens.length === 0 ? (
              <div className="py-12 text-center text-default-400 text-xs space-y-2">
                <Users className="w-8 h-8 mx-auto text-default-300" />
                <p>No visit tokens issued today yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-default-50 text-default-700 font-bold border-b border-border uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 pl-6">Token #</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Issued Time</th>
                      <th className="p-3 text-right pr-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {recentTokens.map((t) => (
                      <tr key={t.id} className="hover:bg-default-50 transition-colors">
                        <td className="p-3 pl-6 font-mono font-extrabold text-primary">
                          #{t.token_number}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-default-900 block">{t.patient_name}</span>
                          <span className="text-[10px] font-mono text-default-400">MRN: {t.patient_mrn}</span>
                        </td>
                        <td className="p-3 text-default-700 font-medium">{t.doctor_name}</td>
                        <td className="p-3 text-default-500 font-mono">
                          {safeFormatDate(t.issued_at, "hh:mm a")}
                        </td>
                        <td className="p-3 text-right pr-6">
                          <Badge
                            color={
                              t.status === "completed"
                                ? "success"
                                : t.status === "called"
                                ? "primary"
                                : "warning"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {t.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Cash Drawer Status Box */}
        <Card className="lg:col-span-1 border border-border">
          <CardHeader className="border-b border-border py-4 px-6">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600" />
              Active Cash Drawer Session
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {activeDrawer ? (
              <div className="space-y-4">
                <div className="bg-default-50 rounded-xl p-4 space-y-2 border border-default-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-default-500">Cashier</span>
                    <span className="font-bold text-default-900">{activeDrawer.cashier_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-default-500">Opening Float</span>
                    <span className="font-mono font-bold text-default-900">৳{activeDrawer.opening_float}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-border pt-2">
                    <span className="text-default-700 font-bold">Expected Cash</span>
                    <span className="font-mono font-black text-lg text-primary">৳{activeDrawer.expected_cash}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-default-500 font-mono">
                  <span>Opened at {safeFormatDate(activeDrawer.opened_at, "hh:mm a")}</span>
                  <Badge color={activeDrawer.status === "disputed" ? "destructive" : "success"} className="uppercase font-bold">
                    {activeDrawer.status}
                  </Badge>
                </div>

                <Link href="/dashboard/reception/cash_drawer">
                  <Button className="w-full font-bold gap-2 mt-2">
                    <Wallet className="w-4 h-4" /> Manage Drawer Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center text-default-400 space-y-3">
                <Wallet className="w-10 h-10 mx-auto text-default-300" />
                <div>
                  <p className="font-bold text-sm text-default-700">No Open Drawer Session</p>
                  <p className="text-xs text-default-500 mt-0.5">
                    Open a cash drawer session to record cash payments & floats.
                  </p>
                </div>
                <Link href="/dashboard/reception/cash_drawer">
                  <Button size="sm" className="font-bold gap-1 mt-2">
                    <Plus className="w-4 h-4" /> Open Drawer Session
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

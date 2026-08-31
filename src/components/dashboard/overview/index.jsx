"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  FlaskConical, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity, 
  CreditCard, 
  FileText, 
  RefreshCw, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight,
  Pill,
  BarChart3
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi, iamApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
];

export default function Overview() {
  const { user } = useTenantAuthStore();
  const [period, setPeriod] = useState("today");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [appointmentAnalytics, setAppointmentAnalytics] = useState(null);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await iamApi.getMe();
        if (res?.data?.data?.user?.branches) {
          setBranches(res.data.data.user.branches);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch Dashboard Data
  const loadDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = { period };
      if (branchId && branchId !== "all") params.branch_id = branchId;

      const [dashRes, revRes, apptRes] = await Promise.allSettled([
        dashboardApi.getOverview(params),
        dashboardApi.getRevenueAnalytics(params),
        dashboardApi.getAppointmentsAnalytics(params),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data?.data) {
        setDashboardData(dashRes.value.data.data);
      }
      if (revRes.status === "fulfilled" && revRes.value?.data?.data) {
        setRevenueAnalytics(revRes.value.data.data);
      }
      if (apptRes.status === "fulfilled" && apptRes.value?.data?.data) {
        setAppointmentAnalytics(apptRes.value.data.data);
      }

      if (isManualRefresh) {
        toast.success("Dashboard metrics updated.");
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
      toast.error("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [period, branchId]);

  const role = dashboardData?.role || "executive";
  const content = dashboardData?.data || {};

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-default-900">
              Hospital Overview & Analytics
            </h1>
            <Badge variant="outline" className="capitalize text-primary border-primary/20 bg-primary/5 font-semibold">
              {role} View
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-default-500 mt-1">
            Real-time clinical, operational, and financial activity for your facility.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {branches.length > 1 && (
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-default-400" />
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] h-9 text-xs font-medium">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-default-400" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => loadDashboard(true)}
            disabled={refreshing || loading}
            title="Refresh Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-primary" : "text-default-600"}`} />
          </Button>

          <Link href="/dashboard/reports">
            <Button className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-sm">
              <FileText className="h-4 w-4" />
              <span>Standard Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* BODY CONTENT */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 border border-default-200/60 shadow-sm">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-36 mb-2" />
                <Skeleton className="h-3 w-20" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6 border border-default-200/60 shadow-sm">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-[280px] w-full" />
            </Card>
            <Card className="p-6 border border-default-200/60 shadow-sm">
              <Skeleton className="h-6 w-36 mb-4" />
              <Skeleton className="h-[280px] w-full" />
            </Card>
          </div>
        </div>
      ) : role === "doctor" ? (
        <DoctorDashboardView content={content} />
      ) : role === "receptionist" ? (
        <ReceptionDashboardView content={content} />
      ) : role === "laboratory" ? (
        <LaboratoryDashboardView content={content} />
      ) : (
        <ExecutiveDashboardView 
          content={content} 
          revenueAnalytics={revenueAnalytics} 
          appointmentAnalytics={appointmentAnalytics} 
        />
      )}
    </div>
  );
}

function ExecutiveDashboardView({ content, revenueAnalytics, appointmentAnalytics }) {
  const cards = content?.summary_cards || {};
  const apptBreakdown = content?.appointments_breakdown || {};
  const topDoctors = content?.top_doctors || [];
  const paymentMethods = content?.payment_methods || [];

  const revGrowth = cards?.revenue_growth_pct || 0;
  const isPositiveGrowth = revGrowth >= 0;

  const revData = revenueAnalytics?.daily_revenue || [];

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Gross Revenue */}
        <Card className="border border-default-200/60 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Gross Billed Revenue</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-default-900">
                ৳{(cards?.total_revenue || 0).toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className={`inline-flex items-center font-semibold ${isPositiveGrowth ? "text-emerald-600" : "text-rose-600"}`}>
                {isPositiveGrowth ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                {Math.abs(revGrowth)}%
              </span>
              <span className="text-default-400">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Collected */}
        <Card className="border border-default-200/60 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Total Collected</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-default-900">
                ৳{(cards?.total_collected || 0).toLocaleString()}
              </h3>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-default-500">
              <span>Outstanding Due:</span>
              <span className="font-semibold text-amber-600">৳{(cards?.total_outstanding || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Appointments */}
        <Card className="border border-default-200/60 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Appointments & Visits</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-default-900">
                {cards?.total_appointments || 0}
              </h3>
              <span className="text-xs text-default-400">booked</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-default-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3 w-3" /> {cards?.completed_visits || 0} completed
              </span>
              <span>{cards?.completion_rate_pct ?? cards?.completion_rate ?? 0}% rate</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Patients & Lab */}
        <Card className="border border-default-200/60 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Patients & Diagnostics</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-default-900">
                {cards?.new_patients || 0}
              </h3>
              <span className="text-xs text-default-400">new registrations</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-default-500">
              <span className="flex items-center gap-1 text-purple-600 font-medium">
                <FlaskConical className="h-3 w-3" /> {cards?.total_lab_orders || 0} lab orders
              </span>
              <span>{cards?.completed_lab_orders || 0} released</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Trend Area Chart */}
        <Card className="lg:col-span-2 border border-default-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-default-900">
                Financial Revenue & Collections Trend
              </CardTitle>
              <CardDescription className="text-xs text-default-500">
                Daily comparison of gross billed amounts vs collected cash/MFS
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">৳ BDT</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-4">
              {revData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary, #3b82f6)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary, #3b82f6)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v}`} />
                    <Tooltip 
                      formatter={(val, name) => [`৳${Number(val).toLocaleString()}`, name === "invoiced" ? "Billed" : "Collected"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Area type="monotone" dataKey="invoiced" name="Gross Invoiced" stroke="var(--primary, #3b82f6)" strokeWidth={2} fillOpacity={1} fill="url(#colorInvoiced)" />
                    <Area type="monotone" dataKey="paid" name="Collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPaid)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-default-400">
                  <BarChart3 className="h-10 w-10 opacity-30 mb-2" />
                  <p className="text-xs">No revenue transactions recorded for this period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Status Breakdown */}
        <Card className="border border-default-200/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-default-900">
              Appointment Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-default-500">
              Patient booking fulfillment rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-default-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-default-700">Completed Visits</span>
                </div>
                <span className="text-sm font-bold text-default-900">{apptBreakdown?.completed || 0}</span>
              </div>

              <div className="flex items-center justify-between border-b border-default-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-default-700">Scheduled / Queue</span>
                </div>
                <span className="text-sm font-bold text-default-900">{apptBreakdown?.scheduled || 0}</span>
              </div>

              <div className="flex items-center justify-between border-b border-default-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-default-700">Checked-In / Waiting</span>
                </div>
                <span className="text-sm font-bold text-default-900">{apptBreakdown?.checked_in || 0}</span>
              </div>

              <div className="flex items-center justify-between border-b border-default-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-sm font-medium text-default-700">Cancelled Visits</span>
                </div>
                <span className="text-sm font-bold text-default-900">{apptBreakdown?.cancelled || 0}</span>
              </div>

              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-default-400" />
                  <span className="text-sm font-medium text-default-700">No-Shows</span>
                </div>
                <span className="text-sm font-bold text-default-900">{apptBreakdown?.no_show || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION: TOP DOCTORS & PAYMENT METHODS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Doctors */}
        <Card className="border border-default-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-default-900">
                Top Performing Doctors
              </CardTitle>
              <CardDescription className="text-xs text-default-500">
                Highest patient throughput for selected timeframe
              </CardDescription>
            </div>
            <Link href="/dashboard/staff/doctors" className="text-xs text-primary hover:underline flex items-center font-medium">
              View All <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {topDoctors.length > 0 ? (
              <div className="divide-y divide-default-100">
                {topDoctors.map((doc, idx) => (
                  <div key={doc.id || idx} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {(doc.name || "Dr").replace("Dr. ", "").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-default-900">{doc.name || "Doctor"}</p>
                        <p className="text-xs text-default-500">{doc.specialty || "General"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-default-900">{doc.completed_visits || 0} visits</p>
                      <p className="text-xs text-emerald-600 font-medium">৳{(doc.revenue_generated || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-default-400">
                No doctor consultations recorded in this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Channels Distribution */}
        <Card className="border border-default-200/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-default-900">
              Payment Collections by Method
            </CardTitle>
            <CardDescription className="text-xs text-default-500">
              Breakdown across Cash, Card, bKash, and Nagad channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethods.length > 0 ? (
              <div className="space-y-4 pt-2">
                {paymentMethods.map((pm, idx) => {
                  const total = paymentMethods.reduce((acc, curr) => acc + Number(curr.amount || curr.total || 0), 0) || 1;
                  const amount = Number(pm.amount || pm.total || 0);
                  const pct = Math.round((amount / total) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-default-700 capitalize">
                          {(pm.method || "Payment").replace("_", " ")} ({pm.count || 1} txns)
                        </span>
                        <span className="font-bold text-default-900">৳{amount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-default-100">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-default-400">
                No payment transactions recorded for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DoctorDashboardView({ content }) {
  const cards = content?.summary_cards || {};
  const queue = content?.today_queue || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Waiting Patients</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.waiting_patients || 0}</h3>
            <p className="mt-1 text-xs text-default-400">Checked-in outside chamber</p>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Completed Today</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.completed_today || 0}</h3>
            <p className="mt-1 text-xs text-default-400">Consultations finished</p>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Prescriptions Issued</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Pill className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.prescriptions_written || 0}</h3>
            <p className="mt-1 text-xs text-default-400">e-Prescriptions generated</p>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Revenue Share</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">৳{(cards?.estimated_earnings || 0).toLocaleString()}</h3>
            <p className="mt-1 text-xs text-default-400">Estimated share for period</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Queue */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-default-900">
              Live Consultation Queue
            </CardTitle>
            <CardDescription className="text-xs text-default-500">
              Patients currently in queue or checked in
            </CardDescription>
          </div>
          <Link href="/dashboard/scheduling/queue">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-primary">
              Full Queue View <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {queue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-default-50 text-default-600 border-y border-default-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Serial</th>
                    <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-3 font-semibold">MRN</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Time</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default-100">
                  {queue.map((pt) => (
                    <tr key={pt.id} className="hover:bg-default-50/50">
                      <td className="py-2.5 px-3 font-bold text-primary">#{pt.serial}</td>
                      <td className="py-2.5 px-3 font-medium text-default-900">{pt.patient_name}</td>
                      <td className="py-2.5 px-3 font-mono text-default-500">{pt.mrn}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={`text-[10px] uppercase font-semibold ${
                          pt.status === "checked_in" ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                          pt.status === "in_progress" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                          "bg-default-100 text-default-600"
                        }`}>
                          {pt.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-default-500">{pt.start_time || "—"}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Link href={`/dashboard/clinical/encounter?appointment_id=${pt.id}`}>
                          <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground">
                            Start Visit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-default-400">
              No patients waiting in queue today
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReceptionDashboardView({ content }) {
  const cards = content?.summary_cards || {};
  const drawer = content?.drawer_session || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Tokens Issued</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.tokens_issued || 0}</h3>
            <p className="mt-1 text-xs text-default-400">Checked-in at front desk</p>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Shift Cash Collections</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">৳{(cards?.cash_collected || 0).toLocaleString()}</h3>
            <p className="mt-1 text-xs text-default-400">Till physical cash</p>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Digital Collections</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">৳{(cards?.digital_collected || 0).toLocaleString()}</h3>
            <p className="mt-1 text-xs text-default-400">Card & MFS</p>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Cash Drawer Status</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-lg font-bold text-default-900 capitalize">{drawer?.status || "Closed"}</h3>
            <p className="mt-1 text-xs text-default-400">Float: ৳{(drawer?.opening_float || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/dashboard/reception/checkin">
          <Card className="hover:border-primary transition-all p-4 cursor-pointer">
            <h4 className="font-semibold text-default-900 text-sm">Front Desk Check-In</h4>
            <p className="text-xs text-default-500 mt-1">Issue token & verify patient registration</p>
          </Card>
        </Link>
        <Link href="/dashboard/reception/cash_drawer">
          <Card className="hover:border-primary transition-all p-4 cursor-pointer">
            <h4 className="font-semibold text-default-900 text-sm">Cash Drawer & Shift Close</h4>
            <p className="text-xs text-default-500 mt-1">Count cash, reconcile, and close session</p>
          </Card>
        </Link>
        <Link href="/dashboard/finance/invoices">
          <Card className="hover:border-primary transition-all p-4 cursor-pointer">
            <h4 className="font-semibold text-default-900 text-sm">Billing Counter</h4>
            <p className="text-xs text-default-500 mt-1">Create invoice & receive split payments</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function LaboratoryDashboardView({ content }) {
  const cards = content?.summary_cards || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Orders Received</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <FlaskConical className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.total_ordered || 0}</h3>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">In Processing</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.processing || 0}</h3>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Verified & Released</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.released || 0}</h3>
          </CardContent>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Critical Value Alerts</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-default-900">{cards?.critical_alerts || 0}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard/laboratory">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
            Open Laboratory Workstation
          </Button>
        </Link>
      </div>
    </div>
  );
}

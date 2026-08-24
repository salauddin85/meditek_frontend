"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    trialBalanceBalanced: true,
    totalRevenue: 0,
    totalReceivables: 0,
    totalInvoices: 0,
    openInvoices: 0,
    recentEntries: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [tbRes, invRes, glRes, pnlRes] = await Promise.all([
        financeApi.getTrialBalance(),
        financeApi.getInvoices(),
        financeApi.getDayBook(),
        financeApi.getProfitAndLoss({}),
      ]);

      const tb = tbRes.data?.data || {};
      const invs = invRes.data?.data?.results || invRes.data?.data || [];
      const dayBook = glRes.data?.data || {};
      const pnl = pnlRes.data?.data || {};

      const totalRev = pnl.total_revenue || 0;
      const openInvs = Array.isArray(invs) ? invs.filter((i) => i.status === "open" || i.status === "partially_paid") : [];
      const totalRec = openInvs.reduce((sum, i) => sum + parseFloat(i.balance || 0), 0);

      setStats({
        trialBalanceBalanced: tb.is_balanced ?? true,
        totalRevenue: totalRev,
        totalReceivables: totalRec,
        totalInvoices: Array.isArray(invs) ? invs.length : 0,
        openInvoices: openInvs.length,
        recentEntries: dayBook.entries || [],
      });
    } catch (err) {
      console.error("Error fetching finance dashboard data:", err);
      toast.error(err.userMessage || "Failed to load financial dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      title: "Invoice Workstation",
      desc: "Create invoices, record payments, process refunds, and issue credit notes.",
      href: "/dashboard/finance/invoices",
      icon: "heroicons:document-text",
      badge: `${stats.openInvoices} Pending`,
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "General Ledger",
      desc: "Inspect double-entry journal entries and debit/credit balanced postings.",
      href: "/dashboard/finance/reports/gl",
      icon: "heroicons:scale",
    },
    {
      title: "Profit & Loss",
      desc: "Review total service revenue vs operating expenses and net income.",
      href: "/dashboard/finance/reports/pnl",
      icon: "heroicons:chart-bar",
    },
    {
      title: "Balance Sheet",
      desc: "Assets, liabilities, equity, and retained earnings breakdown.",
      href: "/dashboard/finance/reports/balance-sheet",
      icon: "heroicons:building-library",
    },
    {
      title: "Aged Receivables",
      desc: "Track patient outstanding balances by 30, 60, and 90+ day aging buckets.",
      href: "/dashboard/finance/reports/aged-receivables",
      icon: "heroicons:clock",
    },
    {
      title: "Doctor Revenue Share",
      desc: "Configure share percentages and generate period payable statements.",
      href: "/dashboard/finance/revenue-share",
      icon: "heroicons:user-group",
    },
    {
      title: "Chart of Accounts",
      desc: "Healthcare double-entry chart of accounts (Asset, Liability, Equity, Revenue, Expense).",
      href: "/dashboard/finance/chart-of-accounts",
      icon: "heroicons:folder-open",
    },
    {
      title: "Charge Master Catalog",
      desc: "Manage service item prices, pricing tiers, and revenue account mappings.",
      href: "/dashboard/finance/service-items",
      icon: "heroicons:tag",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:banknotes" className="w-7 h-7 text-primary" />
            Financial Management & Double-Entry Ledger
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Module 13 — Enterprise SaaS multi-tenant double-entry general ledger, invoices, tiered pricing, and financial statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
            <Icon icon="heroicons:arrow-path" className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/dashboard/finance/invoices">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Trial Balance Health Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        stats.trialBalanceBalanced
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
          : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
      }`}>
        <div className="flex items-center gap-3">
          <Icon
            icon={stats.trialBalanceBalanced ? "heroicons:check-circle" : "heroicons:exclamation-triangle"}
            className="w-6 h-6 flex-none"
          />
          <div>
            <p className="font-semibold text-sm">
              {stats.trialBalanceBalanced
                ? "General Ledger Verified Balanced (Debit = Credit)"
                : "Trial Balance Imbalance Warning Detected"}
            </p>
            <p className="text-xs opacity-90">
              {stats.trialBalanceBalanced
                ? "All double-entry financial transactions comply strictly with FR-FIN-001 balance constraints."
                : "Please inspect the General Ledger report immediately."}
            </p>
          </div>
        </div>

        <Link href="/dashboard/finance/reports/gl">
          <Button size="sm" variant="ghost" className="text-xs">
            Inspect Ledger <Icon icon="heroicons:chevron-right" className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-bold text-default-900 mt-1">৳{stats.totalRevenue.toLocaleString()}</h3>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Icon icon="heroicons:arrow-trending-up" className="w-3.5 h-3.5" />
                  Derived from Ledger
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon="heroicons:currency-bangladeshi" className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Aged Receivables</p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  ৳{stats.totalReceivables.toLocaleString()}
                </h3>
                <p className="text-xs text-default-500 mt-1">{stats.openInvoices} Unpaid Invoices</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Icon icon="heroicons:clock" className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Total Invoices</p>
                <h3 className="text-2xl font-bold text-default-900 mt-1">{stats.totalInvoices}</h3>
                <p className="text-xs text-default-500 mt-1">Gap-free Sequential</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Icon icon="heroicons:document-text" className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-default-500 uppercase tracking-wider">Accounting Status</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Period Open</h3>
                <p className="text-xs text-default-500 mt-1">Double-Entry Active</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Icon icon="heroicons:lock-open" className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold text-default-900 mb-4">Financial Modules & Statements</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((mod, idx) => (
            <Link key={idx} href={mod.href} className="group">
              <Card className="h-full transition-all duration-200 group-hover:border-primary group-hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon icon={mod.icon} className="w-5 h-5" />
                    </div>
                    {mod.badge && (
                      <Badge variant="soft" className={mod.badgeColor || "bg-primary/10 text-primary"}>
                        {mod.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-semibold text-default-900 mt-3 group-hover:text-primary">
                    {mod.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-default-500 leading-relaxed">
                  {mod.desc}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

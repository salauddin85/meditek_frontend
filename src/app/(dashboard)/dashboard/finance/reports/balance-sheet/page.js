"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function BalanceSheetPage() {
  const [bs, setBs] = useState({
    as_of_date: "",
    assets: [],
    total_assets: 0,
    liabilities: [],
    total_liabilities: 0,
    equity: [],
    total_equity: 0,
    is_balanced: true,
  });
  const [loading, setLoading] = useState(true);
  const [atDate, setAtDate] = useState("");

  useEffect(() => {
    fetchBalanceSheet();
  }, [atDate]);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const params = {};
      if (atDate) params.at_date = atDate;

      const res = await financeApi.getBalanceSheet(params);
      setBs(res.data?.data || {});
    } catch (err) {
      console.error("Error fetching Balance Sheet:", err);
      toast.error(err.userMessage || "Failed to load Balance Sheet");
    } finally {
      setLoading(false);
    }
  };

  const isBalanced = bs.is_balanced ?? true;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:building-library" className="w-7 h-7 text-primary" />
            Balance Sheet (Financial Position)
          </h1>
          <p className="text-sm text-default-500 mt-1">
            FR-FIN-009 — Balance equation check: Assets = Liabilities + Owner's Equity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1 text-xs font-semibold ${
            isBalanced
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-red-500/10 text-red-600 border-red-500/20"
          }`}>
            {isBalanced ? "✓ BALANCE EQUATION VERIFIED" : "⚠ UNBALANCED"}
          </Badge>
          <Button onClick={() => window.print()} variant="outline" size="sm" className="print:hidden">
            <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Picker */}
      <Card className="print:hidden">
        <CardContent className="p-4 flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-default-700 mb-1">As of Date</label>
            <Input type="date" value={atDate} onChange={(e) => setAtDate(e.target.value)} />
          </div>
          <Button onClick={fetchBalanceSheet} className="mt-5 bg-primary text-primary-foreground">
            Generate Balance Sheet
          </Button>
        </CardContent>
      </Card>

      {/* Balance Sheet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ASSETS */}
        <Card>
          <CardHeader className="bg-emerald-500/5 border-b pb-3">
            <CardTitle className="text-base font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Icon icon="heroicons:circle-stack" className="w-5 h-5" />
              1. Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="divide-y">
              {bs.assets?.map((a, idx) => (
                <div key={idx} className="py-2.5 flex justify-between text-sm">
                  <span className="font-medium text-default-900">
                    <span className="font-mono text-xs text-default-400 mr-2">[{a.code}]</span>
                    {a.name}
                  </span>
                  <span className="font-semibold text-emerald-600">৳{parseFloat(a.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-emerald-500 pt-3 flex justify-between font-bold text-base text-emerald-800 dark:text-emerald-200">
              <span>Total Assets</span>
              <span>৳{parseFloat(bs.total_assets || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* LIABILITIES & EQUITY */}
        <div className="space-y-6">
          {/* LIABILITIES */}
          <Card>
            <CardHeader className="bg-amber-500/5 border-b pb-3">
              <CardTitle className="text-base font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Icon icon="heroicons:credit-card" className="w-5 h-5" />
                2. Liabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="divide-y">
                {bs.liabilities?.map((l, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between text-sm">
                    <span className="font-medium text-default-900">
                      <span className="font-mono text-xs text-default-400 mr-2">[{l.code}]</span>
                      {l.name}
                    </span>
                    <span className="font-semibold text-amber-600">৳{parseFloat(l.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-sm text-amber-800 dark:text-amber-200">
                <span>Total Liabilities</span>
                <span>৳{parseFloat(bs.total_liabilities || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* EQUITY */}
          <Card>
            <CardHeader className="bg-blue-500/5 border-b pb-3">
              <CardTitle className="text-base font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Icon icon="heroicons:user-group" className="w-5 h-5" />
                3. Owner Equity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="divide-y">
                {bs.equity?.map((e, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between text-sm">
                    <span className="font-medium text-default-900">
                      <span className="font-mono text-xs text-default-400 mr-2">[{e.code}]</span>
                      {e.name}
                    </span>
                    <span className="font-semibold text-blue-600">৳{parseFloat(e.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-sm text-blue-800 dark:text-blue-200">
                <span>Total Equity</span>
                <span>৳{parseFloat(bs.total_equity || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Liabilities + Equity Summary Box */}
          <div className="p-4 rounded-xl border bg-default-100 flex justify-between items-center text-base font-bold text-default-900">
            <span>Total Liabilities & Equity</span>
            <span>৳{(parseFloat(bs.total_liabilities || 0) + parseFloat(bs.total_equity || 0)).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

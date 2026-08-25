"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function ProfitAndLossPage() {
  const [pnl, setPnl] = useState({
    period_start: "",
    period_end: "",
    revenues: [],
    total_revenue: 0,
    expenses: [],
    total_expense: 0,
    net_profit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchPnL();
  }, [startDate, endDate]);

  const fetchPnL = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await financeApi.getProfitAndLoss(params);
      setPnl(res.data?.data || {});
    } catch (err) {
      console.error("Error fetching P&L:", err);
      toast.error(err.userMessage || "Failed to load Profit & Loss statement");
    } finally {
      setLoading(false);
    }
  };

  const netProfit = parseFloat(pnl.net_profit || 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:chart-bar" className="w-7 h-7 text-primary" />
            Profit & Loss Statement (Income Statement)
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Derived strictly from double-entry revenue and expense ledger accounts.
          </p>
        </div>

        <Button onClick={() => window.print()} variant="outline" size="sm" className="print:hidden">
          <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
          Print Statement
        </Button>
      </div>

      {/* Date Range Picker */}
      <Card className="print:hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-default-700 mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-default-700 mb-1">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <Button onClick={fetchPnL} className="mt-5 bg-primary text-primary-foreground">
            Calculate P&L
          </Button>
        </CardContent>
      </Card>

      {/* Net Income Highlight Card */}
      <div className={`p-6 rounded-xl border flex items-center justify-between ${
        netProfit >= 0
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
          : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
      }`}>
        <div>
          <p className="text-xs uppercase font-semibold tracking-wider opacity-80">
            {netProfit >= 0 ? "Net Operating Profit" : "Net Operating Loss"}
          </p>
          <h2 className="text-3xl font-bold mt-1">৳{netProfit.toLocaleString()}</h2>
          <p className="text-xs opacity-90 mt-1">Period: {pnl.period_start} to {pnl.period_end}</p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center shadow">
          <Icon
            icon={netProfit >= 0 ? "heroicons:arrow-trending-up" : "heroicons:arrow-trending-down"}
            className={`w-8 h-8 ${netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}
          />
        </div>
      </div>

      {/* Statement Details Card */}
      <Card>
        <CardContent className="p-8 space-y-6">
          {/* Revenue Section */}
          <div>
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide border-b pb-2 flex items-center gap-2">
              <Icon icon="heroicons:arrow-down-left" className="w-5 h-5" />
              Operating Revenues
            </h3>

            <div className="divide-y my-3">
              {pnl.revenues?.map((rev, idx) => (
                <div key={idx} className="py-2.5 flex justify-between text-sm">
                  <span className="font-medium text-default-900">
                    <span className="font-mono text-xs text-default-400 mr-2">[{rev.code}]</span>
                    {rev.name}
                  </span>
                  <span className="font-semibold text-emerald-600">৳{parseFloat(rev.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-base text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-3 rounded-lg">
              <span>Total Operating Revenue</span>
              <span>৳{parseFloat(pnl.total_revenue || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h3 className="text-base font-bold text-red-600 dark:text-red-400 uppercase tracking-wide border-b pb-2 flex items-center gap-2">
              <Icon icon="heroicons:arrow-up-right" className="w-5 h-5" />
              Operating Expenses
            </h3>

            <div className="divide-y my-3">
              {pnl.expenses?.map((exp, idx) => (
                <div key={idx} className="py-2.5 flex justify-between text-sm">
                  <span className="font-medium text-default-900">
                    <span className="font-mono text-xs text-default-400 mr-2">[{exp.code}]</span>
                    {exp.name}
                  </span>
                  <span className="font-semibold text-red-600">৳{parseFloat(exp.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-base text-red-700 dark:text-red-300 bg-red-500/10 p-3 rounded-lg">
              <span>Total Operating Expense</span>
              <span>৳{parseFloat(pnl.total_expense || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Bottom Net Line */}
          <div className="border-t-2 border-default-900 pt-4 flex justify-between items-center text-lg font-bold text-default-900">
            <span>Net Operating Income</span>
            <span className={netProfit >= 0 ? "text-emerald-600" : "text-red-600"}>
              ৳{netProfit.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

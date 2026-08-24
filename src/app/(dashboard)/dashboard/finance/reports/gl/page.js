"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function GeneralLedgerPage() {
  const [lines, setLines] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchGL();
  }, [startDate, endDate, selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const res = await financeApi.getChartOfAccounts();
      setAccounts(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  const fetchGL = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedAccount) params.account_id = selectedAccount;

      const res = await financeApi.getGeneralLedger(params);
      const data = res.data?.data || [];
      setLines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching General Ledger:", err);
      toast.error(err.userMessage || "Failed to load General Ledger entries");
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = lines.reduce((sum, l) => sum + parseFloat(l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + parseFloat(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:scale" className="w-7 h-7 text-primary" />
            General Ledger (Double-Entry Register)
          </h1>
          <p className="text-sm text-default-500 mt-1">
            FR-FIN-001 & FR-FIN-013 — Append-only double-entry transaction record. All dashboard metrics derive from these balanced lines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1 text-xs font-semibold ${
            isBalanced
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-red-500/10 text-red-600 border-red-500/20"
          }`}>
            {isBalanced ? "✓ BALANCED (DEBIT = CREDIT)" : "⚠ UNBALANCED LEDGER"}
          </Badge>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-default-700 mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-default-700 mb-1">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-default-700 mb-1">Filter by Account</label>
            <select
              className="w-full text-sm p-2 rounded border bg-card"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="">All Accounts...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.account_type})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Totals Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Total Ledger Debit</p>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">৳{totalDebit.toLocaleString()}</h3>
            </div>
            <Icon icon="heroicons:arrow-down-left" className="w-8 h-8 text-emerald-500" />
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Ledger Credit</p>
              <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300">৳{totalCredit.toLocaleString()}</h3>
            </div>
            <Icon icon="heroicons:arrow-up-right" className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Ledger Lines ({lines.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-default-500">
              <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading General Ledger lines...
            </div>
          ) : lines.length === 0 ? (
            <div className="p-12 text-center text-default-500">
              No journal lines found for selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-default-100 text-default-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Account Code & Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Debit (৳)</th>
                    <th className="p-3 text-right">Credit (৳)</th>
                    <th className="p-3">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((line, idx) => (
                    <tr key={line.line_id || idx} className="hover:bg-default-50 transition-colors">
                      <td className="p-3 text-default-600">{line.date}</td>
                      <td className="p-3 font-mono font-semibold text-primary">{line.reference}</td>
                      <td className="p-3 capitalize">
                        <Badge variant="soft" className="text-xs">{line.source_type}</Badge>
                      </td>
                      <td className="p-3 font-medium text-default-900">
                        <span className="font-mono text-xs text-default-500 mr-2">[{line.account_code}]</span>
                        {line.account_name}
                      </td>
                      <td className="p-3 text-default-600 max-w-xs truncate">{line.description}</td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                        {parseFloat(line.debit) > 0 ? `৳${parseFloat(line.debit).toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-blue-600">
                        {parseFloat(line.credit) > 0 ? `৳${parseFloat(line.credit).toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 text-xs text-default-500">{line.branch_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

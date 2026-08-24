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

export default function AgedReceivablesPage() {
  const [report, setReport] = useState({
    as_of_date: "",
    summary: {
      current: 0,
      "1_30": 0,
      "31_60": 0,
      "61_90": 0,
      "90_plus": 0,
      total: 0,
    },
    invoices: [],
  });
  const [loading, setLoading] = useState(true);
  const [atDate, setAtDate] = useState("");

  useEffect(() => {
    fetchAgedReceivables();
  }, [atDate]);

  const fetchAgedReceivables = async () => {
    setLoading(true);
    try {
      const params = {};
      if (atDate) params.at_date = atDate;

      const res = await financeApi.getAgedReceivables(params);
      setReport(res.data?.data || {});
    } catch (err) {
      console.error("Error fetching Aged Receivables:", err);
      toast.error(err.userMessage || "Failed to load Aged Receivables");
    } finally {
      setLoading(false);
    }
  };

  const sum = report.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:clock" className="w-7 h-7 text-primary" />
            Aged Receivables Report
          </h1>
          <p className="text-sm text-default-500 mt-1">
            FR-FIN-009 — Patient outstanding balances categorized by overdue age buckets.
          </p>
        </div>

        <Button onClick={() => window.print()} variant="outline" size="sm" className="print:hidden">
          <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Date Picker */}
      <Card className="print:hidden">
        <CardContent className="p-4 flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-default-700 mb-1">As of Date</label>
            <Input type="date" value={atDate} onChange={(e) => setAtDate(e.target.value)} />
          </div>
          <Button onClick={fetchAgedReceivables} className="mt-5 bg-primary text-primary-foreground">
            Calculate Aging
          </Button>
        </CardContent>
      </Card>

      {/* Aging Buckets Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-semibold uppercase text-emerald-600">Current (0 Days)</p>
            <p className="text-lg font-bold text-emerald-700 mt-1">৳{parseFloat(sum.current || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-semibold uppercase text-blue-600">1 – 30 Days</p>
            <p className="text-lg font-bold text-blue-700 mt-1">৳{parseFloat(sum["1_30"] || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-semibold uppercase text-amber-600">31 – 60 Days</p>
            <p className="text-lg font-bold text-amber-700 mt-1">৳{parseFloat(sum["31_60"] || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-semibold uppercase text-orange-600">61 – 90 Days</p>
            <p className="text-lg font-bold text-orange-700 mt-1">৳{parseFloat(sum["61_90"] || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-semibold uppercase text-red-600">90+ Days</p>
            <p className="text-lg font-bold text-red-700 mt-1">৳{parseFloat(sum["90_plus"] || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-[11px] font-semibold uppercase text-primary">Total Receivables</p>
            <p className="text-lg font-bold text-primary mt-1">৳{parseFloat(sum.total || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Invoices Aging Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Outstanding Patient Invoices ({report.invoices?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-default-500">
              <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2" />
              Calculating aged receivables...
            </div>
          ) : !report.invoices || report.invoices.length === 0 ? (
            <div className="p-12 text-center text-default-500">
              No outstanding receivables found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-default-100 text-default-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3 text-center">Overdue Days</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-right">Balance Due</th>
                    <th className="p-3">Aging Bucket</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.invoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-default-50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{inv.invoice_number}</td>
                      <td className="p-3">
                        <p className="font-medium text-default-900">{inv.patient_name}</p>
                        <p className="text-xs text-default-400">MRN: {inv.mrn}</p>
                      </td>
                      <td className="p-3 text-default-600">{inv.invoice_date}</td>
                      <td className="p-3 text-center font-bold text-amber-600">{inv.days_overdue} Days</td>
                      <td className="p-3 text-right">৳{parseFloat(inv.total_amount).toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-red-600">৳{parseFloat(inv.balance).toLocaleString()}</td>
                      <td className="p-3 capitalize">
                        <Badge variant="soft" className="text-xs">
                          {inv.bucket.replace("_", " ")}
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
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Wallet,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  History,
  FileText,
  User,
  Clock,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

import { receptionApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function safeFormatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return format(d, "dd/MM/yyyy hh:mm a");
  } catch {
    return "—";
  }
}

function safeAmount(val) {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = parseFloat(val);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

export default function CashDrawerSessionDetailPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessionDetail() {
      if (!sessionId) return;
      setLoading(true);
      try {
        const res = await receptionApi.getDrawerSessionDetail(sessionId);
        if (res.data?.data) {
          setSession(res.data.data);
        } else {
          setSession(null);
        }
      } catch {
        toast.error("Failed to load session details.");
      } finally {
        setLoading(false);
      }
    }
    loadSessionDetail();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-default-400 max-w-5xl mx-auto space-y-3">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
        <p className="text-xs font-bold">Loading cash drawer session logs...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <Wallet className="w-12 h-12 text-default-300 mx-auto" />
        <h2 className="text-lg font-bold text-default-800">Cash Drawer Session Not Found</h2>
        <p className="text-xs text-default-500">The requested session record does not exist or has been deleted.</p>
        <Link href="/dashboard/reception/cash_drawer">
          <Button variant="outline" className="font-bold gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Cash Drawer Manager
          </Button>
        </Link>
      </div>
    );
  }

  const varianceNum = session.variance !== null && session.variance !== undefined ? parseFloat(session.variance) : NaN;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Link
        href="/dashboard/reception/cash_drawer"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cash Drawer Manager
      </Link>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-default-900 tracking-tight flex items-center gap-2">
              <Wallet className="w-6 h-6 text-indigo-600" />
              Cash Drawer Session Audit Details
            </h1>
            <Badge
              color={
                session.status === "open"
                  ? "success"
                  : session.status === "approved"
                  ? "primary"
                  : session.status === "disputed"
                  ? "destructive"
                  : "secondary"
              }
              className="text-xs uppercase font-extrabold px-2.5 py-0.5"
            >
              {session.status}
            </Badge>
          </div>
          <p className="text-xs text-default-500 font-mono mt-1">
            Session ID: {session.id} · Branch: {session.branch_name || "—"}
          </p>
        </div>

        <div className="text-xs font-mono text-default-500 space-y-0.5 text-right">
          <div>Opened: <span className="font-bold text-default-800">{safeFormatDate(session.opened_at)}</span></div>
          <div>Closed: <span className="font-bold text-default-800">{safeFormatDate(session.closed_at)}</span></div>
        </div>
      </div>

      {/* Financial Overview Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <span className="text-[10px] uppercase font-bold text-default-500 block">Opening Float</span>
            <span className="font-mono font-extrabold text-xl text-default-900 mt-1 block">
              ৳{safeAmount(session.opening_float)}
            </span>
            <span className="text-[10px] text-default-400 mt-1 block">Cashier: {session.cashier_name || "—"}</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block">Expected Cash Balance</span>
            <span className="font-mono font-black text-xl text-indigo-700 mt-1 block">
              ৳{safeAmount(session.expected_cash)}
            </span>
            <span className="text-[10px] text-default-400 mt-1 block">Float + Cash In - Cash Out</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <span className="text-[10px] uppercase font-bold text-default-500 block">Physical Counted Cash</span>
            <span className="font-mono font-extrabold text-xl text-default-900 mt-1 block">
              {session.counted_cash !== null && session.counted_cash !== undefined ? `৳${safeAmount(session.counted_cash)}` : "—"}
            </span>
            <span className="text-[10px] text-default-400 mt-1 block">Closed By: {session.closed_by_name || "—"}</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <span className="text-[10px] uppercase font-bold text-default-500 block">Reconciliation Variance</span>
            <span className="font-mono font-black text-xl mt-1 block">
              {!isNaN(varianceNum) ? (
                <span className={varianceNum < 0 ? "text-rose-600" : varianceNum > 0 ? "text-emerald-600" : "text-default-600"}>
                  {varianceNum > 0 ? "+" : ""}৳{safeAmount(session.variance)}
                </span>
              ) : (
                "—"
              )}
            </span>
            <span className="text-[10px] text-default-400 mt-1 block">
              {session.status === "disputed" ? "Requires Supervisor Audit" : "Reconciled Cleanly"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Supervisor Audit Note (if approved/disputed) */}
      {(session.supervisor_name || session.supervisor_note) && (
        <Card className="border-2 border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-indigo-900 uppercase tracking-wider block text-[10px]">
                Supervisor Audit & Approval
              </span>
              <p className="font-medium text-default-800">
                "{session.supervisor_note || "Approved by supervisor after variance inspection."}"
              </p>
              <p className="text-[10px] text-default-500 font-mono">
                Approved by {session.supervisor_name || "Supervisor"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Audit Log Table */}
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="border-b border-border py-4 px-6">
          <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Session Transactions Audit Feed ({session.transactions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!session.transactions || session.transactions.length === 0 ? (
            <div className="py-16 text-center text-default-400 text-xs">No transactions recorded in this session.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-default-50 text-default-700 font-bold border-b border-border uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 pl-6">Timestamp</th>
                    <th className="p-3">Transaction Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Recorded By</th>
                    <th className="p-3 text-right pr-6">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {session.transactions.map((tx) => {
                    const isIn = tx.transaction_type && tx.transaction_type.includes("in");
                    return (
                      <tr key={tx.id} className="hover:bg-default-50 transition-colors">
                        <td className="p-3 pl-6 font-mono text-default-700 font-bold">
                          {safeFormatDate(tx.recorded_at)}
                        </td>
                        <td className="p-3">
                          <Badge
                            color={isIn ? "success" : "destructive"}
                            className="text-[9px] uppercase font-bold"
                          >
                            {tx.transaction_type}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold text-default-900">
                          {tx.description || "Cash Transaction"}
                        </td>
                        <td className="p-3 text-default-600">
                          {tx.recorded_by_name || session.cashier_name || "—"}
                        </td>
                        <td className={`p-3 text-right pr-6 font-mono font-black text-sm ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIn ? "+" : "-"}৳{safeAmount(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

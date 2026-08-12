"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Wallet,
  Plus,
  Lock,
  ArrowRightLeft,
  Loader2,
  ArrowLeft,
  X,
  History,
  ShieldCheck,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

import { receptionApi, branchesApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function extractSessionObject(data) {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    return data.length > 0 ? extractSessionObject(data[0]) : null;
  }
  if (data.results && Array.isArray(data.results)) {
    return data.results.length > 0 ? extractSessionObject(data.results[0]) : null;
  }
  if (data.session) {
    return extractSessionObject(data.session);
  }
  // Must contain a valid session ID to be considered an active session
  if (!data.id && !data.pk && !data.uuid && !data.session_id) {
    return null;
  }
  return data;
}

function extractSessionId(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) {
    const first = obj[0];
    return first?.id || first?.pk || first?.uuid || null;
  }
  return obj.id || obj.pk || obj.uuid || obj.session_id || null;
}

export default function CashDrawerPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("1000");
  const [opening, setOpening] = useState(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closing, setClosing] = useState(false);

  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState("float_in");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [recordingTx, setRecordingTx] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [disputedSession, setDisputedSession] = useState(null);
  const [supervisorNote, setSupervisorNote] = useState("Approved after physical count audit.");
  const [approving, setApproving] = useState(false);

  // Fetch branches on mount
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

  // Fetch active session & history
  const fetchDrawerData = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        receptionApi.getActiveDrawer({ branch_id: selectedBranchId || undefined }),
        receptionApi.getDrawerSessions({ branch_id: selectedBranchId || undefined }),
      ]);

      const rawActive = activeRes.data?.data;
      const parsedSession = extractSessionObject(rawActive);
      setActiveSession(parsedSession);

      const rawHistory = historyRes.data?.data;
      if (Array.isArray(rawHistory)) {
        setSessionHistory(rawHistory);
      } else if (rawHistory?.results && Array.isArray(rawHistory.results)) {
        setSessionHistory(rawHistory.results);
      } else {
        setSessionHistory([]);
      }
    } catch {
      toast.error("Failed to load cash drawer details.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchDrawerData();
  }, [fetchDrawerData]);

  // Open Drawer Handler
  const handleOpenDrawer = async (e) => {
    e.preventDefault();
    if (!selectedBranchId) return toast.error("Please select a branch.");
    setOpening(true);
    try {
      const res = await receptionApi.openDrawer({
        branch_id: selectedBranchId,
        opening_float: parseFloat(openingFloat || "0"),
      });
      toast.success("Cash drawer session opened.");
      const sess = extractSessionObject(res.data?.data);
      if (sess) {
        setActiveSession(sess);
      }
      setShowOpenModal(false);
      fetchDrawerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to open drawer session.");
    } finally {
      setOpening(false);
    }
  };

  // Close Drawer Handler
  const handleCloseDrawer = async (e) => {
    e.preventDefault();
    const sessionId = extractSessionId(activeSession);
    if (!sessionId) return toast.error("No active session ID found. Please open a cash drawer session first.");
    if (!countedCash.trim()) return toast.error("Please enter counted cash.");
    setClosing(true);
    try {
      const res = await receptionApi.closeDrawer(sessionId, {
        counted_cash: parseFloat(countedCash),
      });
      toast.success(res.data?.message || "Drawer session closed.");
      setShowCloseModal(false);
      setCountedCash("");
      fetchDrawerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to close drawer.");
    } finally {
      setClosing(false);
    }
  };

  // Transaction Record Handler
  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    const sessionId = extractSessionId(activeSession);
    if (!sessionId) return toast.error("No active session ID found. Please open a cash drawer session first.");
    if (!txAmount || parseFloat(txAmount) <= 0) return toast.error("Enter valid amount.");
    setRecordingTx(true);
    try {
      await receptionApi.recordDrawerTransaction(sessionId, {
        transaction_type: txType,
        amount: parseFloat(txAmount),
        description: txDescription.trim() || undefined,
      });
      toast.success("Transaction recorded.");
      setShowTxModal(false);
      setTxAmount("");
      setTxDescription("");
      fetchDrawerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record transaction.");
    } finally {
      setRecordingTx(false);
    }
  };

  // Supervisor Approval Handler
  const handleApproveDispute = async (e) => {
    e.preventDefault();
    const sessionId = extractSessionId(disputedSession);
    if (!sessionId) return toast.error("No session ID found for approval.");
    setApproving(true);
    try {
      await receptionApi.approveDrawerVariance(sessionId, {
        supervisor_note: supervisorNote,
      });
      toast.success("Disputed drawer approved by supervisor.");
      setShowApproveModal(false);
      setDisputedSession(null);
      fetchDrawerData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Link
        href="/dashboard/reception"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Reception Command Center
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            Cash Drawer Session Manager
          </h1>
          <p className="text-xs text-default-500 mt-1">
            Opening float, cash transactions, physical count reconciliation, and supervisor audit gate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {activeSession ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTxModal(true)}
                className="h-10 font-bold gap-2"
              >
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> Float In / Out
              </Button>
              <Button
                onClick={() => setShowCloseModal(true)}
                className="h-10 font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Lock className="w-4 h-4" /> Close & Reconcile Drawer
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowOpenModal(true)} className="h-10 font-bold gap-2">
              <Plus className="w-4 h-4" /> Open Drawer Session
            </Button>
          )}
        </div>
      </div>

      {/* Active Session Highlight Banner */}
      {activeSession ? (
        <Card className="border-2 border-indigo-500/30 bg-indigo-50/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/30">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-default-900 text-lg">
                      Active Cash Drawer Session
                    </h3>
                    <Badge color="success" className="text-xs uppercase font-extrabold px-2.5 py-0.5">
                      Open
                    </Badge>
                  </div>
                  <p className="text-xs text-default-500 font-mono mt-0.5">
                    Cashier: {activeSession.cashier_name || "—"} · Opened at {safeFormatDate(activeSession.opened_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-default-500 block">Opening Float</span>
                  <span className="font-mono font-bold text-default-900 text-sm">৳{safeAmount(activeSession.opening_float)}</span>
                </div>
                <div className="h-8 w-px bg-indigo-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Expected Cash Balance</span>
                  <span className="font-mono font-black text-2xl text-indigo-700">৳{safeAmount(activeSession.expected_cash)}</span>
                </div>
              </div>
            </div>

            {/* Active Session Transactions Feed */}
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-bold text-default-700 uppercase tracking-wider">
                Session Transactions Log ({activeSession.transactions?.length || 0})
              </h4>
              {!activeSession.transactions || activeSession.transactions.length === 0 ? (
                <p className="text-xs text-default-400 font-medium">No transactions recorded yet in this session.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-default-200 rounded-xl p-2 bg-card">
                  {activeSession.transactions.map((tx) => {
                    const isIn = tx.transaction_type && tx.transaction_type.includes("in");
                    return (
                      <div key={tx.id} className="p-2 rounded-lg bg-default-50 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Badge
                            color={isIn ? "success" : "destructive"}
                            className="text-[9px] uppercase font-bold px-1.5"
                          >
                            {tx.transaction_type}
                          </Badge>
                          <span className="font-bold text-default-800">{tx.description || "Cash Transaction"}</span>
                        </div>
                        <span className={`font-black ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIn ? "+" : "-"}৳{safeAmount(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-default-300 py-12 text-center space-y-3">
          <Wallet className="w-12 h-12 text-default-300 mx-auto" />
          <h3 className="text-base font-bold text-default-800">No Active Cash Drawer Session</h3>
          <p className="text-xs text-default-500 max-w-sm mx-auto">
            You must open a cash drawer session to begin receiving cash consultation payments or issuing cash float.
          </p>
          <Button onClick={() => setShowOpenModal(true)} className="font-bold gap-2">
            <Plus className="w-4 h-4" /> Open Drawer Session Now
          </Button>
        </Card>
      )}

      {/* Historical Sessions Table */}
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="border-b border-border py-4 px-6">
          <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Cash Drawer Sessions History ({sessionHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-default-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-xs font-bold">Loading drawer sessions history...</p>
            </div>
          ) : sessionHistory.length === 0 ? (
            <div className="py-16 text-center text-default-400 text-xs">No drawer sessions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-default-50 text-default-700 font-bold border-b border-border uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 pl-6">Opened At</th>
                    <th className="p-3">Cashier</th>
                    <th className="p-3 font-mono">Opening Float</th>
                    <th className="p-3 font-mono">Expected Cash</th>
                    <th className="p-3 font-mono">Counted Cash</th>
                    <th className="p-3 font-mono">Variance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right pr-6">Supervisor Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {sessionHistory.map((s) => {
                    const varianceNum = s.variance !== null && s.variance !== undefined ? parseFloat(s.variance) : NaN;
                    const isDisputed = s.status === "disputed";
                    const isOpen = s.status === "open";
                    const isApproved = s.status === "approved";

                    return (
                      <tr key={s.id} className="hover:bg-default-50 transition-colors">
                        <td className="p-3 pl-6 font-mono text-default-800 font-bold">
                          {safeFormatDate(s.opened_at)}
                        </td>
                        <td className="p-3 font-semibold text-default-900">{s.cashier_name || "—"}</td>
                        <td className="p-3 font-mono">৳{safeAmount(s.opening_float)}</td>
                        <td className="p-3 font-mono font-bold text-default-900">৳{safeAmount(s.expected_cash)}</td>
                        <td className="p-3 font-mono text-default-700">
                          {s.counted_cash !== null && s.counted_cash !== undefined ? `৳${safeAmount(s.counted_cash)}` : "—"}
                        </td>
                        <td className="p-3 font-mono">
                          {!isNaN(varianceNum) ? (
                            <span className={`font-bold ${varianceNum < 0 ? "text-rose-600" : varianceNum > 0 ? "text-emerald-600" : "text-default-600"}`}>
                              {varianceNum > 0 ? "+" : ""}৳{safeAmount(s.variance)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            color={isOpen ? "success" : isApproved ? "primary" : isDisputed ? "destructive" : "secondary"}
                            className="text-[10px] uppercase font-bold"
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/reception/cash_drawer/${s.id}`}>
                              <Button size="xs" variant="outline" className="font-bold gap-1">
                                <FileText className="w-3.5 h-3.5" /> View Details
                              </Button>
                            </Link>

                            {isDisputed && (
                              <Button
                                size="xs"
                                color="destructive"
                                onClick={() => {
                                  setDisputedSession(s);
                                  setShowApproveModal(true);
                                }}
                                className="font-bold gap-1"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" /> Approve Dispute
                              </Button>
                            )}
                          </div>
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

      {/* ── Modal 1: Open Cash Drawer ────────────────────── */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-default-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" /> Open Cash Drawer Session
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="text-default-400 hover:text-default-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenDrawer} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-default-700">Opening Float Amount (BDT)</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000.00"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    className="font-mono text-lg pl-9"
                    required
                  />
                  <span className="absolute left-3 top-3 font-bold text-default-400">৳</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" type="button" onClick={() => setShowOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={opening} className="font-bold gap-2">
                  {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : "Open Drawer Session"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Close Cash Drawer & Physical Count ────── */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-default-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" /> Close & Reconcile Drawer
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-default-400 hover:text-default-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-default-50 rounded-xl p-3 text-xs space-y-1 font-mono border border-default-200">
              <div className="flex justify-between">
                <span className="text-default-500">Expected Cash Balance:</span>
                <span className="font-bold text-primary text-sm">৳{safeAmount(activeSession.expected_cash)}</span>
              </div>
              <p className="text-[10px] text-default-400 mt-1">
                Enter your physical cash count. Variance &gt; ৳200 requires supervisor approval.
              </p>
            </div>

            <form onSubmit={handleCloseDrawer} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-default-700">Physical Cash Counted (BDT) *</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter physical cash count..."
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="font-mono text-lg pl-9"
                    required
                  />
                  <span className="absolute left-3 top-3 font-bold text-default-400">৳</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" type="button" onClick={() => setShowCloseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={closing} className="font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white">
                  {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Close & Reconcile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Float In / Out Transaction ──────────── */}
      {showTxModal && activeSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-default-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Record Float In / Out
              </h3>
              <button onClick={() => setShowTxModal(false)} className="text-default-400 hover:text-default-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-default-700">Transaction Type *</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-default-200 bg-background text-sm font-medium"
                >
                  <option value="float_in">Float In (Add Cash to Drawer)</option>
                  <option value="float_out">Float Out (Remove Cash from Drawer)</option>
                  <option value="in">Manual Cash In</option>
                  <option value="out">Manual Cash Out</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-default-700">Amount (BDT) *</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="font-mono text-base pl-9"
                    required
                  />
                  <span className="absolute left-3 top-2.5 font-bold text-default-400">৳</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-default-700">Description / Reason</label>
                <Input
                  placeholder="e.g. Added petty cash float"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" type="button" onClick={() => setShowTxModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={recordingTx} className="font-bold gap-2">
                  {recordingTx ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Transaction"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 4: Supervisor Variance Approval Gate ───── */}
      {showApproveModal && disputedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-default-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-600" /> Supervisor Variance Approval
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="text-default-400 hover:text-default-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-default-600">Cashier:</span>
                <span className="font-bold text-default-900">{disputedSession.cashier_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-600">Expected:</span>
                <span className="font-bold text-default-900">৳{safeAmount(disputedSession.expected_cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-600">Counted:</span>
                <span className="font-bold text-default-900">৳{safeAmount(disputedSession.counted_cash)}</span>
              </div>
              <div className="flex justify-between border-t border-rose-200 pt-1">
                <span className="text-rose-700 font-bold">Variance:</span>
                <span className="font-black text-rose-600 text-sm">৳{safeAmount(disputedSession.variance)}</span>
              </div>
            </div>

            <form onSubmit={handleApproveDispute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-default-700">Supervisor Note *</label>
                <Input
                  placeholder="Enter audit approval reason..."
                  value={supervisorNote}
                  onChange={(e) => setSupervisorNote(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" type="button" onClick={() => setShowApproveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={approving} className="font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white">
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve Disputed Session"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

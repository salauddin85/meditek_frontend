"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Loader2,
  ArrowLeft,
  Building2,
  Wallet,
  DollarSign,
  User,
  AlertTriangle,
  Receipt,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { receptionApi, branchesApi, schedulingApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SplitPaymentCounterContent() {
  const searchParams = useSearchParams();
  const initialApptId = searchParams.get("appointment_id");

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Dynamic splits builder state
  const [splits, setSplits] = useState([
    { payment_method: "cash", amount: "", reference_number: "", insurer_name: "" },
  ]);
  const [processing, setProcessing] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

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

  // Fetch today's appointments for payment processing
  const fetchAppointments = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoadingAppts(true);
    try {
      const res = await schedulingApi.getAppointments({
        branch_id: selectedBranchId,
        date_from: format(new Date(), "yyyy-MM-dd"),
        date_to: format(new Date(), "yyyy-MM-dd"),
      });
      if (res.data?.data) {
        const apptsList = res.data.data;
        setAppointments(apptsList);

        // Auto select target appointment from URL query parameter
        if (initialApptId) {
          const match = apptsList.find((a) => a.id === initialApptId);
          if (match) {
            handleSelectAppointment(match);
          }
        }
      }
    } catch {
      toast.error("Failed to load today's appointments.");
    } finally {
      setLoadingAppts(false);
    }
  }, [selectedBranchId, initialApptId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // When appointment is selected, pre-fill first split amount with consult fee
  const handleSelectAppointment = (appt) => {
    setSelectedAppt(appt);
    const fee = parseFloat(appt.consult_fee || "0");
    setSplits([
      { payment_method: "cash", amount: fee > 0 ? fee.toString() : "", reference_number: "", insurer_name: "" },
    ]);
  };

  // Add new split row
  const handleAddSplitRow = () => {
    setSplits([
      ...splits,
      { payment_method: "bkash", amount: "", reference_number: "", insurer_name: "" },
    ]);
  };

  // Remove split row
  const handleRemoveSplitRow = (index) => {
    if (splits.length === 1) return toast.error("At least one payment method split is required.");
    setSplits(splits.filter((_, i) => i !== index));
  };

  // Update split row field
  const handleUpdateSplit = (index, field, value) => {
    const updated = [...splits];
    updated[index][field] = value;
    setSplits(updated);
  };

  // Total calculated split sum
  const totalSplitAmount = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const targetFee = selectedAppt ? parseFloat(selectedAppt.consult_fee || "0") : 0;
  const isBalanceMatched = Math.abs(totalSplitAmount - targetFee) < 0.01;

  // Process Split Payment Handler
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return toast.error("Please select an appointment first.");
    if (splits.length === 0) return toast.error("Please add at least one payment split.");
    if (!isBalanceMatched && targetFee > 0) {
      return toast.error(`Split total (৳${totalSplitAmount}) must equal consultation fee (৳${targetFee}).`);
    }

    setProcessing(true);
    try {
      const res = await receptionApi.processSplitPayment({
        appointment_id: selectedAppt.id,
        branch_id: selectedBranchId,
        splits: splits.map((s) => ({
          payment_method: s.payment_method,
          amount: parseFloat(s.amount || "0"),
          reference_number: s.reference_number || undefined,
          insurer_name: s.insurer_name || undefined,
        })),
      });

      toast.success("Split payment processed & recorded!");
      setPaymentReceipt(res.data?.data);

      // Auto check-in patient and issue token upon successful payment
      try {
        await receptionApi.checkInAppointment({
          appointment_id: selectedAppt.id,
          branch_id: selectedBranchId,
        });
        toast.success("Patient checked in & Visit Token issued!");
      } catch {
        // Payment was recorded cleanly even if already checked in
      }

      fetchAppointments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to process split payment.");
    } finally {
      setProcessing(false);
    }
  };

  // Filtered appointments
  const filteredAppts = appointments.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.patient_name?.toLowerCase().includes(q) ||
      a.patient_mrn?.toLowerCase().includes(q) ||
      a.doctor_name?.toLowerCase().includes(q)
    );
  });

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
            <CreditCard className="w-6 h-6 text-violet-600" />
            Split Payment Counter
          </h1>
          <p className="text-xs text-default-500 mt-1">
            Process consultation fee invoices split across Cash, Cards, MFS (bKash/Nagad), Insurance, and Corporate Accounts.
          </p>
        </div>

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
      </div>

      {/* Main Grid: Appointment Picker & Split Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Select Appointment for Payment */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader className="border-b border-border py-4 px-5">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              1. Select Patient / Appointment
            </CardTitle>
            <Input
              placeholder="Search MRN or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2 text-xs"
            />
          </CardHeader>
          <CardContent className="p-0">
            {loadingAppts ? (
              <div className="py-12 text-center text-default-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-xs font-bold">Loading appointments...</p>
              </div>
            ) : filteredAppts.length === 0 ? (
              <div className="py-12 text-center text-default-400 text-xs">No appointments for today.</div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {filteredAppts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleSelectAppointment(a)}
                    className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      selectedAppt?.id === a.id
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "hover:bg-default-50"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-bold text-default-900 block truncate">{a.patient_name}</span>
                      <span className="text-[10px] font-mono text-default-500 block">
                        MRN: {a.patient_mrn} · Dr. {a.doctor_name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-default-900 block">৳{a.consult_fee}</span>
                      <Badge
                        color={a.payment_status === "paid" ? "success" : "warning"}
                        className="text-[9px] uppercase font-bold"
                      >
                        {a.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Split Builder & Processor */}
        <Card className="lg:col-span-2 shadow-lg border-2 border-violet-500/20">
          <CardHeader className="border-b border-border py-4 px-6">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-violet-600" />
              2. Payment Method Split Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {selectedAppt ? (
              <div className="bg-default-50 rounded-xl p-4 border border-default-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <div>
                  <span className="text-xs text-default-500 block">Selected Patient</span>
                  <span className="font-bold text-sm text-default-900">{selectedAppt.patient_name}</span>
                  <span className="text-[10px] text-default-400 block">MRN: {selectedAppt.patient_mrn} · Dr. {selectedAppt.doctor_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-default-500 block">Total Consult Fee</span>
                  <span className="font-black text-2xl text-violet-700">৳{selectedAppt.consult_fee}</span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-center text-xs text-amber-700 font-medium">
                👈 Please select a patient appointment from the left panel to begin split payment.
              </div>
            )}

            {/* Split Rows List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase text-default-700 tracking-wider">
                  Payment Splits ({splits.length})
                </h4>
                <Button size="xs" variant="outline" onClick={handleAddSplitRow} className="font-bold gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Payment Method
                </Button>
              </div>

              {splits.map((s, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-default-200 bg-card space-y-3 shadow-sm relative group"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-default-600 block mb-1">Method *</label>
                      <select
                        value={s.payment_method}
                        onChange={(e) => handleUpdateSplit(index, "payment_method", e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800"
                      >
                        <option value="cash">💵 Cash (Auto Cash Drawer)</option>
                        <option value="card">💳 Credit/Debit Card</option>
                        <option value="bkash">📱 bKash MFS</option>
                        <option value="nagad">📱 Nagad MFS</option>
                        <option value="insurance">🛡️ Health Insurance</option>
                        <option value="corporate">🏢 Corporate Account</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-default-600 block mb-1">Amount (BDT) *</label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 300.00"
                          value={s.amount}
                          onChange={(e) => handleUpdateSplit(index, "amount", e.target.value)}
                          className="font-mono text-sm pl-8"
                        />
                        <span className="absolute left-2.5 top-2.5 font-bold text-default-400 text-xs">৳</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-default-600 block mb-1">
                        {s.payment_method === "insurance" ? "Insurer Name" : "Ref / Tx ID"}
                      </label>
                      <Input
                        placeholder={s.payment_method === "insurance" ? "e.g. Green Delta" : "e.g. TRX998822"}
                        value={s.payment_method === "insurance" ? s.insurer_name : s.reference_number}
                        onChange={(e) =>
                          handleUpdateSplit(
                            index,
                            s.payment_method === "insurance" ? "insurer_name" : "reference_number",
                            e.target.value
                          )
                        }
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  {splits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplitRow(index)}
                      className="text-default-400 hover:text-rose-600 absolute right-3 top-3 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Split Balance Summary Bar */}
            <div className="bg-default-50 rounded-xl p-4 border border-default-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-default-500 block">Total Split Sum</span>
                <span className={`font-mono font-black text-xl ${isBalanceMatched ? "text-emerald-600" : "text-amber-600"}`}>
                  ৳{totalSplitAmount.toFixed(2)} / ৳{targetFee.toFixed(2)}
                </span>
              </div>

              <div>
                {isBalanceMatched ? (
                  <Badge color="success" className="font-bold gap-1 px-3 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Amount Matched
                  </Badge>
                ) : (
                  <Badge color="warning" className="font-bold gap-1 px-3 py-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Split Mismatch
                  </Badge>
                )}
              </div>
            </div>

            {/* Process Action */}
            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleProcessPayment}
                disabled={!selectedAppt || processing || (!isBalanceMatched && targetFee > 0)}
                className="h-12 px-8 font-extrabold gap-2 text-base shadow-lg shadow-violet-500/20"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Receipt className="w-5 h-5" /> Process & Record Payment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SplitPaymentCounterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-default-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-xs font-bold">Loading payment counter...</p>
        </div>
      }
    >
      <SplitPaymentCounterContent />
    </Suspense>
  );
}

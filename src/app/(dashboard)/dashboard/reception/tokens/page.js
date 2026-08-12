"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CheckCircle2,
  Search,
  Printer,
  Loader2,
  ArrowLeft,
  X,
  Building2,
  User,
  Filter,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

import { receptionApi, branchesApi, staffApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const safeFormatDate = (dateStr, pattern = "dd/MM/yyyy hh:mm a") => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return format(d, pattern);
  } catch {
    return "—";
  }
};

export default function VisitTokensDirectoryPage() {
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  // Print modal
  const [activeToken, setActiveToken] = useState(null);
  const [printPayload, setPrintPayload] = useState(null);
  const [loadingPayload, setLoadingPayload] = useState(false);

  // Load initial dropdowns
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [brRes, docRes] = await Promise.all([
          branchesApi.getBranches(),
          staffApi.getDoctors(),
        ]);
        if (brRes.data?.data) setBranches(brRes.data.data);
        if (docRes.data?.data) setDoctors(docRes.data.data);
      } catch {
        toast.error("Failed to load filter dropdowns.");
      }
    }
    loadDropdowns();
  }, []);

  // Fetch visit tokens
  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await receptionApi.getVisitTokens({
        branch_id: selectedBranchId || undefined,
        doctor_id: selectedDoctorId || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: searchQuery || undefined,
      });
      if (res.data?.data) setTokens(res.data.data);
    } catch {
      toast.error("Failed to fetch visit tokens.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, selectedDoctorId, statusFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Open thermal print modal
  const handleOpenPrintModal = async (token) => {
    setActiveToken(token);
    setLoadingPayload(true);
    try {
      const res = await receptionApi.getPrintPayload(token.id);
      if (res.data?.data) setPrintPayload(res.data.data);
    } catch {
      toast.error("Failed to generate thermal print payload.");
    } finally {
      setLoadingPayload(false);
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
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Visit Tokens Directory
          </h1>
          <p className="text-xs text-default-500 mt-1">
            Browse and reprint thermal visit tokens issued across all branches and doctors.
          </p>
        </div>

        <Button onClick={fetchTokens} variant="outline" className="font-bold gap-2">
          <Filter className="w-4 h-4" /> Apply Filters
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-default-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-default-600 block mb-1">Branch</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full h-9 px-2 rounded-lg border border-default-200 bg-background text-xs font-medium"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-default-600 block mb-1">Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full h-9 px-2 rounded-lg border border-default-200 bg-background text-xs font-medium"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-default-600 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-2 rounded-lg border border-default-200 bg-background text-xs font-medium"
            >
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="checked_in">Checked In</option>
              <option value="called">Called</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-default-600 block mb-1">Date</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDateTo(e.target.value);
              }}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-default-600 block mb-1">Search</label>
            <Input
              placeholder="Search Token / MRN / Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Directory Table */}
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="border-b border-border py-4 px-6">
          <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Issued Tokens ({tokens.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-default-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-xs font-bold">Loading visit tokens...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="py-20 text-center text-default-400 text-xs space-y-2">
              <User className="w-8 h-8 mx-auto text-default-300" />
              <p>No visit tokens found for selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-default-50 text-default-700 font-bold border-b border-border uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 pl-6">Token #</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Issued Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right pr-6">Thermal Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {tokens.map((t) => (
                    <tr key={t.id} className="hover:bg-default-50 transition-colors">
                      <td className="p-3 pl-6 font-mono font-extrabold text-primary text-sm">
                        #{t.token_number}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-default-900 block">{t.patient_name}</span>
                        <span className="text-[10px] font-mono text-default-400">MRN: {t.patient_mrn}</span>
                      </td>
                      <td className="p-3 text-default-800 font-semibold">{t.doctor_name}</td>
                      <td className="p-3 text-default-600">{t.branch_name}</td>
                      <td className="p-3 font-mono text-default-500">
                        {safeFormatDate(t.issued_at)}
                      </td>
                      <td className="p-3">
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
                      <td className="p-3 text-right pr-6">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenPrintModal(t)}
                          className="font-bold gap-1 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-primary" /> Thermal Slip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Thermal Receipt Print Modal ────────────────────── */}
      {activeToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-default-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" /> Thermal Slip Preview
              </h3>
              <button
                onClick={() => {
                  setActiveToken(null);
                  setPrintPayload(null);
                }}
                className="text-default-400 hover:text-default-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingPayload ? (
              <div className="py-12 text-center text-default-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-xs font-bold">Generating payload...</p>
              </div>
            ) : printPayload ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-5 text-center space-y-3 font-mono">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-amber-700 dark:text-amber-400">
                  {printPayload.branch_name}
                </p>

                <div className="text-4xl font-black text-amber-900 dark:text-amber-200 py-1 border-y border-amber-300/60 border-dashed">
                  #{printPayload.token_number}
                </div>

                <div className="text-xs text-default-800 space-y-1">
                  <p className="font-bold text-sm">{printPayload.patient_name}</p>
                  <p className="text-[10px] text-default-500">MRN: {printPayload.patient_mrn}</p>
                  <p className="font-bold text-amber-800 dark:text-amber-300 mt-2">
                    {printPayload.doctor_name}
                  </p>
                  <p className="text-[10px] text-default-400">{printPayload.issued_at}</p>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveToken(null);
                  setPrintPayload(null);
                }}
                className="flex-1 font-bold"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 font-bold gap-2"
              >
                <Printer className="w-4 h-4" /> Print (80mm)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

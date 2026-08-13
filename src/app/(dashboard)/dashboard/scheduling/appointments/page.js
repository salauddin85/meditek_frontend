"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Play,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

import { schedulingApi, branchesApi, staffApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AppointmentsListPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState("");

  // Cancel Modal State
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const [apptsRes, brRes, docRes] = await Promise.all([
        schedulingApi.getAppointments({
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          branch_id: branchFilter || undefined,
          doctor_id: doctorFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        branchesApi.getBranches(),
        staffApi.getDoctors(),
      ]);

      if (apptsRes.data?.data) setAppointments(apptsRes.data.data);
      if (brRes.data?.data) setBranches(brRes.data.data);
      if (docRes.data?.data) setDoctors(docRes.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load appointments list.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, branchFilter, doctorFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleUpdateStatus = async (appt, newStatus) => {
    if (newStatus === "checked_in") {
      const isPaid = appt.payment_status === "paid" || appt.payment_status === "waived";
      if (!isPaid) {
        toast.error("Payment required before check-in. Redirecting to payment counter...");
        router.push(`/dashboard/reception/payments?appointment_id=${appt.id}`);
        return;
      }
    }

    try {
      await schedulingApi.updateAppointmentStatus(appt.id, { status: newStatus });
      toast.success(`Appointment status updated to '${newStatus}'.`);
      fetchAppointments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setCancelling(true);
    try {
      await schedulingApi.cancelAppointment(cancellingAppt.id, {
        cancellation_reason: cancellationReason || "Cancelled by reception",
      });
      toast.success("Appointment cancelled and waitlist auto-promotion checked.");
      setCancellingAppt(null);
      setCancellationReason("");
      fetchAppointments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            Appointments Directory
          </h1>
          <p className="text-sm text-default-500 mt-1">
            View, search, filter, and update appointment statuses across all hospital branches.
          </p>
        </div>

        <Link href="/dashboard/scheduling/book">
          <Button className="h-10 px-5 font-bold gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Controls & Filters */}
      <div className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
            <Input
              placeholder="Search by patient name, MRN, phone, or doctor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>

          <Button variant="outline" size="sm" onClick={fetchAppointments} className="h-10 px-3">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-default-200 bg-background text-xs font-semibold text-default-800"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="checked_in">Checked In</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-default-200 bg-background text-xs font-semibold text-default-800"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-default-200 bg-background text-xs font-semibold text-default-800"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.full_name}
              </option>
            ))}
          </select>

          <Input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 text-xs font-mono"
          />

          <Input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 text-xs font-mono"
          />
        </div>
      </div>

      {/* Appointments List Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[350px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center text-default-500">
              <Calendar className="w-12 h-12 text-default-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-default-800">No Appointments Found</h3>
              <p className="text-xs text-default-400 mt-1">Try adjusting your filters or date range.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-default-50">
                  <TableHead>Date / Time / Serial</TableHead>
                  <TableHead>Patient Info</TableHead>
                  <TableHead>Doctor & Branch</TableHead>
                  <TableHead>Type & Source</TableHead>
                  <TableHead>Fee & Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id} className="hover:bg-default-50/50">
                    <TableCell className="text-xs font-mono font-bold">
                      <div>{appt.appointment_date}</div>
                      <div className="text-default-500 font-normal">
                        {appt.session_type === "serial"
                          ? `Serial #${appt.serial_number || "—"}`
                          : appt.start_time || "—"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-default-900 text-sm">{appt.patient_name}</span>
                      <p className="text-xs text-default-500 font-mono">
                        MRN: {appt.patient_mrn} | {appt.patient_phone || "No Phone"}
                      </p>
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="font-bold text-default-800">Dr. {appt.doctor_name}</span>
                      <p className="text-default-500">{appt.branch_name}</p>
                    </TableCell>

                    <TableCell className="text-xs capitalize">
                      <span className="font-semibold text-default-800">{appt.appointment_type.replace("_", " ")}</span>
                      <p className="text-[10px] text-default-400">Via {appt.booking_source}</p>
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="font-extrabold text-default-900">৳{appt.consult_fee || 0}</span>
                      <p className="text-[10px] font-bold uppercase text-default-500">{appt.payment_status}</p>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          appt.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : appt.status === "in_progress"
                            ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                            : appt.status === "checked_in"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : appt.status === "cancelled"
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                        }`}
                      >
                        {appt.status.replace("_", " ")}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status === "scheduled" && (
                          <Button
                            size="xs"
                            variant="soft"
                            color="warning"
                            onClick={() => handleUpdateStatus(appt, "checked_in")}
                            className="font-bold gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            Check In
                          </Button>
                        )}

                        {appt.status !== "cancelled" && appt.status !== "completed" && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setCancellingAppt(appt)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Dialog */}
      <AlertDialog open={!!cancellingAppt} onOpenChange={() => setCancellingAppt(null)}>
        <AlertDialogContent className="p-0 overflow-hidden border-none shadow-2xl max-w-md">
          <div className="bg-destructive/5 p-6 border-b border-destructive/10">
            <AlertDialogHeader className="flex-row items-center gap-4 space-y-0">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-xl font-bold text-default-900">
                  Cancel Appointment
                </AlertDialogTitle>
                <p className="text-xs text-default-500 mt-1">This will free up the slot and check waitlist auto-promotion.</p>
              </div>
            </AlertDialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <AlertDialogDescription className="text-default-700 text-sm">
              Are you sure you want to cancel the appointment for{" "}
              <span className="font-bold text-default-900">"{cancellingAppt?.patient_name}"</span>?
            </AlertDialogDescription>

            <Input
              placeholder="Reason for cancellation..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="text-xs"
            />

            <div className="flex justify-end gap-3 pt-4">
              <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmCancel();
                }}
                disabled={cancelling}
                className="bg-destructive hover:bg-destructive/90 text-white font-bold"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Cancel"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  UserPlus,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Loader2,
  ArrowRight,
  TrendingUp,
  Activity,
  Tv,
} from "lucide-react";
import toast from "react-hot-toast";

import { schedulingApi, branchesApi, staffApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SchedulingDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [search, setSearch] = useState("");

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptsRes, brRes, docRes] = await Promise.all([
        schedulingApi.getAppointments({
          date_from: todayStr,
          date_to: todayStr,
          branch_id: selectedBranch || undefined,
          doctor_id: selectedDoctor || undefined,
          search: search.trim() || undefined,
        }),
        branchesApi.getBranches(),
        staffApi.getDoctors(),
      ]);

      if (apptsRes.data?.data) setAppointments(apptsRes.data.data);
      if (brRes.data?.data) setBranches(brRes.data.data);
      if (docRes.data?.data) setDoctors(docRes.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load scheduling data.");
    } finally {
      setLoading(false);
    }
  }, [todayStr, selectedBranch, selectedDoctor, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute Metrics
  const totalToday = appointments.length;
  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const checkedInCount = appointments.filter((a) => a.status === "checked_in").length;
  const inProgressCount = appointments.filter((a) => a.status === "in_progress").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const noShowCount = appointments.filter((a) => a.status === "no_show").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            Appointment & Scheduling Dashboard
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Manage daily appointments, walk-in queues, doctor availability, and waiting room displays.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/scheduling/queue">
            <Button variant="soft" color="info" className="h-10 px-4 font-bold gap-2">
              <Activity className="w-4 h-4" />
              Live Queue Rooms
            </Button>
          </Link>

          <Link href="/dashboard/scheduling/book">
            <Button className="h-10 px-4 font-bold gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          </Link>

          <Link href="/dashboard/scheduling/calendar">
            <Button variant="outline" className="h-10 px-4 font-bold gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Doctor Calendar
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Calendar className="w-5 h-5 text-primary mb-1" />
            <span className="text-2xl font-extrabold text-default-900">{totalToday}</span>
            <span className="text-xs font-semibold text-default-600 uppercase tracking-wider">Total Today</span>
          </CardContent>
        </Card>

        <Card className="bg-sky-500/5 border-sky-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Clock className="w-5 h-5 text-sky-600 mb-1" />
            <span className="text-2xl font-extrabold text-sky-600">{scheduledCount + confirmedCount}</span>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Upcoming</span>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <UserPlus className="w-5 h-5 text-amber-600 mb-1" />
            <span className="text-2xl font-extrabold text-amber-600">{checkedInCount}</span>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Checked In</span>
          </CardContent>
        </Card>

        <Card className="bg-indigo-500/5 border-indigo-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Activity className="w-5 h-5 text-indigo-600 mb-1" />
            <span className="text-2xl font-extrabold text-indigo-600">{inProgressCount}</span>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">In Chamber</span>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-2xl font-extrabold text-emerald-600">{completedCount}</span>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <XCircle className="w-5 h-5 text-rose-600 mb-1" />
            <span className="text-2xl font-extrabold text-rose-600">{noShowCount}</span>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">No Show</span>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
          <Input
            placeholder="Search today's appointments by patient name, MRN, phone, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-semibold text-default-800 focus:ring-primary focus:border-primary"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-semibold text-default-800 focus:ring-primary focus:border-primary"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.full_name}
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={fetchData} className="h-10 px-3">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Today's Appointments Table ── */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Today's Scheduled Appointments ({todayStr})
          </CardTitle>

          {selectedDoctor && selectedBranch && (
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/scheduling/queue/${selectedDoctor}`}>
                <Button size="xs" variant="soft" color="info" className="gap-1 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  Manage Live Queue
                </Button>
              </Link>
              <Link href={`/queue-display/${selectedBranch}/${selectedDoctor}`} target="_blank">
                <Button size="xs" variant="outline" className="gap-1 font-semibold">
                  <Tv className="w-3.5 h-3.5 text-primary" />
                  TV Display
                </Button>
              </Link>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Calendar className="w-12 h-12 text-default-300 mb-3" />
              <h3 className="text-lg font-bold text-default-800">No Appointments Scheduled Today</h3>
              <p className="text-sm text-default-500 max-w-sm mt-1 mb-4">
                {search ? "No appointments match your filter criteria." : "Create a new booking for a patient using the button below."}
              </p>
              <Link href="/dashboard/scheduling/book">
                <Button size="sm" className="font-semibold">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Book Appointment
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-default-50">
                  <TableHead className="w-[110px]">Time / Serial</TableHead>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Doctor & Branch</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fee / Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id} className="hover:bg-default-50/50">
                    <TableCell className="font-mono text-xs font-bold">
                      {appt.session_type === "serial" ? (
                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-700 font-extrabold border border-amber-500/20">
                          Serial #{appt.serial_number || "—"}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-primary/10 text-primary font-extrabold border border-primary/20">
                          {appt.start_time || "—"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-default-900">{appt.patient_name}</span>
                      <p className="text-xs font-mono text-default-500 mt-0.5">
                        MRN: {appt.patient_mrn} | {appt.patient_phone || "No Phone"}
                      </p>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-default-800 text-xs">{appt.doctor_name}</span>
                      <p className="text-[11px] text-default-500">{appt.branch_name}</p>
                    </TableCell>

                    <TableCell>
                      <Badge variant="soft" className="capitalize text-[10px] font-bold">
                        {appt.appointment_type.replace("_", " ")}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="font-bold text-default-900">৳{appt.consult_fee || 0}</span>
                      <p className="text-[10px] font-extrabold uppercase mt-0.5 text-default-500">
                        {appt.payment_status}
                      </p>
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
                      <Link href={`/dashboard/scheduling/appointments`}>
                        <Button size="xs" variant="soft" color="secondary" className="gap-1 font-semibold">
                          Details
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

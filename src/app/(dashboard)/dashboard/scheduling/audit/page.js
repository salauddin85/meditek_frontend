"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  XCircle,
  Stethoscope,
  ArrowLeft,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  parseISO,
} from "date-fns";
import toast from "react-hot-toast";
import Link from "next/link";

import { schedulingApi, staffApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Status color map ─────────────────────────────────────────
const STATUS_COLORS = {
  completed: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  in_progress: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
  checked_in: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  scheduled: "bg-sky-500/10 text-sky-600 border border-sky-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
  no_show: "bg-zinc-400/10 text-zinc-500 border border-zinc-400/20",
};

// ── Summary computation (independent counters as requested) ──
function computeSummary(appointments) {
  const total = appointments.length;
  const paid = appointments.filter((a) => a.payment_status === "paid");
  const cancelled = appointments.filter((a) => a.status === "cancelled");
  // Unpaid = not paid AND not cancelled
  const unpaid = appointments.filter(
    (a) => a.payment_status !== "paid" && a.status !== "cancelled"
  );
  const collected = paid.reduce((sum, a) => sum + parseFloat(a.consult_fee || 0), 0);
  return {
    total,
    paidCount: paid.length,
    unpaidCount: unpaid.length,
    cancelledCount: cancelled.length,
    collected,
  };
}

// ── Month Calendar ────────────────────────────────────────────
function MonthCalendar({ appointments, selectedDate, onSelectDate, currentMonth, onMonthChange }) {
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const startOffset = getDay(startOfMonth(currentMonth));

  const datesWithAppts = new Set(appointments.map((a) => a.appointment_date));

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 rounded-lg hover:bg-default-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-default-600" />
        </button>
        <h3 className="text-sm font-extrabold text-default-900">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={() => onMonthChange(1)}
          className="p-2 rounded-lg hover:bg-default-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-default-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-default-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const hasAppts = datesWithAppts.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const today = isToday(day);
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`
                relative mx-auto w-9 h-9 rounded-xl text-sm font-semibold flex flex-col items-center justify-center transition-all
                ${isSelected ? "bg-primary text-white shadow-md shadow-primary/30" : today ? "ring-2 ring-primary/40 text-primary font-extrabold" : "text-default-700 hover:bg-default-100"}
              `}
            >
              {format(day, "d")}
              {hasAppts && (
                <span
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-primary"}`}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-default-400 mt-3 text-center">
        • Dots = days with appointments
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ScheduleAuditPage() {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Load doctors once
  useEffect(() => {
    staffApi
      .getDoctors()
      .then((res) => {
        if (res.data?.data) setDoctors(res.data.data);
      })
      .catch(() => toast.error("Failed to load doctors."))
      .finally(() => setLoadingDoctors(false));
  }, []);

  // Load appointments for selected doctor + displayed month
  const fetchMonthAppointments = useCallback(async () => {
    if (!selectedDoctor) return;
    setLoadingAppts(true);
    try {
      const dateFrom = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const dateTo = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const res = await schedulingApi.getAppointments({
        doctor_id: selectedDoctor.id,
        date_from: dateFrom,
        date_to: dateTo,
      });
      const data = res.data?.data || [];
      setAppointments(data);
      if (selectedDate) {
        setDayAppointments(data.filter((a) => a.appointment_date === selectedDate));
      }
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setLoadingAppts(false);
    }
  }, [selectedDoctor, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMonthAppointments();
  }, [fetchMonthAppointments]);

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    setDayAppointments(appointments.filter((a) => a.appointment_date === dateStr));
  };

  const handleMonthChange = (delta) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
    setSelectedDate(null);
    setDayAppointments([]);
  };

  const filteredDoctors = doctors.filter(
    (d) =>
      d.full_name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialty_name?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const summary = selectedDate ? computeSummary(dayAppointments) : null;

  const sortedDayAppointments = [...dayAppointments].sort((a, b) => {
    const ta = a.start_time || `${String(a.serial_number || 999).padStart(3, "0")}`;
    const tb = b.start_time || `${String(b.serial_number || 999).padStart(3, "0")}`;
    return ta.localeCompare(tb);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard/scheduling"
            className="inline-flex items-center gap-1 text-xs font-bold text-default-400 hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Scheduling
          </Link>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-primary" />
            Doctor Schedule Audit
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Select a doctor → pick a date → view full appointment list and payment audit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Left: Doctor Selector ─────────────── */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
            <Input
              placeholder="Search doctors..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5 max-h-[72vh] overflow-y-auto pr-1">
            {loadingDoctors ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredDoctors.length === 0 ? (
              <p className="text-xs text-default-400 text-center py-6">No doctors found.</p>
            ) : (
              filteredDoctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setSelectedDate(null);
                    setDayAppointments([]);
                    setAppointments([]);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedDoctor?.id === doc.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-default-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${
                        selectedDoctor?.id === doc.id
                          ? "bg-primary text-white"
                          : "bg-default-100 text-default-600"
                      }`}
                    >
                      {doc.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-default-900 truncate">Dr. {doc.full_name}</p>
                      <p className="text-[10px] text-default-500 truncate">
                        {doc.specialty_name || "General"}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Calendar + Audit ─────────────── */}
        <div className="lg:col-span-3 space-y-5">
          {!selectedDoctor ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Stethoscope className="w-16 h-16 text-default-200 mb-4" />
              <h3 className="text-lg font-bold text-default-600">Select a Doctor</h3>
              <p className="text-sm text-default-400 mt-1">
                Choose a doctor from the left panel to begin the audit.
              </p>
            </div>
          ) : (
            <>
              {/* Doctor banner */}
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl p-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-black text-xl text-primary">
                  {selectedDoctor.full_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-default-900">
                    Dr. {selectedDoctor.full_name}
                  </h2>
                  <p className="text-xs text-default-500">
                    {selectedDoctor.specialty_name || "General"}
                    {selectedDoctor.qualification ? ` · ${selectedDoctor.qualification}` : ""}
                  </p>
                </div>
                {loadingAppts && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                {/* Calendar */}
                <Card className="md:col-span-2">
                  <CardHeader className="border-b border-border py-3 px-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> Select Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <MonthCalendar
                      appointments={appointments}
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                      currentMonth={currentMonth}
                      onMonthChange={handleMonthChange}
                    />
                  </CardContent>
                </Card>

                {/* Audit panel */}
                <div className="md:col-span-3 space-y-4">
                  {!selectedDate ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-default-50 rounded-xl border border-border border-dashed h-full">
                      <Calendar className="w-12 h-12 text-default-300 mb-3" />
                      <p className="font-bold text-default-600 text-sm">Pick a Date</p>
                      <p className="text-xs text-default-400 mt-1">
                        Click any date on the calendar.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Date title row */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-default-900 text-base">
                          {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
                        </h3>
                        <Badge className="text-xs px-2.5 font-bold bg-default-100 text-default-700">
                          {summary.total} Appt{summary.total !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      {/* ── Summary Bar ─────────────── */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                          <div className="text-2xl font-black text-emerald-600">
                            {summary.paidCount}
                          </div>
                          <div className="text-[10px] font-extrabold text-emerald-700 uppercase mt-0.5">
                            Paid
                          </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
                          <div className="text-2xl font-black text-amber-600">
                            {summary.unpaidCount}
                          </div>
                          <div className="text-[10px] font-extrabold text-amber-700 uppercase mt-0.5">
                            Unpaid
                          </div>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-center">
                          <div className="text-2xl font-black text-rose-600">
                            {summary.cancelledCount}
                          </div>
                          <div className="text-[10px] font-extrabold text-rose-700 uppercase mt-0.5">
                            Cancelled
                          </div>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                          <div className="text-lg font-black text-primary leading-tight">
                            ৳{summary.collected.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-extrabold text-primary/70 uppercase mt-0.5">
                            Collected
                          </div>
                        </div>
                      </div>

                      {/* ── Appointment Table ─────────── */}
                      {dayAppointments.length === 0 ? (
                        <div className="py-10 text-center bg-default-50 rounded-xl border border-border border-dashed">
                          <XCircle className="w-10 h-10 text-default-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-default-500">
                            No appointments on this date.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                          {/* Table head */}
                          <div className="grid grid-cols-12 gap-1 px-4 py-2.5 bg-default-50 border-b border-border text-[10px] font-extrabold uppercase tracking-wider text-default-500">
                            <div className="col-span-4">Patient</div>
                            <div className="col-span-2">Time</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Fee / Pay</div>
                          </div>

                          {/* Table rows */}
                          <div className="divide-y divide-border">
                            {sortedDayAppointments.map((appt) => (
                              <div
                                key={appt.id}
                                className="grid grid-cols-12 gap-1 px-4 py-3 hover:bg-default-50/60 transition-colors items-center"
                              >
                                {/* Patient */}
                                <div className="col-span-4">
                                  <p className="font-bold text-sm text-default-900 truncate">
                                    {appt.patient_name}
                                  </p>
                                  <p className="text-[10px] font-mono text-default-400">
                                    {appt.patient_mrn}
                                  </p>
                                </div>

                                {/* Time / Serial */}
                                <div className="col-span-2 text-xs text-default-600 font-mono">
                                  {appt.start_time
                                    ? appt.start_time.substring(0, 5)
                                    : appt.serial_number
                                    ? `#${appt.serial_number}`
                                    : "—"}
                                </div>

                                {/* Type */}
                                <div className="col-span-2 text-[10px] capitalize text-default-500 font-medium">
                                  {appt.appointment_type?.replace(/_/g, " ")}
                                </div>

                                {/* Status */}
                                <div className="col-span-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                      STATUS_COLORS[appt.status] || "bg-default-100 text-default-600"
                                    }`}
                                  >
                                    {appt.status?.replace(/_/g, " ")}
                                  </span>
                                </div>

                                {/* Fee / Payment */}
                                <div className="col-span-2 text-right">
                                  <p className="font-extrabold text-sm text-default-900">
                                    ৳{parseFloat(appt.consult_fee || 0).toLocaleString()}
                                  </p>
                                  <span
                                    className={`text-[10px] font-bold uppercase ${
                                      appt.payment_status === "paid"
                                        ? "text-emerald-600"
                                        : "text-rose-500"
                                    }`}
                                  >
                                    {appt.payment_status === "paid" ? "✓ Paid" : "✗ Unpaid"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Footer summary row */}
                          <div className="px-4 py-3 bg-default-50 border-t border-border flex items-center justify-between">
                            <span className="text-xs font-semibold text-default-600">
                              {summary.total} appts · {summary.paidCount} paid · {summary.unpaidCount} unpaid · {summary.cancelledCount} cancelled
                            </span>
                            <span className="text-sm font-extrabold text-emerald-700">
                              ৳{summary.collected.toLocaleString()} collected
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

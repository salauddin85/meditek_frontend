"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, addDays, startOfWeek } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Plus,
  Loader2,
  RefreshCw,
  Building2,
  Stethoscope,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import { schedulingApi, staffApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorCalendarPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 6 })); // Saturday start (BD standard)
  const [calendarData, setCalendarData] = useState({ appointments: [], slots: [], blackouts: [] });
  const [loading, setLoading] = useState(false);

  // Load doctors list
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await staffApi.getDoctors();
        if (res.data?.data && res.data.data.length > 0) {
          setDoctors(res.data.data);
          setSelectedDoctorId(res.data.data[0].id);
        }
      } catch (err) {
        toast.error("Failed to load doctors.");
      }
    }
    loadDoctors();
  }, []);

  const weekDays = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(currentWeekStart, i));
  const dateFromStr = format(weekDays[0], "yyyy-MM-dd");
  const dateToStr = format(weekDays[6], "yyyy-MM-dd");

  const fetchCalendar = useCallback(async () => {
    if (!selectedDoctorId) return;
    setLoading(true);
    try {
      const res = await schedulingApi.getDoctorCalendar(selectedDoctorId, {
        date_from: dateFromStr,
        date_to: dateToStr,
      });
      if (res.data?.data) {
        setCalendarData(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load doctor calendar.");
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, dateFromStr, dateToStr]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const handleNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="space-y-3">
        <Link
          href="/dashboard/scheduling"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scheduling Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
              <CalendarIcon className="w-7 h-7 text-primary" />
              Doctor Weekly Calendar
            </h1>
            <p className="text-sm text-default-500 mt-1">
              Weekly schedule overview, slot availability, blackouts, and patient appointments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800 focus:ring-primary focus:border-primary"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name} ({d.designation || "Doctor"})
                </option>
              ))}
            </select>

            <Link href="/dashboard/scheduling/book">
              <Button className="h-10 px-4 font-bold gap-2">
                <Plus className="w-4 h-4" />
                Book Appt
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
        <Button variant="outline" size="sm" onClick={handlePrevWeek} className="gap-1 font-bold">
          <ChevronLeft className="w-4 h-4" />
          Previous Week
        </Button>

        <span className="font-extrabold text-default-900 text-sm">
          {format(weekDays[0], "MMM d, yyyy")} — {format(weekDays[6], "MMM d, yyyy")}
        </span>

        <Button variant="outline" size="sm" onClick={handleNextWeek} className="gap-1 font-bold">
          Next Week
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayName = format(day, "EEE");
            const dayNum = format(day, "d MMM");

            const isBlackout = calendarData.blackouts?.some((b) => b.blackout_date === dayStr);
            const dayAppts = calendarData.appointments?.filter((a) => a.appointment_date === dayStr) || [];
            const daySlots = calendarData.slots?.filter((s) => s.slot_date === dayStr) || [];

            return (
              <Card key={dayStr} className={`overflow-hidden ${isBlackout ? "bg-rose-500/5 border-rose-500/20" : ""}`}>
                <CardHeader className="p-3 border-b border-border text-center bg-default-50">
                  <span className="text-xs font-bold text-default-500 uppercase">{dayName}</span>
                  <CardTitle className="text-sm font-extrabold text-default-900">{dayNum}</CardTitle>
                </CardHeader>

                <CardContent className="p-2 space-y-2 min-h-[220px] text-xs">
                  {isBlackout ? (
                    <div className="p-2 rounded bg-rose-500/10 text-rose-600 font-bold text-[11px] text-center flex flex-col items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Doctor On Leave / Blackout
                    </div>
                  ) : dayAppts.length === 0 ? (
                    <div className="py-8 text-center text-default-400 text-[11px]">No bookings</div>
                  ) : (
                    dayAppts.map((a) => (
                      <div
                        key={a.id}
                        className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                          a.status === "completed"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                            : a.status === "checked_in"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-800"
                            : "bg-primary/5 border-primary/20 text-primary-900"
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span>
                            {a.session_type === "serial" ? `#${a.serial_number}` : a.start_time || "—"}
                          </span>
                          <span className="text-[9px] uppercase font-extrabold">{a.status}</span>
                        </div>
                        <p className="font-semibold truncate">{a.patient_name}</p>
                      </div>
                    ))
                  )}

                  {!isBlackout && daySlots.length > 0 && (
                    <div className="pt-2 text-[10px] text-default-400 font-medium text-center border-t border-dashed border-default-200">
                      {daySlots.filter((s) => s.status === "available").length} / {daySlots.length} slots free
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

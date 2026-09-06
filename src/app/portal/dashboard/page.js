"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  Clock,
  User,
  HeartPulse,
  Download,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  CalendarCheck,
  Building,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { portalService } from "@/lib/portal-api";
import { usePortalAuthStore } from "@/store/portal-auth";

export default function PortalDashboardPage() {
  const patient = usePortalAuthStore((s) => s.patient);
  const [appointmentsData, setAppointmentsData] = useState({
    upcoming: [],
    past: [],
    all: [],
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [apptsRes, reportsRes] = await Promise.all([
        portalService.getAppointments(),
        portalService.getReports(),
      ]);
      if (apptsRes.data?.data) {
        setAppointmentsData(apptsRes.data.data);
      }
      if (reportsRes.data?.data) {
        setReports(reportsRes.data.data);
      }
    } catch (err) {
      toast.error(err.userMessage || "Failed to load dashboard records.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    setDownloadingId(reportId);
    try {
      await portalService.downloadReportPdf(reportId, `lab_report_${reportId}.pdf`);
      toast.success("Lab report downloaded.");
    } catch (err) {
      toast.error(err.userMessage || "Failed to download report PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const nextAppt = appointmentsData.upcoming?.[0] || null;

  return (
    <div className="space-y-6">
      {/* Patient Welcome & Info Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 sm:p-8 text-white shadow-lg shadow-emerald-600/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-100 backdrop-blur-md">
              <span>MRN:</span>
              <span className="font-mono text-white">{patient?.mrn || "N/A"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {patient?.full_name || "Patient"}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              Welcome to your personal healthcare portal. Manage your upcoming consultations, view lab test findings, and book visits in real-time.
            </p>
          </div>

          {/* Quick Demographics Pills */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs">
            {patient?.blood_group && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-white/20 px-3.5 py-2 backdrop-blur-md">
                <Activity className="h-4 w-4 text-rose-200" />
                <div>
                  <div className="text-[10px] text-emerald-100">Blood</div>
                  <div className="font-bold">{patient.blood_group}</div>
                </div>
              </div>
            )}
            {patient?.sex && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-white/20 px-3.5 py-2 backdrop-blur-md">
                <User className="h-4 w-4 text-emerald-200" />
                <div>
                  <div className="text-[10px] text-emerald-100">Gender</div>
                  <div className="font-bold capitalize">{patient.sex}</div>
                </div>
              </div>
            )}
            {patient?.branch_name && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-white/20 px-3.5 py-2 backdrop-blur-md">
                <Building className="h-4 w-4 text-teal-200" />
                <div>
                  <div className="text-[10px] text-emerald-100">Primary Branch</div>
                  <div className="font-bold">{patient.branch_name}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background glow circle */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Upcoming Visits</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {appointmentsData.upcoming.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Past Visits</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {appointmentsData.past.length}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4.5 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lab Reports</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {reports.length}
          </div>
        </div>
      </div>

      {/* Main Grid: Next Appointment & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment Card (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Next Scheduled Appointment
            </h2>
            <Link
              href="/portal/appointments"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="h-48 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse dark:border-slate-800 dark:bg-slate-900" />
          ) : nextAppt ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 capitalize">
                    {nextAppt.status}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                    {nextAppt.doctor_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {nextAppt.doctor_specialization || nextAppt.department_name || "Specialist"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Time</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {nextAppt.start_time || "Serial: #" + nextAppt.serial_number}
                  </p>
                  <p className="text-xs text-slate-500">
                    {nextAppt.appointment_date}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>{nextAppt.branch_name || "Hospital Campus"}</span>
                </div>
                {nextAppt.consult_fee && (
                  <div>
                    Consultation Fee:{" "}
                    <strong className="text-slate-900 dark:text-white">
                      BDT {Number(nextAppt.consult_fee).toFixed(0)}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <Calendar className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                No upcoming appointments scheduled
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Need to consult a doctor? You can self-book a consultation slot directly through the portal.
              </p>
              <Link
                href="/portal/appointments"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Book an Appointment</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Action & Recent Lab Reports (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Recent Lab Reports
            </h2>
            <Link
              href="/portal/reports"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="h-36 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse dark:border-slate-800 dark:bg-slate-900" />
            ) : reports.length > 0 ? (
              reports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {rep.tests_summary?.[0]?.name || "Laboratory Test Report"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Released: {new Date(rep.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(rep.id)}
                    disabled={downloadingId === rep.id}
                    title="Download Report PDF"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 dark:border-slate-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                No lab reports released yet.
              </div>
            )}
          </div>

          {/* Quick CTA Box */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
              Need Assistance?
            </h3>
            <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
              For emergencies or inquiries, please contact your primary branch front desk directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

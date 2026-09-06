"use client";
import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  ShieldCheck,
  Search,
  Calendar,
  Building,
  UserCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { portalService } from "@/lib/portal-api";

export default function PortalReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await portalService.getReports();
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (err) {
      toast.error(err.userMessage || "Failed to load laboratory reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report) => {
    setDownloadingId(report.id);
    try {
      const filename = `lab_report_${report.order_id || report.id}.pdf`;
      await portalService.downloadReportPdf(report.id, filename);
      toast.success("Report downloaded successfully.");
    } catch (err) {
      toast.error(err.userMessage || "Download failed. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredReports = reports.filter((rep) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const testsStr = (rep.tests_summary || []).map((t) => t.name).join(" ").toLowerCase();
    const orderStr = (rep.order_id || "").toLowerCase();
    return testsStr.includes(query) || orderStr.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Diagnostic Lab Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Access, view, and download verified laboratory findings and pathology tests.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by test name..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800/50"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>Verified & Released</span>
                    </span>

                    {report.is_amended && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        Amended
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {(report.tests_summary || [])
                      .map((t) => t.name)
                      .join(", ") || "Diagnostic Pathology Report"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Date: {new Date(report.generated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{report.pathologist_name}</span>
                    </div>

                    {report.branch_name && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" />
                        <span>{report.branch_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Button */}
                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={downloadingId === report.id}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {downloadingId === report.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Digital authenticity hash footer */}
              {report.qr_verification_token && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Cryptographically verified pathology report</span>
                  </div>
                  <span className="font-mono text-[10px] hidden sm:inline">
                    Token: {report.qr_verification_token.slice(0, 16)}...
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {searchQuery ? "No reports match your search" : "No lab reports released"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? "Try searching for a different test name or clear your search query."
              : "Completed test results will appear here as soon as they are signed and released by the pathology team."}
          </p>
        </div>
      )}
    </div>
  );
}

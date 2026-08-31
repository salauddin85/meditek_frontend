"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  FileSpreadsheet, 
  FileCode2,
  Calendar
} from "lucide-react";
import { reportsApi } from "@/lib/tenant-api";
import toast from "react-hot-toast";

export default function ReportRunsHistory() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRuns = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await reportsApi.getRuns();
      if (res?.data?.data) {
        setRuns(res.data.data);
      }
      if (isManual) toast.success("History refreshed.");
    } catch (err) {
      console.error("Failed to load runs history:", err);
      toast.error("Failed to load report execution logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const getFormatIcon = (fmt) => {
    switch (fmt) {
      case "pdf": return <FileText className="h-4 w-4 text-rose-500" />;
      case "xlsx": return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
      case "csv": return <FileCode2 className="h-4 w-4 text-blue-500" />;
      default: return <FileText className="h-4 w-4 text-default-500" />;
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case "completed":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase">Completed</Badge>;
      case "running":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase animate-pulse">Running</Badge>;
      case "queued":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase">Queued</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] uppercase">Failed</Badge>;
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Catalogue
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-default-900 tracking-tight">
              Report Execution History & Downloads
            </h1>
            <p className="text-xs text-default-500 mt-0.5">
              Audit log of generated reports and asynchronous exports
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 text-xs" 
          onClick={() => loadRuns(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-default-200/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader className="bg-default-100/70">
              <TableRow>
                <TableHead className="font-semibold text-default-700">Report Name</TableHead>
                <TableHead className="font-semibold text-default-700">Format</TableHead>
                <TableHead className="font-semibold text-default-700">Status</TableHead>
                <TableHead className="font-semibold text-default-700">Rows</TableHead>
                <TableHead className="font-semibold text-default-700">Date Range / Params</TableHead>
                <TableHead className="font-semibold text-default-700">Generated At</TableHead>
                <TableHead className="font-semibold text-default-700 text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-default-100">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-4 text-center text-default-400">
                      Loading execution history...
                    </TableCell>
                  </TableRow>
                ))
              ) : runs.length > 0 ? (
                runs.map((r) => (
                  <TableRow key={r.id} className="hover:bg-default-50/60">
                    <TableCell>
                      <div className="font-semibold text-default-900">{r.definition_name || r.definition_code}</div>
                      <div className="text-[11px] font-mono text-default-400">{r.definition_code}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium uppercase text-default-700">
                        {getFormatIcon(r.export_format)}
                        <span>{r.export_format}</span>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(r.status)}</TableCell>

                    <TableCell className="font-mono text-default-700">
                      {r.row_count > 0 ? r.row_count.toLocaleString() : "—"}
                    </TableCell>

                    <TableCell className="text-default-500 font-mono text-[11px]">
                      {r.parameters_json?.start_date && r.parameters_json?.end_date ? (
                        <span>{r.parameters_json.start_date} to {r.parameters_json.end_date}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-default-500 whitespace-nowrap">
                      {r.completed_at ? new Date(r.completed_at).toLocaleString() : new Date(r.created_at).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right">
                      {r.status === "completed" && r.output_s3_key ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={async () => {
                            const ext = r.export_format || "pdf";
                            const fname = `${r.definition_code?.toLowerCase() || "report"}_${r.id.substring(0, 8)}.${ext}`;
                            try {
                              await reportsApi.downloadFile(r.id, fname);
                              toast.success("Download started.");
                            } catch (e) {
                              toast.error("Download failed.");
                            }
                          }}
                          className="h-7 text-xs gap-1 text-primary border-primary/20 hover:bg-primary/5"
                        >
                          <Download className="h-3 w-3" /> Download
                        </Button>
                      ) : (
                        <span className="text-default-400 text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-default-400">
                    No report execution history available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

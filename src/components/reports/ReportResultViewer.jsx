"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Search, 
  FileText, 
  FileSpreadsheet, 
  FileCode2, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { reportsApi } from "@/lib/tenant-api";
import toast from "react-hot-toast";

export default function ReportResultViewer({ reportData, reportRun, onBack }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [downloading, setDownloading] = useState(false);

  if (!reportData) return null;

  const title = reportData.title || "Generated Report";
  const headers = reportData.headers || [];
  const rows = reportData.rows || [];
  const summary = reportData.summary || {};

  // Filter rows by search term
  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(r).some((val) => 
      String(val).toLowerCase().includes(term)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  // Trigger export for other formats
  const handleExport = async (format) => {
    const reportCode = reportRun?.definition?.code || reportRun?.definition_code;
    if (!reportCode) return;
    setDownloading(true);
    try {
      const payload = {
        report_code: reportCode,
        parameters: reportRun.parameters_json || {},
        export_format: format,
        branch_id: reportRun.branch_id,
      };
      const res = await reportsApi.runReport(payload);
      const data = res?.data?.data;
      if (data?.run?.id) {
        const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
        const fname = `${reportCode.toLowerCase()}.${ext}`;
        await reportsApi.downloadFile(data.run.id, fname);
        toast.success(`Exported to ${format.toUpperCase()} successfully.`);
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to download exported file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-xl border border-default-200/60 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="h-8 gap-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <div>
            <h2 className="text-base font-bold text-default-900">{title}</h2>
            <p className="text-xs text-default-500">
              Total Records: {rows.length.toLocaleString()} rows
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleExport("pdf")}
            disabled={downloading}
            className="h-8 gap-1 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            <FileText className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleExport("xlsx")}
            disabled={downloading}
            className="h-8 gap-1 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleExport("csv")}
            disabled={downloading}
            className="h-8 gap-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <FileCode2 className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards Row (if available) */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(summary).map(([key, val], idx) => (
            <div key={idx} className="bg-default-50/70 border border-default-200/60 rounded-lg p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-default-500 truncate">{key}</p>
              <p className="text-base font-bold text-default-900 mt-1 truncate">
                {typeof val === "number" ? (key.includes("৳") || key.toLowerCase().includes("revenue") || key.toLowerCase().includes("balance") || key.toLowerCase().includes("profit") ? `৳${val.toLocaleString()}` : val.toLocaleString()) : String(val)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-default-400" />
          <Input
            placeholder="Search in records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <p className="text-xs text-default-500">
          Showing {filteredRows.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, filteredRows.length)} of {filteredRows.length}
        </p>
      </div>

      {/* Interactive Table */}
      <div className="rounded-xl border border-default-200/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader className="bg-default-100/70">
              <TableRow>
                <TableHead className="w-10 font-bold">#</TableHead>
                {headers.map((h, i) => (
                  <TableHead key={i} className="font-semibold text-default-700 whitespace-nowrap">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-default-100">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rIdx) => (
                  <TableRow key={rIdx} className="hover:bg-default-50/60">
                    <TableCell className="text-default-400 font-mono text-[11px]">
                      {startIndex + rIdx + 1}
                    </TableCell>
                    {headers.map((h, cIdx) => {
                      const val = row[h];
                      const isNumeric = typeof val === "number";
                      const isMoney = isNumeric && (h.includes("৳") || h.toLowerCase().includes("revenue") || h.toLowerCase().includes("balance") || h.toLowerCase().includes("profit") || h.toLowerCase().includes("collected") || h.toLowerCase().includes("invoiced"));

                      return (
                        <TableCell key={cIdx} className={`whitespace-nowrap ${isNumeric ? "font-mono" : ""}`}>
                          {isMoney ? (
                            <span className="font-semibold text-default-900">৳{val.toLocaleString()}</span>
                          ) : isNumeric ? (
                            val.toLocaleString()
                          ) : (
                            String(val ?? "—")
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length + 1} className="h-32 text-center text-default-400">
                    No matching records found for this report query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-default-100 bg-default-50/50">
            <span className="text-xs text-default-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

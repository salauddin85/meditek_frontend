"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode2, 
  Table as TableIcon, 
  ShieldAlert, 
  Loader2, 
  Calendar,
  Building2,
  User
} from "lucide-react";
import toast from "react-hot-toast";
import { reportsApi, iamApi, financeApi } from "@/lib/tenant-api";

export default function ReportGeneratorModal({ 
  open, 
  onOpenChange, 
  definition, 
  onReportGenerated 
}) {
  const [format, setFormat] = useState("json");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [branchId, setBranchId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (open) {
      // Load branches and doctors if needed
      iamApi.getMe().then((res) => {
        if (res?.data?.data?.user?.branches) {
          setBranches(res.data.data.user.branches);
        }
      }).catch(console.error);

      financeApi.getDoctors().then((res) => {
        if (res?.data?.data) {
          setDoctors(res.data.data);
        }
      }).catch(console.error);
    }
  }, [open]);

  if (!definition) return null;

  const handleRun = async () => {
    setRunning(true);
    try {
      const payload = {
        report_code: definition.code,
        parameters: {
          start_date: startDate,
          end_date: endDate,
        },
        export_format: format,
      };
      if (branchId && branchId !== "all") payload.branch_id = branchId;
      if (doctorId && doctorId !== "all") payload.parameters.doctor_id = doctorId;

      const res = await reportsApi.runReport(payload);
      const data = res?.data?.data;

      if (data?.mode === "async") {
        toast.success("Report processing queued in background. You can download it from History.");
        onOpenChange(false);
      } else {
        toast.success("Report generated successfully!");
        if (format === "json") {
          onReportGenerated(data?.run?.result_data, data?.run);
          onOpenChange(false);
        } else if (data?.run?.id) {
          const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
          const fname = `${definition.code.toLowerCase()}_${startDate}_to_${endDate}.${ext}`;
          await reportsApi.downloadFile(data.run.id, fname);
          onOpenChange(false);
        }
      }
    } catch (err) {
      console.error("Report generation error:", err);
      toast.error(err?.response?.data?.message || "Failed to execute report.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold text-default-900">
              {definition.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-default-500 mt-1">
            {definition.description}
          </DialogDescription>
        </DialogHeader>

        {definition.contains_phi && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 text-amber-600 flex-none mt-0.5" />
            <div>
              <span className="font-semibold">Protected Health Information (PHI):</span> This export contains identifiable medical/patient records. All access is logged to the tenant compliance audit trail (FR-RPT-007).
            </div>
          </div>
        )}

        <div className="space-y-4 py-2 text-xs">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Start Date</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">End Date</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Branch Scoping */}
          {branches.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Branch Scope</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-9 text-xs">
                  <Building2 className="h-3.5 w-3.5 mr-1.5 text-default-400" />
                  <SelectValue placeholder="All Tenant Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenant Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Doctor Filter (if relevant) */}
          {(definition.code.includes("DOCTOR") || definition.code.includes("APPOINTMENT")) && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Filter by Doctor (Optional)</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger className="h-9 text-xs">
                  <User className="h-3.5 w-3.5 mr-1.5 text-default-400" />
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>Dr. {d.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Output Format */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-semibold">Output Format</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  format === "json" 
                    ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary" 
                    : "border-default-200 hover:border-default-300 text-default-600"
                }`}
              >
                <TableIcon className="h-5 w-5 mb-1.5" />
                <span className="text-xs">Interactive Table</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  format === "pdf" 
                    ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary" 
                    : "border-default-200 hover:border-default-300 text-default-600"
                }`}
              >
                <FileText className="h-5 w-5 mb-1.5 text-rose-500" />
                <span className="text-xs">PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  format === "xlsx" 
                    ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary" 
                    : "border-default-200 hover:border-default-300 text-default-600"
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 mb-1.5 text-emerald-600" />
                <span className="text-xs">Excel (XLSX)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                  format === "csv" 
                    ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary" 
                    : "border-default-200 hover:border-default-300 text-default-600"
                }`}
              >
                <FileCode2 className="h-5 w-5 mb-1.5 text-blue-500" />
                <span className="text-xs">CSV (Bangla)</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            disabled={running}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            size="sm" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5" 
            onClick={handleRun}
            disabled={running}
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            <span>{running ? "Generating..." : "Run & Export"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

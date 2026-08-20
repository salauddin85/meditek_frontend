"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { prescriptionApi } from "@/lib/tenant-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Printer,
  QrCode,
  ArrowLeft,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rxId = params.id;

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyData, setVerifyData] = useState(null);

  useEffect(() => {
    if (rxId) fetchPrescription();
  }, [rxId]);

  const fetchPrescription = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prescriptionApi.getPrescription(rxId);
      setPrescription(res.data?.data || res.data);
    } catch (err) {
      setError(err.userMessage || "Failed to load prescription details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifyModal(true);
    setVerifyData(null);
    try {
      const res = await prescriptionApi.verifyPrescription(rxId);
      setVerifyData(res.data?.data || res.data);
    } catch (err) {
      setVerifyData({ valid: false, error: err.userMessage || "Verification failed." });
    }
  };

  const handlePrint = () => {
    const pdfUrl = prescriptionApi.getPdfDownloadUrl(rxId);
    const win = window.open(pdfUrl, "_blank");
    if (win) win.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        Loading prescription details...
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Link href="/dashboard/prescriptions">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Prescriptions
          </Button>
        </Link>
        <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-200 text-sm font-medium">
          {error || "Prescription not found."}
        </div>
      </div>
    );
  }

  const pdfUrl = prescriptionApi.getPdfDownloadUrl(prescription.id);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard/prescriptions" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Prescriptions
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">{prescription.id?.substring(0, 8)}...</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Prescription Summary
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleVerify} className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50">
            <QrCode className="h-4 w-4" />
            Verify QR
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2 border-slate-300">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow">
              <Download className="h-4 w-4" />
              Download Official PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Info */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Patient Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-1 text-xs text-slate-700">
            <div className="font-bold text-slate-900 text-sm">{prescription.patient_name}</div>
            <div><b>MRN:</b> <span className="font-mono">{prescription.patient_mrn}</span></div>
            <div><b>Sex / Age:</b> {prescription.patient_gender || "N/A"}</div>
            <div><b>Weight:</b> {prescription.patient_weight ? `${prescription.patient_weight} kg` : "N/A"}</div>
            <div><b>eGFR:</b> {prescription.patient_egfr ? `${prescription.patient_egfr} mL/min` : "N/A"}</div>
          </CardContent>
        </Card>

        {/* Doctor Info */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600" /> Prescribing Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-1 text-xs text-slate-700">
            <div className="font-bold text-slate-900 text-sm">
              {prescription.doctor_name ? `Dr. ${prescription.doctor_name}` : "N/A"}
            </div>
            <div><b>BMDC Reg:</b> <span className="font-mono">{prescription.doctor_bmdc || "N/A"}</span></div>
            <div><b>Qualification:</b> {prescription.doctor_qualification || "N/A"}</div>
            <div><b>Designation:</b> {prescription.doctor_designation || "N/A"}</div>
            <div><b>Branch:</b> {prescription.branch_name || "Main"}</div>
          </CardContent>
        </Card>

        {/* Security & Verification */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Digital Integrity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              Digitally Signed (HMAC-SHA256)
            </div>
            <div><b>Issued Date:</b> {prescription.prescription_date}</div>
            <div><b>Status:</b> <Badge variant="outline" className="capitalize text-[10px]">{prescription.status}</Badge></div>
            <div><b>Print Count:</b> {prescription.print_count} times</div>
          </CardContent>
        </Card>
      </div>

      {/* Embedded PDF Preview */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>Official ReportLab Prescription Document</span>
            <span className="text-xs text-slate-500 font-normal">Bangladesh Conventional Format</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <iframe
            src={pdfUrl}
            className="w-full h-[650px] rounded border border-slate-200 shadow-inner"
            title="Prescription PDF Preview"
          />
        </CardContent>
      </Card>

      {/* QR Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                Public QR Verification Result
              </CardTitle>
              <button
                onClick={() => setVerifyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!verifyData ? (
                <div className="flex items-center justify-center p-8 gap-2 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  Verifying cryptographic signature...
                </div>
              ) : verifyData.valid ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-md text-sm font-semibold border border-emerald-200">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    Authentic Prescription Verified
                  </div>
                  <div className="text-xs space-y-1 text-slate-700 bg-slate-50 p-3 rounded border font-mono">
                    <div><b>Prescription ID:</b> {verifyData.prescription_id}</div>
                    <div><b>Patient Initials:</b> {verifyData.patient_initials} (MRN: {verifyData.patient_mrn})</div>
                    <div><b>Doctor:</b> {verifyData.doctor_name} (BMDC: {verifyData.doctor_bmdc})</div>
                    <div><b>Branch:</b> {verifyData.branch_name}</div>
                    <div><b>Date:</b> {verifyData.prescription_date}</div>
                    <div><b>Total Drugs:</b> {verifyData.item_count} item(s)</div>
                    <div><b>Digitally Signed:</b> {verifyData.is_digitally_signed ? "Yes" : "No"}</div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm font-semibold border border-red-200">
                  {verifyData.error || "Verification failed."}
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setVerifyModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

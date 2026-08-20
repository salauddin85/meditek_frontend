"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { prescriptionApi } from "@/lib/tenant-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Search,
  Download,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Bookmark,
  CheckCircle,
  AlertCircle,
  Pill,
} from "lucide-react";

export default function PrescriptionsListPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // QR Verify Modal State
  const [selectedVerifyRx, setSelectedVerifyRx] = useState(null);
  const [verifyData, setVerifyData] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Edit Modal State
  const [editingRx, setEditingRx] = useState(null);
  const [editFormData, setEditFormData] = useState({
    notes: "",
    status: "active",
    patient_weight: "",
    patient_egfr: "",
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Delete Modal State
  const [deletingRx, setDeletingRx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const extractList = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.results)) return res.data.results;
        if (Array.isArray(res.data?.data)) return res.data.data;
        if (Array.isArray(res.data?.data?.results)) return res.data.data.results;
        if (Array.isArray(res.results)) return res.results;
        return [];
      };
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await prescriptionApi.getPrescriptions(params);
      const list = extractList(res);
      setPrescriptions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load prescriptions.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQR = async (id) => {
    setSelectedVerifyRx(id);
    setVerifying(true);
    setVerifyData(null);
    try {
      const res = await prescriptionApi.verifyPrescription(id);
      setVerifyData(res.data?.data || res.data);
    } catch (err) {
      setVerifyData({ valid: false, error: err.userMessage || "Invalid prescription or QR code." });
    } finally {
      setVerifying(false);
    }
  };

  const openEditModal = (rx) => {
    setEditingRx(rx);
    setEditFormData({
      notes: rx.notes || "",
      status: rx.status || "active",
      patient_weight: rx.patient_weight || "",
      patient_egfr: rx.patient_egfr || "",
    });
    setUpdateError("");
  };

  const handleUpdatePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!editingRx) return;
    setUpdating(true);
    setUpdateError("");
    try {
      await prescriptionApi.updatePrescription(editingRx.id, {
        notes: editFormData.notes.trim(),
        status: editFormData.status,
        patient_weight: editFormData.patient_weight ? parseFloat(editFormData.patient_weight) : null,
        patient_egfr: editFormData.patient_egfr ? parseFloat(editFormData.patient_egfr) : null,
      });
      setEditingRx(null);
      fetchPrescriptions();
    } catch (err) {
      setUpdateError(err.userMessage || "Failed to update prescription.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePrescriptionSubmit = async () => {
    if (!deletingRx) return;
    setDeleting(true);
    try {
      await prescriptionApi.deletePrescription(deletingRx.id);
      setDeletingRx(null);
      fetchPrescriptions();
    } catch (err) {
      alert(err.userMessage || "Failed to delete prescription.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const term = search.toLowerCase();
    const pName = rx.patient_name?.toLowerCase() || "";
    const pMrn = rx.patient_mrn?.toLowerCase() || "";
    const dName = rx.doctor_name?.toLowerCase() || "";
    const id = rx.id?.toLowerCase() || "";
    return pName.includes(term) || pMrn.includes(term) || dName.includes(term) || id.includes(term);
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Prescription Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Structured drug entry, interaction checking, digital signatures, edit/void & QR verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/prescriptions/drugs">
            <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Pill className="h-4 w-4" />
              Drug Registry
            </Button>
          </Link>
          <Link href="/dashboard/prescriptions/templates">
            <Button variant="outline" className="gap-2 border-slate-300">
              <Bookmark className="h-4 w-4 text-purple-600" />
              Templates
            </Button>
          </Link>
          <Link href="/dashboard/prescriptions/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow">
              <Plus className="h-4 w-4" />
              Write Prescription
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Patient Name, MRN, Doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="dispensed">Dispensed</option>
              <option value="partially_dispensed">Partially Dispensed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">
            Prescription Records ({filteredPrescriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading prescriptions...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 bg-red-50 text-sm font-medium">
              {error}
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No prescriptions found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Medicines</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-24 text-center">Prints</TableHead>
                  <TableHead className="w-48 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((rx) => (
                  <TableRow key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-mono text-xs text-slate-600 font-medium">
                      {rx.prescription_date}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 text-sm">{rx.patient_name}</div>
                      <div className="text-xs text-slate-500 font-mono">MRN: {rx.patient_mrn}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-800">
                        {rx.doctor_name ? `Dr. ${rx.doctor_name}` : "N/A"}
                      </div>
                      <div className="text-xs text-slate-400">{rx.doctor_qualification || rx.branch_name}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {rx.items?.length || 0} Drug(s)
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          rx.status === "active"
                            ? "default"
                            : rx.status === "dispensed"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize text-xs font-semibold"
                      >
                        {rx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-500 font-mono">
                      {rx.print_count || 0}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/prescriptions/${rx.id}`}>
                          <Button size="icon" variant="ghost" title="View Prescription" className="h-8 w-8 text-slate-600 hover:text-blue-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit Prescription"
                          onClick={() => openEditModal(rx)}
                          className="h-8 w-8 text-slate-600 hover:text-amber-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete / Void Prescription"
                          onClick={() => setDeletingRx(rx)}
                          className="h-8 w-8 text-slate-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <a
                          href={prescriptionApi.getPdfDownloadUrl(rx.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download PDF"
                        >
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-emerald-600">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>

                        <Button
                          size="icon"
                          variant="ghost"
                          title="Verify QR Code"
                          onClick={() => handleVerifyQR(rx.id)}
                          className="h-8 w-8 text-slate-600 hover:text-purple-600"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Prescription Modal */}
      {editingRx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                Edit Prescription (Rx #{editingRx.id.substring(0, 8)})
              </CardTitle>
              <button
                onClick={() => setEditingRx(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {updateError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-semibold">
                  {updateError}
                </div>
              )}

              <form onSubmit={handleUpdatePrescriptionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled (Void)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Patient Weight (kg)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 68.5"
                      value={editFormData.patient_weight}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, patient_weight: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Patient eGFR (mL/min)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 75.0"
                      value={editFormData.patient_egfr}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, patient_egfr: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Doctor Advice & Notes
                  </label>
                  <Textarea
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="text-sm bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingRx(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updating}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  >
                    {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes & Re-sign PDF
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Confirm Prescription Deletion
              </CardTitle>
              <button
                onClick={() => setDeletingRx(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete prescription for patient <b>{deletingRx.patient_name}</b> (MRN: {deletingRx.patient_mrn})? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeletingRx(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeletePrescriptionSubmit}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete Prescription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Verification Modal */}
      {selectedVerifyRx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                Public QR Code Verification
              </CardTitle>
              <button
                onClick={() => setSelectedVerifyRx(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {verifying ? (
                <div className="flex items-center justify-center p-8 gap-2 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  Verifying cryptographic signature...
                </div>
              ) : verifyData?.valid ? (
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
                    <div><b>Digitally Signed:</b> {verifyData.is_digitally_signed ? "Yes (HMAC SHA-256)" : "No"}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md text-sm font-semibold border border-red-200">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {verifyData?.error || "Prescription record not found."}
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedVerifyRx(null)}>
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

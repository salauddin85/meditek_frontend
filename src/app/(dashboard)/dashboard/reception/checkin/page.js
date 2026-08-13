"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  UserCheck,
  QrCode,
  UserPlus,
  Calendar,
  Search,
  CheckCircle2,
  Printer,
  Loader2,
  ArrowLeft,
  X,
  User,
  Phone,
  Building2,
  Clock,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import { receptionApi, branchesApi, staffApi, schedulingApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const safeFormatDate = (dateStr, pattern = "dd/MM/yyyy hh:mm a") => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return format(d, pattern);
  } catch {
    return "—";
  }
};

const ensureArray = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.data)) return resData.data;
  if (Array.isArray(resData.results)) return resData.results;
  if (Array.isArray(resData.data?.results)) return resData.data.results;
  return [];
};

export default function FrontDeskCheckInPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("qr"); // qr | new | appointment
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Tab 1: Rapid QR / MRN state
  const [qrInput, setQrInput] = useState("");
  const [processingQr, setProcessingQr] = useState(false);
  const qrInputRef = useRef(null);

  // Tab 2: New Patient Fast Register state
  const [newPatient, setNewPatient] = useState({
    full_name: "",
    gender: "male",
    phone: "",
    age_years: "",
    doctor_id: "",
    appointment_date: format(new Date(), "yyyy-MM-dd"),
    selected_slot_id: "",
    is_overbook: false,
  });
  const [registering, setRegistering] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Tab 3: Today's Scheduled Appointments state
  const [todayAppts, setTodayAppts] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [apptSearch, setApptSearch] = useState("");

  // Printed token modal
  const [issuedToken, setIssuedToken] = useState(null);
  const [printPayload, setPrintPayload] = useState(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [brRes, docRes] = await Promise.all([
          branchesApi.getBranches().catch(() => ({ data: [] })),
          staffApi.getDoctors().catch(() => ({ data: [] })),
        ]);
        const branchList = ensureArray(brRes.data);
        const doctorList = ensureArray(docRes.data);

        setBranches(branchList);
        setDoctors(doctorList);

        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
        }
        if (doctorList.length > 0) {
          setNewPatient((prev) => ({
            ...prev,
            doctor_id: prev.doctor_id || doctorList[0].id,
          }));
        }
      } catch {
        toast.error("Failed to load initial reception data.");
      }
    }
    loadData();
  }, []);

  // Fetch available slots when doctor or date changes in Tab 2
  const fetchDoctorSlots = useCallback(async () => {
    if (!newPatient.doctor_id || !selectedBranchId || !newPatient.appointment_date) return;
    setLoadingSlots(true);
    try {
      const res = await schedulingApi.getSlots({
        doctor_id: newPatient.doctor_id,
        branch_id: selectedBranchId,
        slot_date: newPatient.appointment_date,
      });
      const slots = ensureArray(res.data);
      setAvailableSlots(slots);

      if (slots.length > 0) {
        const firstAvailable = slots.find((s) => s && s.status === "available");
        if (firstAvailable) {
          setNewPatient((prev) => ({
            ...prev,
            selected_slot_id: firstAvailable.id,
            is_overbook: false,
          }));
        } else {
          setNewPatient((prev) => ({
            ...prev,
            selected_slot_id: "",
            is_overbook: true,
          }));
        }
      } else {
        setNewPatient((prev) => ({
          ...prev,
          selected_slot_id: "",
          is_overbook: true,
        }));
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [newPatient.doctor_id, selectedBranchId, newPatient.appointment_date]);

  useEffect(() => {
    if (activeTab === "new") {
      fetchDoctorSlots();
    }
  }, [activeTab, fetchDoctorSlots]);

  // Fetch today's scheduled appointments with backend search
  const fetchTodayAppts = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoadingAppts(true);
    try {
      const params = {
        branch_id: selectedBranchId,
      };
      if (apptSearch.trim()) {
        params.search = apptSearch.trim();
      } else {
        params.date_from = format(new Date(), "yyyy-MM-dd");
      }
      const res = await schedulingApi.getAppointments(params);
      const apptList = ensureArray(res.data);
      setTodayAppts(apptList);
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setLoadingAppts(false);
    }
  }, [selectedBranchId, apptSearch]);

  useEffect(() => {
    if (activeTab === "appointment") {
      const timer = setTimeout(() => {
        fetchTodayAppts();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchTodayAppts, apptSearch]);

  // Focus QR input on mount
  useEffect(() => {
    if (activeTab === "qr" && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [activeTab]);

  // ── Handler 1: Rapid QR Check-In ──────────────────────────
  const handleQrCheckIn = async (e) => {
    if (e) e.preventDefault();
    if (!qrInput.trim()) return toast.error("Please enter or scan MRN / QR Code.");
    setProcessingQr(true);
    try {
      const res = await receptionApi.checkInQR({
        qr_data: qrInput.trim(),
        branch_id: selectedBranchId,
      });
      const token = res.data?.data;
      setIssuedToken(token);
      toast.success(`Check-in successful! Token #${token?.token_number || ""} issued.`);
      setQrInput("");

      if (token?.id) {
        const printRes = await receptionApi.getPrintPayload(token.id);
        setPrintPayload(printRes.data?.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "QR check-in failed.");
    } finally {
      setProcessingQr(false);
    }
  };

  // ── Handler 2: Fast New Patient Check-In & Forward to Payment Counter ──────
  const handleNewPatientCheckIn = async (e) => {
    e.preventDefault();
    if (!newPatient.full_name.trim()) return toast.error("Patient name is required.");
    if (!newPatient.doctor_id) return toast.error("Please select a doctor.");
    setRegistering(true);
    try {
      const res = await receptionApi.checkInNew({
        full_name: newPatient.full_name,
        gender: newPatient.gender,
        phone: newPatient.phone || undefined,
        age_years: newPatient.age_years ? parseInt(newPatient.age_years) : undefined,
        doctor_id: newPatient.doctor_id,
        branch_id: selectedBranchId,
        appointment_date: newPatient.appointment_date,
        slot_id: newPatient.selected_slot_id || undefined,
        is_overbook: newPatient.is_overbook,
      });

      const resData = res.data?.data;
      const apptId = resData?.appointment_id || resData?.appointment;

      toast.success("Walk-in patient registered! Redirecting to payment counter...");

      if (apptId) {
        router.push(`/dashboard/reception/payments?appointment_id=${apptId}`);
      } else {
        toast.success("Registration complete.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "New patient check-in failed.");
    } finally {
      setRegistering(false);
    }
  };

  // ── Handler 3: Appointment Check-In with Payment Enforce ─
  const handleAppointmentCheckIn = async (appt) => {
    if (appt.payment_status !== "paid" && appt.payment_status !== "waived") {
      toast.error("Payment required before check-in. Redirecting to payment counter...");
      router.push(`/dashboard/reception/payments?appointment_id=${appt.id}`);
      return;
    }

    try {
      const res = await receptionApi.checkInAppointment({
        appointment_id: appt.id,
        branch_id: selectedBranchId,
      });
      const token = res.data?.data;
      setIssuedToken(token);
      toast.success("Appointment checked in & token issued!");
      fetchTodayAppts();

      if (token?.id) {
        const printRes = await receptionApi.getPrintPayload(token.id);
        setPrintPayload(printRes.data?.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Check-in failed.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <Link
        href="/dashboard/reception"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Reception Command Center
      </Link>

      {/* Header & Branch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            Front Desk Check-In Suite
          </h1>
          <p className="text-xs text-default-500 mt-1">
            Rapid QR scan, fast new walk-in patient registration, or scheduled appointment check-in.
          </p>
        </div>

        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800"
        >
          {(branches || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>
      </div>

      {/* Check-In Tabs Header */}
      <div className="flex border-b border-border gap-2 bg-default-50 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("qr")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === "qr"
              ? "bg-white dark:bg-card text-primary shadow-sm"
              : "text-default-600 hover:text-default-900"
          }`}
        >
          <QrCode className="w-4 h-4" />
          ⚡ 1-Click QR / MRN Scan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("new")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === "new"
              ? "bg-white dark:bg-card text-primary shadow-sm"
              : "text-default-600 hover:text-default-900"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          👤 Fast Register New Patient
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("appointment")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTab === "appointment"
              ? "bg-white dark:bg-card text-primary shadow-sm"
              : "text-default-600 hover:text-default-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          📅 Scheduled Appointments
        </button>
      </div>

      {/* Tab 1: ⚡ Rapid QR / MRN Lookup */}
      {activeTab === "qr" && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Rapid Patient Scan & Check-In (&lt; 2 Seconds Target)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleQrCheckIn} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-default-700">
                  Scan Barcode / QR or Type Patient MRN
                </label>
                <div className="relative">
                  <Input
                    ref={qrInputRef}
                    placeholder="e.g. BR-01-2026-00004 or Scan QR..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    className="h-12 text-base pl-10 font-mono"
                  />
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={processingQr} className="h-11 px-8 font-bold gap-2">
                  {processingQr ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Check-In Patient
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="bg-default-50 rounded-xl p-4 border border-default-200 text-xs text-default-600 space-y-1">
              <p className="font-bold text-default-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Scanner Ready
              </p>
              <p>
                Point physical USB barcode scanner at patient's card or phone QR code.
                The system automatically verifies scheduled appointments for today, issues visit token, and adds patient to the doctor's live queue.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: 👤 Fast Register New Patient */}
      {activeTab === "new" && (
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Fast Walk-In Registration (&lt; 3 Minutes Target)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleNewPatientCheckIn} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-default-700">Patient Full Name *</label>
                  <Input
                    placeholder="e.g. Mohammad Rahim"
                    value={newPatient.full_name}
                    onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-default-700">Phone Number</label>
                  <Input
                    placeholder="e.g. 01700000000"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-default-700">Gender *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-default-200 bg-background text-sm font-medium"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-default-700">Age (Years)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 35"
                    value={newPatient.age_years}
                    onChange={(e) => setNewPatient({ ...newPatient, age_years: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-default-700">Select Consulting Doctor *</label>
                  <select
                    value={newPatient.doctor_id}
                    onChange={(e) => setNewPatient({ ...newPatient, doctor_id: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-default-200 bg-background text-sm font-medium"
                    required
                  >
                    {(doctors || []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.designation || "Doctor"}) — Fee: ৳{d.consult_fee}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-default-700">Appointment Date *</label>
                  <Input
                    type="date"
                    value={newPatient.appointment_date}
                    onChange={(e) => setNewPatient({ ...newPatient, appointment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-default-700">Available Appointment Serials</label>
                    <button
                      type="button"
                      onClick={() =>
                        setNewPatient((prev) => ({
                          ...prev,
                          is_overbook: !prev.is_overbook,
                          selected_slot_id: !prev.is_overbook ? "" : prev.selected_slot_id,
                        }))
                      }
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                        newPatient.is_overbook
                          ? "bg-amber-500 text-white border-amber-600 shadow"
                          : "bg-default-100 text-default-700 hover:bg-default-200 border-default-300"
                      }`}
                    >
                      {newPatient.is_overbook ? "⚡ Overbook Active" : "⚡ Overbook Patient"}
                    </button>
                  </div>

                  {loadingSlots ? (
                    <div className="py-6 text-center text-default-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                      <p className="text-xs mt-1">Loading available serial slots...</p>
                    </div>
                  ) : newPatient.is_overbook ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Overbook Mode Active: Patient will be issued an emergency overbooked serial.
                    </div>
                  ) : (availableSlots || []).length === 0 ? (
                    <div className="p-3 bg-default-50 border border-border rounded-xl text-xs text-default-500 text-center space-y-1">
                      <p>No regular serial slots found for this date.</p>
                      <button
                        type="button"
                        onClick={() => setNewPatient((prev) => ({ ...prev, is_overbook: true }))}
                        className="text-primary font-bold hover:underline"
                      >
                        Click here to Overbook Patient
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {(availableSlots || []).map((s, idx) => {
                        if (!s) return null;
                        const isSelected = newPatient.selected_slot_id === s.id;
                        const isAvailable = s.status === "available";
                        return (
                          <button
                            key={s.id || idx}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() =>
                              setNewPatient((prev) => ({
                                ...prev,
                                selected_slot_id: s.id,
                                is_overbook: false,
                              }))
                            }
                            className={`p-2 rounded-lg border text-center transition ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary font-bold shadow-md"
                                : isAvailable
                                ? "bg-background hover:bg-default-50 text-default-800 border-default-200"
                                : "bg-default-100 text-default-400 border-default-200 opacity-60 cursor-not-allowed"
                            }`}
                          >
                            <span className="block text-xs font-mono font-bold">
                              #{s.serial_number || idx + 1}
                            </span>
                            <span className="block text-[9px] uppercase tracking-tighter">
                              {s.status || "available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <Button type="submit" disabled={registering} className="h-11 px-8 font-bold gap-2">
                  {registering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Register & Forward to Payment Counter
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: 📅 Scheduled Appointments */}
      {activeTab === "appointment" && (
        <Card className="shadow-lg">
          <CardHeader className="border-b border-border py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Appointments Check-In List ({(todayAppts || []).length})
            </CardTitle>
            <Input
              placeholder="Search patient name, phone, serial #, doctor..."
              value={apptSearch}
              onChange={(e) => setApptSearch(e.target.value)}
              className="max-w-xs text-xs"
            />
          </CardHeader>
          <CardContent className="p-0">
            {loadingAppts ? (
              <div className="py-16 text-center text-default-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-xs font-bold">Searching today's appointments...</p>
              </div>
            ) : (todayAppts || []).length === 0 ? (
              <div className="py-16 text-center text-default-400 text-xs space-y-2">
                <User className="w-8 h-8 mx-auto text-default-300" />
                <p>No appointments found matching search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-default-50 text-default-700 font-bold border-b border-border uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 pl-6">Serial #</th>
                      <th className="p-3">Patient Info</th>
                      <th className="p-3">Doctor & Dept</th>
                      <th className="p-3">Slot / Time</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {(todayAppts || []).map((a) => {
                      if (!a) return null;
                      const isPaid = a.payment_status === "paid" || a.payment_status === "waived";
                      const isCheckedIn = a.status === "checked_in" || a.status === "in_progress" || a.status === "completed";

                      return (
                        <tr key={a.id} className="hover:bg-default-50 transition-colors">
                          <td className="p-3 pl-6 font-mono font-black text-primary text-sm">
                            #{a.serial_number || "—"}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-default-900 block">{a.patient_name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-default-500 font-mono">
                              <span>MRN: {a.patient_mrn}</span>
                              {a.patient_phone && <span>· Phone: {a.patient_phone}</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-default-800 block">{a.doctor_name}</span>
                            <span className="text-[10px] text-default-400 font-medium">
                              {a.doctor_specialization || a.department_name || "General OPD"}
                            </span>
                          </td>
                          <td className="p-3 text-default-600 font-mono">
                            <div>{safeFormatDate(a.appointment_date, "dd/MM/yyyy")}</div>
                            <div className="text-[10px] font-bold text-indigo-600">
                              {a.start_time || `Serial #${a.serial_number}`}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              color={isPaid ? "success" : "destructive"}
                              className="text-[9px] uppercase font-extrabold px-2"
                            >
                              {a.payment_status || "UNPAID"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              color={isCheckedIn ? "success" : "warning"}
                              className="text-[10px] uppercase font-bold"
                            >
                              {a.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right pr-6">
                            {isCheckedIn ? (
                              <Badge color="success" className="text-[10px] font-bold">
                                Already Checked In
                              </Badge>
                            ) : !isPaid ? (
                              <Button
                                size="xs"
                                color="warning"
                                onClick={() => router.push(`/dashboard/reception/payments?appointment_id=${a.id}`)}
                                className="font-bold gap-1"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Pay & Check In
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                onClick={() => handleAppointmentCheckIn(a)}
                                className="font-bold gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Check In & Issue Token
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Issued Token Print Modal (Thermal Receipt Payload) ───── */}
      {issuedToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-default-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Visit Token Issued
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIssuedToken(null);
                  setPrintPayload(null);
                }}
                className="text-default-400 hover:text-default-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Receipt Box (58mm/80mm Style) */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-5 text-center space-y-3 font-mono">
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-amber-700 dark:text-amber-400">
                {issuedToken.branch_name || "MEDITek Hospital"}
              </p>

              <div className="text-4xl font-black text-amber-900 dark:text-amber-200 py-1 border-y border-amber-300/60 border-dashed">
                #{issuedToken.token_number}
              </div>

              <div className="text-xs text-default-800 space-y-1">
                <p className="font-bold text-sm">{issuedToken.patient_name}</p>
                <p className="text-[10px] text-default-500">MRN: {issuedToken.patient_mrn}</p>
                <p className="font-bold text-amber-800 dark:text-amber-300 mt-2">
                  {issuedToken.doctor_name}
                </p>
                <p className="text-[10px] text-default-400">
                  {safeFormatDate(issuedToken.issued_at)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIssuedToken(null);
                  setPrintPayload(null);
                }}
                className="flex-1 font-bold"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 font-bold gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

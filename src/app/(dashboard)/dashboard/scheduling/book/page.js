"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Building2,
  Stethoscope,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Search,
  Plus,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

import { schedulingApi, branchesApi, staffApi, patientApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function BookAppointmentWizardPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Form State
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Patient Search & Select
  const [patientQuery, setPatientQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fast inline patient register modal state
  const [showFastRegister, setShowFastRegister] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("30");
  const [newPatientSex, setNewPatientSex] = useState("male");
  const [registeringPatient, setRegisteringPatient] = useState(false);

  // Booking config
  const [appointmentType, setAppointmentType] = useState("regular");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [bookingSource, setBookingSource] = useState("counter");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quotaError, setQuotaError] = useState(null);

  // Initial fetch: Branches & Doctors
  useEffect(() => {
    async function init() {
      try {
        const [brRes, docRes] = await Promise.all([
          branchesApi.getBranches(),
          staffApi.getDoctors(),
        ]);
        if (brRes.data?.data) {
          setBranches(brRes.data.data);
          if (brRes.data.data.length > 0) {
            setSelectedBranchId(brRes.data.data[0].id);
          }
        }
        if (docRes.data?.data) setDoctors(docRes.data.data);
      } catch (err) {
        toast.error("Failed to load initial scheduling options.");
      }
    }
    init();
  }, []);

  // Fetch Slots when Doctor + Branch + Date change
  useEffect(() => {
    if (selectedDoctor && selectedBranchId && selectedDate) {
      async function loadSlots() {
        setLoadingSlots(true);
        try {
          const res = await schedulingApi.getSlots({
            doctor_id: selectedDoctor.id,
            branch_id: selectedBranchId,
            date: selectedDate,
          });
          if (res.data?.data) {
            setSlots(res.data.data);
          }
        } catch (err) {
          toast.error("Failed to load availability slots.");
        } finally {
          setLoadingSlots(false);
        }
      }
      loadSlots();
    }
  }, [selectedDoctor, selectedBranchId, selectedDate]);

  // Load Patients list
  const loadPatientsList = useCallback(async (query = "") => {
    setSearchingPatients(true);
    try {
      const res = await patientApi.getPatients({
        search: query.trim() || undefined,
      });
      const rawData = res.data?.data;
      const list = Array.isArray(rawData) ? rawData : rawData?.results || [];
      setPatients(list);
    } catch (err) {
      // Silently handled
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  // Auto-load patients whenever Step 3 is reached
  useEffect(() => {
    if (step === 3) {
      loadPatientsList(patientQuery);
    }
  }, [step, loadPatientsList]);

  // Search Patients Handler
  const handleSearchPatients = (query) => {
    setPatientQuery(query);
    loadPatientsList(query);
  };

  // Inline fast patient register
  const handleFastRegisterPatient = async () => {
    if (!newPatientName.trim()) {
      toast.error("Patient name is required.");
      return;
    }
    if (!selectedBranchId) {
      toast.error("Please select a branch in Step 1 first.");
      return;
    }
    setRegisteringPatient(true);
    try {
      const res = await patientApi.createPatient({
        full_name: newPatientName,
        phone: newPatientPhone || null,
        branch: selectedBranchId,
        age_estimated: parseInt(newPatientAge || "30", 10),
        is_age_estimated: true,
        sex: newPatientSex || "male",
      });
      if (res.data?.data) {
        setSelectedPatient(res.data.data);
        setShowFastRegister(false);
        setNewPatientName("");
        setNewPatientPhone("");
        toast.success("Patient registered and selected!");
        loadPatientsList(); // Refresh list
      }
    } catch (err) {
      const errRes = err?.response?.data;
      let errorMsg = errRes?.message || "Failed to register patient.";
      if (errRes?.data) {
        if (typeof errRes.data === "object") {
          errorMsg = Object.entries(errRes.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" | ");
        }
      }
      toast.error(errorMsg);
    } finally {
      setRegisteringPatient(false);
    }
  };

  // Submit Booking
  const handleFinalBooking = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedBranchId) return;

    setSubmitting(true);
    setQuotaError(null);

    try {
      const res = await schedulingApi.bookAppointment({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        branch_id: selectedBranchId,
        slot_id: selectedSlot?.id || null,
        appointment_date: selectedDate,
        appointment_type: appointmentType,
        session_type: selectedSlot?.session_type || "timed",
        start_time: selectedSlot?.start_time || null,
        serial_number: selectedSlot?.serial_number || null,
        consult_fee: selectedDoctor.consult_fee,
        payment_status: paymentStatus,
        booking_source: bookingSource,
        notes: notes,
      });

      if (res.data?.data) {
        toast.success("Appointment booked successfully!");
        router.push("/dashboard/scheduling/appointments");
      }
    } catch (err) {
      const errData = err?.response?.data;
      if (errData?.data?.error_code === "QUOTA_EXCEEDED") {
        setQuotaError(errData.message || "Monthly appointment quota limit reached.");
      } else {
        toast.error(errData?.message || "Booking failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Breadcrumb */}
      <Link
        href="/dashboard/scheduling"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scheduling Dashboard
      </Link>

      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Book New Appointment
        </h1>
        <p className="text-xs text-default-500 mt-1">
          Follow the 4-step wizard to select doctor, schedule slot, and confirm patient booking.
        </p>
      </div>

      {/* ── Wizard Stepper Bar ── */}
      <div className="grid grid-cols-4 gap-2 bg-card p-2 rounded-xl border border-border">
        {[
          { num: 1, title: "1. Doctor & Branch" },
          { num: 2, title: "2. Date & Slot" },
          { num: 3, title: "3. Select Patient" },
          { num: 4, title: "4. Confirm" },
        ].map((s) => (
          <div
            key={s.num}
            className={`py-2 px-3 rounded-lg text-center font-bold text-xs transition-colors ${
              step === s.num
                ? "bg-primary text-white shadow"
                : step > s.num
                ? "bg-primary/10 text-primary"
                : "bg-default-50 text-default-400"
            }`}
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Select Branch & Doctor ── */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-default-900 flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              Step 1: Select Hospital Branch & Doctor
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="font-semibold text-default-700">Hospital Branch</Label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 rounded-lg border border-default-200 bg-background text-sm font-medium"
                >
                  <option value="">-- Choose Branch --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.district || "Branch"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="font-semibold text-default-700">Attending Doctor</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-default-200 hover:border-primary/50 hover:bg-default-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-default-900 text-sm">Dr. {doc.full_name}</span>
                            <p className="text-xs text-default-500 mt-0.5">{doc.qualification || doc.designation}</p>
                          </div>
                          <Badge color="primary" className="text-[10px] font-mono">
                            ৳{doc.consult_fee || 0}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-default-400 mt-2">
                          Duration: {doc.default_session_duration || 15} mins / session
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              disabled={!selectedBranchId || !selectedDoctor}
              onClick={() => setStep(2)}
              className="font-bold gap-2"
            >
              Next: Select Date & Slot
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ── STEP 2: Date & Slot Picker ── */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="text-lg font-bold text-default-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Step 2: Choose Appointment Date & Slot
              </h2>
              <span className="text-xs font-bold text-primary">Dr. {selectedDoctor?.full_name}</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="font-semibold text-default-700">Appointment Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-64 mt-1.5 font-mono"
                />
              </div>

              <div>
                <Label className="font-semibold text-default-700">Available Slots on {selectedDate}</Label>
                {loadingSlots ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-8 text-center text-default-500 text-xs bg-default-50 rounded-xl mt-2 border border-dashed border-default-200">
                    No open availability slots found for this date. You may proceed with walk-in or general queue.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                    {slots.map((s) => {
                      const isSelected = selectedSlot?.id === s.id;
                      const isBooked = s.status === "booked";
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(s)}
                          className={`p-3 rounded-lg border text-left transition-all text-xs ${
                            isBooked
                              ? "opacity-40 bg-default-100 border-default-200 cursor-not-allowed"
                              : isSelected
                              ? "bg-primary text-white border-primary shadow font-bold"
                              : "bg-background border-default-200 hover:border-primary"
                          }`}
                        >
                          {s.session_type === "serial" ? (
                            <span className="font-extrabold text-sm block">Serial #{s.serial_number}</span>
                          ) : (
                            <span className="font-mono font-bold block">{s.start_time}</span>
                          )}
                          <span className="text-[10px] capitalize block mt-0.5 opacity-80">
                            {isBooked ? "Booked" : s.session_type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="font-bold gap-2">
              Next: Select Patient
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ── STEP 3: Patient Selection ── */}
      {step === 3 && (
        <Card className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="text-lg font-bold text-default-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Step 3: Select or Register Patient
              </h2>

              <Button
                size="sm"
                variant="soft"
                color="info"
                onClick={() => setShowFastRegister(!showFastRegister)}
                className="font-bold gap-1"
              >
                <Plus className="w-4 h-4" />
                {showFastRegister ? "Hide Form" : "Fast Register New Patient"}
              </Button>
            </div>

            {/* Fast Register Form */}
            {showFastRegister && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 mb-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Fast Patient Registration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold">Full Name *</Label>
                    <Input
                      placeholder="Full Name *"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Phone Number</Label>
                    <Input
                      placeholder="Phone"
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Age (Years)</Label>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(e.target.value)}
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Gender / Sex</Label>
                    <select
                      value={newPatientSex}
                      onChange={(e) => setNewPatientSex(e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-lg border border-default-200 bg-background text-xs font-semibold"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-end gap-2">
                    <Button size="xs" variant="outline" onClick={() => setShowFastRegister(false)}>
                      Cancel
                    </Button>
                    <Button size="xs" onClick={handleFastRegisterPatient} disabled={registeringPatient}>
                      {registeringPatient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save & Select"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedPatient ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-default-900">{selectedPatient.full_name}</span>
                    <Badge color="success" className="text-[10px]">
                      MRN: {selectedPatient.mrn}
                    </Badge>
                  </div>
                  <p className="text-xs text-default-500 mt-1 pl-7">
                    Phone: {selectedPatient.phone || "N/A"} | Sex: {selectedPatient.sex || "N/A"}
                  </p>
                </div>
                <Button size="xs" variant="outline" onClick={() => setSelectedPatient(null)}>
                  Change Patient
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                  <Input
                    placeholder="Search patient by MRN, Name, or Phone..."
                    value={patientQuery}
                    onChange={(e) => handleSearchPatients(e.target.value)}
                    className="pl-9 h-10 w-full"
                  />
                </div>

                {searchingPatients ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : patients.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        className="p-3 rounded-xl border border-default-200 hover:border-primary hover:bg-primary/5 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-bold text-default-900 text-sm">{p.full_name}</span>
                          <span className="ml-2 font-mono text-default-500 text-xs">({p.mrn})</span>
                          <p className="text-[11px] text-default-400 mt-0.5">
                            Branch: {p.branch_name || "Primary"} | Gender: {p.sex || "Unknown"}
                          </p>
                        </div>
                        <div className="text-right font-mono font-semibold text-default-700">
                          {p.phone || "No Phone"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-default-500 border border-dashed border-default-200 rounded-xl bg-default-50">
                    No patients found. Click <strong>Fast Register New Patient</strong> above to create one.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button disabled={!selectedPatient} onClick={() => setStep(4)} className="font-bold gap-2">
              Next: Review & Confirm
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ── STEP 4: Summary & Confirm ── */}
      {step === 4 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-default-900 flex items-center gap-2 border-b border-border pb-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Step 4: Booking Summary & Final Confirmation
            </h2>

            {quotaError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-start gap-3 mb-4">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{quotaError}</p>
                  <Link href="/dashboard/settings/billing" className="text-xs underline font-bold hover:text-destructive/80">
                    Upgrade Subscription Plan →
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-default-50 p-4 rounded-xl border border-default-200 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-default-800 uppercase tracking-wider">Appointment Details</h4>
                <p>
                  <span className="text-default-500">Doctor:</span>{" "}
                  <strong className="text-default-900">Dr. {selectedDoctor?.full_name}</strong>
                </p>
                <p>
                  <span className="text-default-500">Date:</span>{" "}
                  <strong className="text-default-900">{selectedDate}</strong>
                </p>
                <p>
                  <span className="text-default-500">Slot / Serial:</span>{" "}
                  <strong className="text-default-900">
                    {selectedSlot
                      ? selectedSlot.session_type === "serial"
                        ? `Serial #${selectedSlot.serial_number}`
                        : selectedSlot.start_time
                      : "General Queue / Walk-in"}
                  </strong>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-default-800 uppercase tracking-wider">Patient & Fee</h4>
                <p>
                  <span className="text-default-500">Patient:</span>{" "}
                  <strong className="text-default-900">{selectedPatient?.full_name}</strong> ({selectedPatient?.mrn})
                </p>
                <p>
                  <span className="text-default-500">Consultation Fee:</span>{" "}
                  <strong className="text-primary text-sm font-extrabold">৳{selectedDoctor?.consult_fee || 0} BDT</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div>
                <Label className="font-semibold text-default-700">Appointment Type</Label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-semibold"
                >
                  <option value="regular">Regular</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <Label className="font-semibold text-default-700">Payment Status</Label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-semibold"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="waived">Waived</option>
                </select>
              </div>

              <div>
                <Label className="font-semibold text-default-700">Booking Source</Label>
                <select
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-semibold"
                >
                  <option value="counter">Counter</option>
                  <option value="phone">Phone</option>
                  <option value="portal">Portal</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <Label className="font-semibold text-default-700">Reception Notes</Label>
              <Input
                placeholder="Optional notes or patient symptoms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button onClick={handleFinalBooking} disabled={submitting} className="font-bold gap-2 min-w-[140px]">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

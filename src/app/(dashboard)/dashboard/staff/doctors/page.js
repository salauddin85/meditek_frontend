"use client";
import { useState, useEffect, useTransition,useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  Loader2,
  UserPlus,
  RefreshCw,
  Search,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import { staffApi, branchesApi, billingApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

const StatusBadge = ({ isActive }) =>
  isActive ? (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      Active
    </span>
  ) : (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
      Inactive
    </span>
  );

// Modal: Create / Edit Doctor Profile
function DoctorFormModal({ doctor, specialties, branches, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: doctor?.full_name || "",
    full_name_bn: doctor?.full_name_bn || "",
    bmdc_reg_number: doctor?.bmdc_reg_number || "",
    bmdc_reg_expiry: doctor?.bmdc_reg_expiry || "",
    qualification: doctor?.qualification || "",
    designation: doctor?.designation || "",
    gender: doctor?.gender || "Male",
    phone: doctor?.phone || "",
    email: doctor?.email || "",
    profile_image_s3_key: doctor?.profile_image_s3_key || "",
    consult_fee: doctor?.consult_fee || "500",
    revenue_share_percent: doctor?.revenue_share_percent || "0",
    default_session_duration: doctor?.default_session_duration || 15,
    specialty_ids: doctor?.specialties?.map((s) => s.id) || [],
    primary_specialty_id: doctor?.specialties?.find((s) => s.is_primary)?.id || doctor?.specialties?.[0]?.id || "",
    branch_id: doctor?.branches?.[0]?.branch?.id || branches?.[0]?.id || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image file size must be less than 5MB.");
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, profile_image_s3_key: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Doctor full name is required.";
    if (!form.bmdc_reg_number.trim()) errs.bmdc_reg_number = "BMDC registration number is required.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        consult_fee: parseFloat(form.consult_fee) || 0,
        revenue_share_percent: parseFloat(form.revenue_share_percent) || 0,
        default_session_duration: parseInt(form.default_session_duration) || 15,
        primary_specialty_id: form.primary_specialty_id || form.specialty_ids[0] || null,
        branch_assignments: form.branch_id ? [{ branch_id: form.branch_id, is_primary: true }] : [],
      };

      if (doctor) {
        await staffApi.updateDoctor(doctor.id, payload);
        toast.success("Doctor profile updated successfully.");
      } else {
        await staffApi.createDoctor(payload);
        toast.success("Doctor profile created successfully.");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.userMessage || "Failed to save doctor profile.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (id) => {
    setForm((prev) => {
      const exists = prev.specialty_ids.includes(id);
      const updated = exists ? prev.specialty_ids.filter((item) => item !== id) : [...prev.specialty_ids, id];
      return {
        ...prev,
        specialty_ids: updated,
        primary_specialty_id: prev.primary_specialty_id || updated[0] || "",
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-default-900">
                {doctor ? "Edit Doctor Profile" : "Register New Doctor"}
              </h2>
              <p className="text-xs text-default-500 mt-0.5">
                BMDC licensed medical professional setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-default-100 transition text-default-400"
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Doctor Profile Photo Upload */}
          <div className="space-y-1.5 bg-default-50 p-3 rounded-xl border border-border">
            <label className="block text-xs font-bold text-default-700">Doctor Profile Photo (Optional)</label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {form.profile_image_s3_key ? (
                  <img src={form.profile_image_s3_key} alt="Doctor" className="w-full h-full object-cover" />
                ) : (
                  <Stethoscope className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-default-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-[10px] text-default-400">Upload doctor avatar photo (Max 5MB). Leave empty for default icon.</p>
              </div>
            </div>
          </div>

          {/* Row 1: Full Name & Bangla Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Mohammad Najmul or Dr. Mohammad Najmul"
                className={`w-full h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.full_name ? "border-destructive" : "border-input"
                }`}
              />
              {errors.full_name && <p className="text-destructive text-xs">{errors.full_name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Name (Bangla)</label>
              <input
                type="text"
                value={form.full_name_bn}
                onChange={(e) => setForm((f) => ({ ...f, full_name_bn: e.target.value }))}
                placeholder="ডাঃ মোহাম্মদ আলী"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Row 2: BMDC Reg & BMDC Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">BMDC Reg No. *</label>
              <input
                type="text"
                value={form.bmdc_reg_number}
                onChange={(e) => setForm((f) => ({ ...f, bmdc_reg_number: e.target.value }))}
                placeholder="A-12345"
                className={`w-full h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.bmdc_reg_number ? "border-destructive" : "border-input"
                }`}
              />
              {errors.bmdc_reg_number && <p className="text-destructive text-xs">{errors.bmdc_reg_number}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">BMDC Expiry Date</label>
              <input
                type="date"
                value={form.bmdc_reg_expiry}
                onChange={(e) => setForm((f) => ({ ...f, bmdc_reg_expiry: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Row 3: Qualification & Designation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Degrees & Qualification</label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}
                placeholder="MBBS, FCPS (Medicine), MD (Cardiology)"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                placeholder="Senior Consultant"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Row 4: Gender, Phone, Email */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+880 1700-000000"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="doctor@meditek.com"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Row 5: Consult Fee, Revenue Share & Slot Mins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Consultation Fee (BDT)</label>
              <input
                type="number"
                value={form.consult_fee}
                onChange={(e) => setForm((f) => ({ ...f, consult_fee: e.target.value }))}
                placeholder="800"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Revenue Share (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.revenue_share_percent}
                onChange={(e) => setForm((f) => ({ ...f, revenue_share_percent: e.target.value }))}
                placeholder="60"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Default Slot Duration (Mins)</label>
              <input
                type="number"
                value={form.default_session_duration}
                onChange={(e) => setForm((f) => ({ ...f, default_session_duration: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Branch & Specialties Selection */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="block text-sm font-semibold text-default-700">Primary Branch</label>
            <select
              value={form.branch_id}
              onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-default-700">Specialties</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-input rounded-lg bg-default-50/50">
              {specialties.map((spec) => {
                const selected = form.specialty_ids.includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => toggleSpecialty(spec.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-default-600 border-input hover:border-primary/50"
                    }`}
                  >
                    {spec.name} ({spec.code})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-input text-sm font-medium hover:bg-default-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              {loading ? "Saving..." : doctor ? "Update Profile" : "Register Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const formatDoctorName = (name) => {
  if (!name) return "";
  return name.trim().startsWith("Dr.") || name.trim().startsWith("Dr ") ? name : `Dr. ${name}`;
};

// Modal: Doctor Schedule Templates Manager
function DoctorScheduleModal({ doctor, branches = [], onClose }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch_id: branches?.[0]?.id || "",
    day_of_week: 0,
    start_time: "09:00",
    end_time: "13:00",
    session_type: "timed",
    slot_duration_mins: doctor?.default_session_duration || 15,
    max_serials: 20,
    max_overbook: 2,
  });

  useEffect(() => {
    if (Array.isArray(branches) && branches.length > 0) {
      setForm((f) => (f.branch_id ? f : { ...f, branch_id: branches[0].id }));
    }
  }, [branches]);

  const DAYS = [
    { value: 0, label: "Monday" },
    { value: 1, label: "Tuesday" },
    { value: 2, label: "Wednesday" },
    { value: 3, label: "Thursday" },
    { value: 4, label: "Friday" },
    { value: 5, label: "Saturday" },
    { value: 6, label: "Sunday" },
  ];

  const fetchSchedules = useCallback(async () => {
    if (!doctor?.id) return;
    setLoading(true);
    try {
      const res = await staffApi.getDoctorSchedules(doctor.id);
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.results)
        ? raw.results
        : Array.isArray(res.data)
        ? res.data
        : [];
      setSchedules(list);
    } catch {
      toast.error("Failed to load doctor schedules.");
    } finally {
      setLoading(false);
    }
  }, [doctor?.id]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!form.branch_id) {
      toast.error("Please select a branch.");
      return;
    }
    setSaving(true);
    try {
      await staffApi.createDoctorSchedule(doctor.id, form);
      toast.success("Schedule template added.");
      fetchSchedules();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.userMessage || "Failed to add schedule.");
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteSchedule = async (tid) => {
    try {
      await staffApi.deleteDoctorSchedule(doctor.id, tid);
      toast.success("Schedule template deleted.");
      fetchSchedules();
    } catch (err) {
      toast.error("Failed to delete schedule.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-default-900">
                Schedules for {doctor.full_name}
              </h2>
              <p className="text-xs text-default-500 mt-0.5">
                Configure weekly consultation templates & session limits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-default-100 transition text-default-400"
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Add New Template Form */}
          <form onSubmit={handleAddSchedule} className="bg-default-50/70 border border-border p-4 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-default-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" /> Add Weekly Shift / Session
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-default-600 mb-1">Branch</label>
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  {(branches || []).map((b) => (
                    <option key={b?.id || b?.name} value={b?.id}>
                      {b?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-600 mb-1">Day of Week</label>
                <select
                  value={form.day_of_week}
                  onChange={(e) => setForm((f) => ({ ...f, day_of_week: parseInt(e.target.value) }))}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-600 mb-1">Session Type</label>
                <select
                  value={form.session_type}
                  onChange={(e) => setForm((f) => ({ ...f, session_type: e.target.value }))}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  <option value="timed">Timed Slot</option>
                  <option value="serial">Sequential Serial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-default-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                />
              </div>

              {form.session_type === "timed" ? (
                <div>
                  <label className="block text-xs font-semibold text-default-600 mb-1">Slot Duration (min)</label>
                  <input
                    type="number"
                    value={form.slot_duration_mins}
                    onChange={(e) => setForm((f) => ({ ...f, slot_duration_mins: parseInt(e.target.value) || 15 }))}
                    className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-default-600 mb-1">Max Serials</label>
                  <input
                    type="number"
                    value={form.max_serials}
                    onChange={(e) => setForm((f) => ({ ...f, max_serials: parseInt(e.target.value) || 20 }))}
                    className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-default-600 mb-1">Max Overbook</label>
                <input
                  type="number"
                  value={form.max_overbook}
                  onChange={(e) => setForm((f) => ({ ...f, max_overbook: parseInt(e.target.value) || 0 }))}
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-md flex items-center gap-1.5 hover:bg-primary/90 transition"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add Schedule
              </button>
            </div>
          </form>

          {/* Active Schedule List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-default-800">Current Schedule Templates</h3>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : (schedules || []).length === 0 ? (
              <div className="py-8 text-center text-default-400 text-sm border border-dashed border-border rounded-xl">
                No schedule templates set yet for {doctor?.full_name || "Doctor"}.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {(schedules || []).map((s, idx) => {
                  if (!s) return null;
                  const dayName = DAYS.find((d) => d.value === s.day_of_week)?.label || "Day " + (s.day_of_week ?? "");
                  return (
                    <div
                      key={s.id || idx}
                      className="p-3 border border-border rounded-xl bg-card flex items-center justify-between hover:border-primary/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {dayName.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-default-900">{dayName}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-default-100 text-default-600 font-mono">
                              {(s.start_time || "").slice(0, 5)} - {(s.end_time || "").slice(0, 5)}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {s.session_type || "timed"}
                            </span>
                          </div>
                          <p className="text-xs text-default-500 mt-0.5">
                            Branch: <strong className="text-default-700">{s.branch_name || "Primary Branch"}</strong> |{" "}
                            {s.session_type === "timed" ? `${s.slot_duration_mins || 15}m slots` : `Max ${s.max_serials || 20} serials`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [branches, setBranches] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [schedulingDoctor, setSchedulingDoctor] = useState(null);
  const [previewImageDoc, setPreviewImageDoc] = useState(null);
  const [isPending, startTransition] = useTransition();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getDoctors({
        search,
        specialty_id: selectedSpecialty || undefined,
        branch_id: selectedBranch || undefined,
      });
      setDoctors(res.data.data || []);
    } catch {
      toast.error("Failed to load doctors list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [specRes, branchRes, usageRes] = await Promise.all([
        staffApi.getSpecialties(),
        branchesApi.getBranches(),
        billingApi.getUsage().catch(() => null),
      ]);
      setSpecialties(specRes.data.data || []);
      setBranches(branchRes.data.data?.results || branchRes.data.data || []);
      if (usageRes?.data?.data) {
        setUsage(usageRes.data.data.doctors);
      }
    } catch {}
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty, selectedBranch]);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    startTransition(() => {
      fetchDoctors();
    });
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Are you sure you want to deactivate this doctor profile?")) return;
    try {
      await staffApi.deactivateDoctor(id);
      toast.success("Doctor profile deactivated.");
      fetchDoctors();
    } catch (err) {
      toast.error("Failed to deactivate doctor.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quota Alert */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-primary" />
            Doctors Directory
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Manage medical professionals, consultation fees, BMDC licences, and schedules.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDoctor(null);
            setShowCreateModal(true);
          }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          <UserPlus className="w-4 h-4" />
          Add Doctor
        </button>
      </div>

      {/* Quota Usage Counter Card */}
      {usage && (
        <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                Doctor Quota Capacity
              </p>
              <p className="text-sm font-bold text-default-900">
                {usage.used} / {usage.unlimited ? "Unlimited" : usage.limit} Active Doctors Registered
              </p>
            </div>
          </div>
          {!usage.unlimited && usage.percentage >= 80 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" /> Near Quota Limit
            </span>
          )}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by doctor name, BMDC, qualification..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-default-700 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:w-auto"
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-default-700 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:w-auto"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchDoctors}
          className="h-9 w-9 rounded-lg border border-input flex items-center justify-center hover:bg-default-50 transition text-default-500 ml-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid of Doctor Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-default-400 mt-2">Loading doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Stethoscope className="w-12 h-12 text-default-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-default-800">No Doctors Found</h3>
          <p className="text-sm text-default-500 mt-1 max-w-md mx-auto">
            Get started by registering your hospital's doctors, consultants, and specialists.
          </p>
          <button
            onClick={() => {
              setEditingDoctor(null);
              setShowCreateModal(true);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add First Doctor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Doctor Card Top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => doc.profile_image_s3_key && setPreviewImageDoc(doc)}
                      className={`w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center border border-primary/20 overflow-hidden shrink-0 transition-all ${
                        doc.profile_image_s3_key
                          ? "cursor-pointer hover:ring-4 hover:ring-primary/30 hover:scale-105"
                          : ""
                      }`}
                      title={doc.profile_image_s3_key ? "Click to view full image preview" : ""}
                    >
                      {doc.profile_image_s3_key ? (
                        <img src={doc.profile_image_s3_key} alt={doc.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <Stethoscope className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-default-900 text-base leading-tight">
                        {doc.full_name}
                      </h3>
                      {doc.designation && (
                        <p className="text-xs font-medium text-primary mt-0.5">{doc.designation}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge isActive={doc.is_active} />
                </div>

                {/* Info Pills */}
                <div className="space-y-1.5 text-xs text-default-600 mb-4">
                  {doc.qualification && (
                    <p className="text-default-700 font-medium">{doc.qualification}</p>
                  )}
                  <p className="flex items-center gap-1.5 text-default-500">
                    <Award className="w-3.5 h-3.5 text-primary" /> BMDC:{" "}
                    <strong className="text-default-700 font-mono">{doc.bmdc_reg_number}</strong>
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-default-500 bg-default-100 dark:bg-default-800/50 px-2.5 py-1.5 rounded-lg border border-border">
                    <span className="truncate mr-1">
                      UUID: <strong className="text-default-800 dark:text-default-200">{doc.id}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(doc.id);
                        toast.success(`Copied UUID for ${doc.full_name}`);
                      }}
                      className="p-1 hover:bg-default-200 dark:hover:bg-default-700 rounded text-primary transition shrink-0"
                      title="Copy Doctor UUID"
                    >
                      <Icon icon="heroicons:document-duplicate" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {doc.phone && (
                    <p className="flex items-center gap-1.5 text-default-500">
                      <Icon icon="heroicons:phone" className="w-3.5 h-3.5 text-primary" /> {doc.phone}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-default-500">
                    <Icon icon="heroicons:banknotes" className="w-3.5 h-3.5 text-emerald-500" /> Fee:{" "}
                    <strong className="text-emerald-600 font-semibold">৳{doc.consult_fee}</strong> BDT
                  </p>
                </div>

                {/* Specialties Chips */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {doc.specialties?.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => setSchedulingDoctor(doc)}
                  className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" /> Schedule Shifts
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingDoctor(doc);
                      setShowCreateModal(true);
                    }}
                    className="p-1.5 rounded-lg border border-input text-default-600 hover:bg-default-100 transition"
                    title="Edit Doctor"
                  >
                    <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                  </button>
                  {doc.is_active && (
                    <button
                      onClick={() => handleDeactivate(doc.id)}
                      className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition"
                      title="Deactivate Doctor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Create / Edit Modal */}
      {showCreateModal && (
        <DoctorFormModal
          doctor={editingDoctor}
          specialties={specialties}
          branches={branches}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDoctor(null);
          }}
          onSuccess={fetchDoctors}
        />
      )}

      {/* Schedule Manager Modal */}
      {schedulingDoctor && (
        <DoctorScheduleModal
          doctor={schedulingDoctor}
          branches={branches}
          onClose={() => setSchedulingDoctor(null)}
        />
      )}

      {/* Doctor Photo Lightbox Modal */}
      {previewImageDoc && (
        <div
          onClick={() => setPreviewImageDoc(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-w-xl w-full relative space-y-4 p-5"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-extrabold text-default-900 text-lg">
                  {previewImageDoc.full_name}
                </h3>
                {previewImageDoc.designation && (
                  <p className="text-xs font-semibold text-primary">{previewImageDoc.designation}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewImageDoc(null)}
                className="p-1.5 rounded-full hover:bg-default-100 transition text-default-500"
              >
                <Icon icon="heroicons:x-mark" className="w-6 h-6" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black/5 flex items-center justify-center max-h-[75vh] p-2">
              <img
                src={previewImageDoc.profile_image_s3_key}
                alt={previewImageDoc.full_name}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

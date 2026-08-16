"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Stethoscope,
  Calendar,
  ClipboardList,
  Search,
  Plus,
  Loader2,
  RefreshCw,
  ShieldAlert,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { clinicalApi, patientApi, staffApi, branchesApi } from "@/lib/tenant-api";

const ENCOUNTER_TYPE_LABELS = {
  opd: "OPD",
  ipd: "IPD",
  emergency: "Emergency",
  telemedicine: "Telemedicine",
  diagnostic_only: "Diagnostic",
  daycare: "Daycare",
};

const STATUS_STYLES = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  closed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-default-200 text-default-500 border-default-300",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[status] || "bg-default-100 text-default-500"}`}
    >
      {status?.replace("_", " ")}
    </span>
  );
}

// New Encounter Modal
function NewEncounterModal({ onClose, onCreated }) {
  const [patients, setPatients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    patient_display: "",
    branch_id: "",
    encounter_type: "opd",
    doctor_id: "",
    chief_complaint: "",
  });

  useEffect(() => {
    Promise.all([
      branchesApi.getBranches(),
      staffApi.getDoctors(),
    ]).then(([bRes, dRes]) => {
      const extractList = (res) => {
        const d = res?.data?.data;
        return d?.results || (Array.isArray(d) ? d : []);
      };
      setBranches(extractList(bRes));
      setDoctors(extractList(dRes));
    }).catch(() => {});
  }, []);

  const searchPatients = async () => {
    if (!patientSearch.trim()) return;
    setSearching(true);
    try {
      const res = await patientApi.searchPatients(patientSearch.trim());
      const list = res.data?.data?.results || res.data?.data || [];
      setPatients(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to search patients.");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) return toast.error("Please select a patient.");
    if (!form.branch_id) return toast.error("Please select a branch.");

    setLoading(true);
    try {
      const payload = {
        patient_id: form.patient_id,
        branch_id: form.branch_id,
        encounter_type: form.encounter_type,
        doctor_id: form.doctor_id || null,
        chief_complaint: form.chief_complaint || null,
      };
      const res = await clinicalApi.createEncounter(payload);
      const encounter = res.data?.data;
      toast.success("Encounter opened successfully.");
      onCreated(encounter);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create encounter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-default-900 text-base">New Clinical Encounter</h3>
              <p className="text-xs text-default-500">Open a patient encounter session</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-default-100 text-default-400">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Patient Search */}
          <div className="space-y-1.5">
            <label className="font-semibold text-default-700 text-xs">Patient *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchPatients())}
                placeholder="Search by name, MRN, or mobile number..."
                className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={searchPatients}
                disabled={searching}
                className="h-9 px-3 rounded-lg bg-default-100 border border-input text-xs font-semibold hover:bg-default-200 disabled:opacity-60"
              >
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>
            {patients.length > 0 && !form.patient_id && (
              <div className="border border-border rounded-lg overflow-hidden bg-card shadow-lg max-h-40 overflow-y-auto">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, patient_id: p.id, patient_display: `${p.full_name} (${p.mrn}${p.phone ? ` - ${p.phone}` : ""})` }));
                      setPatients([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-default-50 text-xs border-b border-border last:border-0"
                  >
                    <span className="font-semibold">{p.full_name}</span>
                    <span className="ml-2 font-mono text-default-400">{p.mrn}</span>
                    {(p.phone || p.mobile) && <span className="ml-2 text-primary font-mono">{p.phone || p.mobile}</span>}
                  </button>
                ))}
              </div>
            )}
            {form.patient_id && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-primary truncate">{form.patient_display}</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, patient_id: "", patient_display: "" }))}
                  className="ml-auto text-default-400 hover:text-default-600"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Branch */}
            <div className="space-y-1">
              <label className="font-semibold text-default-700 text-xs">Branch *</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none"
              >
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Encounter Type */}
            <div className="space-y-1">
              <label className="font-semibold text-default-700 text-xs">Encounter Type</label>
              <select
                value={form.encounter_type}
                onChange={(e) => setForm((f) => ({ ...f, encounter_type: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none"
              >
                {Object.entries(ENCOUNTER_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor */}
          <div className="space-y-1">
            <label className="font-semibold text-default-700 text-xs">Assigned Doctor</label>
            <select
              value={form.doctor_id}
              onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}
              className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none"
            >
              <option value="">Unassigned</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user?.full_name || d.full_name || "Doctor"} - {d.specialization || "General"}
                </option>
              ))}
            </select>
          </div>

          {/* Chief Complaint */}
          <div className="space-y-1">
            <label className="font-semibold text-default-700 text-xs">Chief Complaint</label>
            <textarea
              rows={2}
              value={form.chief_complaint}
              onChange={(e) => setForm((f) => ({ ...f, chief_complaint: e.target.value }))}
              placeholder="Patient's presenting complaint..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-input text-xs font-semibold hover:bg-default-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Open Encounter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClinicalDashboardPage() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchEncounters = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;
      const res = await clinicalApi.getEncounters(params);
      const data = res.data?.data;
      const list = data?.results || (Array.isArray(data) ? data : []);
      setEncounters(list);
    } catch {
      toast.error("Failed to load encounters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncounters();
  }, [filterStatus, filterDate]);

  const stats = {
    open: encounters.filter((e) => e.status === "open").length,
    in_progress: encounters.filter((e) => e.status === "in_progress").length,
    closed: encounters.filter((e) => e.status === "closed").length,
    total: encounters.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Clinical / EMR
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Encounter management, SOAP notes, vitals, diagnoses and clinical records.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          id="clinical-new-encounter-btn"
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Encounter
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Today", value: stats.total, icon: ClipboardList, color: "text-default-700", bg: "bg-default-100" },
          { label: "Open", value: stats.open, icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "In Progress", value: stats.in_progress, icon: Stethoscope, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Closed", value: stats.closed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-default-900">{s.value}</p>
              <p className="text-xs text-default-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-default-600">Date:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-default-600">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          onClick={fetchEncounters}
          className="h-9 w-9 rounded-lg border border-input flex items-center justify-center hover:bg-default-50 text-default-500 ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Encounters Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-default-50/50">
              <tr>
                <th className="h-11 px-4 text-left font-semibold text-default-700 text-xs">Patient</th>
                <th className="h-11 px-4 text-left font-semibold text-default-700 text-xs">Type</th>
                <th className="h-11 px-4 text-left font-semibold text-default-700 text-xs">Doctor</th>
                <th className="h-11 px-4 text-left font-semibold text-default-700 text-xs">Chief Complaint</th>
                <th className="h-11 px-4 text-left font-semibold text-default-700 text-xs">Status</th>
                <th className="h-11 px-4 text-left font-semibold text-default-700 text-xs">Started</th>
                <th className="h-11 px-4 text-right font-semibold text-default-700 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : encounters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center text-default-400 text-sm">
                    No encounters found. Click &quot;New Encounter&quot; to open one.
                  </td>
                </tr>
              ) : (
                encounters.map((enc) => (
                  <tr key={enc.id} className="border-b border-border hover:bg-default-50/50 transition">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-default-900 text-xs">{enc.patient_name}</p>
                        <p className="font-mono text-[11px] text-primary">{enc.patient_mrn}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-default-100 text-default-700 text-[11px] font-semibold">
                        {ENCOUNTER_TYPE_LABELS[enc.encounter_type] || enc.encounter_type}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-default-700">
                      {enc.doctor_name || <span className="text-default-400 italic">Unassigned</span>}
                    </td>
                    <td className="p-4 text-xs text-default-600 max-w-48">
                      <p className="truncate">{enc.chief_complaint || <span className="text-default-400 italic">—</span>}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={enc.status} />
                    </td>
                    <td className="p-4 text-xs text-default-500">
                      {enc.started_at ? new Date(enc.started_at).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/dashboard/clinical/encounter/${enc.id}`}
                        id={`encounter-open-${enc.id}`}
                        className="inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition"
                      >
                        Open
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/patients" className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-default-900 text-sm">Patient Directory</p>
            <p className="text-xs text-default-400">Search & manage patients</p>
          </div>
          <ChevronRight className="w-4 h-4 text-default-400 ml-auto" />
        </Link>

        <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-default-900 text-sm">Break-Glass Access</p>
            <p className="text-xs text-default-400">Emergency record access</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-default-900 text-sm">ICD-10 Search</p>
            <p className="text-xs text-default-400">Find diagnosis codes</p>
          </div>
        </div>
      </div>

      {showNewModal && (
        <NewEncounterModal
          onClose={() => setShowNewModal(false)}
          onCreated={(enc) => {
            fetchEncounters();
            if (enc?.id) window.location.href = `/dashboard/clinical/encounter/${enc.id}`;
          }}
        />
      )}
    </div>
  );
}

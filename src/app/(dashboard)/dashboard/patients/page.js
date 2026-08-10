"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  UserPlus,
  RefreshCw,
  Search,
  Users,
  QrCode,
  Eye,
  Trash2,
  Pencil,
  Phone,
  Calendar,
  ShieldAlert,
  GitMerge,
  Printer,
  X,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { patientApi, branchesApi } from "@/lib/tenant-api";

const getMediaUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const StatusBadge = ({ isActive, isMinor }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {isActive ? (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        Inactive
      </span>
    )}
    {isMinor && (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        Minor (&lt;18)
      </span>
    )}
  </div>
);

// QR Code Viewing & Printing Modal
function QRModal({ patient, onClose }) {
  if (!patient) return null;
  const qrUrl = getMediaUrl(patient.qr_code_s3_key);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient QR - ${patient.mrn}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px solid #333; padding: 20px; border-radius: 12px; display: inline-block; max-width: 300px; }
            img { width: 200px; height: 200px; }
            h2 { margin: 10px 0 4px; font-size: 18px; }
            p { margin: 4px 0; color: #555; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${qrUrl}" alt="Patient QR Code" />
            <h2>${patient.full_name}</h2>
            <p><strong>MRN:</strong> ${patient.mrn}</p>
            <p><strong>Phone:</strong> ${patient.phone || "N/A"}</p>
            <p><strong>DOB:</strong> ${patient.dob || "N/A"} | <strong>Sex:</strong> ${patient.sex?.toUpperCase()}</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-default-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Patient Digital Card
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-default-100 text-default-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {patient.qr_code_s3_key ? (
          <div className="p-4 bg-white rounded-xl border border-default-200 inline-block my-2 shadow-inner">
            <img
              src={qrUrl}
              alt={`QR Code for ${patient.mrn}`}
              className="w-48 h-48 mx-auto object-contain"
            />
          </div>
        ) : (
          <div className="p-8 bg-default-100 rounded-xl my-2 text-default-400 text-sm">
            QR code generating...
          </div>
        )}

        <div className="mt-3">
          <h4 className="font-bold text-default-900 text-base">{patient.full_name}</h4>
          <p className="font-mono text-sm font-semibold text-primary">{patient.mrn}</p>
          <p className="text-xs text-default-500 mt-1">
            {patient.sex?.toUpperCase()} • {patient.phone || "No Phone"} • Blood Group: {patient.blood_group || "N/A"}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-lg border border-input text-xs font-semibold hover:bg-default-50"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Badge
          </button>
        </div>
      </div>
    </div>
  );
}

// QR Code Scanner / Quick Lookup Modal
function QRScanModal({ onClose, onFound }) {
  const [mrnInput, setMrnInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!mrnInput.trim()) return;
    setLoading(true);
    try {
      const res = await patientApi.lookupPatientByQR(mrnInput.trim());
      toast.success("Patient found via MRN lookup.");
      onFound(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || `No patient found with MRN '${mrnInput}'`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-default-900 text-lg">QR & MRN Lookup</h3>
              <p className="text-xs text-default-500">Scan code or enter MRN manually</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-default-100 text-default-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-default-700">Enter MRN / Scan Code</label>
            <input
              type="text"
              autoFocus
              value={mrnInput}
              onChange={(e) => setMrnInput(e.target.value)}
              placeholder="e.g. HQ-2026-00001"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
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
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Lookup Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Patient Demographics Modal
function EditPatientModal({ patient, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    full_name: patient.full_name || "",
    full_name_bn: patient.full_name_bn || "",
    dob: patient.dob || "",
    age_estimated: patient.age_estimated || "",
    sex: patient.sex || "male",
    blood_group: patient.blood_group || "",
    phone: patient.phone || "",
    phone_alt: patient.phone_alt || "",
    email: patient.email || "",
    address_line: patient.address_line || "",
    division: patient.division || "",
    district: patient.district || "",
    upazila: patient.upazila || "",
    union_name: patient.union_name || "",
    nid_number: patient.nid_number || "",
    birth_cert_number: patient.birth_cert_number || "",
    is_active: patient.is_active ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const payload = {
      ...form,
      dob: form.dob || null,
      age_estimated: form.age_estimated ? parseInt(form.age_estimated) : null,
      phone: form.phone || null,
      phone_alt: form.phone_alt || null,
      email: form.email || null,
      nid_number: form.nid_number || null,
      birth_cert_number: form.birth_cert_number || null,
    };

    try {
      await patientApi.updatePatient(patient.id, payload);
      toast.success("Patient record updated successfully!");
      onUpdated();
      onClose();
    } catch (err) {
      if (err?.response?.data?.data && typeof err.response.data.data === "object") {
        setErrors(err.response.data.data);
      }
      toast.error(err?.response?.data?.message || "Failed to update patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-default-900 text-lg">Edit Patient Profile</h3>
              <p className="text-xs font-mono text-primary">MRN: {patient.mrn}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-default-100 text-default-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Full Name *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
              {errors.full_name && <p className="text-rose-500 text-[11px]">{errors.full_name[0]}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-default-700">Bangla Name</label>
              <input
                type="text"
                value={form.full_name_bn}
                onChange={(e) => setForm((f) => ({ ...f, full_name_bn: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Sex *</label>
              <select
                value={form.sex}
                onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-default-700">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
              {errors.dob && <p className="text-rose-500 text-[11px]">{errors.dob[0]}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-default-700">Blood Group</label>
              <select
                value={form.blood_group}
                onChange={(e) => setForm((f) => ({ ...f, blood_group: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs"
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Alt Phone</label>
              <input
                type="text"
                value={form.phone_alt}
                onChange={(e) => setForm((f) => ({ ...f, phone_alt: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-default-700">NID Number</label>
              <input
                type="text"
                value={form.nid_number}
                onChange={(e) => setForm((f) => ({ ...f, nid_number: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-default-700">Birth Certificate</label>
              <input
                type="text"
                value={form.birth_cert_number}
                onChange={(e) => setForm((f) => ({ ...f, birth_cert_number: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-default-700">Address Line</label>
            <input
              type="text"
              value={form.address_line}
              onChange={(e) => setForm((f) => ({ ...f, address_line: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-input font-semibold hover:bg-default-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Patient Detail Drawer / Modal
function PatientDetailDrawer({ patientId, onClose }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      patientApi
        .getPatient(patientId)
        .then((res) => setPatient(res.data.data))
        .catch(() => toast.error("Failed to load patient detail."))
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (!patientId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-card border-l border-border h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-default-50/50 flex items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {patient?.full_name ? patient.full_name.charAt(0) : "P"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-default-900">{patient?.full_name || "Loading..."}</h2>
              <p className="text-xs font-mono font-semibold text-primary">{patient?.mrn}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-default-100 text-default-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : patient ? (
          <div className="p-6 space-y-6 flex-1">
            {/* Overview Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-default-50 p-3 rounded-xl border border-border">
                <p className="text-[11px] text-default-400 font-medium uppercase">Sex</p>
                <p className="text-sm font-semibold text-default-900 capitalize">{patient.sex}</p>
              </div>
              <div className="bg-default-50 p-3 rounded-xl border border-border">
                <p className="text-[11px] text-default-400 font-medium uppercase">Blood Group</p>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{patient.blood_group || "N/A"}</p>
              </div>
              <div className="bg-default-50 p-3 rounded-xl border border-border">
                <p className="text-[11px] text-default-400 font-medium uppercase">DOB</p>
                <p className="text-sm font-semibold text-default-900">{patient.dob || "Estimated"}</p>
              </div>
              <div className="bg-default-50 p-3 rounded-xl border border-border">
                <p className="text-[11px] text-default-400 font-medium uppercase">Status</p>
                <StatusBadge isActive={patient.is_active} isMinor={patient.is_minor} />
              </div>
            </div>

            {/* Demographics & Identifiers */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-default-400 border-b border-border pb-1">
                Demographics & Identifiers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-default-500">Name (Bangla):</span>{" "}
                  <span className="font-medium text-default-900">{patient.full_name_bn || "—"}</span>
                </div>
                <div>
                  <span className="text-default-500">Branch:</span>{" "}
                  <span className="font-medium text-default-900">{patient.branch?.name}</span>
                </div>
                <div>
                  <span className="text-default-500">Phone:</span>{" "}
                  <span className="font-medium text-default-900">{patient.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-default-500">Alt Phone:</span>{" "}
                  <span className="font-medium text-default-900">{patient.phone_alt || "—"}</span>
                </div>
                <div>
                  <span className="text-default-500">Email:</span>{" "}
                  <span className="font-medium text-default-900">{patient.email || "—"}</span>
                </div>
                <div>
                  <span className="text-default-500">NID Number:</span>{" "}
                  <span className="font-mono font-medium text-default-900">{patient.nid_number || "—"}</span>
                </div>
                <div>
                  <span className="text-default-500">Birth Cert:</span>{" "}
                  <span className="font-mono font-medium text-default-900">{patient.birth_cert_number || "—"}</span>
                </div>
                <div>
                  <span className="text-default-500">Registered By:</span>{" "}
                  <span className="font-medium text-default-900">{patient.registered_by_name || "System"}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-default-400 border-b border-border pb-1">
                Address
              </h3>
              <p className="text-sm text-default-800">
                {[patient.address_line, patient.union_name, patient.upazila, patient.district, patient.division]
                  .filter(Boolean)
                  .join(", ") || "No address on file."}
              </p>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-default-400 border-b border-border pb-1">
                Emergency Contacts
              </h3>
              {patient.contacts && patient.contacts.length > 0 ? (
                <div className="space-y-2">
                  {patient.contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-default-50/50"
                    >
                      <div>
                        <p className="font-semibold text-sm text-default-900">
                          {c.name}{" "}
                          {c.is_primary && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold uppercase">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-default-500">{c.relationship || "Contact"}</p>
                      </div>
                      <p className="font-mono text-sm font-semibold text-default-800">{c.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-default-400 italic">No emergency contacts recorded.</p>
              )}
            </div>

            {/* Family & Guardian Links */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-default-400 border-b border-border pb-1">
                Family & Guardian Links
              </h3>
              {patient.family_links && patient.family_links.length > 0 ? (
                <div className="space-y-2">
                  {patient.family_links.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-default-50/50"
                    >
                      <div>
                        <p className="font-semibold text-sm text-default-900">{f.linked_patient_name}</p>
                        <p className="text-xs text-default-500 capitalize">
                          {f.relationship} • MRN: {f.linked_patient_mrn}
                        </p>
                      </div>
                      {f.is_guardian && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold uppercase">
                          Guardian
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-default-400 italic">No linked family members.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [qrModalPatient, setQrModalPatient] = useState(null);
  const [showQRScanModal, setShowQRScanModal] = useState(false);
  const [detailPatientId, setDetailPatientId] = useState(null);
  const [editPatient, setEditPatient] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await patientApi.getPatients({
        search,
        branch_id: selectedBranch || undefined,
      });
      const list =
        res.data?.data?.results ||
        res.data?.data ||
        res.data?.results ||
        (Array.isArray(res.data) ? res.data : []);
      setPatients(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load patient records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    branchesApi
      .getBranches()
      .then((res) => {
        setBranches(res.data.data?.results || res.data.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [selectedBranch]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to soft-delete patient record for '${name}'?`)) return;
    try {
      await patientApi.deletePatient(id);
      toast.success("Patient record deleted.");
      fetchPatients();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete patient.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Patient Directory
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Registered patients, MRN lookup, digital QR cards, and demographic management.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowQRScanModal(true)}
            className="h-10 px-3.5 rounded-lg border border-input bg-card text-default-700 text-sm font-semibold flex items-center gap-2 hover:bg-default-50 transition"
          >
            <QrCode className="w-4 h-4 text-primary" />
            Scan / Lookup
          </button>
          <Link
            href="/dashboard/patients/merge"
            className="h-10 px-3.5 rounded-lg border border-input bg-card text-default-700 text-sm font-semibold flex items-center gap-2 hover:bg-default-50 transition"
          >
            <GitMerge className="w-4 h-4 text-amber-500" />
            Merge Records
          </Link>
          <Link
            href="/dashboard/patients/register"
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" />
            Register Patient
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPatients()}
            placeholder="Search by name, MRN, phone, NID number..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

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
          onClick={fetchPatients}
          className="h-9 w-9 rounded-lg border border-input flex items-center justify-center hover:bg-default-50 transition text-default-500 ml-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-default-50/50">
              <tr>
                <th className="h-12 px-4 text-left font-semibold text-default-800">MRN</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Patient Name</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Sex / Blood</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Phone / NID</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Branch</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Flags</th>
                <th className="h-12 px-4 text-right font-semibold text-default-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center text-default-400">
                    No patient records found. Click "Register Patient" to add a new record.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-default-50/50 transition">
                    <td className="p-4">
                      <button
                        onClick={() => setDetailPatientId(p.id)}
                        className="font-mono font-bold text-xs text-primary hover:underline"
                      >
                        {p.mrn}
                      </button>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-default-900">{p.full_name}</p>
                        {p.full_name_bn && <p className="text-xs text-default-400">{p.full_name_bn}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        <span className="capitalize font-medium text-default-800">{p.sex}</span>
                        {p.blood_group && (
                          <span className="ml-2 font-bold text-rose-600 dark:text-rose-400">
                            {p.blood_group}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-default-700">
                      <p className="font-medium">{p.phone || "—"}</p>
                      {p.nid_number && <p className="text-default-400 font-mono">NID: {p.nid_number}</p>}
                    </td>
                    <td className="p-4 text-xs font-medium text-default-700">{p.branch_name || "—"}</td>
                    <td className="p-4">
                      <StatusBadge isActive={p.is_active} isMinor={p.is_minor} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setQrModalPatient(p)}
                          className="p-1.5 rounded-lg border border-input text-default-600 hover:bg-default-100 transition"
                          title="View Digital QR Card"
                        >
                          <QrCode className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => setDetailPatientId(p.id)}
                          className="p-1.5 rounded-lg border border-input text-default-600 hover:bg-default-100 transition"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditPatient(p)}
                          className="p-1.5 rounded-lg border border-input text-default-600 hover:bg-default-100 transition"
                          title="Edit Patient Record"
                        >
                          <Pencil className="w-4 h-4 text-amber-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.full_name)}
                          className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition"
                          title="Delete Patient Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Card Modal */}
      {qrModalPatient && <QRModal patient={qrModalPatient} onClose={() => setQrModalPatient(null)} />}

      {/* QR Scan Modal */}
      {showQRScanModal && (
        <QRScanModal
          onClose={() => setShowQRScanModal(false)}
          onFound={(foundPatient) => setDetailPatientId(foundPatient.id)}
        />
      )}

      {/* Patient Detail Drawer */}
      {detailPatientId && (
        <PatientDetailDrawer patientId={detailPatientId} onClose={() => setDetailPatientId(null)} />
      )}

      {/* Edit Patient Modal */}
      {editPatient && (
        <EditPatientModal
          patient={editPatient}
          onClose={() => setEditPatient(null)}
          onUpdated={fetchPatients}
        />
      )}
    </div>
  );
}

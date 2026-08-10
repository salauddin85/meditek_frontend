"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Loader2,
  ChevronLeft,
  AlertTriangle,
  Users,
  Building2,
  Phone,
  Calendar,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Link2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { patientApi, branchesApi } from "@/lib/tenant-api";

export default function PatientRegisterPage() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [errors, setErrors] = useState({});

  // Form State
  const [form, setForm] = useState({
    branch: "",
    full_name: "",
    full_name_bn: "",
    dob: "",
    age_estimated: "",
    is_age_estimated: false,
    sex: "male",
    blood_group: "",
    phone: "",
    phone_alt: "",
    email: "",
    address_line: "",
    division: "",
    district: "",
    upazila: "",
    union_name: "",
    nid_number: "",
    birth_cert_number: "",
    contacts: [],
    family_links: [],
  });

  // Family Link Search state
  const [familySearchQuery, setFamilySearchQuery] = useState("");
  const [familySearchResults, setFamilySearchResults] = useState([]);
  const [familySearching, setFamilySearching] = useState(false);

  useEffect(() => {
    branchesApi
      .getBranches()
      .then((res) => {
        const list = res.data.data?.results || res.data.data || [];
        setBranches(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, branch: list[0].id }));
        }
      })
      .catch(() => toast.error("Failed to load branches."));
  }, []);

  const handleAddContact = () => {
    setForm((f) => ({
      ...f,
      contacts: [...f.contacts, { name: "", relationship: "", phone: "", is_primary: f.contacts.length === 0 }],
    }));
  };

  const handleRemoveContact = (index) => {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.filter((_, i) => i !== index),
    }));
  };

  const handleContactChange = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.contacts];
      updated[index][field] = value;
      return { ...f, contacts: updated };
    });
  };

  // Family Member Search
  const handleFamilySearch = async (e) => {
    e.preventDefault();
    if (!familySearchQuery.trim()) return;
    setFamilySearching(true);
    try {
      const res = await patientApi.searchPatients(familySearchQuery.trim());
      setFamilySearchResults(res.data.data || []);
    } catch {
      toast.error("Failed to search patients.");
    } finally {
      setFamilySearching(false);
    }
  };

  const handleAddFamilyLink = (targetPatient) => {
    if (form.family_links.some((l) => l.linked_patient === targetPatient.id)) {
      toast.error("Patient is already added as a family member.");
      return;
    }
    setForm((f) => ({
      ...f,
      family_links: [
        ...f.family_links,
        {
          linked_patient: targetPatient.id,
          linked_patient_name: targetPatient.full_name,
          linked_patient_mrn: targetPatient.mrn,
          relationship: "guardian",
          is_guardian: true,
          guardian_has_access: true,
        },
      ],
    }));
    setFamilySearchResults([]);
    setFamilySearchQuery("");
  };

  const handleRemoveFamilyLink = (index) => {
    setForm((f) => ({
      ...f,
      family_links: f.family_links.filter((_, i) => i !== index),
    }));
  };

  const handleFamilyLinkChange = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.family_links];
      updated[index][field] = value;
      return { ...f, family_links: updated };
    });
  };

  const handleSubmit = async (e, forceConfirm = false) => {
    if (e) e.preventDefault();
    setErrors({});

    // Client-side validations
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = ["Full name is required."];
    if (!form.branch) newErrors.branch = ["Please select a branch."];
    if (!form.dob && !form.age_estimated) {
      newErrors.dob = ["Please enter either Date of Birth or estimated age."];
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    setLoading(true);
    setDuplicateWarning(null);

    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      full_name_bn: form.full_name_bn.trim() || null,
      dob: form.dob || null,
      age_estimated: form.age_estimated ? parseInt(form.age_estimated) : null,
      blood_group: form.blood_group || null,
      phone: form.phone.trim() || null,
      phone_alt: form.phone_alt.trim() || null,
      email: form.email.trim() || null,
      address_line: form.address_line.trim() || null,
      division: form.division.trim() || null,
      district: form.district.trim() || null,
      upazila: form.upazila.trim() || null,
      union_name: form.union_name.trim() || null,
      nid_number: form.nid_number.trim() || null,
      birth_cert_number: form.birth_cert_number.trim() || null,
      contacts: form.contacts.filter((c) => c.name.trim() && c.phone.trim()),
      family_links: form.family_links.map((l) => ({
        linked_patient: l.linked_patient,
        relationship: l.relationship,
        is_guardian: l.is_guardian,
        guardian_has_access: l.guardian_has_access,
      })),
      confirm_create: forceConfirm,
    };

    try {
      const res = await patientApi.createPatient(payload);
      const data = res.data.data;

      // Duplicate detection prompt
      if (data?.action_required && data?.duplicate_candidates) {
        setDuplicateWarning(data);
        toast.error("Potential duplicate patients detected!");
        setLoading(false);
        return;
      }

      toast.success("Patient registered successfully!");
      router.push("/dashboard/patients");
    } catch (err) {
      const respData = err?.response?.data;
      if (respData?.data && typeof respData.data === "object") {
        setErrors(respData.data);
      }
      toast.error(respData?.message || err?.userMessage || "Registration failed. Check form errors.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link
          href="/dashboard/patients"
          className="p-2 rounded-lg border border-input bg-card hover:bg-default-100 transition text-default-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Register New Patient
          </h1>
          <p className="text-sm text-default-500">
            Fields marked with <span className="text-rose-500 font-bold">*</span> are required. All other information is optional.
          </p>
        </div>
      </div>

      {/* Global Validation Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-1">
          <p className="font-bold text-rose-700 dark:text-rose-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Form Validation Failed
          </p>
          <ul className="text-xs text-rose-600 dark:text-rose-300 list-disc list-inside space-y-0.5">
            {Object.entries(errors).map(([field, errList]) => (
              <li key={field}>
                <strong className="capitalize">{field.replace("_", " ")}:</strong>{" "}
                {Array.isArray(errList) ? errList.join(", ") : String(errList)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {duplicateWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-lg">
                Potential Duplicate Records Found ({duplicateWarning.duplicate_candidates.length})
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Patients with matching Phone, NID, or Name/DOB already exist in the database. Please review before proceeding.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-default-50 border-b border-border text-default-700 font-semibold">
                <tr>
                  <th className="p-3 text-left">MRN</th>
                  <th className="p-3 text-left">Full Name</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">NID / DOB</th>
                  <th className="p-3 text-left">Branch</th>
                </tr>
              </thead>
              <tbody>
                {duplicateWarning.duplicate_candidates.map((cand) => (
                  <tr key={cand.id} className="border-b border-border hover:bg-default-50">
                    <td className="p-3 font-mono font-bold text-primary">{cand.mrn}</td>
                    <td className="p-3 font-semibold text-default-900">{cand.full_name}</td>
                    <td className="p-3 text-default-700">{cand.phone || "—"}</td>
                    <td className="p-3 text-default-600">
                      {cand.nid_number ? `NID: ${cand.nid_number}` : `DOB: ${cand.dob || "N/A"}`}
                    </td>
                    <td className="p-3 text-default-600">{cand.branch_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setDuplicateWarning(null)}
              className="h-9 px-4 rounded-lg border border-input bg-card text-xs font-semibold hover:bg-default-50"
            >
              Cancel Registration
            </button>
            <button
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="h-9 px-5 rounded-lg bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-700 disabled:opacity-60 shadow-md"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Confirm & Save Duplicate Record
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-default-900 border-b border-border pb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            1. Primary Demographics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">
                Branch <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.branch}
                onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                className={`w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 ${
                  errors.branch ? "border-rose-500 focus:ring-rose-500/30" : "border-input focus:ring-primary/30"
                }`}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              {errors.branch && <p className="text-rose-500 text-[11px]">{errors.branch[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">
                Full Name (English) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Mohammad Rahim"
                className={`w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 ${
                  errors.full_name ? "border-rose-500 focus:ring-rose-500/30" : "border-input focus:ring-primary/30"
                }`}
              />
              {errors.full_name && <p className="text-rose-500 text-[11px]">{errors.full_name[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">
                Full Name (Bangla) <span className="text-default-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={form.full_name_bn}
                onChange={(e) => setForm((f) => ({ ...f, full_name_bn: e.target.value }))}
                placeholder="যেমন: মোহাম্মদ রহিম"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">
                Sex <span className="text-rose-500 font-bold">*</span>
              </label>
              <select
                value={form.sex}
                onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">
                Date of Birth <span className="text-rose-500 font-bold">* (or Age)</span>
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dob: e.target.value, is_age_estimated: false }))
                }
                className={`w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 ${
                  errors.dob ? "border-rose-500 focus:ring-rose-500/30" : "border-input focus:ring-primary/30"
                }`}
              />
              {errors.dob && <p className="text-rose-500 text-[11px]">{errors.dob[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">
                Estimated Age (Years) <span className="text-default-400 font-normal">(If DOB unknown)</span>
              </label>
              <input
                type="number"
                value={form.age_estimated}
                onChange={(e) =>
                  setForm((f) => ({ ...f, age_estimated: e.target.value, is_age_estimated: true }))
                }
                placeholder="e.g. 35"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">
                Blood Group <span className="text-default-400 font-normal">(Optional)</span>
              </label>
              <select
                value={form.blood_group}
                onChange={(e) => setForm((f) => ({ ...f, blood_group: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select Blood Group...</option>
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
        </div>

        {/* Section 2: Contact & Identification (Optional) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-default-900 border-b border-border pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              2. Contact & National Identifiers
            </span>
            <span className="text-xs text-default-400 font-normal">(All Optional)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">Primary Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="01711000111"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.phone && <p className="text-rose-500 text-[11px]">{errors.phone[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">Alternate Phone</label>
              <input
                type="text"
                value={form.phone_alt}
                onChange={(e) => setForm((f) => ({ ...f, phone_alt: e.target.value }))}
                placeholder="01800000000"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="patient@example.com"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.email && <p className="text-rose-500 text-[11px]">{errors.email[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">National ID (NID)</label>
              <input
                type="text"
                value={form.nid_number}
                onChange={(e) => setForm((f) => ({ ...f, nid_number: e.target.value }))}
                placeholder="19901234567890"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.nid_number && <p className="text-rose-500 text-[11px]">{errors.nid_number[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">Birth Certificate Number</label>
              <input
                type="text"
                value={form.birth_cert_number}
                onChange={(e) => setForm((f) => ({ ...f, birth_cert_number: e.target.value }))}
                placeholder="20101234567890123"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.birth_cert_number && <p className="text-rose-500 text-[11px]">{errors.birth_cert_number[0]}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Address (Optional) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-default-900 border-b border-border pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              3. Address (Bangladesh Administration)
            </span>
            <span className="text-xs text-default-400 font-normal">(Optional)</span>
          </h2>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-default-700">Address Line / Street</label>
            <input
              type="text"
              value={form.address_line}
              onChange={(e) => setForm((f) => ({ ...f, address_line: e.target.value }))}
              placeholder="House 12, Road 4, Sector 7"
              className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">Division</label>
              <input
                type="text"
                value={form.division}
                onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
                placeholder="Dhaka"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">District</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                placeholder="Dhaka"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">Upazila / Thana</label>
              <input
                type="text"
                value={form.upazila}
                onChange={(e) => setForm((f) => ({ ...f, upazila: e.target.value }))}
                placeholder="Uttara"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-default-700">Union / Ward</label>
              <input
                type="text"
                value={form.union_name}
                onChange={(e) => setForm((f) => ({ ...f, union_name: e.target.value }))}
                placeholder="Ward 1"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Contacts (Optional) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-base font-bold text-default-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-rose-500" />
              4. Emergency Contacts (Optional)
            </h2>
            <button
              type="button"
              onClick={handleAddContact}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          </div>

          {form.contacts.map((contact, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 rounded-xl bg-default-50 border border-border">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-default-600">Contact Name</label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, "name", e.target.value)}
                  placeholder="Relative name"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-default-600">Relationship</label>
                <input
                  type="text"
                  value={contact.relationship}
                  onChange={(e) => handleContactChange(index, "relationship", e.target.value)}
                  placeholder="Spouse / Parent / Sibling"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-default-600">Phone</label>
                <input
                  type="text"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                  placeholder="01700000000"
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRemoveContact(index)}
                  className="p-1.5 rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10"
                  title="Remove Contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Section 5: Family & Guardian Links (Optional - Solves Requirement #1) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-base font-bold text-default-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-indigo-500" />
              5. Family & Guardian Links (Optional)
            </h2>
            <span className="text-xs text-default-400 font-normal">Link parent / guardian / spouse</span>
          </div>

          {/* Search box to find existing family member */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-default-700">
              Search Existing Patient to Link as Family / Guardian
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
                <input
                  type="text"
                  value={familySearchQuery}
                  onChange={(e) => setFamilySearchQuery(e.target.value)}
                  placeholder="Search by MRN, Name, or Phone..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="button"
                onClick={handleFamilySearch}
                disabled={familySearching}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90"
              >
                {familySearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {familySearchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-background text-xs mt-2">
                {familySearchResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 hover:bg-default-50 flex justify-between items-center transition"
                  >
                    <div>
                      <p className="font-semibold text-default-900">{p.full_name}</p>
                      <p className="text-default-500">{p.phone} • {p.sex} • DOB: {p.dob || "N/A"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddFamilyLink(p)}
                      className="h-7 px-3 rounded-md bg-indigo-600 text-white font-semibold text-[11px] hover:bg-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Link Patient
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Family List */}
          {form.family_links.length > 0 ? (
            <div className="space-y-3 pt-2">
              {form.family_links.map((link, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-default-50 border border-border grid grid-cols-1 md:grid-cols-4 gap-3 items-center"
                >
                  <div>
                    <p className="font-bold text-xs text-default-900">{link.linked_patient_name}</p>
                    <p className="font-mono text-[11px] text-primary">MRN: {link.linked_patient_mrn}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-default-600">Relationship</label>
                    <select
                      value={link.relationship}
                      onChange={(e) => handleFamilyLinkChange(index, "relationship", e.target.value)}
                      className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                    >
                      <option value="guardian">Guardian</option>
                      <option value="parent">Parent</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id={`guardian-${index}`}
                      checked={link.is_guardian}
                      onChange={(e) => handleFamilyLinkChange(index, "is_guardian", e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary/30"
                    />
                    <label htmlFor={`guardian-${index}`} className="text-xs font-semibold text-default-700">
                      Is Legal Guardian?
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveFamilyLink(index)}
                      className="p-1.5 rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10"
                      title="Remove Family Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-default-400 italic">No family or guardian links added yet.</p>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex gap-4 justify-end pt-4">
          <Link
            href="/dashboard/patients"
            className="h-10 px-6 rounded-lg border border-input bg-card text-sm font-semibold hover:bg-default-50 transition flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-8 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "Registering..." : "Save Patient Record"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  FileText,
  Paperclip,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Plus,
  Loader2,
  Save,
  Clock,
  ShieldAlert,
  Search,
  Upload,
  User,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { clinicalApi } from "@/lib/tenant-api";

// Severity Badge for Allergies
function SeverityBadge({ severity }) {
  const styles = {
    mild: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    moderate: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    severe: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    life_threatening: "bg-rose-600 text-white font-extrabold animate-pulse",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border font-bold ${
        styles[severity] || "bg-default-100 text-default-600"
      }`}
    >
      {severity?.replace("_", " ")}
    </span>
  );
}

// SOAP Details Modal
function SoapDetailModal({ soapItem, onClose }) {
  if (!soapItem) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-default-900 text-base">SOAP Note Details</h3>
              <p className="text-xs text-default-500 font-mono">
                Saved: {new Date(soapItem.created_at || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-default-100 text-default-400">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-default-50 border border-border rounded-xl">
            <h4 className="font-bold text-primary text-[11px] uppercase tracking-wider mb-1">Subjective (S)</h4>
            <p className="text-default-800 whitespace-pre-wrap">{soapItem.subjective || "—"}</p>
          </div>

          <div className="p-3 bg-default-50 border border-border rounded-xl">
            <h4 className="font-bold text-primary text-[11px] uppercase tracking-wider mb-1">Objective (O)</h4>
            <p className="text-default-800 whitespace-pre-wrap">{soapItem.objective || "—"}</p>
          </div>

          <div className="p-3 bg-default-50 border border-border rounded-xl">
            <h4 className="font-bold text-primary text-[11px] uppercase tracking-wider mb-1">Assessment (A)</h4>
            <p className="text-default-800 whitespace-pre-wrap">{soapItem.assessment || "—"}</p>
          </div>

          <div className="p-3 bg-default-50 border border-border rounded-xl">
            <h4 className="font-bold text-primary text-[11px] uppercase tracking-wider mb-1">Plan (P)</h4>
            <p className="text-default-800 whitespace-pre-wrap">{soapItem.plan || "—"}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button onClick={onClose} className="h-9 px-5 bg-default-100 hover:bg-default-200 rounded-lg text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EncounterWorkspacePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const encounterId = params.id;

  const [encounter, setEncounter] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [notes, setNotes] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSoap, setSavingSoap] = useState(false);
  const [activeTab, setActiveTab] = useState("soap");

  // Multiple SOAP State & Selection
  const [editingSoapId, setEditingSoapId] = useState(null);
  const [viewingSoapModal, setViewingSoapModal] = useState(null);
  const [soapList, setSoapList] = useState([]);

  const [soap, setSoap] = useState({
    chief_complaint: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  // Notes Form State
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Vitals Form State
  const [vitalForm, setVitalForm] = useState({
    systolic_bp: "",
    diastolic_bp: "",
    heart_rate: "",
    respiratory_rate: "",
    temperature: "",
    spo2: "",
    weight: "",
    height: "",
    confirm_implausible: false,
  });
  const [recordingVital, setRecordingVital] = useState(false);
  const [vitalPlausibilityWarning, setVitalPlausibilityWarning] = useState(null);

  // Diagnosis Form State
  const [icdQuery, setIcdQuery] = useState("");
  const [icdResults, setIcdResults] = useState([]);
  const [searchingIcd, setSearchingIcd] = useState(false);
  const [selectedIcd, setSelectedIcd] = useState(null);
  const [freeTextDiag, setFreeTextDiag] = useState("");
  const [isPrimaryDiag, setIsPrimaryDiag] = useState(false);
  const [addingDiag, setAddingDiag] = useState(false);

  // Attachment Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const encRes = await clinicalApi.getEncounter(encounterId);
      const enc = encRes.data?.data;
      setEncounter(enc);

      // Load active top-level SOAP fields
      setSoap({
        chief_complaint: enc?.chief_complaint || "",
        subjective: enc?.subjective || "",
        objective: enc?.objective || "",
        assessment: enc?.assessment || "",
        plan: enc?.plan || "",
      });

      // Load multiple SOAP entries from specialty_data_json
      const history = enc?.specialty_data_json?.soap_list || [];
      setSoapList(Array.isArray(history) ? history : []);

      const patientUuid = enc?.patient_id || enc?.patient;
      if (patientUuid) {
        clinicalApi.getAllergies(patientUuid).then((res) => {
          setAllergies(res.data?.data || []);
        }).catch(() => {});
      }

      Promise.all([
        clinicalApi.getNotes(encounterId),
        clinicalApi.getDiagnoses(encounterId),
        clinicalApi.getAttachments(encounterId),
      ]).then(([nRes, dRes, aRes]) => {
        setNotes(nRes.data?.data || []);
        setDiagnoses(dRes.data?.data || []);
        setAttachments(aRes.data?.data || []);
      }).catch(() => {});
    } catch {
      toast.error("Failed to load encounter workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (encounterId) loadData();
  }, [encounterId]);

  // Save / Update SOAP Entry
  const handleSaveSoap = async () => {
    setSavingSoap(true);
    try {
      let updatedList = [...soapList];
      const nowStr = new Date().toISOString();

      if (editingSoapId) {
        // Edit existing SOAP entry
        updatedList = updatedList.map((item) =>
          item.id === editingSoapId
            ? { ...item, ...soap, updated_at: nowStr }
            : item
        );
      } else {
        // Create new SOAP entry
        const newItem = {
          id: `soap-${Date.now()}`,
          ...soap,
          created_at: nowStr,
          updated_at: nowStr,
        };
        updatedList = [newItem, ...updatedList];
      }

      const specialty_data_json = {
        ...(encounter?.specialty_data_json || {}),
        soap_list: updatedList,
      };

      const payload = {
        subjective: soap.subjective,
        objective: soap.objective,
        assessment: soap.assessment,
        plan: soap.plan,
        chief_complaint: soap.chief_complaint,
        specialty_data_json,
      };

      const res = await clinicalApi.updateEncounter(encounterId, payload);
      setEncounter(res.data?.data);
      setSoapList(updatedList);
      setEditingSoapId(null);
      toast.success(editingSoapId ? "SOAP note updated." : "New SOAP note saved.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save SOAP notes.");
    } finally {
      setSavingSoap(false);
    }
  };

  // Delete SOAP Entry
  const handleDeleteSoap = async (idToDelete) => {
    if (!confirm("Are you sure you want to delete this SOAP record?")) return;
    try {
      const updatedList = soapList.filter((item) => item.id !== idToDelete);
      const specialty_data_json = {
        ...(encounter?.specialty_data_json || {}),
        soap_list: updatedList,
      };
      const res = await clinicalApi.updateEncounter(encounterId, { specialty_data_json });
      setEncounter(res.data?.data);
      setSoapList(updatedList);
      if (editingSoapId === idToDelete) {
        setEditingSoapId(null);
        setSoap({ chief_complaint: "", subjective: "", objective: "", assessment: "", plan: "" });
      }
      toast.success("SOAP record deleted.");
    } catch {
      toast.error("Failed to delete SOAP record.");
    }
  };

  // Close Encounter
  const handleCloseEncounter = async () => {
    if (!confirm("Are you sure you want to close this encounter? SOAP notes will lock after 24 hours.")) return;
    try {
      const res = await clinicalApi.closeEncounter(encounterId);
      setEncounter(res.data?.data);
      toast.success("Encounter closed. Notes lock scheduled in 24 hours.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to close encounter.");
    }
  };

  // Add Clinical Note / Addendum (Issue 4 fix: send `content`)
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await clinicalApi.addNote(encounterId, {
        content: newNote.trim(),
        note_type: "progress_note",
      });
      setNotes((prev) => [res.data?.data, ...prev]);
      setNewNote("");
      toast.success("Clinical note recorded.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  };

  // Record Vitals (Issue 3 fix)
  const handleRecordVitals = async (e) => {
    e.preventDefault();
    setRecordingVital(true);
    setVitalPlausibilityWarning(null);

    const payload = {};
    if (vitalForm.systolic_bp) payload.systolic_bp = parseInt(vitalForm.systolic_bp);
    if (vitalForm.diastolic_bp) payload.diastolic_bp = parseInt(vitalForm.diastolic_bp);
    if (vitalForm.heart_rate) payload.heart_rate = parseInt(vitalForm.heart_rate);
    if (vitalForm.respiratory_rate) payload.respiratory_rate = parseInt(vitalForm.respiratory_rate);
    if (vitalForm.temperature) payload.temperature = parseFloat(vitalForm.temperature);
    if (vitalForm.spo2) payload.spo2 = parseFloat(vitalForm.spo2);
    if (vitalForm.weight) payload.weight = parseFloat(vitalForm.weight);
    if (vitalForm.height) payload.height = parseFloat(vitalForm.height);
    if (vitalForm.confirm_implausible) payload.confirm_implausible = true;

    try {
      const res = await clinicalApi.recordVitals(encounterId, payload);
      toast.success("Vitals recorded successfully!");
      setVitalForm({
        systolic_bp: "",
        diastolic_bp: "",
        heart_rate: "",
        respiratory_rate: "",
        temperature: "",
        spo2: "",
        weight: "",
        height: "",
        confirm_implausible: false,
      });
      loadData();
    } catch (err) {
      const data = err?.response?.data;
      const flags = data?.data?.implausible_flags || data?.data?.flags;
      if (flags) {
        setVitalPlausibilityWarning(flags);
      }
      toast.error(data?.message || "Failed to record vitals.");
    } finally {
      setRecordingVital(false);
    }
  };

  // ICD-10 Search
  const handleSearchIcd = async () => {
    if (!icdQuery.trim()) return;
    setSearchingIcd(true);
    try {
      const res = await clinicalApi.searchICD10(icdQuery.trim());
      setIcdResults(res.data?.data || []);
    } catch {
      toast.error("Failed to search ICD-10 codes.");
    } finally {
      setSearchingIcd(false);
    }
  };

  // Add Diagnosis
  const handleAddDiagnosis = async (e) => {
    e.preventDefault();
    if (!selectedIcd && !freeTextDiag.trim()) return toast.error("Provide an ICD-10 code or free-text diagnosis.");

    setAddingDiag(true);
    try {
      const payload = {
        icd10_code: selectedIcd?.code || null,
        free_text: freeTextDiag.trim() || null,
        is_primary: isPrimaryDiag,
      };
      const res = await clinicalApi.addDiagnosis(encounterId, payload);
      setDiagnoses((prev) => [...prev, res.data?.data]);
      setSelectedIcd(null);
      setFreeTextDiag("");
      setIcdQuery("");
      setIcdResults([]);
      setIsPrimaryDiag(false);
      if (res.data?.warning) toast(res.data.warning, { icon: "⚠️" });
      else toast.success("Diagnosis added.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add diagnosis.");
    } finally {
      setAddingDiag(false);
    }
  };

  // Upload Attachment
  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!uploadFile) return toast.error("Select a file to upload.");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    if (uploadNotes.trim()) formData.append("notes", uploadNotes.trim());

    try {
      const res = await clinicalApi.uploadAttachment(encounterId, formData);
      setAttachments((prev) => [res.data?.data, ...prev]);
      setUploadFile(null);
      setUploadNotes("");
      toast.success("Attachment uploaded! Virus scan queued.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-semibold">Encounter not found.</p>
        <Link href="/dashboard/clinical" className="text-primary hover:underline text-sm font-semibold">
          ← Back to Clinical Workspace
        </Link>
      </div>
    );
  }

  const isLocked = Boolean(encounter.notes_locked_at);
  const isClosed = encounter.status === "closed";
  const patientUuid = encounter.patient_id || encounter.patient;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/clinical"
            className="p-2 rounded-lg border border-input bg-card hover:bg-default-50 transition text-default-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-default-900">{encounter.patient_name}</h1>
              <span className="font-mono text-xs font-semibold text-primary">{encounter.patient_mrn}</span>
              {isLocked && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Lock className="w-3 h-3" /> Notes Locked (24h)
                </span>
              )}
            </div>
            <p className="text-xs text-default-500 mt-0.5">
              Encounter #{encounter.id.substring(0, 8)} • Type: <span className="font-semibold uppercase">{encounter.encounter_type}</span> • Doctor: <strong className="text-default-800">{encounter.doctor_name || "Unassigned"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {patientUuid && (
            <Link
              href={`/dashboard/clinical/patients/${patientUuid}/timeline`}
              className="h-9 px-3 rounded-lg border border-input bg-card text-xs font-semibold flex items-center gap-1.5 hover:bg-default-50 transition text-default-700"
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              Patient History
            </Link>
          )}

          {!isClosed && (
            <button
              onClick={handleCloseEncounter}
              className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Close Encounter
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Active Allergy Banner (Issue 5 Fix) */}
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-rose-700 dark:text-rose-300 text-xs uppercase tracking-wider">
              Patient Active Allergies ({allergies.length})
            </h3>
            {patientUuid ? (
              <Link
                href={`/dashboard/clinical/patients/${patientUuid}/allergies`}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                Manage Allergies <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <span className="text-[11px] text-default-400">Patient ID unavailable</span>
            )}
          </div>
          {allergies.length === 0 ? (
            <p className="text-xs text-rose-600/80 dark:text-rose-300/80 mt-1 italic">
              No known drug/food allergies recorded for this patient.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {allergies.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-rose-500/20 text-xs shadow-xs">
                  <span className="font-bold text-default-900">{a.substance}</span>
                  <span className="text-default-400">({a.substance_type || a.category})</span>
                  <SeverityBadge severity={a.severity} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        {[
          { id: "soap", label: "SOAP Notes", icon: FileText },
          { id: "vitals", label: "Vitals", icon: Activity },
          { id: "diagnoses", label: "Diagnoses (ICD-10)", icon: Stethoscope },
          { id: "notes", label: "Addenda & Notes", icon: Clock },
          { id: "attachments", label: "Attachments", icon: Paperclip },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-default-500 hover:text-default-800"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SOAP Notes Editor & Multiple SOAP History List (Issue 2 Fix) */}
      {activeTab === "soap" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-default-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {editingSoapId ? "Edit SOAP Note" : "Structured SOAP Editor"}
                </h2>
                <p className="text-xs text-default-400">
                  {editingSoapId ? "Updating existing SOAP record" : "Create or append a SOAP clinical record"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {editingSoapId && (
                  <button
                    onClick={() => {
                      setEditingSoapId(null);
                      setSoap({ chief_complaint: "", subjective: "", objective: "", assessment: "", plan: "" });
                    }}
                    className="h-8 px-3 rounded-lg border border-input text-xs font-semibold hover:bg-default-50"
                  >
                    Cancel Editing
                  </button>
                )}
                <button
                  onClick={handleSaveSoap}
                  disabled={savingSoap || isLocked}
                  className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/20"
                >
                  {savingSoap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editingSoapId ? "Update SOAP Note" : "Save SOAP Note"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-default-700 uppercase tracking-wider">
                  Subjective (S) — Patient Complaints & History
                </label>
                <textarea
                  rows={5}
                  disabled={isLocked}
                  value={soap.subjective}
                  onChange={(e) => setSoap((s) => ({ ...s, subjective: e.target.value }))}
                  placeholder="Patient describes onset, location, duration, characteristics of symptoms..."
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs text-default-700 uppercase tracking-wider">
                  Objective (O) — Examination & Observations
                </label>
                <textarea
                  rows={5}
                  disabled={isLocked}
                  value={soap.objective}
                  onChange={(e) => setSoap((s) => ({ ...s, objective: e.target.value }))}
                  placeholder="Physical exam findings, lab results, clinical measurements..."
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs text-default-700 uppercase tracking-wider">
                  Assessment (A) — Differential & Clinical Impression
                </label>
                <textarea
                  rows={5}
                  disabled={isLocked}
                  value={soap.assessment}
                  onChange={(e) => setSoap((s) => ({ ...s, assessment: e.target.value }))}
                  placeholder="Clinical evaluation, progress assessment, differential diagnoses..."
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs text-default-700 uppercase tracking-wider">
                  Plan (P) — Treatment, Prescriptions & Follow-up
                </label>
                <textarea
                  rows={5}
                  disabled={isLocked}
                  value={soap.plan}
                  onChange={(e) => setSoap((s) => ({ ...s, plan: e.target.value }))}
                  placeholder="Medications ordered, diagnostic tests requested, referral or follow-up instructions..."
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Saved SOAP List Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-default-900 text-sm flex items-center justify-between">
              <span>Saved SOAP Notes History ({soapList.length})</span>
            </h3>

            {soapList.length === 0 ? (
              <div className="p-6 text-center bg-card border border-border rounded-xl text-default-400 text-xs italic">
                No SOAP notes saved yet. Fill out the editor above and click &quot;Save SOAP Note&quot;.
              </div>
            ) : (
              <div className="space-y-3">
                {soapList.map((item, index) => (
                  <div key={item.id || index} className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-default-900">SOAP Record #{soapList.length - index}</span>
                        <span className="text-[11px] text-default-400 font-mono">
                          Saved: {new Date(item.created_at || Date.now()).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingSoapModal(item)}
                          className="h-7 px-2.5 rounded bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>

                        {!isLocked && (
                          <>
                            <button
                              onClick={() => {
                                setEditingSoapId(item.id);
                                setSoap({
                                  chief_complaint: item.chief_complaint || "",
                                  subjective: item.subjective || "",
                                  objective: item.objective || "",
                                  assessment: item.assessment || "",
                                  plan: item.plan || "",
                                });
                                window.scrollTo({ top: 200, behavior: "smooth" });
                              }}
                              className="h-7 px-2.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-500/20 transition flex items-center gap-1 text-[11px]"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteSoap(item.id)}
                              className="h-7 px-2.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-500/20 transition flex items-center gap-1 text-[11px]"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-default-700">
                      {item.subjective && (
                        <div>
                          <span className="font-bold text-primary block text-[10px]">SUBJECTIVE</span>
                          <p className="line-clamp-2">{item.subjective}</p>
                        </div>
                      )}
                      {item.objective && (
                        <div>
                          <span className="font-bold text-primary block text-[10px]">OBJECTIVE</span>
                          <p className="line-clamp-2">{item.objective}</p>
                        </div>
                      )}
                      {item.assessment && (
                        <div>
                          <span className="font-bold text-primary block text-[10px]">ASSESSMENT</span>
                          <p className="line-clamp-2">{item.assessment}</p>
                        </div>
                      )}
                      {item.plan && (
                        <div>
                          <span className="font-bold text-primary block text-[10px]">PLAN</span>
                          <p className="line-clamp-2">{item.plan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Vitals */}
      {activeTab === "vitals" && (
        <div className="space-y-6">
          <form onSubmit={handleRecordVitals} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-default-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Record New Vitals
            </h3>

            {vitalPlausibilityWarning && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Implausible Vital Values Detected:
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(vitalPlausibilityWarning).map(([k, msg]) => (
                    <li key={k}>{msg}</li>
                  ))}
                </ul>
                <label className="flex items-center gap-2 pt-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vitalForm.confirm_implausible}
                    onChange={(e) => setVitalForm((v) => ({ ...v, confirm_implausible: e.target.checked }))}
                    className="rounded border-amber-400"
                  />
                  I confirm these values are correct despite clinical warnings
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-medium text-default-700">BP Systolic (mmHg)</label>
                <input
                  type="number"
                  value={vitalForm.systolic_bp}
                  onChange={(e) => setVitalForm((v) => ({ ...v, systolic_bp: e.target.value }))}
                  placeholder="e.g. 120"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-medium text-default-700">BP Diastolic (mmHg)</label>
                <input
                  type="number"
                  value={vitalForm.diastolic_bp}
                  onChange={(e) => setVitalForm((v) => ({ ...v, diastolic_bp: e.target.value }))}
                  placeholder="e.g. 80"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-medium text-default-700">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={vitalForm.heart_rate}
                  onChange={(e) => setVitalForm((v) => ({ ...v, heart_rate: e.target.value }))}
                  placeholder="e.g. 72"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-medium text-default-700">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={vitalForm.respiratory_rate}
                  onChange={(e) => setVitalForm((v) => ({ ...v, respiratory_rate: e.target.value }))}
                  placeholder="e.g. 16"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-medium text-default-700">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalForm.temperature}
                  onChange={(e) => setVitalForm((v) => ({ ...v, temperature: e.target.value }))}
                  placeholder="e.g. 36.6"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-medium text-default-700">SpO2 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalForm.spo2}
                  onChange={(e) => setVitalForm((v) => ({ ...v, spo2: e.target.value }))}
                  placeholder="e.g. 98"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-medium text-default-700">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalForm.weight}
                  onChange={(e) => setVitalForm((v) => ({ ...v, weight: e.target.value }))}
                  placeholder="e.g. 68.5"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-medium text-default-700">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalForm.height}
                  onChange={(e) => setVitalForm((v) => ({ ...v, height: e.target.value }))}
                  placeholder="e.g. 172"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={recordingVital}
                className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20"
              >
                {recordingVital ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Record Vitals
              </button>
            </div>
          </form>

          {/* Vitals History List */}
          <div className="space-y-3">
            <h3 className="font-bold text-default-900 text-xs uppercase tracking-wider">Recent Vitals Readings</h3>
            {encounter.vitals && encounter.vitals.length > 0 ? (
              <div className="space-y-2">
                {encounter.vitals.map((v) => (
                  <div key={v.id} className="p-4 bg-card border border-border rounded-xl flex items-center justify-between flex-wrap gap-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 text-xs">
                      <div>
                        <span className="text-default-400 block text-[10px]">Blood Pressure</span>
                        <span className="font-bold text-default-900">
                          {v.systolic_bp && v.diastolic_bp ? `${v.systolic_bp}/${v.diastolic_bp} mmHg` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-default-400 block text-[10px]">Heart Rate</span>
                        <span className="font-bold text-default-900">{v.heart_rate ? `${v.heart_rate} bpm` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-default-400 block text-[10px]">Resp Rate</span>
                        <span className="font-bold text-default-900">{v.respiratory_rate ? `${v.respiratory_rate} /min` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-default-400 block text-[10px]">Temp</span>
                        <span className="font-bold text-default-900">{v.temperature ? `${v.temperature} °C` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-default-400 block text-[10px]">SpO2</span>
                        <span className="font-bold text-default-900">{v.spo2 ? `${v.spo2}%` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-default-400 block text-[10px]">BMI</span>
                        <span className="font-bold text-primary">{v.bmi || "—"}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-default-400 font-mono">
                      {new Date(v.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-default-400 italic">No vitals recorded during this encounter yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Diagnoses */}
      {activeTab === "diagnoses" && (
        <div className="space-y-6">
          <form onSubmit={handleAddDiagnosis} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-default-900 text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Add Diagnosis (ICD-10 Coded / Free-text)
            </h3>

            {/* ICD-10 Search */}
            <div className="space-y-1.5">
              <label className="font-medium text-xs text-default-700">ICD-10 Code Search</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={icdQuery}
                  onChange={(e) => setIcdQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchIcd())}
                  placeholder="Search by code or description (e.g. J06.9, Dengue, Fever)..."
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs"
                />
                <button
                  type="button"
                  onClick={handleSearchIcd}
                  disabled={searchingIcd}
                  className="h-9 px-3 bg-default-100 border border-input rounded-lg text-xs font-semibold"
                >
                  {searchingIcd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
              {icdResults.length > 0 && !selectedIcd && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto bg-card shadow-lg">
                  {icdResults.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => {
                        setSelectedIcd(r);
                        setIcdResults([]);
                      }}
                      className="w-full text-left px-3 py-2 text-xs border-b border-border last:border-0 hover:bg-default-50 flex items-center justify-between"
                    >
                      <span>
                        <strong className="font-mono text-primary mr-2">{r.code}</strong> {r.description}
                      </span>
                      <span className="text-[10px] text-default-400">{r.category}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedIcd && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                  <span className="font-mono font-bold text-primary">{selectedIcd.code}</span>
                  <span className="text-default-800">{selectedIcd.description}</span>
                  <button type="button" onClick={() => setSelectedIcd(null)} className="ml-auto text-default-400">
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Free-text Diagnosis */}
            <div className="space-y-1.5">
              <label className="font-medium text-xs text-default-700">Free-text Clinical Diagnosis (Optional)</label>
              <input
                type="text"
                value={freeTextDiag}
                onChange={(e) => setFreeTextDiag(e.target.value)}
                placeholder="Alternative/additional clinical narrative..."
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="primary-diag"
                checked={isPrimaryDiag}
                onChange={(e) => setIsPrimaryDiag(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="primary-diag" className="text-xs font-semibold text-default-700 cursor-pointer">
                Mark as Primary Diagnosis
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingDiag}
                className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20"
              >
                {addingDiag ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add Diagnosis
              </button>
            </div>
          </form>

          {/* Diagnoses List */}
          <div className="space-y-2">
            <h3 className="font-bold text-default-900 text-xs uppercase tracking-wider">Recorded Diagnoses</h3>
            {diagnoses.length === 0 ? (
              <p className="text-xs text-default-400 italic">No diagnoses recorded for this encounter.</p>
            ) : (
              <div className="space-y-2">
                {diagnoses.map((d) => (
                  <div key={d.id} className="p-3 bg-card border border-border rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {d.is_primary && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase">
                          Primary
                        </span>
                      )}
                      <div>
                        {d.icd10_code ? (
                          <p className="font-semibold text-default-900">
                            <span className="font-mono text-primary mr-1">[{d.icd10_code}]</span> {d.icd10_display || d.icd10_description}
                          </p>
                        ) : (
                          <p className="font-semibold text-default-900">{d.free_text}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-default-400 font-mono">
                      {new Date(d.diagnosed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Notes & Addenda (Issue 4 Fix: content field) */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <form onSubmit={handleAddNote} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-default-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Add Clinical Note / Addendum
            </h3>
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter clinical notes, patient progress update, or post-closing addendum..."
              className="w-full p-3 rounded-lg border border-input bg-background text-xs resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingNote}
                className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20"
              >
                {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add Note
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            <h3 className="font-bold text-default-900 text-xs uppercase tracking-wider">Clinical Notes Timeline</h3>
            {notes.length === 0 ? (
              <p className="text-xs text-default-400 italic">No notes recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="p-4 bg-card border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-default-900">{n.authored_by_name || "Clinician"}</span>
                        {n.is_addendum && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase">
                            Addendum
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-default-400 font-mono">
                        {new Date(n.authored_at || n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-default-700 whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Attachments */}
      {activeTab === "attachments" && (
        <div className="space-y-6">
          <form onSubmit={handleUploadAttachment} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-default-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Upload Clinical Document / File
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-xs text-default-600"
              />
              <input
                type="text"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Description / notes for file..."
                className="h-9 px-3 rounded-lg border border-input bg-background"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload Document
              </button>
            </div>
          </form>

          {/* Attachments List */}
          <div className="space-y-2">
            <h3 className="font-bold text-default-900 text-xs uppercase tracking-wider">Clinical Files</h3>
            {attachments.length === 0 ? (
              <p className="text-xs text-default-400 italic">No files attached.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div key={a.id} className="p-3 bg-card border border-border rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-semibold text-default-900">{a.filename}</p>
                        <p className="text-[10px] text-default-400">
                          {a.size_bytes ? `${(a.size_bytes / 1024).toFixed(1)} KB` : "File"} • Virus Scan:{" "}
                          <span
                            className={`font-semibold uppercase ${
                              a.is_virus_clean === true
                                ? "text-emerald-500"
                                : a.is_virus_clean === false
                                ? "text-rose-500"
                                : "text-amber-500"
                            }`}
                          >
                            {a.is_virus_clean === true ? "clean" : a.is_virus_clean === false ? "flagged" : "pending"}
                          </span>
                        </p>
                      </div>
                    </div>
                    {a.file_url && (
                      <a
                        href={a.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-semibold"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOAP Details Modal */}
      {viewingSoapModal && (
        <SoapDetailModal
          soapItem={viewingSoapModal}
          onClose={() => setViewingSoapModal(null)}
        />
      )}
    </div>
  );
}

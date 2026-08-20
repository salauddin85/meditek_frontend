"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { prescriptionApi, clinicalApi, patientApi, staffApi, branchesApi } from "@/lib/tenant-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Search,
  Bookmark,
  ShieldAlert,
  Loader2,
  UserCheck,
  Stethoscope,
  Pill,
  User,
  Calendar,
  X,
  Check,
  Building2,
} from "lucide-react";

// Robust helper to extract list from any API response structure
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

function PrescriptionWriterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lists
  const [encounters, setEncounters] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [branches, setBranches] = useState([]);

  // Selected State
  const [selectedEncounterId, setSelectedEncounterId] = useState(searchParams.get("encounter_id") || "");
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get("patient_id") || "");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Search Queries
  const [encounterQuery, setEncounterQuery] = useState("");
  const [patientQuery, setPatientQuery] = useState("");

  const [loadingEncounters, setLoadingEncounters] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Vitals & Clinical info
  const [patientWeight, setPatientWeight] = useState("");
  const [patientEgfr, setPatientEgfr] = useState("");
  const [notes, setNotes] = useState("");
  const [isTelemedicine, setIsTelemedicine] = useState(false);

  // Line items
  const [items, setItems] = useState([]);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // Quick Add Drug Modal
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [addingDrug, setAddingDrug] = useState(false);
  const [addDrugError, setAddDrugError] = useState("");
  const [newDrugData, setNewDrugData] = useState({
    generic_name: "",
    brand_name: "",
    strength: "",
    dosage_form: "tablet",
    manufacturer: "",
    dgda_reg_number: "",
    is_controlled: false,
    requires_dosing_by_weight: false,
    min_egfr_threshold: "",
  });

  // Drug Search Autocomplete
  const [drugQuery, setDrugQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingDrugs, setSearchingDrugs] = useState(false);

  // Interaction Panel State
  const [warnings, setWarnings] = useState([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  // Loading & Submission
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingEncounters(true);
    setLoadingPatients(true);
    try {
      const [encRes, patRes, docRes, branchRes, tplRes] = await Promise.allSettled([
        clinicalApi.getEncounters(),
        patientApi.getPatients(),
        staffApi.getDoctors(),
        branchesApi.getBranches(),
        prescriptionApi.getTemplates(),
      ]);

      if (encRes.status === "fulfilled") {
        setEncounters(extractList(encRes.value));
      }
      if (patRes.status === "fulfilled") {
        setPatients(extractList(patRes.value));
      }
      if (docRes.status === "fulfilled") {
        const list = extractList(docRes.value);
        setDoctors(list);
        if (list.length > 0 && !selectedDoctorId) setSelectedDoctorId(list[0].id);
      }
      if (branchRes.status === "fulfilled") {
        const list = extractList(branchRes.value);
        setBranches(list);
        if (list.length > 0 && !selectedBranchId) setSelectedBranchId(list[0].id);
      }
      if (tplRes.status === "fulfilled") {
        setTemplates(extractList(tplRes.value));
      }
    } catch (err) {
      console.error("Failed to load setup data", err);
    } finally {
      setLoadingEncounters(false);
      setLoadingPatients(false);
    }
  };

  // Search Encounters dynamically
  const handleSearchEncounters = async (q) => {
    setEncounterQuery(q);
    setLoadingEncounters(true);
    try {
      const res = await clinicalApi.getEncounters(q ? { q } : {});
      setEncounters(extractList(res));
    } catch (err) {
      console.error("Encounter search error", err);
    } finally {
      setLoadingEncounters(false);
    }
  };

  // Search Patients dynamically
  const handleSearchPatients = async (q) => {
    setPatientQuery(q);
    setLoadingPatients(true);
    try {
      const res = await patientApi.getPatients(q ? { search: q } : {});
      setPatients(extractList(res));
    } catch (err) {
      console.error("Patient search error", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // When Encounter selected, auto link patient, doctor, branch
  const handleSelectEncounterId = (id) => {
    setSelectedEncounterId(id);
    if (!id) return;
    const enc = encounters.find((e) => e.id === id);
    if (enc) {
      const pid = typeof enc.patient === "object" ? enc.patient.id : enc.patient;
      const docid = typeof enc.doctor === "object" ? enc.doctor.id : enc.doctor;
      const branchid = typeof enc.branch === "object" ? enc.branch.id : enc.branch;
      if (pid) setSelectedPatientId(pid);
      if (docid) setSelectedDoctorId(docid);
      if (branchid) setSelectedBranchId(branchid);
    }
  };

  useEffect(() => {
    // Re-check interactions whenever items, patientId, weight, or egfr change
    if (selectedPatientId && items.length > 0) {
      runInteractionCheck();
    } else {
      setWarnings([]);
    }
  }, [items, selectedPatientId, patientWeight, patientEgfr]);

  // Dynamic Drug Search
  const handleSearchDrugs = async (q) => {
    setDrugQuery(q);
    if (!q || q.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchingDrugs(true);
    try {
      const res = await prescriptionApi.searchDrugs(q);
      setSearchResults(extractList(res));
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingDrugs(false);
    }
  };

  const handleSelectDrug = (drug) => {
    const newItem = {
      drug_id: drug.id,
      drug_name: drug.generic_name,
      brand_name: drug.brand_name,
      strength: drug.strength,
      dosage_form: drug.dosage_form,
      is_controlled: drug.is_controlled,
      dose: "1+0+1",
      frequency: "After food",
      duration: "7 days",
      route: "oral",
      instructions: "",
      interaction_override_reason: "",
    };
    setItems((prev) => [...prev, newItem]);
    setDrugQuery("");
    setSearchResults([]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const runInteractionCheck = async () => {
    if (!selectedPatientId || items.length === 0) return;
    setCheckingInteractions(true);
    try {
      const lastItem = items[items.length - 1];
      const res = await prescriptionApi.batchCheckInteractions({
        drug_id: lastItem.drug_id,
        patient_id: selectedPatientId,
        encounter_id: selectedEncounterId || null,
        patient_weight: patientWeight ? parseFloat(patientWeight) : null,
        patient_egfr: patientEgfr ? parseFloat(patientEgfr) : null,
      });
      setWarnings(extractList(res));
    } catch (err) {
      console.error("Interaction check failed", err);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const handleApplyTemplate = (tpl) => {
    if (!tpl.items_json || !Array.isArray(tpl.items_json)) return;
    const formatted = tpl.items_json.map((it) => ({
      drug_id: it.drug_id,
      drug_name: it.drug_name || "Prescribed Medication",
      brand_name: it.brand_name || "",
      strength: it.strength || "",
      dosage_form: it.dosage_form || "tablet",
      is_controlled: it.is_controlled || false,
      dose: it.dose || "1+0+1",
      frequency: it.frequency || "After food",
      duration: it.duration || "7 days",
      route: it.route || "oral",
      instructions: it.instructions || "",
      interaction_override_reason: "",
    }));
    setItems(formatted);
  };

  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim() || items.length === 0) return;
    try {
      await prescriptionApi.createTemplate({
        name: saveTemplateName.trim(),
        items_json: items,
        doctor_id: selectedDoctorId,
      });
      setShowSaveTemplateModal(false);
      setSaveTemplateName("");
      // Reload templates
      const res = await prescriptionApi.getTemplates();
      setTemplates(extractList(res));
    } catch (err) {
      alert("Failed to save template: " + (err.userMessage || err.message));
    }
  };

  const handleQuickAddDrug = async (e) => {
    e.preventDefault();
    setAddDrugError("");
    if (!newDrugData.generic_name.trim()) {
      setAddDrugError("Generic Name is required.");
      return;
    }
    setAddingDrug(true);
    try {
      const payload = {
        ...newDrugData,
        generic_name: newDrugData.generic_name.trim(),
        brand_name: newDrugData.brand_name.trim() || null,
        strength: newDrugData.strength.trim() || null,
        manufacturer: newDrugData.manufacturer.trim() || null,
        dgda_reg_number: newDrugData.dgda_reg_number.trim() || null,
        min_egfr_threshold: newDrugData.min_egfr_threshold ? parseFloat(newDrugData.min_egfr_threshold) : null,
      };

      const res = await prescriptionApi.createDrug(payload);
      const createdDrug = res.data?.data || res.data;

      // Auto-add to line items
      handleSelectDrug(createdDrug);

      setShowAddDrugModal(false);
      setNewDrugData({
        generic_name: "",
        brand_name: "",
        strength: "",
        dosage_form: "tablet",
        manufacturer: "",
        dgda_reg_number: "",
        is_controlled: false,
        requires_dosing_by_weight: false,
        min_egfr_threshold: "",
      });
    } catch (err) {
      setAddDrugError(err.userMessage || "Failed to add drug.");
    } finally {
      setAddingDrug(false);
    }
  };

  const handleSubmitPrescription = async () => {
    setErrorMessage("");
    if (!selectedPatientId || !selectedEncounterId) {
      setErrorMessage("Please select both Encounter and Patient.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Prescription must contain at least one medicine line item.");
      return;
    }

    // Check high severity interaction override reasons
    const hasHighSeverity = warnings.some(
      (w) => w.severity === "high" || w.severity === "contraindicated"
    );
    if (hasHighSeverity) {
      const missingOverride = items.some(
        (it) => !it.interaction_override_reason || !it.interaction_override_reason.trim()
      );
      if (missingOverride) {
        setErrorMessage(
          "High-severity interaction detected! You must provide an Override Reason for prescribed items before issuing."
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        encounter_id: selectedEncounterId,
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        branch_id: selectedBranchId,
        patient_weight: patientWeight ? parseFloat(patientWeight) : null,
        patient_egfr: patientEgfr ? parseFloat(patientEgfr) : null,
        notes: notes.trim(),
        is_telemedicine: isTelemedicine,
        items: items.map((it) => ({
          drug_id: it.drug_id,
          dose: it.dose,
          frequency: it.frequency,
          duration: it.duration,
          route: it.route,
          instructions: it.instructions,
          interaction_override_reason: it.interaction_override_reason,
        })),
      };

      const res = await prescriptionApi.createPrescription(payload);
      const rx = res.data?.data || res.data;
      router.push(`/dashboard/prescriptions/${rx.id}`);
    } catch (err) {
      setErrorMessage(err.userMessage || "Failed to create prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEncounterObj = encounters.find((e) => e.id === selectedEncounterId);
  const selectedPatientObj = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Structured Prescription Writer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            DGDA drug registry, automated interaction checks, weight-based dosing & digital signatures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/prescriptions/drugs">
            <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Pill className="h-4 w-4" />
              Drug Master Registry
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => setShowAddDrugModal(true)}
            className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" />
            + Register New Drug
          </Button>

          {templates.length > 0 && (
            <select
              onChange={(e) => {
                const tpl = templates.find((t) => t.id === e.target.value);
                if (tpl) handleApplyTemplate(tpl);
              }}
              defaultValue=""
              className="px-3 py-2 text-sm bg-white border border-purple-200 rounded-md font-medium text-purple-700 shadow-sm focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="" disabled>
                ⚡ Load Quick Template...
              </option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.items_json?.length || 0} items)
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            onClick={() => setShowSaveTemplateModal(true)}
            disabled={items.length === 0}
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Bookmark className="h-4 w-4" />
            Save as Template
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          {errorMessage}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) — Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Encounter & Patient Setup Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                Clinical Context: Encounter & Patient Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. ENCOUNTER SELECTOR WITH SEARCH */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Select Encounter *</span>
                    {loadingEncounters && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                  </label>

                  {/* Search box above list */}
                  <div className="relative">
                    <Input
                      placeholder="Type patient name, MRN or ID to search encounters..."
                      value={encounterQuery}
                      onChange={(e) => handleSearchEncounters(e.target.value)}
                      className="pl-8 text-xs bg-slate-50 border-slate-300"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Dropdown Select */}
                  <select
                    value={selectedEncounterId}
                    onChange={(e) => handleSelectEncounterId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Encounter ({encounters.length} available) --</option>
                    {encounters.map((enc) => {
                      const pName = enc.patient_name || (typeof enc.patient === "object" ? enc.patient?.full_name : null) || "Patient";
                      const pMrn = enc.patient_mrn || (typeof enc.patient === "object" ? enc.patient?.mrn : null) || "";
                      const dName = enc.doctor_name || (typeof enc.doctor === "object" ? enc.doctor?.full_name : null) || "";
                      return (
                        <option key={enc.id} value={enc.id}>
                          Enc #{enc.id.substring(0, 8)} | Patient: {pName} {pMrn ? `(MRN: ${pMrn})` : ""} | Status: {enc.status || "open"} {dName ? `| Dr: ${dName}` : ""}
                        </option>
                      );
                    })}
                  </select>

                  {/* Selected Encounter Badge */}
                  {selectedEncounterObj && (
                    <div className="p-2.5 bg-blue-50/80 rounded border border-blue-200 text-xs space-y-1">
                      <div className="font-bold text-blue-900 flex items-center justify-between">
                        <span>Selected Encounter #{selectedEncounterObj.id.substring(0, 8)}</span>
                        <Badge variant="outline" className="text-[10px] bg-white capitalize">
                          {selectedEncounterObj.status || "open"}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-blue-800">
                        <b>Patient:</b> {selectedEncounterObj.patient_name || selectedEncounterObj.patient?.full_name} (MRN: {selectedEncounterObj.patient_mrn || selectedEncounterObj.patient?.mrn})
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. PATIENT SELECTOR WITH SEARCH */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Select Patient *</span>
                    {loadingPatients && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                  </label>

                  {/* Search box above list */}
                  <div className="relative">
                    <Input
                      placeholder="Type patient name, MRN or phone to search..."
                      value={patientQuery}
                      onChange={(e) => handleSearchPatients(e.target.value)}
                      className="pl-8 text-xs bg-slate-50 border-slate-300"
                    />
                    <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Dropdown Select */}
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Patient ({patients.length} available) --</option>
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.full_name} (MRN: {pat.mrn}) {pat.phone ? `| Ph: ${pat.phone}` : ""}
                      </option>
                    ))}
                  </select>

                  {/* Selected Patient Badge */}
                  {selectedPatientObj && (
                    <div className="p-2.5 bg-emerald-50/80 rounded border border-emerald-200 text-xs space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center justify-between">
                        <span>Selected Patient: {selectedPatientObj.full_name}</span>
                        <span className="font-mono text-[10px]">MRN: {selectedPatientObj.mrn}</span>
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Sex: {selectedPatientObj.sex || selectedPatientObj.gender || "N/A"} | Phone: {selectedPatientObj.phone || "N/A"}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. DOCTOR SELECTOR */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Prescribing Doctor *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.full_name} ({doc.bmdc_reg_number || 'No BMDC'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. BRANCH SELECTOR */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Branch *
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vitals inputs */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Patient Weight (kg) [Pediatric Flag]
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.5"
                    value={patientWeight}
                    onChange={(e) => setPatientWeight(e.target.value)}
                    className="bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Patient eGFR (mL/min) [Renal Flag]
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 75.0"
                    value={patientEgfr}
                    onChange={(e) => setPatientEgfr(e.target.value)}
                    className="bg-white text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DGDA Drug Autocomplete & Addition Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                DGDA Drug Search & Entry (&lt;500ms Autocomplete)
              </CardTitle>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowAddDrugModal(true)}
                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
              >
                + Register New Drug
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Input
                  placeholder="Type medicine generic or brand name (e.g. Paracetamol, Moxacil, Napa)..."
                  value={drugQuery}
                  onChange={(e) => handleSearchDrugs(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-300 font-medium text-sm"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                {searchingDrugs && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-600" />
                )}

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectDrug(d)}
                        className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-700">
                            {d.generic_name} {d.brand_name ? `(${d.brand_name})` : ""}
                          </div>
                          <div className="text-xs text-slate-500">
                            Strength: {d.strength || "N/A"} | Form: {d.dosage_form} | Mfr: {d.manufacturer || "DGDA"}
                          </div>
                        </div>
                        {d.is_controlled && (
                          <Badge variant="destructive" className="text-[10px]">Controlled</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prescribed Items Table */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                Prescribed Medicines ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg text-sm">
                  Search and add medicines above to build the prescription.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-slate-200 rounded-lg bg-white space-y-3 shadow-xs hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-base">
                            {item.drug_name}
                          </span>
                          {item.brand_name && (
                            <span className="text-sm text-slate-500">({item.brand_name})</span>
                          )}
                          {item.strength && (
                            <Badge variant="outline" className="text-xs bg-slate-50">
                              {item.strength}
                            </Badge>
                          )}
                          {item.is_controlled && (
                            <Badge variant="destructive" className="text-[10px]">
                              Controlled Drug
                            </Badge>
                          )}
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500">Dose</label>
                          <Input
                            value={item.dose}
                            onChange={(e) => handleItemChange(idx, "dose", e.target.value)}
                            placeholder="e.g. 1+0+1 or 500mg"
                            className="text-xs bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500">Frequency</label>
                          <Input
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, "frequency", e.target.value)}
                            placeholder="e.g. After food"
                            className="text-xs bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500">Duration</label>
                          <Input
                            value={item.duration}
                            onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                            placeholder="e.g. 7 days"
                            className="text-xs bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500">Route</label>
                          <select
                            value={item.route}
                            onChange={(e) => handleItemChange(idx, "route", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border rounded border-slate-200 bg-slate-50"
                          >
                            <option value="oral">Oral</option>
                            <option value="topical">Topical</option>
                            <option value="injection">IV/IM Injection</option>
                            <option value="inhalation">Inhalation</option>
                            <option value="drops">Eye/Ear Drops</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500">Special Instructions</label>
                        <Input
                          value={item.instructions}
                          onChange={(e) => handleItemChange(idx, "instructions", e.target.value)}
                          placeholder="e.g. Drink plenty of warm water, take before sleep..."
                          className="text-xs bg-slate-50"
                        />
                      </div>

                      {/* Override reason field if interaction warnings exist */}
                      {warnings.some((w) => w.severity === "high" || w.severity === "contraindicated") && (
                        <div className="pt-2">
                          <label className="text-[11px] font-bold text-red-600 block mb-1">
                            ⚠️ Interaction Override Reason Required *
                          </label>
                          <Input
                            value={item.interaction_override_reason}
                            onChange={(e) =>
                              handleItemChange(idx, "interaction_override_reason", e.target.value)
                            }
                            placeholder="State clinical justification for prescribing despite interaction warning..."
                            className="text-xs border-red-300 bg-red-50/50"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinical Advice & Telemedicine */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-800">
                Doctor Advice & Consultation Format
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Advice / Notes for Patient
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter general dietary advice, follow-up instructions, or diagnostic test recommendations..."
                  className="bg-white text-sm"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="telemed"
                  checked={isTelemedicine}
                  onChange={(e) => setIsTelemedicine(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="telemed" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  This prescription is issued via Telemedicine Consultation
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => router.push("/dashboard/prescriptions")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPrescription}
              disabled={submitting || items.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-lg px-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF & Signing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save & Issue Prescription
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column (1 Col) — Interaction Panel */}
        <div className="space-y-6">
          <Card className="shadow-sm border-amber-200 bg-amber-50/30 sticky top-6">
            <CardHeader className="pb-3 border-b border-amber-200/60 bg-amber-100/40">
              <CardTitle className="text-sm font-bold text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  Live Interaction Panel
                </span>
                {checkingInteractions && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {warnings.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-white rounded border border-slate-200">
                  No interaction, allergy, or dosing alerts detected.
                </div>
              ) : (
                warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      w.severity === "contraindicated" || w.severity === "high"
                        ? "bg-red-50 border-red-200 text-red-900"
                        : w.severity === "moderate"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-blue-50 border-blue-200 text-blue-900"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="capitalize">{w.type.replace("_", " ")} Alert</span>
                      <Badge
                        variant={
                          w.severity === "high" || w.severity === "contraindicated"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {w.severity}
                      </Badge>
                    </div>
                    <div className="font-semibold">{w.title}</div>
                    <p className="text-[11px] text-slate-700">{w.description}</p>
                  </div>
                ))
              )}

              <div className="p-3 bg-white rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">Safety Guard Checklist:</div>
                <div>• Drug-Drug interactions (DGDA severity rank)</div>
                <div>• Active patient allergy cross-check</div>
                <div>• Pediatric weight requirement check</div>
                <div>• Renal eGFR adjustment threshold</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-purple-600" />
                Save Prescription Template
              </CardTitle>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Template Name *
                </label>
                <Input
                  placeholder="e.g. Adult Acute Bronchitis, Fever & Cold..."
                  value={saveTemplateName}
                  onChange={(e) => setSaveTemplateName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowSaveTemplateModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={!saveTemplateName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Add Drug Modal */}
      {showAddDrugModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Pill className="h-5 w-5 text-emerald-600" />
                Register New Drug (Quick Add)
              </CardTitle>
              <button
                onClick={() => setShowAddDrugModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {addDrugError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-semibold">
                  {addDrugError}
                </div>
              )}

              <form onSubmit={handleQuickAddDrug} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Generic Name *
                    </label>
                    <Input
                      placeholder="e.g. Azithromycin, Paracetamol..."
                      value={newDrugData.generic_name}
                      onChange={(e) => setNewDrugData((prev) => ({ ...prev, generic_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Brand Name
                    </label>
                    <Input
                      placeholder="e.g. Zimax, Napa..."
                      value={newDrugData.brand_name}
                      onChange={(e) => setNewDrugData((prev) => ({ ...prev, brand_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Strength
                    </label>
                    <Input
                      placeholder="e.g. 500mg, 10mg/5ml..."
                      value={newDrugData.strength}
                      onChange={(e) => setNewDrugData((prev) => ({ ...prev, strength: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Dosage Form
                    </label>
                    <select
                      value={newDrugData.dosage_form}
                      onChange={(e) => setNewDrugData((prev) => ({ ...prev, dosage_form: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 bg-white"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                      <option value="suspension">Suspension</option>
                      <option value="cream">Cream</option>
                      <option value="ointment">Ointment</option>
                      <option value="drops">Drops</option>
                      <option value="inhaler">Inhaler</option>
                      <option value="suppository">Suppository</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDrugModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addingDrug}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {addingDrug && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save & Prescribe Immediately
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PrescriptionWriterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading prescription workspace...</div>}>
      <PrescriptionWriterContent />
    </Suspense>
  );
}

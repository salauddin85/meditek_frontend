"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { clinicalApi, patientApi } from "@/lib/tenant-api";

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

export default function PatientAllergiesPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const patientId = params.id;

  const [patient, setPatient] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    substance: "",
    category: "drug",
    severity: "moderate",
    reaction_notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        patientApi.getPatient(patientId),
        clinicalApi.getAllergies(patientId),
      ]);
      setPatient(pRes.data?.data);
      setAllergies(aRes.data?.data || []);
    } catch {
      toast.error("Failed to load patient allergies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadData();
  }, [patientId]);

  const handleAddAllergy = async (e) => {
    e.preventDefault();
    if (!form.substance.trim()) return toast.error("Please enter substance name.");

    setSubmitting(true);
    try {
      await clinicalApi.addAllergy(patientId, {
        substance: form.substance.trim(),
        substance_type: form.category === "environment" ? "environmental" : form.category,
        category: form.category === "environment" ? "environmental" : form.category,
        severity: form.severity,
        reaction: form.reaction_notes.trim() || null,
        reaction_notes: form.reaction_notes.trim() || null,
      });
      toast.success(`Allergy record added for '${form.substance}'.`);
      setForm({ substance: "", category: "drug", severity: "moderate", reaction_notes: "" });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add allergy.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (allergyId, substance) => {
    if (!confirm(`Mark allergy '${substance}' as inactive? (Clinical records are soft-deactivated)`)) return;
    try {
      await clinicalApi.deleteAllergy(patientId, allergyId);
      toast.success("Allergy marked as inactive.");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate allergy.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/clinical"
            className="p-2 rounded-lg border border-input bg-card hover:bg-default-50 transition text-default-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-default-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Patient Allergy Profile
            </h1>
            <p className="text-xs text-default-500 mt-0.5">
              Manage clinical drug, food, and environmental allergies for {patient?.full_name} ({patient?.mrn})
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/clinical/patients/${patientId}/timeline`}
          className="h-9 px-3 rounded-lg border border-input bg-card text-xs font-semibold flex items-center gap-1.5 hover:bg-default-50 transition"
        >
          View Timeline
        </Link>
      </div>

      {/* Add Allergy Form */}
      <form onSubmit={handleAddAllergy} className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
        <h2 className="font-bold text-default-900 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Record New Active Allergy
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-default-700">Substance / Drug Name *</label>
            <input
              type="text"
              required
              value={form.substance}
              onChange={(e) => setForm((f) => ({ ...f, substance: e.target.value }))}
              placeholder="e.g. Penicillin, Peanuts, Latex..."
              className="w-full h-9 px-3 rounded-lg border border-input bg-background mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-default-700">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full h-9 px-2.5 rounded-lg border border-input bg-background mt-1"
            >
              <option value="drug">Drug / Medication</option>
              <option value="food">Food</option>
              <option value="environment">Environmental</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-default-700">Severity *</label>
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              className="w-full h-9 px-2.5 rounded-lg border border-input bg-background mt-1"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="life_threatening">Life Threatening / Anaphylactic</option>
            </select>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-semibold text-default-700">Reaction Notes & Symptoms</label>
          <input
            type="text"
            value={form.reaction_notes}
            onChange={(e) => setForm((f) => ({ ...f, reaction_notes: e.target.value }))}
            placeholder="e.g. Rash, hives, difficulty breathing, swelling..."
            className="w-full h-9 px-3 rounded-lg border border-input bg-background"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="h-9 px-5 rounded-lg bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-700 disabled:opacity-60 shadow-md shadow-rose-600/20"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Save Allergy Record
          </button>
        </div>
      </form>

      {/* Allergies List */}
      <div className="space-y-3">
        <h2 className="font-bold text-default-900 text-sm flex items-center justify-between">
          <span>Active Allergies ({allergies.filter((a) => a.is_active).length})</span>
        </h2>

        {allergies.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-xl text-default-400 text-xs italic">
            No active allergies recorded for this patient.
          </div>
        ) : (
          <div className="space-y-3">
            {allergies.map((a) => (
              <div
                key={a.id}
                className={`p-4 bg-card border rounded-xl flex items-center justify-between flex-wrap gap-4 ${
                  !a.is_active ? "opacity-50 border-default-200" : "border-border"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-default-900">{a.substance}</span>
                    <span className="text-xs text-default-400 capitalize">({a.category})</span>
                    <SeverityBadge severity={a.severity} />
                    {!a.is_active && (
                      <span className="px-2 py-0.5 rounded bg-default-200 text-default-600 text-[10px] font-bold uppercase">
                        Inactive
                      </span>
                    )}
                  </div>
                  {a.reaction_notes && (
                    <p className="text-xs text-default-600">{a.reaction_notes}</p>
                  )}
                  <p className="text-[10px] text-default-400 font-mono">
                    Recorded by: {a.recorded_by_name || "System"} • Date: {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>

                {a.is_active && (
                  <button
                    onClick={() => handleDeactivate(a.id, a.substance)}
                    className="h-8 px-3 rounded-lg border border-rose-500/20 text-rose-600 text-xs font-semibold hover:bg-rose-500/10 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Deactivate
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

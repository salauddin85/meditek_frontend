"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowLeft,
  Loader2,
  Stethoscope,
  Activity,
  ShieldAlert,
  FileText,
  Paperclip,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { clinicalApi } from "@/lib/tenant-api";

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

export default function PatientTimelinePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const patientId = params.id;

  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedEncounter, setExpandedEncounter] = useState(null);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      clinicalApi
        .getTimeline(patientId)
        .then((res) => {
          const raw = res.data?.data;
          const data = raw?.results || raw || {};
          setTimeline(data);
          if (data?.encounters?.length > 0) {
            setExpandedEncounter(data.encounters[0].id);
          }
        })
        .catch(() => toast.error("Failed to load patient clinical timeline."))
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-semibold">Timeline data unavailable.</p>
        <Link href="/dashboard/clinical" className="text-primary hover:underline text-sm font-semibold">
          ← Back to Clinical Workspace
        </Link>
      </div>
    );
  }

  const { patient, allergies: active_allergies = [], encounters = [] } = timeline;

  return (
    <div className="space-y-6 pb-12">
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
              <Clock className="w-5 h-5 text-primary" />
              Clinical History & Timeline
            </h1>
            <p className="text-xs text-default-500 mt-0.5">
              Comprehensive clinical record for {patient?.full_name || "Patient"} ({patient?.mrn || "N/A"})
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/clinical/patients/${patientId}/vitals`}
            className="h-9 px-3 rounded-lg border border-input bg-card text-xs font-semibold flex items-center gap-1.5 hover:bg-default-50 transition"
          >
            <Activity className="w-3.5 h-3.5 text-primary" />
            Vitals History
          </Link>
          <Link
            href={`/dashboard/clinical/patients/${patientId}/allergies`}
            className="h-9 px-3 rounded-lg border border-input bg-card text-xs font-semibold flex items-center gap-1.5 hover:bg-default-50 transition text-rose-600"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Allergies ({active_allergies.length})
          </Link>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-default-400 text-[10px] block font-medium uppercase">Patient Name</span>
          <span className="font-bold text-default-900">{patient?.full_name || "N/A"}</span>
        </div>
        <div>
          <span className="text-default-400 text-[10px] block font-medium uppercase">MRN</span>
          <span className="font-mono font-bold text-primary">{patient?.mrn || "N/A"}</span>
        </div>
        <div>
          <span className="text-default-400 text-[10px] block font-medium uppercase">Sex / DOB</span>
          <span className="font-semibold text-default-900 capitalize">
            {patient?.sex || "N/A"} • {patient?.dob || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-default-400 text-[10px] block font-medium uppercase">Blood Group</span>
          <span className="font-bold text-rose-600">{patient?.blood_group || "N/A"}</span>
        </div>
      </div>

      {/* Allergies Summary Banner */}
      {active_allergies.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Active Clinical Allergies ({active_allergies.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {active_allergies.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-rose-500/20 text-xs">
                <span className="font-bold text-default-900">{a.substance}</span>
                <span className="text-default-400">({a.substance_type || a.category})</span>
                <SeverityBadge severity={a.severity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encounters Timeline List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-default-900 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" />
          Encounter History ({encounters.length})
        </h2>

        {encounters.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-xl text-default-400 text-xs">
            No clinical encounters recorded for this patient yet.
          </div>
        ) : (
          <div className="space-y-3">
            {encounters.map((enc) => {
              const isExpanded = expandedEncounter === enc.id;
              const subj = enc.subjective || enc.soap_subjective;
              const obj = enc.objective || enc.soap_objective;
              const assess = enc.assessment || enc.soap_assessment;
              const plan = enc.plan || enc.soap_plan;
              const savedSoapList = enc.specialty_data_json?.soap_list || [];

              return (
                <div key={enc.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
                  {/* Encounter Header Bar */}
                  <button
                    onClick={() => setExpandedEncounter(isExpanded ? null : enc.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-default-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                        {enc.encounter_type?.toUpperCase()?.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs text-default-900">
                            {enc.chief_complaint || `Encounter #${enc.id.substring(0, 8)}`}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-default-100 text-default-700">
                            {enc.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-default-500">
                          Doctor: {enc.doctor_name || "Unassigned"} • Branch: {enc.branch_name || "HQ"} • Date:{" "}
                          {enc.started_at ? new Date(enc.started_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/clinical/encounter/${enc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 rounded bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition"
                      >
                        Open Session
                      </Link>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-default-400" /> : <ChevronDown className="w-4 h-4 text-default-400" />}
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-4 border-t border-border bg-default-50/50 space-y-4 text-xs">
                      {/* Active SOAP Notes */}
                      {(subj || obj || assess || plan) && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-default-800 uppercase tracking-wider text-[10px]">SOAP Clinical Record</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subj && (
                              <div className="p-3 bg-card border border-border rounded-lg">
                                <span className="font-bold text-primary block text-[10px]">SUBJECTIVE</span>
                                <p className="text-default-700 mt-1 whitespace-pre-wrap">{subj}</p>
                              </div>
                            )}
                            {obj && (
                              <div className="p-3 bg-card border border-border rounded-lg">
                                <span className="font-bold text-primary block text-[10px]">OBJECTIVE</span>
                                <p className="text-default-700 mt-1 whitespace-pre-wrap">{obj}</p>
                              </div>
                            )}
                            {assess && (
                              <div className="p-3 bg-card border border-border rounded-lg">
                                <span className="font-bold text-primary block text-[10px]">ASSESSMENT</span>
                                <p className="text-default-700 mt-1 whitespace-pre-wrap">{assess}</p>
                              </div>
                            )}
                            {plan && (
                              <div className="p-3 bg-card border border-border rounded-lg">
                                <span className="font-bold text-primary block text-[10px]">PLAN</span>
                                <p className="text-default-700 mt-1 whitespace-pre-wrap">{plan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Saved SOAP Entries History */}
                      {savedSoapList.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-default-800 uppercase tracking-wider text-[10px]">
                            Saved SOAP History Entries ({savedSoapList.length})
                          </h4>
                          <div className="space-y-2">
                            {savedSoapList.map((item, idx) => (
                              <div key={item.id || idx} className="p-3 bg-card border border-border rounded-lg space-y-1">
                                <div className="flex justify-between items-center text-[10px] text-default-400 border-b border-border pb-1 font-mono">
                                  <span>SOAP Entry #{savedSoapList.length - idx}</span>
                                  <span>{new Date(item.created_at || Date.now()).toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-default-700 pt-1">
                                  {item.subjective && <div><strong className="text-primary text-[10px]">S:</strong> {item.subjective}</div>}
                                  {item.objective && <div><strong className="text-primary text-[10px]">O:</strong> {item.objective}</div>}
                                  {item.assessment && <div><strong className="text-primary text-[10px]">A:</strong> {item.assessment}</div>}
                                  {item.plan && <div><strong className="text-primary text-[10px]">P:</strong> {item.plan}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Diagnoses */}
                      {enc.diagnoses && enc.diagnoses.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="font-bold text-default-800 uppercase tracking-wider text-[10px]">Diagnoses</h4>
                          <div className="flex flex-wrap gap-2">
                            {enc.diagnoses.map((d) => (
                              <div key={d.id} className="px-2.5 py-1 bg-card border border-border rounded-lg text-xs">
                                {d.icd10_code ? (
                                  <span>
                                    <strong className="font-mono text-primary mr-1">[{d.icd10_code}]</strong> {d.icd10_display || d.icd10_description}
                                  </span>
                                ) : (
                                  <span>{d.free_text}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

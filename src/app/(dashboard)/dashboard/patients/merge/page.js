"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitMerge,
  Loader2,
  ChevronLeft,
  Search,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  History,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { patientApi } from "@/lib/tenant-api";

function PatientSelectCard({ title, selectedPatient, onSearch, onClear }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await patientApi.searchPatients(query.trim());
      setResults(res.data.data || []);
    } catch {
      toast.error("Failed to search patients.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-default-900 border-b border-border pb-2 flex items-center justify-between">
        <span>{title}</span>
        {selectedPatient && (
          <button onClick={onClear} className="text-xs text-destructive hover:underline flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </h3>

      {selectedPatient ? (
        <div className="p-4 rounded-xl bg-default-50 border border-border space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-default-900 text-base">{selectedPatient.full_name}</p>
              <p className="font-mono text-xs font-bold text-primary">{selectedPatient.mrn}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary">
              Selected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-default-600 pt-2 border-t border-border/50">
            <div><span className="text-default-400">Sex:</span> {selectedPatient.sex}</div>
            <div><span className="text-default-400">DOB:</span> {selectedPatient.dob || "N/A"}</div>
            <div><span className="text-default-400">Phone:</span> {selectedPatient.phone || "N/A"}</div>
            <div><span className="text-default-400">Branch:</span> {selectedPatient.branch_name || "N/A"}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search MRN, Name, Phone..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </button>
          </form>

          {results.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-background text-xs">
              {results.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSearch(p);
                    setResults([]);
                  }}
                  className="p-2.5 hover:bg-default-50 cursor-pointer flex justify-between items-center transition"
                >
                  <div>
                    <p className="font-semibold text-default-900">{p.full_name}</p>
                    <p className="text-default-500">{p.phone} • {p.sex}</p>
                  </div>
                  <span className="font-mono text-primary font-bold">{p.mrn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientMergePage() {
  const [activeTab, setActiveTab] = useState("merge");
  const [sourcePatient, setSourcePatient] = useState(null);
  const [targetPatient, setTargetPatient] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await patientApi.getMergeLogs();
      setHistory(res.data.data || []);
    } catch {
      toast.error("Failed to load merge logs.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const handleMerge = async () => {
    if (!sourcePatient || !targetPatient) {
      toast.error("Please select both source and target patients.");
      return;
    }
    if (sourcePatient.id === targetPatient.id) {
      toast.error("Source and target patient cannot be the same.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for merging.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to merge '${sourcePatient.full_name}' (${sourcePatient.mrn}) into '${targetPatient.full_name}' (${targetPatient.mrn})?\n\nThis will soft-delete the source record and move all emergency contacts & family links.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await patientApi.mergePatients({
        source_patient_id: sourcePatient.id,
        target_patient_id: targetPatient.id,
        merge_reason: reason.trim(),
      });
      toast.success("Patient records merged successfully!");
      setSourcePatient(null);
      setTargetPatient(null);
      setReason("");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.userMessage || "Failed to merge patients.");
    } finally {
      setLoading(false);
    }
  };

  const handleReverseMerge = async (logId) => {
    if (!confirm("Are you sure you want to reverse this merge operation?")) return;
    try {
      await patientApi.reverseMerge(logId);
      toast.success("Patient merge reversed successfully.");
      fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reverse merge.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link
          href="/dashboard/patients"
          className="p-2 rounded-lg border border-input bg-card hover:bg-default-100 transition text-default-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-amber-500" />
            Patient Merge & Record Cleanup
          </h1>
          <p className="text-sm text-default-500">
            Combine duplicate patient profiles into a master record with reversible audit trails.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("merge")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === "merge"
              ? "border-primary text-primary"
              : "border-transparent text-default-500 hover:text-default-800"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          Merge Tool
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-default-500 hover:text-default-800"
          }`}
        >
          <History className="w-4 h-4" />
          Audit & Reversal History
        </button>
      </div>

      {activeTab === "merge" ? (
        <div className="space-y-6">
          {/* Information Callout */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold">Reversible Patient Record Merging</p>
              <p className="mt-0.5">
                The <strong>Source Patient</strong> will be soft-deleted. All contacts and family links will be transferred to the <strong>Target Master Patient</strong>. A full snapshot is preserved in audit logs and can be reversed by administrators.
              </p>
            </div>
          </div>

          {/* Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <PatientSelectCard
              title="1. Source Patient (Duplicate to Remove)"
              selectedPatient={sourcePatient}
              onSearch={setSourcePatient}
              onClear={() => setSourcePatient(null)}
            />

            <PatientSelectCard
              title="2. Target Patient (Master Record to Keep)"
              selectedPatient={targetPatient}
              onSearch={setTargetPatient}
              onClear={() => setTargetPatient(null)}
            />
          </div>

          {/* Merge Action Form */}
          {sourcePatient && targetPatient && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-default-900 text-base border-b border-border pb-2">
                3. Merge Justification & Execution
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-default-700">Reason for Merge *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Duplicate registration created during emergency admission. Phone and NID match."
                  className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleMerge}
                  disabled={loading}
                  className="h-10 px-8 rounded-lg bg-amber-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-amber-700 disabled:opacity-60 shadow-lg shadow-amber-600/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                  {loading ? "Merging Records..." : "Execute Record Merge"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-default-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Merge Logs & Reversals
              </h3>
              <p className="text-xs text-default-500 mt-0.5">
                Audit trail of merged patient profiles. Administrators can restore source patient records.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              className="h-8 px-3 rounded-lg border border-input text-xs font-semibold hover:bg-default-50 flex items-center gap-1"
            >
              Refresh Logs
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-default-400 text-sm border border-dashed border-border rounded-xl">
              No patient merge history recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-default-50 border-b border-border text-default-700 font-semibold">
                  <tr>
                    <th className="p-3 text-left">Source (Merged)</th>
                    <th className="p-3 text-left">Target (Master)</th>
                    <th className="p-3 text-left">Merged By & Date</th>
                    <th className="p-3 text-left">Reason</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-default-50/50">
                      <td className="p-3">
                        <p className="font-semibold text-default-900">{log.source_patient_name}</p>
                        <p className="font-mono text-primary font-bold">{log.source_patient_mrn}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-default-900">{log.target_patient_name}</p>
                        <p className="font-mono text-primary font-bold">{log.target_patient_mrn}</p>
                      </td>
                      <td className="p-3 text-default-600">
                        <p className="font-medium text-default-800">{log.merged_by_name}</p>
                        <p className="text-[11px] text-default-400">{new Date(log.created_at).toLocaleString()}</p>
                      </td>
                      <td className="p-3 text-default-600 max-w-xs truncate">{log.merge_reason || "N/A"}</td>
                      <td className="p-3">
                        {log.is_reversed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Reversed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Merged
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {!log.is_reversed && (
                          <button
                            onClick={() => handleReverseMerge(log.id)}
                            className="h-7 px-3 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 hover:bg-amber-500/20 ml-auto"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reverse Merge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { clinicalApi, patientApi } from "@/lib/tenant-api";

export default function PatientVitalsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const patientId = params.id;

  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      Promise.all([
        patientApi.getPatient(patientId),
        clinicalApi.getPatientVitals(patientId),
      ])
        .then(([pRes, vRes]) => {
          setPatient(pRes.data?.data);
          const list = vRes.data?.data?.results || vRes.data?.data || [];
          setVitals(Array.isArray(list) ? list : []);
        })
        .catch(() => toast.error("Failed to load patient vitals history."))
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

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
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
              <Activity className="w-5 h-5 text-primary" />
              Patient Vitals History
            </h1>
            <p className="text-xs text-default-500 mt-0.5">
              Historical clinical vital sign recordings for {patient?.full_name} ({patient?.mrn})
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

      {/* Vitals Summary Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-default-50/50 flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider text-default-700">
            Recorded Vitals Log ({vitals.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-default-50">
              <tr>
                <th className="h-10 px-4 text-left font-semibold text-default-700">Date & Time</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">BP (mmHg)</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">Pulse (bpm)</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">Resp (/min)</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">Temp (°C)</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">SpO2 (%)</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">Weight / Height</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">BMI</th>
                <th className="h-10 px-4 text-left font-semibold text-default-700">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {vitals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-32 text-center text-default-400 italic">
                    No vital readings recorded for this patient yet.
                  </td>
                </tr>
              ) : (
                vitals.map((v) => (
                  <tr key={v.id} className="border-b border-border hover:bg-default-50/50 transition">
                    <td className="p-4 font-mono text-[11px] text-default-600">
                      {new Date(v.recorded_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-default-900">
                      {(v.systolic_bp || v.bps) && (v.diastolic_bp || v.bpd) ? `${v.systolic_bp || v.bps}/${v.diastolic_bp || v.bpd}` : "—"}
                    </td>
                    <td className="p-4 font-semibold text-default-900">{v.heart_rate || v.hr || "—"}</td>
                    <td className="p-4 text-default-700">{v.respiratory_rate || v.rr || "—"}</td>
                    <td className="p-4 font-semibold text-default-900">{(v.temperature || v.temp) ? `${v.temperature || v.temp} °C` : "—"}</td>
                    <td className="p-4 font-semibold text-default-900">{v.spo2 ? `${v.spo2}%` : "—"}</td>
                    <td className="p-4 text-default-700">
                      {(v.weight || v.weight_kg) ? `${v.weight || v.weight_kg}kg` : "—"} / {(v.height || v.height_cm) ? `${v.height || v.height_cm}cm` : "—"}
                    </td>
                    <td className="p-4 font-bold text-primary">{v.bmi || "—"}</td>
                    <td className="p-4 text-default-500">{v.recorded_by_name || "System"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

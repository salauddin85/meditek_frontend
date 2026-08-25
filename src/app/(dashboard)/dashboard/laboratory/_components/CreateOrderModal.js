"use client";
import { useState } from "react";
import { laboratoryApi, patientApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { extractList, formatApiError } from "./utils";

export default function CreateOrderModal({ catalogue, branches, doctors, onClose, onSuccess }) {
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorOptions, setDoctorOptions] = useState([]);

  const [form, setForm] = useState({
    patient_id: "",
    branch_id: branches[0]?.id || "",
    ordered_by_id: "",
    priority: "routine",
    clinical_notes: "",
    is_home_collection: false,
    test_ids: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Patient search
  const handlePatientSearch = async (q) => {
    setPatientSearch(q);
    if (q.length < 2) { setPatientOptions([]); return; }
    try {
      const res = await patientApi.searchPatients(q);
      setPatientOptions(extractList(res));
    } catch (_) {}
  };

  const selectPatient = (p) => {
    setForm(f => ({ ...f, patient_id: p.id }));
    setPatientSearch(`${p.full_name} (${p.mrn})`);
    setPatientOptions([]);
  };

  // Doctor search
  const handleDoctorSearch = async (q) => {
    setDoctorSearch(q);
    if (q.length < 2) { setDoctorOptions([]); return; }
    const filtered = doctors.filter(d => d.full_name?.toLowerCase().includes(q.toLowerCase()));
    setDoctorOptions(filtered.slice(0, 10));
  };

  const selectDoctor = (d) => {
    setForm(f => ({ ...f, ordered_by_id: d.id }));
    setDoctorSearch(`Dr. ${d.full_name}`);
    setDoctorOptions([]);
  };

  const clearDoctor = () => { setForm(f => ({ ...f, ordered_by_id: "" })); setDoctorSearch(""); };

  const toggleTest = (id) => {
    setForm(f => ({
      ...f,
      test_ids: f.test_ids.includes(id) ? f.test_ids.filter(t => t !== id) : [...f.test_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) return toast.error("Please select a patient.");
    if (form.test_ids.length === 0) return toast.error("Please select at least one test.");
    setSubmitting(true);
    try {
      const payload = {
        patient_id: form.patient_id,
        test_ids: form.test_ids,
        priority: form.priority,
        is_home_collection: form.is_home_collection,
      };
      if (form.branch_id) payload.branch_id = form.branch_id;
      if (form.ordered_by_id) payload.ordered_by_id = form.ordered_by_id;
      if (form.clinical_notes.trim()) payload.clinical_notes = form.clinical_notes.trim();

      await laboratoryApi.createOrder(payload);
      toast.success("Lab order created!");
      onSuccess();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = form.test_ids.reduce((sum, id) => {
    const t = catalogue.find(c => c.id === id);
    return sum + (t ? parseFloat(t.price) : 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Laboratory Order</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Patient *</label>
            <div className="relative">
              <input type="text" value={patientSearch} onChange={e => handlePatientSearch(e.target.value)}
                placeholder="Type patient name or MRN…"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {patientOptions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                  {patientOptions.map(p => (
                    <button key={p.id} type="button" onClick={() => selectPatient(p)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.full_name}</span>
                      <span className="text-slate-500 ml-2 font-mono">{p.mrn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Doctor Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Referring Doctor (Optional)</label>
            <div className="relative">
              <input type="text" value={doctorSearch} onChange={e => handleDoctorSearch(e.target.value)}
                placeholder="Search doctor name…"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {form.ordered_by_id && (
                <button type="button" onClick={clearDoctor} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-red-500 text-sm">×</button>
              )}
              {doctorOptions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                  {doctorOptions.map(d => (
                    <button key={d.id} type="button" onClick={() => selectDoctor(d)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Dr. {d.full_name}</span>
                      {d.designation && <span className="text-slate-500 ml-2">{d.designation}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.ordered_by_id && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">✓ Doctor reference will be shown on lab report PDF.</p>}
          </div>

          {/* Branch + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Branch</label>
              <select value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none">
                {branches.length === 0 && <option value="">Loading…</option>}
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT (Emergency)</option>
              </select>
            </div>
          </div>

          {/* Test Selection */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Select Tests *</label>
              <span className="text-xs text-blue-600 font-semibold">{form.test_ids.length} selected · ৳{totalPrice.toFixed(2)}</span>
            </div>
            <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50">
              {catalogue.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No tests in database. Use "+ Add Test Name" first.</div>
              ) : catalogue.map(t => {
                const checked = form.test_ids.includes(t.id);
                return (
                  <label key={t.id} className={`flex items-center justify-between px-3 py-2 cursor-pointer transition ${checked ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/40"}`}>
                    <span className="flex items-center gap-2.5">
                      <input type="checkbox" checked={checked} onChange={() => toggleTest(t.id)} className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</span>
                      <span className="text-xs font-mono text-slate-400">({t.short_code})</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">৳{t.price}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Clinical Notes (Optional)</label>
            <textarea value={form.clinical_notes} onChange={e => setForm(f => ({ ...f, clinical_notes: e.target.value }))}
              rows="2" placeholder="Any relevant clinical information for the lab…"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Home Collection */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.is_home_collection} onChange={e => setForm(f => ({ ...f, is_home_collection: e.target.checked }))} className="w-4 h-4 rounded text-blue-600" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">🏠 Home Collection Request</span>
          </label>

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50">
              {submitting ? "Creating…" : "Submit Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

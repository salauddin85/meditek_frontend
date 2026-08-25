"use client";
import { useState } from "react";
import { laboratoryApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { formatApiError } from "./utils";

export default function AddTestModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "", short_code: "", specimen_type: "blood",
    container_type: "EDTA", price: "300.00", tat_hours: 6, loinc_code: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.short_code.trim()) return toast.error("Test Name and Short Code are required.");
    setSaving(true);
    try {
      await laboratoryApi.createTest({
        name: form.name.trim(),
        short_code: form.short_code.trim().toUpperCase(),
        specimen_type: form.specimen_type,
        container_type: form.container_type,
        price: parseFloat(form.price) || 0,
        tat_hours: parseInt(form.tat_hours) || 6,
        ...(form.loinc_code.trim() && { loinc_code: form.loinc_code.trim() }),
      });
      toast.success(`Test "${form.name}" saved to database!`);
      onSuccess();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">🧪 Add New Lab Test</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Test Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              placeholder="e.g. HbA1c, Complete Blood Count" autoFocus
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Short Code *</label>
              <input type="text" value={form.short_code} onChange={e => setForm(f => ({ ...f, short_code: e.target.value.toUpperCase() }))} required
                placeholder="HBA1C"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Price (BDT) *</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Specimen Type</label>
              <select value={form.specimen_type} onChange={e => setForm(f => ({ ...f, specimen_type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none">
                {["blood","urine","stool","sputum","swab","csf"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Container</label>
              <select value={form.container_type} onChange={e => setForm(f => ({ ...f, container_type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none">
                <option value="EDTA">EDTA</option>
                <option value="Serum Separator">Serum Separator</option>
                <option value="Fluoride">Fluoride</option>
                <option value="Plain">Plain</option>
                <option value="Sterile Container">Sterile Container</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">TAT (Hours)</label>
              <input type="number" value={form.tat_hours} onChange={e => setForm(f => ({ ...f, tat_hours: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">LOINC Code</label>
              <input type="text" value={form.loinc_code} onChange={e => setForm(f => ({ ...f, loinc_code: e.target.value }))} placeholder="Optional"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50">
              {saving ? "Saving…" : "Save Test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

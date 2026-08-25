"use client";
import { useState } from "react";
import { laboratoryApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { formatApiError } from "./utils";

export default function CatalogueTab({ catalogue, loading, onRefresh }) {
  const [editingTest, setEditingTest] = useState(null); // test object being edited
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const openEdit = (test) => {
    setEditingTest(test);
    setEditForm({
      name: test.name || "",
      short_code: test.short_code || "",
      specimen_type: test.specimen_type || "blood",
      container_type: test.container_type || "EDTA",
      price: test.price || "0",
      tat_hours: test.tat_hours || 6,
      loinc_code: test.loinc_code || "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingTest) return;
    setSaving(true);
    try {
      await laboratoryApi.updateTest(editingTest.id, {
        name: editForm.name.trim(),
        short_code: editForm.short_code.trim().toUpperCase(),
        specimen_type: editForm.specimen_type,
        container_type: editForm.container_type,
        price: parseFloat(editForm.price) || 0,
        tat_hours: parseInt(editForm.tat_hours) || 6,
        ...(editForm.loinc_code.trim() && { loinc_code: editForm.loinc_code.trim() }),
      });
      toast.success(`Test "${editForm.name}" updated!`);
      setEditingTest(null);
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (test) => {
    if (!confirm(`Deactivate "${test.name}"? It will no longer appear in order forms.`)) return;
    try {
      await laboratoryApi.deleteTest(test.id);
      toast.success(`Test "${test.name}" deactivated.`);
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Test Catalogue ({catalogue.length} active tests)</h3>
          <p className="text-xs text-slate-500">Click ✏️ Edit to modify any test. Changes persist in database.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse">Loading catalogue…</div>
      ) : (
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Test Name</th>
              <th className="p-4">Group</th>
              <th className="p-4">Specimen / Container</th>
              <th className="p-4">TAT</th>
              <th className="p-4">Price (৳)</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {catalogue.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-400">No active tests. Use "+ Add Test Name" to create one.</td></tr>
            ) : catalogue.map(test => (
              <tr key={test.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                <td className="p-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{test.short_code}</td>
                <td className="p-4 font-semibold text-slate-900 dark:text-white">
                  {test.name}
                  {test.is_profile && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-bold">PROFILE</span>}
                </td>
                <td className="p-4 text-xs text-slate-500">{test.group_name || "—"}</td>
                <td className="p-4 text-xs">{test.specimen_type} / <span className="font-mono text-slate-500">{test.container_type}</span></td>
                <td className="p-4 text-xs font-mono">{test.tat_hours}h</td>
                <td className="p-4 font-mono font-bold">৳{test.price}</td>
                <td className="p-4 text-right space-x-1.5">
                  <button onClick={() => openEdit(test)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition">✏️ Edit</button>
                  <button onClick={() => handleDeactivate(test)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded transition">✕ Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editingTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Test — {editingTest.name}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Test Name *</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Short Code *</label>
                  <input type="text" value={editForm.short_code} onChange={e => setEditForm(f => ({ ...f, short_code: e.target.value.toUpperCase() }))} required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Price (BDT) *</label>
                  <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Specimen Type</label>
                  <select value={editForm.specimen_type} onChange={e => setEditForm(f => ({ ...f, specimen_type: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none">
                    {["blood","urine","stool","sputum","swab","csf"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Container Type</label>
                  <select value={editForm.container_type} onChange={e => setEditForm(f => ({ ...f, container_type: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none">
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
                  <input type="number" value={editForm.tat_hours} onChange={e => setEditForm(f => ({ ...f, tat_hours: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">LOINC Code</label>
                  <input type="text" value={editForm.loinc_code} onChange={e => setEditForm(f => ({ ...f, loinc_code: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditingTest(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50">{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

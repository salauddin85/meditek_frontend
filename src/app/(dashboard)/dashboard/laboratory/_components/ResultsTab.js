"use client";
import { useState, useRef } from "react";
import { laboratoryApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { getStatusStyle, formatApiError } from "./utils";

export default function ResultsTab({ orders, onRefresh }) {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [resultInput, setResultInput] = useState("");
  const [amendReason, setAmendReason] = useState("");
  const [modalMode, setModalMode] = useState(null); // "enter" | "amend"
  const searchTimer = useRef(null);

  // Flatten all order items with parent order context, then filter
  const allItems = orders.flatMap(o =>
    (o.items || []).map(item => ({ ...item, _order: o }))
  );
  const filtered = search.trim()
    ? allItems.filter(item =>
        item._order.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.test_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.test_short_code?.toLowerCase().includes(search.toLowerCase()) ||
        item._order.id?.toLowerCase().includes(search.toLowerCase())
      )
    : allItems;

  const openEnter = (item) => { setSelectedItem(item); setResultInput(item.result?.result_value || ""); setModalMode("enter"); };
  const openAmend = (item) => { setSelectedItem(item); setResultInput(item.result?.result_value || ""); setAmendReason(""); setModalMode("amend"); };
  const closeModal = () => { setSelectedItem(null); setModalMode(null); setResultInput(""); setAmendReason(""); };

  const handleEnterResult = async (e) => {
    e.preventDefault();
    if (!resultInput.trim()) return toast.error("Result value is required.");
    try {
      await laboratoryApi.enterResult(selectedItem.id, { result_value: resultInput });
      toast.success("Result saved!");
      closeModal();
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleAmendResult = async (e) => {
    e.preventDefault();
    if (!resultInput.trim() || !amendReason.trim()) return toast.error("Both result value and amendment reason are required.");
    try {
      await laboratoryApi.amendResult(selectedItem.id, { result_value: resultInput, amendment_reason: amendReason });
      toast.success("Result amended!");
      closeModal();
      onRefresh();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleVerify = async (itemId) => {
    try { await laboratoryApi.verifyResult(itemId); toast.success("Result verified!"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="🔍  Search by patient name, test name, or order ID..."
          onChange={e => { clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => setSearch(e.target.value), 300); }}
          className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Manual Result Entry & Pathologist Verification</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Patient / Order</th>
                <th className="p-4">Test</th>
                <th className="p-4">Current Result</th>
                <th className="p-4">Flags</th>
                <th className="p-4">Item Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No test items match your search.</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{item._order.patient_name}</div>
                    <div className="text-xs text-slate-500 font-mono">#{item._order.id.substring(0, 8)}</div>
                  </td>
                  <td className="p-4 font-semibold">{item.test_name} <span className="text-slate-400 font-mono text-xs">({item.test_short_code})</span></td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                    {item.result ? (
                      <div>
                        <span>{item.result.result_value}{item.result.unit ? ` ${item.result.unit}` : ""}</span>
                        {item.result.amendment_reason && <div className="text-[10px] text-amber-600 font-normal mt-0.5">Amended: {item.result.amendment_reason}</div>}
                      </div>
                    ) : <span className="text-slate-400 italic text-xs">Not entered</span>}
                  </td>
                  <td className="p-4 text-xs space-x-1">
                    {item.result?.is_critical_low && <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded animate-pulse">CRIT LOW</span>}
                    {item.result?.is_critical_high && <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded animate-pulse">CRIT HIGH</span>}
                    {item.result?.is_delta_flagged && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">DELTA</span>}
                    {!item.result?.is_critical_low && !item.result?.is_critical_high && !item.result?.is_delta_flagged && <span className="text-slate-400">—</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusStyle(item.status)}`}>{item.status?.toUpperCase()}</span>
                  </td>
                  <td className="p-4 text-right space-x-1.5">
                    {!["verified","released"].includes(item.status) && (
                      <button onClick={() => openEnter(item)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition">Enter Result</button>
                    )}
                    {item.status === "resulted" && (
                      <button onClick={() => handleVerify(item.id)} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded transition">Verify</button>
                    )}
                    {item.result && (
                      <button onClick={() => openAmend(item)} className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded transition">Amend</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Modal */}
      {modalMode && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {modalMode === "enter" ? "Enter Result" : "Amend Result"}
            </h3>
            <p className="text-xs text-slate-500">Test: <strong>{selectedItem.test_name}</strong></p>
            <form onSubmit={modalMode === "enter" ? handleEnterResult : handleAmendResult} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Result Value *</label>
                <input type="text" value={resultInput} onChange={e => setResultInput(e.target.value)} autoFocus
                  placeholder="e.g. 13.5  or  Positive" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {modalMode === "amend" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Amendment Reason *</label>
                  <textarea value={amendReason} onChange={e => setAmendReason(e.target.value)} rows="3" placeholder="Explain why the result is being corrected…"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className={`px-4 py-2 text-white text-xs font-semibold rounded-xl ${modalMode === "amend" ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"}`}>
                  {modalMode === "enter" ? "Save Result" : "Save Amendment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

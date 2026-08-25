"use client";
import { useState } from "react";
import { laboratoryApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { getStatusStyle, formatApiError } from "./utils";

export default function OrdersTab({ orders, loading, pagination, page, setPage, onSearchChange, onStatusChange, onPriorityChange, onTestTypeChange, catalogue, onRefresh }) {
  const testCodes = [...new Set(catalogue.map(t => t.short_code).filter(Boolean))];

  const handleCollect = async (orderId) => {
    try { await laboratoryApi.collectSamples(orderId); toast.success("Sample collected!"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
  };
  const handleReceive = async (orderId) => {
    try { await laboratoryApi.receiveSamples(orderId); toast.success("Sample received in lab!"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
  };
  const handleRelease = async (orderId) => {
    try { await laboratoryApi.releaseReport(orderId); toast.success("Report released!"); onRefresh(); }
    catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍  Search by patient name, MRN, or order ID prefix..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select onChange={(e) => onStatusChange(e.target.value)} defaultValue=""
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none">
          <option value="">All Status</option>
          <option value="ordered">Ordered</option>
          <option value="sample_collected">Sample Collected</option>
          <option value="received">Received</option>
          <option value="in_process">In Process</option>
          <option value="resulted">Resulted</option>
          <option value="verified">Verified</option>
          <option value="released">Released</option>
        </select>
        <select onChange={(e) => onPriorityChange(e.target.value)} defaultValue=""
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none">
          <option value="">All Priority</option>
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT</option>
        </select>
        <select onChange={(e) => onTestTypeChange(e.target.value)} defaultValue=""
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none">
          <option value="">All Tests</option>
          {testCodes.map(code => <option key={code} value={code}>{code}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Order / Date</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Tests</th>
                <th className="p-4">Sample Barcodes</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400 animate-pulse">Loading orders…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No orders match your search. Try different filters.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                  <td className="p-4 font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">#{o.id.substring(0, 8)}</span>
                    <div className="text-slate-500 mt-0.5">{o.order_date}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{o.patient_name}</div>
                    <div className="text-xs text-slate-500 font-mono">MRN: {o.patient_mrn}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${o.priority === "stat" ? "bg-red-100 text-red-700" : o.priority === "urgent" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                      {o.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {o.items?.map(item => (
                        <span key={item.id} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-200 dark:border-blue-800">
                          {item.test_short_code || item.test_name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    {o.samples?.length > 0 ? (
                      <div className="space-y-0.5">
                        {o.samples.map(s => (
                          <div key={s.id} className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-block">
                            🏷️ {s.barcode}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No sample yet</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{o.doctor_name || <span className="italic text-slate-400">—</span>}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(o.status)}`}>
                      {o.status?.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5">
                    {o.status === "ordered" && <button onClick={() => handleCollect(o.id)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition">Collect</button>}
                    {o.status === "sample_collected" && <button onClick={() => handleReceive(o.id)} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition">Receive</button>}
                    {o.status === "verified" && <button onClick={() => handleRelease(o.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition">Release Report</button>}
                    {o.status === "released" && o.reports?.length > 0 && (
                      <a
                        href={laboratoryApi.getPdfDownloadUrl(o.reports[0].id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition"
                        title="Download Lab Report PDF"
                      >
                        📄 Download PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Page {pagination.current_page} of {pagination.total_pages} ({pagination.count} orders)</span>
            <div className="flex gap-2">
              <button disabled={!pagination.previous} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition">← Prev</button>
              <button disabled={!pagination.next} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

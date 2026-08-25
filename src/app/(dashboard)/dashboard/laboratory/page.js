"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { laboratoryApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";
import { extractList, extractPagination, formatApiError, getStatusStyle } from "./_components/utils";

// ── Sub-component imports ────────────────────────────────────────────────────
import OrdersTab from "./_components/OrdersTab";
import SamplesTab from "./_components/SamplesTab";
import ResultsTab from "./_components/ResultsTab";
import AlertsTab from "./_components/AlertsTab";
import CatalogueTab from "./_components/CatalogueTab";
import CreateOrderModal from "./_components/CreateOrderModal";
import AddTestModal from "./_components/AddTestModal";

export default function LaboratoryWorkstationPage() {
  const [activeTab, setActiveTab] = useState("orders");

  // ── Shared state ────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  // ── Modal open state ────────────────────────────────────────────────────────
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);

  // ── Orders search/filter state ──────────────────────────────────────────────
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderPriority, setOrderPriority] = useState("");
  const [orderTestType, setOrderTestType] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const searchTimer = useRef(null);

  // ── Fetch Catalogue (called on mount and after add/edit) ────────────────────
  const fetchCatalogue = useCallback(async () => {
    setLoadingCatalogue(true);
    try {
      const res = await laboratoryApi.getCatalogue();
      setCatalogue(extractList(res));
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoadingCatalogue(false);
    }
  }, []);

  // ── Fetch Orders with search/filter/page params ─────────────────────────────
  const fetchOrders = useCallback(async (params = {}) => {
    setLoadingOrders(true);
    try {
      const res = await laboratoryApi.getOrders(params);
      setOrders(extractList(res));
      setOrdersPagination(extractPagination(res));
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // ── Fetch misc (branches, doctors, alerts) ──────────────────────────────────
  const fetchMisc = useCallback(async () => {
    try {
      const [alertsRes, doctorsRes] = await Promise.allSettled([
        laboratoryApi.getCriticalAlerts(),
        laboratoryApi.getDoctors(),
      ]);
      if (alertsRes.status === "fulfilled") setCriticalAlerts(extractList(alertsRes.value));
      if (doctorsRes.status === "fulfilled") setDoctors(extractList(doctorsRes.value));
    } catch (_) {}
  }, []);

  // ── Fetch branches once ─────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { branchesApi } = await import("@/lib/tenant-api");
      try {
        const res = await branchesApi.getBranches();
        setBranches(extractList(res));
      } catch (_) {}
    };
    init();
    fetchCatalogue();
    fetchMisc();
  }, [fetchCatalogue, fetchMisc]);

  // ── Re-fetch orders whenever search/filter/page changes ────────────────────
  useEffect(() => {
    const params = { page: orderPage };
    if (orderSearch) params.q = orderSearch;
    if (orderStatus) params.status = orderStatus;
    if (orderPriority) params.priority = orderPriority;
    if (orderTestType) params.test_type = orderTestType;
    fetchOrders(params);
  }, [orderSearch, orderStatus, orderPriority, orderTestType, orderPage, fetchOrders]);

  // ── Debounced search handler ────────────────────────────────────────────────
  const handleOrderSearchChange = (val) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setOrderPage(1);
      setOrderSearch(val);
    }, 400);
  };

  const unackAlerts = criticalAlerts.length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl">🧪</span>
            <h1 className="text-xl font-bold tracking-tight">Laboratory Workstation</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Manual Entry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Specimen tracking · Result entry · Critical alerts · Report release</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setIsAddTestModalOpen(true)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition">
            + Add Test Name
          </button>
          <button onClick={() => setIsOrderModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition">
            + New Lab Order
          </button>
          <button onClick={() => { fetchOrders({ page: 1 }); fetchMisc(); fetchCatalogue(); }} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition" title="Refresh">
            🔄
          </button>
        </div>
      </div>

      {/* ── Critical alert banner ── */}
      {unackAlerts > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/50 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <span className="text-xl">🚨</span>
            <span className="font-bold text-sm">{unackAlerts} Unacknowledged Critical Alert{unackAlerts > 1 ? "s" : ""} — immediate physician notification required!</span>
          </div>
          <button onClick={() => setActiveTab("alerts")} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg">View Alerts</button>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", val: orders.length, icon: "📋", color: "blue" },
          { label: "Pending Collection", val: orders.filter(o => o.status === "ordered").length, icon: "🩸", color: "amber" },
          { label: "Pending Verification", val: orders.filter(o => ["resulted","in_process"].includes(o.status)).length, icon: "🔬", color: "purple" },
          { label: "Critical Alerts", val: unackAlerts, icon: "🚨", color: "red" },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{c.label}</p>
              <p className={`text-2xl font-bold mt-0.5 text-${c.color}-600 dark:text-${c.color}-400`}>{c.val}</p>
            </div>
            <span className="text-2xl">{c.icon}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 gap-1">
        {[
          { id: "orders", label: "🧪 Orders", badge: orders.length },
          { id: "samples", label: "🏷️ Barcode & Samples" },
          { id: "results", label: "✍️ Results" },
          { id: "alerts", label: "🚨 Alerts", badge: unackAlerts, alert: unackAlerts > 0 },
          { id: "catalogue", label: "📋 Test Catalogue", badge: catalogue.length },
          { id: "home", label: "🏠 Home Collection" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${activeTab === tab.id ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${tab.alert ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "orders" && (
        <OrdersTab
          orders={orders} loading={loadingOrders} pagination={ordersPagination}
          page={orderPage} setPage={setOrderPage}
          onSearchChange={handleOrderSearchChange}
          onStatusChange={(v) => { setOrderPage(1); setOrderStatus(v); }}
          onPriorityChange={(v) => { setOrderPage(1); setOrderPriority(v); }}
          onTestTypeChange={(v) => { setOrderPage(1); setOrderTestType(v); }}
          catalogue={catalogue} onRefresh={() => fetchOrders({ page: orderPage })}
        />
      )}
      {activeTab === "samples" && <SamplesTab />}
      {activeTab === "results" && <ResultsTab orders={orders} onRefresh={() => fetchOrders({ page: orderPage })} />}
      {activeTab === "alerts" && <AlertsTab alerts={criticalAlerts} onRefresh={fetchMisc} />}
      {activeTab === "catalogue" && <CatalogueTab catalogue={catalogue} loading={loadingCatalogue} onRefresh={fetchCatalogue} />}
      {activeTab === "home" && <HomeTab />}

      {/* ── Modals ── */}
      {isOrderModalOpen && (
        <CreateOrderModal
          catalogue={catalogue} branches={branches} doctors={doctors}
          onClose={() => setIsOrderModalOpen(false)}
          onSuccess={() => { setIsOrderModalOpen(false); fetchOrders({ page: 1 }); }}
        />
      )}
      {isAddTestModalOpen && (
        <AddTestModal
          onClose={() => setIsAddTestModalOpen(false)}
          onSuccess={() => { setIsAddTestModalOpen(false); fetchCatalogue(); }}
        />
      )}
    </div>
  );
}

function HomeTab() {
  const [list, setList] = useState([]);
  useEffect(() => {
    laboratoryApi.getHomeCollections().then(r => setList(extractList(r))).catch(() => {});
  }, []);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🏠 Home Sample Collection Requests</h3>
      {list.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No pending home collection requests.</p> : (
        <div className="space-y-3">
          {list.map(r => (
            <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{r.patient_name}</p>
                <p className="text-xs text-slate-500">{r.address}</p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(r.status)}`}>{r.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { laboratoryApi, patientApi, branchesApi } from "@/lib/tenant-api";
import { toast } from "react-hot-toast";

// Standard fallback tests to ensure the user ALWAYS has standard lab options
const DEFAULT_TEST_CATALOGUE = [
  { id: "fallback-hb", name: "Hemoglobin", short_code: "HB", specimen_type: "blood", container_type: "EDTA", price: "300.00", tat_hours: 4 },
  { id: "fallback-cbc", name: "Complete Blood Count", short_code: "CBC", specimen_type: "blood", container_type: "EDTA", price: "500.00", tat_hours: 6, is_profile: true },
  { id: "fallback-fbs", name: "Fasting Blood Sugar", short_code: "FBS", specimen_type: "blood", container_type: "Fluoride", price: "200.00", tat_hours: 4 },
  { id: "fallback-creat", name: "Serum Creatinine", short_code: "CREAT", specimen_type: "blood", container_type: "Serum Separator", price: "400.00", tat_hours: 4 },
  { id: "fallback-sgpt", name: "ALT / SGPT", short_code: "SGPT", specimen_type: "blood", container_type: "Serum Separator", price: "450.00", tat_hours: 4 },
  { id: "fallback-tsh", name: "Thyroid Stimulating Hormone", short_code: "TSH", specimen_type: "blood", container_type: "Serum Separator", price: "800.00", tat_hours: 12 },
  { id: "fallback-lipid", name: "Lipid Profile", short_code: "LIPID", specimen_type: "blood", container_type: "Serum Separator", price: "1000.00", tat_hours: 12, is_profile: true },
  { id: "fallback-urine", name: "Urine Routine & Microscopy", short_code: "URINE_RME", specimen_type: "urine", container_type: "Sterile Container", price: "300.00", tat_hours: 3 },
];

export default function LaboratoryWorkstationPage() {
  const [activeTab, setActiveTab] = useState("orders"); // orders | samples | results | alerts | catalogue | home_collection
  const [loading, setLoading] = useState(true);

  // Data States
  const [orders, setOrders] = useState([]);
  const [catalogue, setCatalogue] = useState(DEFAULT_TEST_CATALOGUE);
  const [groups, setGroups] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [homeCollections, setHomeCollections] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  // Barcode Scanner State
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scannedSampleData, setScannedSampleData] = useState(null);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);

  // Selected items for modal actions
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [selectedSample, setSelectedSample] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Form Inputs: Order Creation
  const [newOrder, setNewOrder] = useState({
    patient_id: "",
    branch_id: "",
    test_ids: [],
    priority: "routine",
    clinical_notes: "",
    is_home_collection: false,
  });

  // Form Inputs: Add New Test Definition
  const [newTest, setNewTest] = useState({
    name: "",
    short_code: "",
    specimen_type: "blood",
    container_type: "EDTA",
    price: "300.00",
    tat_hours: 6,
    loinc_code: "",
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [branches, setBranches] = useState([]);

  const [resultInput, setResultInput] = useState("");
  const [amendReason, setAmendReason] = useState("");
  const [rejectReason, setRejectReason] = useState("haemolysed");
  const [notifiedPerson, setNotifiedPerson] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, catRes, groupsRes, alertsRes, homeRes, branchesRes] = await Promise.allSettled([
        laboratoryApi.getOrders(statusFilter ? { status: statusFilter } : {}),
        laboratoryApi.getCatalogue(),
        laboratoryApi.getCatalogueGroups(),
        laboratoryApi.getCriticalAlerts(),
        laboratoryApi.getHomeCollections(),
        branchesApi.getBranches(),
      ]);

      if (ordersRes.status === "fulfilled") {
        const d = ordersRes.value?.data;
        setOrders(Array.isArray(d?.data) ? d.data : Array.isArray(d?.results) ? d.results : Array.isArray(d) ? d : []);
      }
      if (catRes.status === "fulfilled") {
        const d = catRes.value?.data;
        const fetchedCat = Array.isArray(d?.data) ? d.data : Array.isArray(d?.results) ? d.results : Array.isArray(d) ? d : [];
        if (fetchedCat.length > 0) {
          setCatalogue(fetchedCat);
        } else {
          setCatalogue(DEFAULT_TEST_CATALOGUE);
        }
      }
      if (groupsRes.status === "fulfilled") {
        const d = groupsRes.value?.data;
        setGroups(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
      if (alertsRes.status === "fulfilled") {
        const d = alertsRes.value?.data;
        setCriticalAlerts(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
      if (homeRes.status === "fulfilled") {
        const d = homeRes.value?.data;
        setHomeCollections(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
      if (branchesRes.status === "fulfilled") {
        const d = branchesRes.value?.data;
        const bList = Array.isArray(d?.data) ? d.data : Array.isArray(d?.results) ? d.results : Array.isArray(d) ? d : [];
        setBranches(bList);
        if (bList.length > 0 && !newOrder.branch_id) {
          setNewOrder((prev) => ({ ...prev, branch_id: bList[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load laboratory workstation data.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Patient Search for Order Creation
  const handleSearchPatients = async (query) => {
    setPatientSearch(query);
    if (!query || query.length < 2) return;
    try {
      const res = await patientApi.searchPatients(query);
      const d = res?.data;
      setPatientOptions(Array.isArray(d?.data) ? d.data : Array.isArray(d?.results) ? d.results : Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.patient_id) return toast.error("Please select a patient.");
    if (!newOrder.branch_id) return toast.error("Please select a branch.");
    if (newOrder.test_ids.length === 0) return toast.error("Please select at least one test.");

    try {
      await laboratoryApi.createOrder(newOrder);
      toast.success("Lab order created successfully!");
      setIsOrderModalOpen(false);
      setNewOrder({ patient_id: "", branch_id: branches[0]?.id || "", test_ids: [], priority: "routine", clinical_notes: "", is_home_collection: false });
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Failed to create lab order.");
    }
  };

  // Create New Test Definition
  const handleCreateTestDefinition = async (e) => {
    e.preventDefault();
    if (!newTest.name.trim() || !newTest.short_code.trim()) {
      return toast.error("Test Name and Short Code are required.");
    }

    try {
      const res = await laboratoryApi.createTest(newTest);
      const createdObj = res?.data?.data || res?.data;
      toast.success(`Test '${newTest.name}' created successfully!`);
      
      // Update active catalogue immediately
      const updatedCat = createdObj?.id ? [...catalogue, createdObj] : [...catalogue, { ...newTest, id: `custom-${Date.now()}` }];
      setCatalogue(updatedCat);

      // Auto-select the newly created test if in Order Modal
      if (createdObj?.id) {
        setNewOrder((prev) => ({
          ...prev,
          test_ids: [...prev.test_ids, createdObj.id],
        }));
      }

      setIsAddTestModalOpen(false);
      setNewTest({
        name: "",
        short_code: "",
        specimen_type: "blood",
        container_type: "EDTA",
        price: "300.00",
        tat_hours: 6,
        loinc_code: "",
      });
    } catch (err) {
      // Fallback local addition if API fails (e.g. offline or demo mode)
      const localTest = { ...newTest, id: `local-${Date.now()}` };
      setCatalogue((prev) => [...prev, localTest]);
      setNewOrder((prev) => ({ ...prev, test_ids: [...prev.test_ids, localTest.id] }));
      toast.success(`Test '${newTest.name}' added to local session catalogue!`);
      setIsAddTestModalOpen(false);
    }
  };

  // Collect & Receive Samples
  const handleCollectSamples = async (orderId) => {
    try {
      await laboratoryApi.collectSamples(orderId);
      toast.success("Samples marked as Collected!");
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Failed to collect samples.");
    }
  };

  const handleReceiveSamples = async (orderId) => {
    try {
      await laboratoryApi.receiveSamples(orderId);
      toast.success("Samples received at workstation!");
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Failed to receive samples.");
    }
  };

  // Scan Barcode
  const handleScanBarcode = async (e) => {
    e.preventDefault();
    if (!scannedBarcode.trim()) return;
    try {
      const res = await laboratoryApi.scanBarcode(scannedBarcode.trim());
      setScannedSampleData(res.data?.data || res.data);
      toast.success("Sample barcode located!");
    } catch (err) {
      setScannedSampleData(null);
      toast.error(err.userMessage || `Sample '${scannedBarcode}' not found.`);
    }
  };

  // Reject Sample
  const handleRejectSample = async (e) => {
    e.preventDefault();
    if (!selectedSample) return;
    try {
      await laboratoryApi.rejectSample(selectedSample.id, { reason: rejectReason });
      toast.success("Sample rejected. Recollection request issued!");
      setIsRejectModalOpen(false);
      setSelectedSample(null);
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Failed to reject sample.");
    }
  };

  // Enter Result
  const handleEnterResult = async (e) => {
    e.preventDefault();
    if (!selectedOrderItem || !resultInput.trim()) return;
    try {
      await laboratoryApi.enterResult(selectedOrderItem.id, { result_value: resultInput });
      toast.success("Result recorded!");
      setIsResultModalOpen(false);
      setSelectedOrderItem(null);
      setResultInput("");
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Failed to enter result.");
    }
  };

  // Verify Result
  const handleVerifyResult = async (itemId) => {
    try {
      await laboratoryApi.verifyResult(itemId);
      toast.success("Result verified by Pathologist!");
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Verification failed.");
    }
  };

  // Amend Result
  const handleAmendResult = async (e) => {
    e.preventDefault();
    if (!selectedOrderItem || !resultInput.trim() || !amendReason.trim()) {
      return toast.error("Result value and amendment reason are required.");
    }
    try {
      await laboratoryApi.amendResult(selectedOrderItem.id, {
        result_value: resultInput,
        amendment_reason: amendReason,
      });
      toast.success("Result amended!");
      setIsAmendModalOpen(false);
      setSelectedOrderItem(null);
      setResultInput("");
      setAmendReason("");
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Failed to amend result.");
    }
  };

  // Release Report
  const handleReleaseReport = async (orderId) => {
    try {
      await laboratoryApi.releaseReport(orderId);
      toast.success("Lab report released successfully!");
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Cannot release report.");
    }
  };

  // Acknowledge Critical Alert
  const handleAcknowledgeAlert = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    try {
      await laboratoryApi.acknowledgeCriticalAlert(selectedAlert.id, {
        notified_person_name: notifiedPerson,
      });
      toast.success("Critical alert acknowledged!");
      setIsAckModalOpen(false);
      setSelectedAlert(null);
      setNotifiedPerson("");
      fetchData();
    } catch (err) {
      toast.error(err.userMessage || "Failed to acknowledge alert.");
    }
  };

  // Counts
  const totalOrders = orders.length;
  const pendingCollection = orders.filter((o) => o.status === "ordered").length;
  const pendingVerification = orders.filter((o) => o.status === "resulted" || o.status === "in_process").length;
  const unackAlerts = criticalAlerts.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧪</span>
            <h1 className="text-2xl font-bold tracking-tight">Laboratory Workstation</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Manual Entry Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Specimen tracking, manual result entry, critical value escalation, and pathologist report release.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddTestModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition border border-slate-700 flex items-center gap-2"
          >
            <span>+</span> Add Test Name
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <span>+</span> New Lab Order
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh Data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Critical Alert Warning Banner */}
      {unackAlerts > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/50 p-4 rounded-xl flex items-center justify-between text-red-700 dark:text-red-300 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-sm">
                CRITICAL VALUE ALERT: {unackAlerts} Action Required!
              </p>
              <p className="text-xs opacity-90">
                Patient results outside physiological survival thresholds require immediate 15-min physician notification.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("alerts")}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md"
          >
            View Alerts Panel
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalOrders}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl">
            📋
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Collection</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCollection}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl">
            🩸
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Verification</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{pendingVerification}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-xl">
            🔬
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Critical Alerts</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{unackAlerts}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-xl">
            🚨
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 gap-2">
        {[
          { id: "orders", label: "🧪 Worklist & Orders", badge: orders.length },
          { id: "samples", label: "🏷️ Barcode & Samples" },
          { id: "results", label: "✍️ Results & Verification" },
          { id: "alerts", label: "🚨 Critical Alerts Panel", badge: unackAlerts, alert: unackAlerts > 0 },
          { id: "catalogue", label: "📋 Test Catalogue", badge: catalogue.length },
          { id: "home_collection", label: "🏠 Home Collection" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  tab.alert
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Orders Worklist */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-500">Filter Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ordered">Ordered</option>
                <option value="sample_collected">Sample Collected</option>
                <option value="received">Received</option>
                <option value="in_process">In Process</option>
                <option value="resulted">Resulted</option>
                <option value="verified">Verified</option>
                <option value="released">Released</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Tests Ordered</th>
                    <th className="p-4">Barcodes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No lab orders found. Click "+ New Lab Order" above to place your first order.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                        <td className="p-4 font-mono text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">#{o.id.substring(0, 8)}</span>
                          <div className="text-slate-500 mt-0.5">{o.order_date}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{o.patient_name}</div>
                          <div className="text-xs text-slate-500 font-mono">MRN: {o.patient_mrn}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                              o.priority === "stat"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : o.priority === "urgent"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {o.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {o.items?.map((item) => (
                              <span key={item.id} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-200 dark:border-blue-800">
                                {item.test_short_code || item.test_name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {o.samples?.map((s) => (
                            <div key={s.id} className="text-slate-600 dark:text-slate-400">
                              🏷️ {s.barcode} ({s.status})
                            </div>
                          ))}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(o.status)}`}>
                            {o.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {o.status === "ordered" && (
                            <button
                              onClick={() => handleCollectSamples(o.id)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Collect Sample
                            </button>
                          )}
                          {o.status === "sample_collected" && (
                            <button
                              onClick={() => handleReceiveSamples(o.id)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Receive in Lab
                            </button>
                          )}
                          {o.status === "verified" && (
                            <button
                              onClick={() => handleReleaseReport(o.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Release Report
                            </button>
                          )}
                          {o.reports && o.reports.length > 0 && o.reports[0].pdf_s3_key && (
                            <a
                              href={laboratoryApi.getPdfDownloadUrl(o.reports[0].id)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition inline-block"
                            >
                              📄 Download PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sample Tracking & Barcode Scanner */}
      {activeTab === "samples" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏷️</span> Barcode Scanner Lookup & Custody Check
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Type or scan sample barcode (e.g. SMP-20260823-XXXX) to instantly view chain of custody and status.
            </p>

            <form onSubmit={handleScanBarcode} className="mt-4 flex gap-3">
              <input
                type="text"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                placeholder="Scan / Type Barcode (e.g. SMP-20260823-ABC123)..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-md"
              >
                Scan Barcode
              </button>
            </form>

            {scannedSampleData && (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                      Barcode: {scannedSampleData.sample.barcode}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Specimen: {scannedSampleData.sample.specimen_type} | Container: {scannedSampleData.sample.container_type}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(scannedSampleData.sample.status)}`}>
                    {scannedSampleData.sample.status.toUpperCase()}
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Chain of Custody Log:</p>
                  <div className="space-y-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {scannedSampleData.sample.chain_of_custody_json?.map((log, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-slate-400">{log.timestamp}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action.toUpperCase()}</span>
                        {log.reason && <span className="text-red-500">Reason: {log.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {scannedSampleData.sample.status !== "rejected" && (
                  <div className="flex gap-2 justify-end border-t border-slate-200 dark:border-slate-700 pt-3">
                    <button
                      onClick={() => {
                        setSelectedSample(scannedSampleData.sample);
                        setIsRejectModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Reject Specimen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Results & Verification */}
      {activeTab === "results" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Manual Test Result Entry & Pathologist Verification Workstation
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Patient & Order</th>
                    <th className="p-4">Test Name</th>
                    <th className="p-4">Current Result</th>
                    <th className="p-4">Ref Range & Flags</th>
                    <th className="p-4">Item Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.flatMap((o) =>
                    o.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{o.patient_name}</div>
                          <div className="text-xs text-slate-500 font-mono">Order #{o.id.substring(0, 8)}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                          {item.test_name} ({item.test_short_code})
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          {item.result ? (
                            <div>
                              <span>{item.result.result_value} {item.result.unit}</span>
                              {item.result.amendment_reason && (
                                <div className="text-[10px] text-amber-600 font-normal">Amended: {item.result.amendment_reason}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not entered</span>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          {item.result?.is_critical_low && (
                            <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded mr-1 animate-pulse">
                              CRITICAL LOW
                            </span>
                          )}
                          {item.result?.is_critical_high && (
                            <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded mr-1 animate-pulse">
                              CRITICAL HIGH
                            </span>
                          )}
                          {item.result?.is_delta_flagged && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded mr-1">
                              DELTA FLAG (Prior: {item.result.prior_result_value})
                            </span>
                          )}
                          {!item.result?.is_critical_low && !item.result?.is_critical_high && !item.result?.is_delta_flagged && (
                            <span className="text-slate-500">Normal Range</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${getStatusStyle(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {item.status !== "verified" && item.status !== "released" && (
                            <button
                              onClick={() => {
                                setSelectedOrderItem(item);
                                setResultInput(item.result?.result_value || "");
                                setIsResultModalOpen(true);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition"
                            >
                              Enter Result
                            </button>
                          )}
                          {item.status === "resulted" && (
                            <button
                              onClick={() => handleVerifyResult(item.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded transition"
                            >
                              Verify (Pathologist)
                            </button>
                          )}
                          {item.result && (
                            <button
                              onClick={() => {
                                setSelectedOrderItem(item);
                                setResultInput(item.result.result_value);
                                setIsAmendModalOpen(true);
                              }}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded transition"
                            >
                              Amend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Critical Alerts Panel */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <span>🚨</span> Active Critical Value Alerts Escalation Control
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Must be acknowledged within 15 minutes of detection. Automatic escalation occurs if unacknowledged.
            </p>

            <div className="mt-4 space-y-3">
              {criticalAlerts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  ✅ No active unacknowledged critical alerts.
                </div>
              ) : (
                criticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 bg-red-500/10 border-2 border-red-500/40 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <span className="px-2 py-0.5 text-xs font-extrabold bg-red-600 text-white rounded">
                        {alert.alert_type.toUpperCase()}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white mt-1">
                        {alert.test_name} = <span className="text-red-600 dark:text-red-400 text-lg">{alert.result_value}</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Patient: <strong>{alert.patient_name}</strong> | Ref Doctor: {alert.doctor_name || "N/A"}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Detected At: {alert.detected_at}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setIsAckModalOpen(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30"
                    >
                      Acknowledge & Record Call
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Test Catalogue Master & Manual Test Creation Form */}
      {activeTab === "catalogue" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Laboratory Test Master Catalogue</h3>
                <p className="text-xs text-slate-500">Active tests available for patient lab order placement.</p>
              </div>
              <button
                onClick={() => setIsAddTestModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1.5"
              >
                <span>+</span> Add Custom Test Name
              </button>
            </div>
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Test Name</th>
                  <th className="p-4">Group</th>
                  <th className="p-4">Specimen / Container</th>
                  <th className="p-4">TAT (Hours)</th>
                  <th className="p-4">Price (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {catalogue.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="p-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{test.short_code}</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      {test.name}
                      {test.is_profile && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-bold">PROFILE</span>}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{test.group_name || "General"}</td>
                    <td className="p-4 text-xs">
                      {test.specimen_type} / <span className="font-mono text-slate-500">{test.container_type}</span>
                    </td>
                    <td className="p-4 text-xs font-mono">{test.tat_hours} hrs</td>
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">৳{test.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Home Collection */}
      {activeTab === "home_collection" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏠</span> Home Sample Collection Requests
            </h3>
            <div className="mt-4 space-y-3">
              {homeCollections.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  No pending home collection requests.
                </div>
              ) : (
                homeCollections.map((req) => (
                  <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{req.patient_name}</p>
                      <p className="text-xs text-slate-500">{req.address} ({req.district || "Dhaka"})</p>
                      <p className="text-xs text-slate-400 mt-0.5">Phlebotomist: {req.phlebotomist_name || "Unassigned"}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(req.status)}`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Order */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Laboratory Order</h3>
              <button
                type="button"
                onClick={() => setIsAddTestModalOpen(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>+</span> Add Custom Test
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Search Patient</label>
                <input
                  type="text"
                  placeholder="Type patient name or MRN..."
                  value={patientSearch}
                  onChange={(e) => handleSearchPatients(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
                {patientOptions.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {patientOptions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setNewOrder((prev) => ({ ...prev, patient_id: p.id }));
                          setPatientSearch(`${p.full_name} (${p.mrn})`);
                          setPatientOptions([]);
                        }}
                        className="p-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
                      >
                        {p.full_name} - <span className="font-mono">{p.mrn}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT (Emergency)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Select Tests to Order</label>
                  <span className="text-[11px] text-blue-600 font-medium">Selected ({newOrder.test_ids.length})</span>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {catalogue.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No tests available. Click "+ Add Custom Test" above to create one.
                    </div>
                  ) : (
                    catalogue.map((t) => {
                      const isChecked = newOrder.test_ids.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center justify-between text-xs p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition">
                          <span className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setNewOrder({ ...newOrder, test_ids: newOrder.test_ids.filter((id) => id !== t.id) });
                                } else {
                                  setNewOrder({ ...newOrder, test_ids: [...newOrder.test_ids, t.id] });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{t.name} <span className="font-mono text-slate-400">({t.short_code})</span></span>
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">৳{t.price}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Form to Add Custom Test Definition */}
      {isAddTestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🧪</span> Add New Lab Test Name
            </h3>
            <p className="text-xs text-slate-500">Define test parameters and price to instantly make it available for orders.</p>

            <form onSubmit={handleCreateTestDefinition} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Test Name *</label>
                <input
                  type="text"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="e.g. Complete Blood Count (CBC) or HbA1c"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Short Code *</label>
                  <input
                    type="text"
                    value={newTest.short_code}
                    onChange={(e) => setNewTest({ ...newTest, short_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CBC"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Price (BDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTest.price}
                    onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Specimen Type</label>
                  <select
                    value={newTest.specimen_type}
                    onChange={(e) => setNewTest({ ...newTest, specimen_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="blood">Blood</option>
                    <option value="urine">Urine</option>
                    <option value="stool">Stool</option>
                    <option value="sputum">Sputum</option>
                    <option value="swab">Swab</option>
                    <option value="csf">CSF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Container Type</label>
                  <select
                    value={newTest.container_type}
                    onChange={(e) => setNewTest({ ...newTest, container_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="EDTA">EDTA (Lavender Tube)</option>
                    <option value="Serum Separator">Serum Separator (Yellow/Red)</option>
                    <option value="Fluoride">Fluoride (Gray Tube)</option>
                    <option value="Plain">Plain Tube</option>
                    <option value="Sterile Container">Sterile Container</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Turnaround Time (Hours)</label>
                <input
                  type="number"
                  value={newTest.tat_hours}
                  onChange={(e) => setNewTest({ ...newTest, tat_hours: parseInt(e.target.value) || 6 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTestModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  Save & Add Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Enter Result */}
      {isResultModalOpen && selectedOrderItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enter Test Result</h3>
            <p className="text-xs text-slate-500">Test: {selectedOrderItem.test_name}</p>

            <form onSubmit={handleEnterResult} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Result Value</label>
                <input
                  type="text"
                  value={resultInput}
                  onChange={(e) => setResultInput(e.target.value)}
                  placeholder="Enter numeric or text result..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Amend Result */}
      {isAmendModalOpen && selectedOrderItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Amend Test Result</h3>
            <form onSubmit={handleAmendResult} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">New Result Value</label>
                <input
                  type="text"
                  value={resultInput}
                  onChange={(e) => setResultInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Amendment Reason (Required)</label>
                <textarea
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  placeholder="Explain why result is being amended..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl"
                >
                  Save Amendment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Reject Sample */}
      {isRejectModalOpen && selectedSample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-red-600">Reject Sample ({selectedSample.barcode})</h3>
            <form onSubmit={handleRejectSample} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Coded Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="haemolysed">Haemolysed</option>
                  <option value="insufficient">Insufficient Sample</option>
                  <option value="clotted">Clotted</option>
                  <option value="mislabelled">Mislabelled</option>
                  <option value="wrong_container">Wrong Container</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl"
                >
                  Confirm Rejection & Request Recollection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Acknowledge Alert */}
      {isAckModalOpen && selectedAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-red-600">Acknowledge Critical Alert</h3>
            <form onSubmit={handleAcknowledgeAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Name of Doctor / Person Notified
                </label>
                <input
                  type="text"
                  value={notifiedPerson}
                  onChange={(e) => setNotifiedPerson(e.target.value)}
                  placeholder="e.g. Dr. John Smith (Phone)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAckModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl"
                >
                  Record Acknowledgment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case "ordered":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "sample_collected":
    case "collected":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "received":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "in_process":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "resulted":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
    case "verified":
    case "released":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

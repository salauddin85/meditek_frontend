"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function InvoicesWorkstationPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form & Reference data
  const [serviceItems, setServiceItems] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Patient Search & Selection
  const [patientSearchInput, setPatientSearchInput] = useState("");
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [createForm, setCreateForm] = useState({
    patient_mrn: "",
    vat_rate: 0,
    line_items: [{ service_item_id: "", description: "", quantity: 1, unit_price: 0, discount_pct: 0, doctor_id: "" }],
    discount_type: "fixed",
    discount_value: 0,
    discount_reason: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
    reference: "",
  });

  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "",
    approved_by_id: "",
  });

  const [creditNoteForm, setCreditNoteForm] = useState({
    reason: "",
  });

  const [discountForm, setDiscountForm] = useState({
    discount_type: "fixed",
    discount_value: "",
    reason: "",
    approved_by_id: "",
  });

  useEffect(() => {
    fetchInvoices();
    fetchServiceItems();
    fetchDoctors();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await financeApi.getInvoices(params);
      const data = res.data?.data?.results || res.data?.data || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error(err.userMessage || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceItems = async () => {
    try {
      const res = await financeApi.getServiceItems();
      const items = res.data?.data || [];
      setServiceItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Error loading service items:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await financeApi.getDoctors();
      const docs = res.data?.data?.results || res.data?.data || [];
      setDoctors(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error("Error loading doctors:", err);
    }
  };

  // Search Patient by MRN or Name
  const handleSearchPatient = async (e) => {
    if (e) e.preventDefault();
    const query = patientSearchInput.trim();
    if (!query) {
      toast.error("Please enter a Patient MRN or Name to search");
      return;
    }

    setSearchingPatient(true);
    setSearchResults([]);
    try {
      const res = await financeApi.getPatients({ search: query });
      const pts = res.data?.data?.results || res.data?.data || [];
      if (Array.isArray(pts) && pts.length > 0) {
        if (pts.length === 1) {
          selectPatient(pts[0]);
        } else {
          setSearchResults(pts);
        }
      } else {
        toast.error(`No patient found matching '${query}'`);
      }
    } catch (err) {
      console.error("Error searching patient:", err);
      toast.error(err.userMessage || "Failed to search patient");
    } finally {
      setSearchingPatient(false);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setCreateForm((prev) => ({ ...prev, patient_mrn: patient.mrn }));
    setSearchResults([]);
    toast.success(`Selected Patient: ${patient.full_name} (${patient.mrn})`);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientSearchInput("");
    setCreateForm((prev) => ({ ...prev, patient_mrn: "" }));
    setSearchResults([]);
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.patient_name?.toLowerCase().includes(q) ||
      inv.patient_mrn?.toLowerCase().includes(q)
    );
  });

  // Line item handlers
  const addLineItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { service_item_id: "", description: "", quantity: 1, unit_price: 0, discount_pct: 0, doctor_id: "" },
      ],
    }));
  };

  const removeLineItem = (index) => {
    if (createForm.line_items.length === 1) return;
    setCreateForm((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...createForm.line_items];
    newItems[index][field] = value;

    if (field === "service_item_id" && value) {
      const sel = serviceItems.find((s) => s.id === value);
      if (sel) {
        newItems[index].description = sel.name;
        newItems[index].unit_price = sel.base_price;
      }
    }
    setCreateForm((prev) => ({ ...prev, line_items: newItems }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const mrnToUse = createForm.patient_mrn || patientSearchInput.trim();
    if (!mrnToUse) {
      toast.error("Please search and select a patient by MRN");
      return;
    }

    const rawVat = parseFloat(createForm.vat_rate || 0);
    const vatRateToUse = isNaN(rawVat) ? 0 : Math.max(0, Math.min(1, rawVat));

    const payload = {
      patient_mrn: mrnToUse,
      vat_rate: vatRateToUse,
      line_items: createForm.line_items.map((item) => ({
        service_item_id: item.service_item_id || null,
        description: item.description,
        quantity: parseFloat(item.quantity || 1),
        unit_price: parseFloat(item.unit_price || 0),
        discount_pct: parseFloat(item.discount_pct || 0),
        doctor_id: item.doctor_id || null,
      })),
    };

    if (parseFloat(createForm.discount_value) > 0) {
      payload.discount = {
        discount_type: createForm.discount_type,
        discount_value: parseFloat(createForm.discount_value),
        reason: createForm.discount_reason,
      };
    }

    try {
      const res = await financeApi.createInvoice(payload);
      toast.success(res.data?.message || "Invoice created & posted to ledger!");
      setShowCreateModal(false);
      clearSelectedPatient();
      fetchInvoices();
    } catch (err) {
      let msg = err.userMessage || "Failed to create invoice";
      if (err.response?.data?.data && typeof err.response.data.data === "object") {
        const fieldMsgs = Object.entries(err.response.data.data)
          .map(([f, val]) => `${f}: ${Array.isArray(val) ? val.join(", ") : val}`)
          .join(" | ");
        if (fieldMsgs) msg = `Validation Error: ${fieldMsgs}`;
      }
      toast.error(msg);
    }
  };

  // Payment Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await financeApi.recordPayment(selectedInvoice.id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
      });
      toast.success(res.data?.message || "Payment recorded successfully!");
      setShowPaymentModal(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.userMessage || "Failed to record payment");
    }
  };

  // Refund Submit
  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await financeApi.processRefund(selectedInvoice.id, {
        amount: parseFloat(refundForm.amount),
        reason: refundForm.reason,
        approved_by_id: refundForm.approved_by_id,
      });
      toast.success(res.data?.message || "Refund processed!");
      setShowRefundModal(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.userMessage || "Failed to process refund");
    }
  };

  // Credit Note Submit
  const handleCreditNoteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await financeApi.issueCreditNote(selectedInvoice.id, {
        reason: creditNoteForm.reason,
      });
      toast.success(res.data?.message || "Credit note issued and invoice voided!");
      setShowCreditNoteModal(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.userMessage || "Failed to issue credit note");
    }
  };

  // Discount Submit
  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const payload = {
        discount_type: discountForm.discount_type,
        discount_value: parseFloat(discountForm.discount_value),
        reason: discountForm.reason,
      };
      if (discountForm.approved_by_id) payload.approved_by_id = discountForm.approved_by_id;

      const res = await financeApi.applyDiscount(selectedInvoice.id, payload);
      toast.success(res.data?.message || "Discount applied!");
      setShowDiscountModal(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.userMessage || "Failed to apply discount");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Fully Paid</Badge>;
      case "partially_paid":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Partially Paid</Badge>;
      case "open":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Open / Unpaid</Badge>;
      case "voided":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Voided (Credit Note)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:document-text" className="w-7 h-7 text-primary" />
            Patient Invoice Workstation
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Create gap-free sequential invoices (`INV-YYYY-XXXXXX`), record payments, process approved refunds, and issue credit notes.
          </p>
        </div>

        <Button
          onClick={() => {
            clearSelectedPatient();
            setShowCreateModal(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Icon icon="heroicons:plus" className="w-5 h-5 mr-2" />
          Create New Invoice
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {["", "open", "partially_paid", "paid", "voided"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className={statusFilter === st ? "bg-primary text-primary-foreground" : ""}
              >
                {st === "" ? "All Invoices" : st.replace("_", " ").toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 absolute left-3 top-3 text-default-400" />
            <Input
              placeholder="Search by invoice # or MRN / patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Invoices Ledger ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-default-500">
              <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-default-500">
              No invoices found matching current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-default-100 text-default-700 font-semibold border-b border-border">
                  <tr>
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Subtotal</th>
                    <th className="p-4 text-right">VAT</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-right">Paid</th>
                    <th className="p-4 text-right">Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-default-50 transition-colors">
                      <td className="p-4 font-mono font-medium text-primary">
                        <Link href={`/dashboard/finance/invoices/${inv.id}`}>
                          {inv.invoice_number}
                        </Link>
                        {inv.is_credit_note && (
                          <span className="block text-[10px] text-red-500">Credit Note</span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-default-900">{inv.patient_name}</p>
                        <p className="text-xs text-default-400 font-mono">MRN: {inv.patient_mrn}</p>
                      </td>
                      <td className="p-4 text-default-600">{inv.invoice_date}</td>
                      <td className="p-4 text-right">৳{parseFloat(inv.subtotal).toLocaleString()}</td>
                      <td className="p-4 text-right text-default-500">৳{parseFloat(inv.vat_amount).toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold text-default-900">৳{parseFloat(inv.total_amount).toLocaleString()}</td>
                      <td className="p-4 text-right text-emerald-600">৳{parseFloat(inv.paid_amount).toLocaleString()}</td>
                      <td className="p-4 text-right font-bold text-amber-600 dark:text-amber-400">৳{parseFloat(inv.balance).toLocaleString()}</td>
                      <td className="p-4">{getStatusBadge(inv.status)}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/dashboard/finance/invoices/${inv.id}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-default-600" title="View Detail">
                              <Icon icon="heroicons:eye" className="w-4 h-4" />
                            </Button>
                          </Link>

                          {inv.status !== "paid" && inv.status !== "voided" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                              title="Record Payment"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentForm({ amount: inv.balance, method: "cash", reference: "" });
                                setShowPaymentModal(true);
                              }}
                            >
                              <Icon icon="heroicons:credit-card" className="w-4 h-4" />
                            </Button>
                          )}

                          {inv.status !== "voided" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                              title="Apply Discount"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setDiscountForm({ discount_type: "fixed", discount_value: "", reason: "", approved_by_id: "" });
                                setShowDiscountModal(true);
                              }}
                            >
                              <Icon icon="heroicons:tag" className="w-4 h-4" />
                            </Button>
                          )}

                          {inv.status !== "voided" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              title="Issue Credit Note (Void)"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setCreditNoteForm({ reason: "" });
                                setShowCreditNoteModal(true);
                              }}
                            >
                              <Icon icon="heroicons:arrow-path-rounded-square" className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl rounded-xl border shadow-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900 flex items-center gap-2">
                <Icon icon="heroicons:plus-circle" className="w-5 h-5 text-primary" />
                Create New Patient Invoice
              </h3>
              <Button size="icon" variant="ghost" onClick={() => setShowCreateModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* PATIENT MRN SEARCH CONTROL */}
              <div className="p-4 bg-default-50 rounded-lg border space-y-3">
                <label className="block text-xs font-semibold text-default-800 uppercase tracking-wider">
                  1. Find Patient by MRN or Name *
                </label>

                {selectedPatient ? (
                  /* Verified Patient Card */
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
                        {selectedPatient.full_name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className="font-bold text-default-900 flex items-center gap-2">
                          {selectedPatient.full_name}
                          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Selected</Badge>
                        </p>
                        <p className="text-xs text-default-600 font-mono">
                          MRN: <strong>{selectedPatient.mrn}</strong> | Phone: {selectedPatient.phone || "N/A"} | Sex: {selectedPatient.sex || "N/A"}
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={clearSelectedPatient}>
                      Change Patient
                    </Button>
                  </div>
                ) : (
                  /* Search Input Control */
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 absolute left-3 top-3 text-default-400" />
                        <Input
                          placeholder="Type Patient MRN (e.g. BR-02-2026-00022) or Name and hit Enter..."
                          value={patientSearchInput}
                          onChange={(e) => setPatientSearchInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearchPatient();
                            }
                          }}
                          className="pl-9 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleSearchPatient}
                        disabled={searchingPatient}
                        className="bg-primary text-primary-foreground"
                      >
                        {searchingPatient ? (
                          <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 mr-1" />
                        )}
                        Find Patient
                      </Button>
                    </div>

                    {/* Search Results Dropdown List if Multiple Found */}
                    {searchResults.length > 0 && (
                      <div className="border rounded-lg bg-card divide-y max-h-48 overflow-y-auto shadow-md">
                        <p className="p-2 text-[11px] font-semibold text-default-500 bg-default-100">
                          Found {searchResults.length} matching patients (click to select):
                        </p>
                        {searchResults.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => selectPatient(p)}
                            className="p-2.5 hover:bg-primary/10 cursor-pointer flex justify-between items-center text-xs transition-colors"
                          >
                            <div>
                              <span className="font-bold text-default-900">{p.full_name}</span>
                              <span className="ml-2 font-mono text-default-500">[{p.mrn}]</span>
                            </div>
                            <span className="text-default-400">{p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* VAT Rate */}
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">VAT Rate (0.15 = 15%)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.00 (Healthcare Exempt)"
                  value={createForm.vat_rate}
                  onChange={(e) => setCreateForm({ ...createForm, vat_rate: e.target.value })}
                />
              </div>

              {/* Line Items Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-default-900">Line Items</label>
                  <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                    <Icon icon="heroicons:plus" className="w-4 h-4 mr-1" /> Add Line
                  </Button>
                </div>

                <div className="space-y-3">
                  {createForm.line_items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-default-50 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <select
                          className="w-full text-xs p-2 rounded border bg-card"
                          value={item.service_item_id}
                          onChange={(e) => handleLineItemChange(idx, "service_item_id", e.target.value)}
                        >
                          <option value="">Select Service Item...</option>
                          {serviceItems.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code}) - ৳{s.base_price}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                          className="text-xs"
                          required
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <select
                          className="w-full text-xs p-2 rounded border bg-card"
                          value={item.doctor_id}
                          onChange={(e) => handleLineItemChange(idx, "doctor_id", e.target.value)}
                        >
                          <option value="">Select Doctor (Optional)...</option>
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.full_name} ({d.bmdc_reg_number || "Doctor"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-1">
                        <Input
                          type="number"
                          step="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, "quantity", e.target.value)}
                          className="text-xs"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price ৳"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(idx, "unit_price", e.target.value)}
                          className="text-xs"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1 text-center">
                        {createForm.line_items.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 h-8 w-8"
                            onClick={() => removeLineItem(idx)}
                          >
                            <Icon icon="heroicons:trash" className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Section */}
              <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-default-700 mb-1">Discount Type</label>
                  <select
                    className="w-full text-xs p-2 rounded border bg-card"
                    value={createForm.discount_type}
                    onChange={(e) => setCreateForm({ ...createForm, discount_type: e.target.value })}
                  >
                    <option value="fixed">Fixed Amount (৳)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-default-700 mb-1">Discount Value</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={createForm.discount_value}
                    onChange={(e) => setCreateForm({ ...createForm, discount_value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-default-700 mb-1">Discount Reason</label>
                  <Input
                    placeholder="Reason for discount"
                    value={createForm.discount_reason}
                    onChange={(e) => setCreateForm({ ...createForm, discount_reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Generate & Post Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900">Record Payment</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowPaymentModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-xs text-default-500">
              Invoice #{selectedInvoice.invoice_number} | Remaining Balance: <strong className="text-amber-600">৳{selectedInvoice.balance}</strong>
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Payment Amount (৳) *</label>
                <Input
                  type="number"
                  step="0.01"
                  max={selectedInvoice.balance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Payment Method *</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  <option value="cash">Cash in Hand</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="bkash">bKash MFS</option>
                  <option value="nagad">Nagad MFS</option>
                  <option value="rocket">Rocket MFS</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="insurance">Insurance Claim</option>
                  <option value="corporate">Corporate Account</option>
                  <option value="advance">Patient Advance Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Reference / Txn ID</label>
                <Input
                  placeholder="Cheque #, MFS Txn ID, or Approval code"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Record & Post Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDIT NOTE MODAL */}
      {showCreditNoteModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-red-600">Issue Credit Note</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowCreditNoteModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-xs text-default-600 leading-relaxed">
              Invoices are immutable per FR-FIN-006. Issuing a Credit Note will create a reversal transaction (`CN-{selectedInvoice.invoice_number}`) and mark the original invoice as voided.
            </p>

            <form onSubmit={handleCreditNoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Reason for Reversal *</label>
                <Input
                  placeholder="Reason for issuing credit note..."
                  value={creditNoteForm.reason}
                  onChange={(e) => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreditNoteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
                  Issue Credit Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY DISCOUNT MODAL */}
      {showDiscountModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900">Apply Invoice Discount</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowDiscountModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleDiscountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Discount Type *</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={discountForm.discount_type}
                  onChange={(e) => setDiscountForm({ ...discountForm, discount_type: e.target.value })}
                >
                  <option value="fixed">Fixed Amount (৳)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Value *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter discount value"
                  value={discountForm.discount_value}
                  onChange={(e) => setDiscountForm({ ...discountForm, discount_value: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Reason</label>
                <Input
                  placeholder="Reason for discount"
                  value={discountForm.reason}
                  onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Supervisor Approver User ID (If &gt; ৳500)</label>
                <Input
                  placeholder="Supervisor User UUID if required"
                  value={discountForm.approved_by_id}
                  onChange={(e) => setDiscountForm({ ...discountForm, approved_by_id: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDiscountModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Apply Discount
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

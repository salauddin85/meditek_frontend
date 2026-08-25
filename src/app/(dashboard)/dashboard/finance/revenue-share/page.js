"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function DoctorRevenueSharePage() {
  const [activeTab, setActiveTab] = useState("configs"); // 'configs' | 'statements'
  const [configs, setConfigs] = useState([]);
  const [statements, setStatements] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Disburse Payout Modal State
  const [disburseTarget, setDisburseTarget] = useState(null);
  const [disbursePaymentMethod, setDisbursePaymentMethod] = useState("cash");
  const [submittingDisburse, setSubmittingDisburse] = useState(false);

  const [configForm, setConfigForm] = useState({
    doctor_id: "",
    service_category: "",
    share_type: "percentage",
    share_value: "",
    effective_from: new Date().toISOString().split("T")[0],
  });

  const [generateForm, setGenerateForm] = useState({
    doctor_id: "",
    period_start: "",
    period_end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchDoctors();
    if (activeTab === "configs") fetchConfigs();
    else fetchStatements();
  }, [activeTab]);

  const fetchDoctors = async () => {
    try {
      const res = await financeApi.getDoctors();
      const docs = res.data?.data?.results || res.data?.data || [];
      setDoctors(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error("Error loading doctors list:", err);
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDoctorRevenueConfigs();
      setConfigs(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching revenue share configs:", err);
      toast.error(err.userMessage || "Failed to load revenue share configs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getDoctorRevenueStatements();
      setStatements(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching revenue statements:", err);
      toast.error(err.userMessage || "Failed to load doctor statements");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    if (!configForm.doctor_id) {
      toast.error("Please select or enter a Doctor UUID");
      return;
    }

    try {
      const res = await financeApi.createDoctorRevenueConfig({
        doctor_id: configForm.doctor_id,
        service_category: configForm.service_category || null,
        share_type: configForm.share_type,
        share_value: parseFloat(configForm.share_value),
        effective_from: configForm.effective_from,
      });
      toast.success(res.data?.message || "Doctor revenue share configured!");
      setShowConfigModal(false);
      fetchConfigs();
    } catch (err) {
      toast.error(err.userMessage || "Failed to save config");
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!generateForm.doctor_id) {
      toast.error("Please select or enter a Doctor UUID");
      return;
    }

    try {
      const res = await financeApi.generateDoctorRevenueStatement({
        doctor_id: generateForm.doctor_id,
        period_start: generateForm.period_start,
        period_end: generateForm.period_end,
      });
      toast.success(res.data?.message || "Payable revenue statement generated!");
      setShowGenerateModal(false);
      fetchStatements();
    } catch (err) {
      toast.error(err.userMessage || "Failed to generate statement");
    }
  };

  const handleConfirmDisburse = async (e) => {
    e.preventDefault();
    if (!disburseTarget) return;

    setSubmittingDisburse(true);
    try {
      await financeApi.disburseDoctorRevenueStatement(disburseTarget.id, {
        payment_method: disbursePaymentMethod,
      });
      toast.success(
        `Disbursed ৳${parseFloat(disburseTarget.share_amount).toLocaleString()} payout to Dr. ${disburseTarget.doctor_name}! GL entry posted.`
      );
      setDisburseTarget(null);
      fetchStatements();
    } catch (err) {
      toast.error(err.userMessage || "Failed to disburse statement");
    } finally {
      setSubmittingDisburse(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:user-group" className="w-7 h-7 text-primary" />
            Doctor Revenue Share Management
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Configurable doctor revenue percentage/fixed share per service category with period payable statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "configs" ? (
            <Button onClick={() => setShowConfigModal(true)} className="bg-primary text-primary-foreground">
              <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
              New Config
            </Button>
          ) : (
            <Button onClick={() => setShowGenerateModal(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Icon icon="heroicons:sparkles" className="w-4 h-4 mr-2" />
              Generate Statement
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "configs" ? "default" : "outline"}
          onClick={() => setActiveTab("configs")}
          className={activeTab === "configs" ? "bg-primary text-primary-foreground" : ""}
        >
          <Icon icon="heroicons:cog-6-tooth" className="w-4 h-4 mr-2" />
          Revenue Share Configs
        </Button>
        <Button
          variant={activeTab === "statements" ? "default" : "outline"}
          onClick={() => setActiveTab("statements")}
          className={activeTab === "statements" ? "bg-primary text-primary-foreground" : ""}
        >
          <Icon icon="heroicons:document-chart-bar" className="w-4 h-4 mr-2" />
          Payable Statements
        </Button>
      </div>

      {/* CONFIGS TAB */}
      {activeTab === "configs" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Active Doctor Configurations ({configs.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-default-500">
                <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading configs...
              </div>
            ) : configs.length === 0 ? (
              <div className="p-12 text-center text-default-500">
                No doctor revenue share configurations found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-default-100 text-default-700 font-semibold border-b">
                    <tr>
                      <th className="p-3">Doctor Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Share Type</th>
                      <th className="p-3 text-right">Share Value</th>
                      <th className="p-3">Effective From</th>
                      <th className="p-3">Effective Until</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {configs.map((c) => (
                      <tr key={c.id} className="hover:bg-default-50 transition-colors">
                        <td className="p-3 font-semibold text-default-900">{c.doctor_name}</td>
                        <td className="p-3 capitalize">{c.service_category || "All Categories"}</td>
                        <td className="p-3 capitalize">
                          <Badge variant="soft" className="text-xs">{c.share_type}</Badge>
                        </td>
                        <td className="p-3 text-right font-bold text-primary">
                          {c.share_type === "percentage" ? `${parseFloat(c.share_value)}%` : `৳${parseFloat(c.share_value)}`}
                        </td>
                        <td className="p-3 text-default-600">{c.effective_from}</td>
                        <td className="p-3 text-default-400">{c.effective_until || "Indefinite"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STATEMENTS TAB */}
      {activeTab === "statements" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Doctor Payable Statements ({statements.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-default-500">
                <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading statements...
              </div>
            ) : statements.length === 0 ? (
              <div className="p-12 text-center text-default-500">
                No doctor revenue statements generated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-default-100 text-default-700 font-semibold border-b">
                    <tr>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Period</th>
                      <th className="p-3 text-right">Total Revenue Billed</th>
                      <th className="p-3 text-right">Doctor Payable Share</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Generated At</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {statements.map((s) => (
                      <tr key={s.id} className="hover:bg-default-50 transition-colors">
                        <td className="p-3 font-semibold text-default-900">{s.doctor_name}</td>
                        <td className="p-3 text-default-600">{s.period_start} to {s.period_end}</td>
                        <td className="p-3 text-right font-medium">৳{parseFloat(s.total_revenue).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">৳{parseFloat(s.share_amount).toLocaleString()}</td>
                        <td className="p-3 capitalize">
                          <Badge
                            variant="soft"
                            className={`text-xs ${
                              s.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-default-400">{new Date(s.generated_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          {s.status !== "paid" ? (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5"
                              onClick={() => {
                                setDisbursePaymentMethod("cash");
                                setDisburseTarget(s);
                              }}
                            >
                              <Icon icon="heroicons:banknotes" className="w-3.5 h-3.5 mr-1" />
                              Disburse Payout
                            </Button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                              <Icon icon="heroicons:check-circle" className="w-4 h-4" /> Disbursed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CREATE CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900">Configure Doctor Revenue Share</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowConfigModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Select Doctor *</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card mb-2"
                  value={configForm.doctor_id}
                  onChange={(e) => setConfigForm({ ...configForm, doctor_id: e.target.value })}
                  required
                >
                  <option value="">Choose a Doctor from list...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.bmdc_reg_number || "Doctor"})
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Or paste Doctor UUID manually..."
                  value={configForm.doctor_id}
                  onChange={(e) => setConfigForm({ ...configForm, doctor_id: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Service Category (Blank = All)</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={configForm.service_category}
                  onChange={(e) => setConfigForm({ ...configForm, service_category: e.target.value })}
                >
                  <option value="">All Categories</option>
                  <option value="consultation">Consultation</option>
                  <option value="investigation">Investigation / Lab</option>
                  <option value="procedure">Procedure / OT</option>
                  <option value="medication">Medication</option>
                  <option value="bed">IPD Bed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Share Type</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={configForm.share_type}
                  onChange={(e) => setConfigForm({ ...configForm, share_type: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount per Item (৳)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Share Value *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 60 for 60%"
                  value={configForm.share_value}
                  onChange={(e) => setConfigForm({ ...configForm, share_value: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowConfigModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Save Config
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE STATEMENT MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900">Generate Doctor Revenue Statement</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowGenerateModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Select Doctor *</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card mb-2"
                  value={generateForm.doctor_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, doctor_id: e.target.value })}
                  required
                >
                  <option value="">Choose a Doctor from list...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.bmdc_reg_number || "Doctor"})
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Or paste Doctor UUID manually..."
                  value={generateForm.doctor_id}
                  onChange={(e) => setGenerateForm({ ...generateForm, doctor_id: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-default-700 mb-1">Period Start *</label>
                  <Input
                    type="date"
                    value={generateForm.period_start}
                    onChange={(e) => setGenerateForm({ ...generateForm, period_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-default-700 mb-1">Period End *</label>
                  <Input
                    type="date"
                    value={generateForm.period_end}
                    onChange={(e) => setGenerateForm({ ...generateForm, period_end: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Calculate & Generate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DISBURSE PAYOUT MODAL */}
      {disburseTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
                <Icon icon="heroicons:banknotes" className="w-6 h-6" />
                Confirm Doctor Revenue Payout
              </div>
              <Button size="icon" variant="ghost" onClick={() => setDisburseTarget(null)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <div className="bg-default-50 p-4 rounded-xl border border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-default-500">Doctor:</span>
                <strong className="text-default-900">{disburseTarget.doctor_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">Period:</span>
                <span className="font-mono text-default-700">{disburseTarget.period_start} to {disburseTarget.period_end}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">Total Billed Revenue:</span>
                <span className="font-semibold text-default-800">৳{parseFloat(disburseTarget.total_revenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base border-t pt-2 mt-2">
                <span className="font-bold text-default-900">Payable Share:</span>
                <strong className="font-extrabold text-emerald-600 text-lg">৳{parseFloat(disburseTarget.share_amount).toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmDisburse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Disbursement Payment Method</label>
                <select
                  className="w-full text-sm p-2 rounded-lg border bg-background text-default-800 focus:ring-2 focus:ring-emerald-500/30"
                  value={disbursePaymentMethod}
                  onChange={(e) => setDisbursePaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash in Hand (Counter Till)</option>
                  <option value="bank_transfer">Bank Transfer / Cheque</option>
                </select>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Are you sure you want to disburse this payout? This will mark the statement as <strong>Paid</strong> and record a double-entry Journal Entry in the General Ledger (<code>[5010] Doctor Revenue Share Expense</code> vs <code>[1010] Cash/Bank</code>).
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setDisburseTarget(null)} disabled={submittingDisburse}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingDisburse}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                >
                  {submittingDisburse ? (
                    <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Icon icon="heroicons:check-circle" className="w-4 h-4 mr-1" />
                  )}
                  Confirm & Disburse Payout
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

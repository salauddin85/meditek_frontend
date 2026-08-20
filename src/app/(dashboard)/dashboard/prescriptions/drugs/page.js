"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { prescriptionApi } from "@/lib/tenant-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Pill,
  Plus,
  Search,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

export default function DrugMasterRegistryPage() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    generic_name: "",
    generic_name_bn: "",
    brand_name: "",
    strength: "",
    dosage_form: "tablet",
    manufacturer: "",
    dgda_reg_number: "",
    is_controlled: false,
    requires_dosing_by_weight: false,
    min_egfr_threshold: "",
  });

  useEffect(() => {
    fetchDrugs();
  }, []);

  const extractList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.results)) return res.data.results;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.data?.results)) return res.data.data.results;
    if (Array.isArray(res.results)) return res.results;
    return [];
  };

  const fetchDrugs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prescriptionApi.getDrugs();
      const list = extractList(res);
      setDrugs(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load drug registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q) => {
    setSearch(q);
    setLoading(true);
    try {
      const res = await prescriptionApi.getDrugs({ q });
      const list = extractList(res);
      setDrugs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDrugSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    if (!formData.generic_name.trim()) {
      setModalError("Generic Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        generic_name: formData.generic_name.trim(),
        brand_name: formData.brand_name.trim() || null,
        strength: formData.strength.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        dgda_reg_number: formData.dgda_reg_number.trim() || null,
        min_egfr_threshold: formData.min_egfr_threshold ? parseFloat(formData.min_egfr_threshold) : null,
      };

      const res = await prescriptionApi.createDrug(payload);
      setSuccessMessage(`Drug '${formData.generic_name}' added successfully to registry!`);
      setShowAddModal(false);
      setFormData({
        generic_name: "",
        generic_name_bn: "",
        brand_name: "",
        strength: "",
        dosage_form: "tablet",
        manufacturer: "",
        dgda_reg_number: "",
        is_controlled: false,
        requires_dosing_by_weight: false,
        min_egfr_threshold: "",
      });

      // Reload list
      fetchDrugs();

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setModalError(err.userMessage || "Failed to add drug.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard/prescriptions" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Prescriptions
            </Link>
            <span>/</span>
            <span>Drug Master Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="h-7 w-7 text-emerald-600" />
            Drug Master Registry (DGDA & Custom)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse DGDA-compliant drug database or manually add new medications for clinical prescribing.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow"
        >
          <Plus className="h-4 w-4" />
          Add New Drug
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2 font-medium">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {/* Filter Card */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search generic name, brand, manufacturer..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">
            Registered Medications ({drugs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              Loading drug registry...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 bg-red-50 text-sm font-medium">
              {error}
            </div>
          ) : drugs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No drugs found matching your search term. Click "Add New Drug" above to register a medication manually.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Generic & Brand Name</TableHead>
                  <TableHead>Strength & Form</TableHead>
                  <TableHead>Manufacturer / DGDA Reg</TableHead>
                  <TableHead>Safety Flags</TableHead>
                  <TableHead className="text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugs.map((drug) => (
                  <TableRow key={drug.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm">{drug.generic_name}</div>
                      {drug.brand_name && (
                        <div className="text-xs text-slate-500 font-medium">Brand: {drug.brand_name}</div>
                      )}
                      {drug.generic_name_bn && (
                        <div className="text-xs text-slate-400 font-serif">{drug.generic_name_bn}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-800">{drug.strength || "N/A"}</div>
                      <Badge variant="outline" className="capitalize text-[11px] bg-slate-50">
                        {drug.dosage_form}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-700">{drug.manufacturer || "Generic"}</div>
                      {drug.dgda_reg_number && (
                        <div className="text-[11px] font-mono text-slate-400">DGDA: {drug.dgda_reg_number}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {drug.is_controlled && (
                          <Badge variant="destructive" className="text-[10px]">
                            Controlled
                          </Badge>
                        )}
                        {drug.requires_dosing_by_weight && (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            Weight Dosing
                          </Badge>
                        )}
                        {drug.min_egfr_threshold && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Renal &lt;{drug.min_egfr_threshold}
                          </Badge>
                        )}
                        {!drug.is_controlled && !drug.requires_dosing_by_weight && !drug.min_egfr_threshold && (
                          <span className="text-xs text-slate-400">Standard</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add New Drug Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Pill className="h-5 w-5 text-emerald-600" />
                Add New Drug to Registry
              </CardTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {modalError}
                </div>
              )}

              <form onSubmit={handleAddDrugSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Generic Name *
                    </label>
                    <Input
                      placeholder="e.g. Amoxicillin, Paracetamol..."
                      value={formData.generic_name}
                      onChange={(e) => handleInputChange("generic_name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Brand Trade Name
                    </label>
                    <Input
                      placeholder="e.g. Moxacil, Napa, Ace..."
                      value={formData.brand_name}
                      onChange={(e) => handleInputChange("brand_name", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Strength
                    </label>
                    <Input
                      placeholder="e.g. 500mg, 10mg/5ml..."
                      value={formData.strength}
                      onChange={(e) => handleInputChange("strength", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Dosage Form
                    </label>
                    <select
                      value={formData.dosage_form}
                      onChange={(e) => handleInputChange("dosage_form", e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 bg-white"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                      <option value="suspension">Suspension</option>
                      <option value="cream">Cream</option>
                      <option value="ointment">Ointment</option>
                      <option value="drops">Drops</option>
                      <option value="inhaler">Inhaler</option>
                      <option value="suppository">Suppository</option>
                      <option value="lotion">Lotion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Manufacturer
                    </label>
                    <Input
                      placeholder="e.g. Beximco, Square, Incepta..."
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      DGDA Reg Number
                    </label>
                    <Input
                      placeholder="e.g. DAR-1234-56"
                      value={formData.dgda_reg_number}
                      onChange={(e) => handleInputChange("dgda_reg_number", e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Safety & Dosing Rules:</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="controlled"
                      checked={formData.is_controlled}
                      onChange={(e) => handleInputChange("is_controlled", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 cursor-pointer"
                    />
                    <label htmlFor="controlled" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Controlled / Narcotic Drug (Requires special authorization)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="weight_dosing"
                      checked={formData.requires_dosing_by_weight}
                      onChange={(e) => handleInputChange("requires_dosing_by_weight", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 cursor-pointer"
                    />
                    <label htmlFor="weight_dosing" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Pediatric Weight-Based Dosing Mandatory
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Min eGFR Renal Adjustment Threshold (mL/min)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 50.0"
                      value={formData.min_egfr_threshold}
                      onChange={(e) => handleInputChange("min_egfr_threshold", e.target.value)}
                      className="bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Drug Record
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

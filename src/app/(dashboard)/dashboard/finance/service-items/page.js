"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function ServiceItemsPage() {
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [addForm, setAddForm] = useState({
    name: "",
    code: "",
    category: "consultation",
    base_price: "",
    is_vat_exempt: false,
    revenue_account_id: "",
  });

  const [tierForm, setTierForm] = useState({
    tier_type: "corporate",
    price: "",
  });

  useEffect(() => {
    fetchServiceItems();
    fetchAccounts();
  }, [catFilter]);

  const fetchServiceItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (catFilter) params.category = catFilter;

      const res = await financeApi.getServiceItems(params);
      setItems(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching service items:", err);
      toast.error(err.userMessage || "Failed to load charge master items");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await financeApi.getChartOfAccounts();
      const accs = res.data?.data || [];
      // Filter revenue accounts
      setAccounts(accs.filter((a) => a.account_type === "revenue"));
    } catch (err) {
      console.error("Error loading accounts:", err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: addForm.name.trim(),
        code: addForm.code.trim().toUpperCase(),
        category: addForm.category,
        base_price: parseFloat(addForm.base_price),
        is_vat_exempt: addForm.is_vat_exempt,
      };
      if (addForm.revenue_account_id) payload.revenue_account_id = addForm.revenue_account_id;

      const res = await financeApi.createServiceItem(payload);
      toast.success(res.data?.message || "Service item created!");
      setShowAddModal(false);
      setAddForm({ name: "", code: "", category: "consultation", base_price: "", is_vat_exempt: false, revenue_account_id: "" });
      fetchServiceItems();
    } catch (err) {
      toast.error(err.userMessage || "Failed to create service item");
    }
  };

  const handleTierSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await financeApi.setPricingTier(selectedItem.id, {
        tier_type: tierForm.tier_type,
        price: parseFloat(tierForm.price),
      });
      toast.success(res.data?.message || "Pricing tier updated!");
      setShowTierModal(false);
      fetchServiceItems();
    } catch (err) {
      toast.error(err.userMessage || "Failed to set pricing tier");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:tag" className="w-7 h-7 text-primary" />
            Charge Master Service Catalog
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Central service charge master with tiered pricing (standard, corporate, insurance, staff, camp, contract).
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} className="bg-primary text-primary-foreground">
          <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
          Add Service Item
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {["", "consultation", "investigation", "procedure", "medication", "bed", "other"].map((cat) => (
          <Button
            key={cat}
            variant={catFilter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCatFilter(cat)}
            className={catFilter === cat ? "bg-primary text-primary-foreground" : ""}
          >
            {cat === "" ? "All Categories" : cat.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Service Master Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-default-500">
              <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading charge master catalog...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-default-500">
              No service items found for selected category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-default-100 text-default-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Service Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Base Price (৳)</th>
                    <th className="p-3">Revenue Account</th>
                    <th className="p-3">Pricing Tiers</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-default-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">{item.code}</td>
                      <td className="p-3 font-medium text-default-900">
                        {item.name}
                        {item.is_vat_exempt && (
                          <Badge variant="soft" className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600">
                            VAT Exempt
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 capitalize">
                        <Badge variant="soft" className="text-xs">{item.category}</Badge>
                      </td>
                      <td className="p-3 text-right font-bold text-default-900">
                        ৳{parseFloat(item.base_price).toLocaleString()}
                      </td>
                      <td className="p-3 text-xs text-default-600">
                        {item.revenue_account_code ? `[${item.revenue_account_code}]` : "Default Revenue"}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.pricing_tiers?.map((t) => (
                            <span key={t.id} className="text-[11px] px-2 py-0.5 rounded bg-default-100 border text-default-700">
                              {t.tier_type}: <strong>৳{t.price}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setTierForm({ tier_type: "corporate", price: item.base_price });
                            setShowTierModal(true);
                          }}
                        >
                          <Icon icon="heroicons:tag" className="w-3.5 h-3.5 mr-1" />
                          Set Tier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD SERVICE ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900">Add New Service Item</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowAddModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Service Code * (e.g. CONS-SPEC, LAB-CBC)</label>
                <Input
                  placeholder="Unique code"
                  value={addForm.code}
                  onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Service Name *</label>
                <Input
                  placeholder="e.g. Specialist Consultation"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Category *</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                >
                  <option value="consultation">Consultation</option>
                  <option value="investigation">Investigation / Lab</option>
                  <option value="procedure">Procedure / OT</option>
                  <option value="medication">Medication / Pharmacy</option>
                  <option value="bed">IPD Bed Charge</option>
                  <option value="other">Other Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Base Price (৳) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addForm.base_price}
                  onChange={(e) => setAddForm({ ...addForm, base_price: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Revenue Account Mapping</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={addForm.revenue_account_id}
                  onChange={(e) => setAddForm({ ...addForm, revenue_account_id: e.target.value })}
                >
                  <option value="">Default Revenue Account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.code}] {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vat_exempt"
                  checked={addForm.is_vat_exempt}
                  onChange={(e) => setAddForm({ ...addForm, is_vat_exempt: e.target.checked })}
                  className="rounded border"
                />
                <label htmlFor="vat_exempt" className="text-xs font-medium text-default-700 cursor-pointer">
                  Service is Exempt from Statutory VAT (FR-FIN-011)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Create Service Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SET PRICING TIER MODAL */}
      {showTierModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900">Configure Pricing Tier</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowTierModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-xs text-default-500">
              Service: <strong>{selectedItem.name}</strong> (Base: ৳{selectedItem.base_price})
            </p>

            <form onSubmit={handleTierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Pricing Tier Type *</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={tierForm.tier_type}
                  onChange={(e) => setTierForm({ ...tierForm, tier_type: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="corporate">Corporate Contract</option>
                  <option value="insurance">Insurance Company</option>
                  <option value="staff">Hospital Staff / Dependent</option>
                  <option value="camp">Medical Camp</option>
                  <option value="contract">Special Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Tier Special Price (৳) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter tier price"
                  value={tierForm.price}
                  onChange={(e) => setTierForm({ ...tierForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowTierModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Save Tier Price
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

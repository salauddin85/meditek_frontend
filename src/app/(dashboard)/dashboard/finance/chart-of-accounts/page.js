"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    account_type: "asset",
    parent_id: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getChartOfAccounts();
      setAccounts(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      toast.error(err.userMessage || "Failed to load Chart of Accounts");
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    if (!typeFilter) return true;
    return a.account_type === typeFilter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        account_type: form.account_type,
      };
      if (form.parent_id) payload.parent_id = form.parent_id;

      const res = await financeApi.createChartOfAccount(payload);
      toast.success(res.data?.message || "Chart of Account created!");
      setShowModal(false);
      setForm({ code: "", name: "", account_type: "asset", parent_id: "" });
      fetchAccounts();
    } catch (err) {
      toast.error(err.userMessage || "Failed to create account");
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "asset":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Asset</Badge>;
      case "liability":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Liability</Badge>;
      case "equity":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Equity</Badge>;
      case "revenue":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Revenue</Badge>;
      case "expense":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Expense</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Icon icon="heroicons:folder-open" className="w-7 h-7 text-primary" />
            Chart of Accounts Management
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Tenant double-entry master ledger accounts. Protected system accounts cannot be deleted.
          </p>
        </div>

        <Button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground">
          <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
          Add Custom Account
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {["", "asset", "liability", "equity", "revenue", "expense"].map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(t)}
            className={typeFilter === t ? "bg-primary text-primary-foreground" : ""}
          >
            {t === "" ? "All Accounts" : t.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Master Accounts ({filteredAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-default-500">
              <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading Chart of Accounts...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-12 text-center text-default-500">
              No accounts found matching current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-default-100 text-default-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Account Type</th>
                    <th className="p-3">Protection Status</th>
                    <th className="p-3">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAccounts.map((a) => (
                    <tr key={a.id} className="hover:bg-default-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">{a.code}</td>
                      <td className="p-3 font-medium text-default-900">{a.name}</td>
                      <td className="p-3">{getTypeBadge(a.account_type)}</td>
                      <td className="p-3">
                        {a.is_system ? (
                          <Badge variant="soft" className="bg-default-200 text-default-700 text-xs">
                            🔒 Protected System Account
                          </Badge>
                        ) : (
                          <Badge variant="soft" className="bg-blue-500/10 text-blue-600 text-xs">
                            Custom Account
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="soft" className="bg-emerald-500/10 text-emerald-600 text-xs">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE ACCOUNT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-default-900">Add Custom Chart of Account</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowModal(false)}>
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Account Code * (e.g. 1040, 4060)</label>
                <Input
                  placeholder="Enter numerical code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Account Name *</label>
                <Input
                  placeholder="Enter account name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-default-700 mb-1">Account Type *</label>
                <select
                  className="w-full text-sm p-2 rounded border bg-card"
                  value={form.account_type}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                >
                  <option value="asset">Asset (1000s)</option>
                  <option value="liability">Liability (2000s)</option>
                  <option value="equity">Equity (3000s)</option>
                  <option value="revenue">Revenue (4000s)</option>
                  <option value="expense">Expense (5000s)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

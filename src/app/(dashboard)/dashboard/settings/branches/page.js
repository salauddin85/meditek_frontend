"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Icon import removed (unused)
import {
  Building2,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

import { branchesApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Zod Schema ─────────────────────────────────────────────────────────────

const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters."),
  name_bn: z.string().optional(),
  code: z.string().min(2, "Branch code must be at least 2 characters."),
  is_headquarters: z.boolean().default(false),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  upazila: z.string().optional(),
  union_name: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  timezone: z.string().default("Asia/Dhaka"),
  currency: z.string().default("BDT"),
});

export default function BranchesPage() {
  const { isAdmin } = useTenantAuthStore();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deactivatingBranch, setDeactivatingBranch] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      is_headquarters: false,
      timezone: "Asia/Dhaka",
      currency: "BDT",
    },
  });

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchesApi.getBranches({
        search: search.trim() || undefined,
        include_inactive: includeInactive ? "true" : undefined,
      });
      if (res.data?.data) {
        setBranches(res.data.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }, [search, includeInactive]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    setQuotaExceeded(null);
    reset({
      name: "",
      name_bn: "",
      code: `BR-${String(branches.length + 1).padStart(2, "0")}`,
      is_headquarters: branches.length === 0,
      address_line1: "",
      address_line2: "",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "",
      union_name: "",
      postal_code: "",
      phone: "",
      email: "",
      timezone: "Asia/Dhaka",
      currency: "BDT",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch);
    setQuotaExceeded(null);
    reset({
      name: branch.name || "",
      name_bn: branch.name_bn || "",
      code: branch.code || "",
      is_headquarters: branch.is_headquarters || false,
      address_line1: branch.address_line1 || "",
      address_line2: branch.address_line2 || "",
      division: branch.division || "",
      district: branch.district || "",
      upazila: branch.upazila || "",
      union_name: branch.union_name || "",
      postal_code: branch.postal_code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      timezone: branch.timezone || "Asia/Dhaka",
      currency: branch.currency || "BDT",
    });
    setShowModal(true);
  };

  const onSubmitForm = async (formData) => {
    setSubmitting(true);
    setQuotaExceeded(null);
    try {
      if (editingBranch) {
        await branchesApi.updateBranch(editingBranch.id, formData);
        toast.success("Branch updated successfully.");
      } else {
        await branchesApi.createBranch(formData);
        toast.success("Branch created successfully.");
      }
      setShowModal(false);
      fetchBranches();
    } catch (err) {
      const errData = err?.response?.data;
      if (errData?.data?.error_code === "QUOTA_EXCEEDED") {
        setQuotaExceeded(errData.message || "Branch quota limit reached.");
      } else {
        toast.error(errData?.message || "Operation failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingBranch) return;
    setDeactivating(true);
    try {
      await branchesApi.deactivateBranch(deactivatingBranch.id);
      toast.success("Branch deactivated successfully.");
      setDeactivatingBranch(null);
      fetchBranches();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate branch.");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            Branch & Department Management
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Manage physical hospital locations, headquarters, and departmental organizational structures.
          </p>
        </div>

        {isAdmin() && (
          <Button onClick={handleOpenCreateModal} className="h-10 px-5 font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Add New Branch
          </Button>
        )}
      </div>

      {/* ── Search & Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
          <Input
            type="text"
            placeholder="Search branches by name, code, district, or division..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-2 text-xs font-semibold text-default-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-default-300 text-primary focus:ring-primary h-4 w-4"
            />
            Show Inactive
          </label>

          <Button variant="outline" size="sm" onClick={fetchBranches} className="h-10 px-3">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Branch List Table ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Building className="w-12 h-12 text-default-300 mb-3" />
              <h3 className="text-lg font-bold text-default-800">No Branches Found</h3>
              <p className="text-sm text-default-500 max-w-sm mt-1 mb-4">
                {search ? "No branches match your search criteria." : "Get started by adding your first hospital branch location."}
              </p>
              {isAdmin() && !search && (
                <Button onClick={handleOpenCreateModal} size="sm" className="font-semibold">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Branch
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-default-50">
                  <TableHead className="w-[120px]">Code</TableHead>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Departments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id} className="hover:bg-default-50/50 transition-colors">
                    <TableCell className="font-mono font-bold text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-default-100 border border-default-200 text-default-800">
                        {branch.code}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-default-900">{branch.name}</span>
                        {branch.is_headquarters && (
                          <Badge color="primary" className="text-[10px] px-2 py-0.5 font-extrabold uppercase tracking-wider">
                            Headquarters
                          </Badge>
                        )}
                      </div>
                      {branch.name_bn && (
                        <p className="text-xs text-default-500 mt-0.5">{branch.name_bn}</p>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-default-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-default-400 shrink-0" />
                        <span>
                          {branch.district ? `${branch.district}, ` : ""}
                          {branch.division || "Bangladesh"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-default-600">
                      {branch.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-default-400 shrink-0" />
                          <span>{branch.phone}</span>
                        </div>
                      )}
                      {branch.email && (
                        <div className="flex items-center gap-1 text-default-500">
                          <Mail className="w-3.5 h-3.5 text-default-400 shrink-0" />
                          <span>{branch.email}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {branch.department_count ?? 0}
                      </span>
                    </TableCell>

                    <TableCell>
                      {branch.is_active ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-500/10 text-slate-600 border border-slate-500/20">
                          Inactive
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/dashboard/settings/branches/${branch.id}`}>
                          <Button size="xs" variant="soft" color="info" className="font-semibold gap-1">
                            Departments
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>

                        {isAdmin() && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-default-600 hover:text-primary"
                              onClick={() => handleOpenEditModal(branch)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {!branch.is_headquarters && branch.is_active && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setDeactivatingBranch(branch)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Create / Edit Branch Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent size="lg" className="p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-default-900">
                    {editingBranch ? "Edit Branch Location" : "Add New Branch Location"}
                  </DialogTitle>
                  <p className="text-xs text-default-500 mt-0.5">
                    {editingBranch ? `Update parameters for ${editingBranch.name}` : "Create a new branch in your hospital organization."}
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
            {quotaExceeded && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{quotaExceeded}</p>
                  <Link href="/dashboard/settings/billing" className="text-xs underline font-bold hover:text-destructive/80">
                    Upgrade Subscription Plan →
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-semibold text-default-700">
                  Branch Name <span className="text-destructive">*</span>
                </Label>
                <Input id="name" placeholder="e.g. Uttara Main Branch" {...register("name")} />
                {errors.name && <p className="text-destructive text-xs italic">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name_bn" className="font-semibold text-default-700">
                  Branch Name (Bangla)
                </Label>
                <Input id="name_bn" placeholder="উত্তরা প্রধান শাখা" {...register("name_bn")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code" className="font-semibold text-default-700">
                  Branch Code <span className="text-destructive">*</span>
                </Label>
                <Input id="code" placeholder="e.g. BR-01, HQ" className="uppercase font-mono" {...register("code")} />
                {errors.code && <p className="text-destructive text-xs italic">{errors.code.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="font-semibold text-default-700">
                  Contact Phone
                </Label>
                <Input id="phone" placeholder="+8801700000000" {...register("phone")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold text-default-700">
                  Branch Email
                </Label>
                <Input id="email" type="email" placeholder="uttara@hospital.com" {...register("email")} />
                {errors.email && <p className="text-destructive text-xs italic">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="district" className="font-semibold text-default-700">
                  District
                </Label>
                <Input id="district" placeholder="e.g. Dhaka" {...register("district")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="division" className="font-semibold text-default-700">
                  Division
                </Label>
                <Input id="division" placeholder="e.g. Dhaka" {...register("division")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="upazila" className="font-semibold text-default-700">
                  Upazila / Thana
                </Label>
                <Input id="upazila" placeholder="e.g. Uttara" {...register("upazila")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address_line1" className="font-semibold text-default-700">
                Full Street Address
              </Label>
              <Input id="address_line1" placeholder="House #12, Road #4, Sector #3" {...register("address_line1")} />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-default-800">
                <input
                  type="checkbox"
                  {...register("is_headquarters")}
                  className="rounded border-default-300 text-primary focus:ring-primary h-4 w-4"
                />
                Set as Headquarters (HQ) Branch
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-border gap-3">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[120px] font-bold">
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    {editingBranch ? "Save Changes" : "Create Branch"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Branch Confirmation Dialog ── */}
      <AlertDialog open={!!deactivatingBranch} onOpenChange={() => setDeactivatingBranch(null)}>
        <AlertDialogContent className="p-0 overflow-hidden border-none shadow-2xl max-w-md">
          <div className="bg-destructive/5 p-6 border-b border-destructive/10">
            <AlertDialogHeader className="flex-row items-center gap-4 space-y-0">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-xl font-bold text-default-900">
                  Deactivate Branch
                </AlertDialogTitle>
                <p className="text-xs text-default-500 mt-1">Soft-deactivate branch location.</p>
              </div>
            </AlertDialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <AlertDialogDescription className="text-default-700 text-sm leading-relaxed">
              Are you sure you want to deactivate <span className="font-bold text-default-900">"{deactivatingBranch?.name}"</span>?
              New appointments or transactions will not be allowed under this branch.
            </AlertDialogDescription>

            <div className="flex justify-end gap-3 pt-4">
              <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeactivate();
                }}
                disabled={deactivating}
                className="bg-destructive hover:bg-destructive/90 text-white font-bold"
              >
                {deactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deactivate Branch"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

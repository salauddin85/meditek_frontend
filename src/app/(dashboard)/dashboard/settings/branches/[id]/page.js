"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Building2,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";

import { branchesApi } from "@/lib/tenant-api";
import { useTenantAuthStore } from "@/store/tenant-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ── Zod Department Schema ──────────────────────────────────────────────────

const deptSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters."),
  name_bn: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
});

export default function BranchDetailPage({ params }) {
  const unwrappedParams = use(params);
  const branchId = unwrappedParams.id;

  const { isAdmin } = useTenantAuthStore();

  const [branch, setBranch] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptSearch, setDeptSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submittingDept, setSubmittingDept] = useState(false);
  const [deactivatingDept, setDeactivatingDept] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "", name_bn: "", code: "", description: "" },
  });

  const fetchBranchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchesApi.getBranch(branchId);
      if (res.data?.data) {
        setBranch(res.data.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load branch details.");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await branchesApi.getDepartments(branchId, {
        search: deptSearch.trim() || undefined,
        include_inactive: includeInactive ? "true" : undefined,
      });
      if (res.data?.data) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      // Handled silently or toast
    }
  }, [branchId, deptSearch, includeInactive]);

  useEffect(() => {
    fetchBranchDetails();
    fetchDepartments();
  }, [fetchBranchDetails, fetchDepartments]);

  const handleOpenCreateDeptModal = () => {
    setEditingDept(null);
    reset({
      name: "",
      name_bn: "",
      code: "",
      description: "",
    });
    setShowDeptModal(true);
  };

  const handleOpenEditDeptModal = (dept) => {
    setEditingDept(dept);
    reset({
      name: dept.name || "",
      name_bn: dept.name_bn || "",
      code: dept.code || "",
      description: dept.description || "",
    });
    setShowDeptModal(true);
  };

  const onSubmitDeptForm = async (formData) => {
    setSubmittingDept(true);
    try {
      if (editingDept) {
        await branchesApi.updateDepartment(branchId, editingDept.id, formData);
        toast.success("Department updated successfully.");
      } else {
        await branchesApi.createDepartment(branchId, formData);
        toast.success("Department created successfully.");
      }
      setShowDeptModal(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Operation failed.");
    } finally {
      setSubmittingDept(false);
    }
  };

  const handleDeactivateDept = async () => {
    if (!deactivatingDept) return;
    setDeactivating(true);
    try {
      await branchesApi.deactivateDepartment(branchId, deactivatingDept.id);
      toast.success("Department deactivated successfully.");
      setDeactivatingDept(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate department.");
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-default-800">Branch Not Found</h2>
        <Link href="/dashboard/settings/branches" className="mt-4 inline-block text-primary font-bold">
          ← Back to Branches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Navigation & Title Bar ── */}
      <div className="space-y-3">
        <Link
          href="/dashboard/settings/branches"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Branches List
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-default-900">{branch.name}</h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-default-100 border border-default-200 text-default-800 font-bold">
                  {branch.code}
                </span>
                {branch.is_headquarters && (
                  <Badge color="primary" className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-extrabold">
                    Headquarters
                  </Badge>
                )}
              </div>
              {branch.name_bn && <p className="text-xs text-default-500 mt-0.5">{branch.name_bn}</p>}
            </div>
          </div>

          {isAdmin() && (
            <Button onClick={handleOpenCreateDeptModal} className="h-10 px-5 font-bold flex items-center gap-2 shadow-md">
              <Plus className="w-4 h-4" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      {/* ── Branch Overview Metadata Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-sm font-bold text-default-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-default-500 font-medium">District</span>
              <span className="text-default-800 font-bold">{branch.district || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-default-500 font-medium">Division</span>
              <span className="text-default-800 font-bold">{branch.division || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-default-500 font-medium">Upazila</span>
              <span className="text-default-800 font-bold">{branch.upazila || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-500 font-medium">Address</span>
              <span className="text-default-800 font-semibold text-right max-w-[180px]">
                {branch.address_line1 || "No street address provided"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-sm font-bold text-default-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Contact & Config
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-default-500 font-medium">Phone</span>
              <span className="text-default-800 font-bold">{branch.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-default-500 font-medium">Email</span>
              <span className="text-default-800 font-bold truncate max-w-[160px]">{branch.email || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-default-500 font-medium">Timezone</span>
              <span className="text-default-800 font-bold">{branch.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-default-500 font-medium">Currency</span>
              <span className="text-default-800 font-bold">{branch.currency}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-sm font-bold text-default-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Department Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-4xl font-extrabold text-primary">{departments.length}</span>
            <span className="text-xs font-semibold text-default-600">Active Departments</span>
            <p className="text-[11px] text-default-400 max-w-[200px]">
              OPD, Emergency, Pharmacy, Lab, and Clinical units assigned to this branch.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Department Management Section ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-default-900">Branch Departments</h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
              <Input
                placeholder="Search departments..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-default-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-default-300 text-primary focus:ring-primary h-4 w-4"
              />
              Show Inactive
            </label>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {departments.length === 0 ? (
              <div className="py-12 text-center text-default-500 text-sm">
                <Layers className="w-10 h-10 text-default-300 mx-auto mb-2" />
                <p className="font-semibold">No Departments Found</p>
                <p className="text-xs text-default-400 mt-1">Add departments (e.g. OPD, IPD, Pathology) under this branch.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-default-50">
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id} className="hover:bg-default-50/50">
                      <TableCell className="font-mono text-xs font-bold">
                        <span className="px-2 py-0.5 rounded bg-default-100 border border-default-200">
                          {dept.code || "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-default-900 text-sm">{dept.name}</span>
                        {dept.name_bn && <p className="text-xs text-default-500">{dept.name_bn}</p>}
                      </TableCell>

                      <TableCell className="text-xs text-default-600 max-w-xs truncate">
                        {dept.description || "—"}
                      </TableCell>

                      <TableCell>
                        {dept.is_active ? (
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
                        {isAdmin() && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-default-600 hover:text-primary"
                              onClick={() => handleOpenEditDeptModal(dept)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {dept.is_active && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setDeactivatingDept(dept)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Add / Edit Department Modal ── */}
      <Dialog open={showDeptModal} onOpenChange={setShowDeptModal}>
        <DialogContent size="sm" className="p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-default-900">
                    {editingDept ? "Edit Department" : "Add Department"}
                  </DialogTitle>
                  <p className="text-xs text-default-500 mt-0.5">
                    Department for {branch.name} branch.
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmitDeptForm)} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-semibold text-default-700">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="e.g. Cardiology OPD" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs italic">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name_bn" className="font-semibold text-default-700">
                Department Name (Bangla)
              </Label>
              <Input id="name_bn" placeholder="কার্ডিওলজি বিভাগ" {...register("name_bn")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code" className="font-semibold text-default-700">
                Department Code
              </Label>
              <Input id="code" placeholder="e.g. CARD, OPD-1" className="uppercase font-mono" {...register("code")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="font-semibold text-default-700">
                Description / Notes
              </Label>
              <Input id="description" placeholder="Brief outline of services provided..." {...register("description")} />
            </div>

            <DialogFooter className="pt-4 border-t border-border gap-3">
              <Button type="button" variant="outline" onClick={() => setShowDeptModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingDept} className="min-w-[120px] font-bold">
                {submittingDept ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Department AlertDialog ── */}
      <AlertDialog open={!!deactivatingDept} onOpenChange={() => setDeactivatingDept(null)}>
        <AlertDialogContent className="p-0 overflow-hidden border-none shadow-2xl max-w-md">
          <div className="bg-destructive/5 p-6 border-b border-destructive/10">
            <AlertDialogHeader className="flex-row items-center gap-4 space-y-0">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold text-default-900">
                  Deactivate Department
                </AlertDialogTitle>
                <p className="text-xs text-default-500 mt-1">Soft deactivate department record.</p>
              </div>
            </AlertDialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <AlertDialogDescription className="text-default-700 text-sm">
              Are you sure you want to deactivate <span className="font-bold text-default-900">"{deactivatingDept?.name}"</span>?
            </AlertDialogDescription>

            <div className="flex justify-end gap-3 pt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeactivateDept();
                }}
                disabled={deactivating}
                className="bg-destructive hover:bg-destructive/90 text-white font-bold"
              >
                {deactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deactivate Department"}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";
import { useState, useEffect, useTransition } from "react";
import { Icon } from "@iconify/react";
import {
  Loader2,
  UserPlus,
  RefreshCw,
  Search,
  Users,
  Building2,
  Briefcase,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { staffApi, branchesApi } from "@/lib/tenant-api";

const StatusBadge = ({ isActive }) =>
  isActive ? (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      Active
    </span>
  ) : (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
      Inactive
    </span>
  );

// Modal: Create / Edit Employee
function EmployeeFormModal({ employee, branches, onClose, onSuccess }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    full_name: employee?.full_name || "",
    full_name_bn: employee?.full_name_bn || "",
    employee_code: employee?.employee_code || "",
    designation: employee?.designation || "",
    nid_number: employee?.nid_number || "",
    phone: employee?.phone || "",
    email: employee?.email || "",
    date_of_joining: employee?.date_of_joining || "",
    branch_id: employee?.branch?.id || branches?.[0]?.id || "",
    department_id: employee?.department?.id || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (form.branch_id) {
      branchesApi
        .getDepartments(form.branch_id)
        .then((res) => {
          setDepartments(res.data.data || []);
        })
        .catch(() => setDepartments([]));
    }
  }, [form.branch_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required.";
    if (!form.branch_id) errs.branch_id = "Branch is required.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (employee) {
        await staffApi.updateEmployee(employee.id, form);
        toast.success("Employee record updated.");
      } else {
        await staffApi.createEmployee(form);
        toast.success("Employee created successfully.");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.userMessage || "Failed to save employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8">
        <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-default-900">
                {employee ? "Edit Employee Record" : "Add New Employee"}
              </h2>
              <p className="text-xs text-default-500 mt-0.5">
                Hospital staff & administration personnel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-default-100 transition text-default-400"
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Rahim Uddin"
                className={`w-full h-9 px-3 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.full_name ? "border-destructive" : "border-input"
                }`}
              />
              {errors.full_name && <p className="text-destructive text-xs">{errors.full_name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Name (Bangla)</label>
              <input
                type="text"
                value={form.full_name_bn}
                onChange={(e) => setForm((f) => ({ ...f, full_name_bn: e.target.value }))}
                placeholder="রহিম উদ্দিন"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Employee Code</label>
              <input
                type="text"
                value={form.employee_code}
                onChange={(e) => setForm((f) => ({ ...f, employee_code: e.target.value }))}
                placeholder="EMP-001 (auto generated if blank)"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                placeholder="Senior Staff Nurse / Receptionist"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Branch *</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select Branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Department</label>
              <select
                value={form.department_id}
                onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+880 1800-000000"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="staff@meditek.com"
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-default-700">Date of Joining</label>
              <input
                type="date"
                value={form.date_of_joining}
                onChange={(e) => setForm((f) => ({ ...f, date_of_joining: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-default-700">NID Number</label>
            <input
              type="text"
              value={form.nid_number}
              onChange={(e) => setForm((f) => ({ ...f, nid_number: e.target.value }))}
              placeholder="19901234567890123"
              className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-input text-sm font-medium hover:bg-default-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {loading ? "Saving..." : employee ? "Update Record" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getEmployees({
        search,
        branch_id: selectedBranch || undefined,
      });
      setEmployees(res.data.data || []);
    } catch {
      toast.error("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    branchesApi
      .getBranches()
      .then((res) => {
        setBranches(res.data.data?.results || res.data.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [selectedBranch]);

  const handleDeactivate = async (id) => {
    if (!confirm("Deactivate this employee record?")) return;
    try {
      await staffApi.deactivateEmployee(id);
      toast.success("Employee record deactivated.");
      fetchEmployees();
    } catch (err) {
      toast.error("Failed to deactivate employee.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Employee Directory
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Manage non-physician staff, nurses, receptionists, technicians, and administrative employees.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEmployee(null);
            setShowModal(true);
          }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchEmployees()}
            placeholder="Search by employee name, code, phone..."
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-default-700 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:w-auto"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchEmployees}
          className="h-9 w-9 rounded-lg border border-input flex items-center justify-center hover:bg-default-50 transition text-default-500 ml-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-default-50/50">
              <tr>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Employee Code</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Full Name</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Designation</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Branch / Department</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Contact</th>
                <th className="h-12 px-4 text-left font-semibold text-default-800">Status</th>
                <th className="h-12 px-4 text-right font-semibold text-default-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center text-default-400">
                    No employees recorded. Click "Add Employee" to register staff.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-default-50/50 transition">
                    <td className="p-4 font-mono font-semibold text-xs text-primary">
                      {emp.employee_code}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-default-900">{emp.full_name}</p>
                        {emp.full_name_bn && (
                          <p className="text-xs text-default-400">{emp.full_name_bn}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-default-700">{emp.designation || "—"}</td>
                    <td className="p-4">
                      <div className="text-xs">
                        <p className="font-medium text-default-800">{emp.branch?.name}</p>
                        {emp.department && (
                          <p className="text-default-400">{emp.department?.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-default-600">
                      <p>{emp.phone || "—"}</p>
                      <p className="text-default-400">{emp.email}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge isActive={emp.is_active} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-input text-default-600 hover:bg-default-100 transition"
                          title="Edit Employee"
                        >
                          <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                        </button>
                        {emp.is_active && (
                          <button
                            onClick={() => handleDeactivate(emp.id)}
                            className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition"
                            title="Deactivate Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          branches={branches}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
}

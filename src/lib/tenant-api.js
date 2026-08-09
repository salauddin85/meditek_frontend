/**
 * Tenant IAM API client.
 * Uses cookie-based JWT auth — credentials: 'include' ensures httpOnly cookies are sent.
 * On 401 TOKEN_EXPIRED → automatically refresh via /auth/refresh/ and retry.
 */
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Tenant API client — sends cookies automatically
const tenantApi = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // Critical: sends httpOnly cookies
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: on 401 TOKEN_EXPIRED → refresh and retry
tenantApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh/") &&
      !originalRequest.url?.includes("/auth/login/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => tenantApi(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await tenantApi.post("/auth/refresh/");
        processQueue(null);
        return tenantApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth store on refresh failure
        if (typeof window !== "undefined") {
          const { useTenantAuthStore } = await import("@/store/tenant-auth");
          useTenantAuthStore.getState().logout();
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error
    if (error && typeof error === "object") {
      error.userMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred.";
    }

    return Promise.reject(error);
  }
);

export default tenantApi;

// ── IAM API functions ─────────────────────────────────────────────

export const iamApi = {
  // Auth
  login: (data) => tenantApi.post("/auth/login/", data),
  logout: () => tenantApi.post("/auth/logout/"),
  refresh: () => tenantApi.post("/auth/refresh/"),
  changePassword: (data) => tenantApi.post("/auth/password/change/", data),
  requestPasswordReset: (data) => tenantApi.post("/auth/password/reset/", data),
  confirmPasswordReset: (data) => tenantApi.post("/auth/password/reset/confirm/", data),

  // Me
  getMe: () => tenantApi.get("/users/me/"),
  updateMe: (data) => tenantApi.patch("/users/me/", data),
  switchBranch: (branchId) => tenantApi.patch("/users/me/branch/", { branch_id: branchId }),

  // Sessions
  getSessions: () => tenantApi.get("/auth/sessions/"),
  revokeSession: (sessionId) => tenantApi.delete(`/auth/sessions/${sessionId}/`),

  // Users
  getUsers: (params) => tenantApi.get("/users/", { params }),
  getUser: (id) => tenantApi.get(`/users/${id}/`),
  createUser: (data) => tenantApi.post("/users/", data),
  updateUser: (id, data) => tenantApi.patch(`/users/${id}/`, data),
  deactivateUser: (id) => tenantApi.post(`/users/${id}/deactivate/`),
  unlockUser: (id) => tenantApi.post(`/users/${id}/unlock/`),
  inviteUser: (data) => tenantApi.post("/users/invite/", data),

  // Roles
  getRoles: () => tenantApi.get("/roles/"),
  createRole: (data) => tenantApi.post("/roles/", data),
  deleteRole: (roleId) => tenantApi.delete(`/roles/${roleId}/`),
  updateRolePermissions: (roleId, data) => tenantApi.patch(`/roles/${roleId}/permissions/`, data),

  // Permissions
  getPermissions: (params) => tenantApi.get("/permissions/", { params }),

  // Audit
  getAuditLogs: (params) => tenantApi.get("/audit/", { params }),
};

// ── Billing & Subscription API functions ──────────────────────────────────────────

export const billingApi = {
  getSubscription: () => tenantApi.get("/billing/subscription/"),
  getUsage: () => tenantApi.get("/billing/usage/"),
  getPlans: () => tenantApi.get("/billing/plans/"),
  upgradePlan: (data) => tenantApi.post("/billing/upgrade/", data),
  cancelSubscription: (data) => tenantApi.post("/billing/cancel/", data),
  getInvoices: (params) => tenantApi.get("/billing/invoices/", { params }),
  getInvoice: (id) => tenantApi.get(`/billing/invoices/${id}/`),
  downloadInvoicePdf: (id) => tenantApi.get(`/billing/invoices/${id}/download/`, { responseType: "blob" }),
  initiatePayment: (data) => tenantApi.post("/billing/payment/initiate/", data),
  validateCoupon: (data) => tenantApi.post("/billing/coupons/validate/", data),
};

// ── Branch & Department API functions ─────────────────────────────────────────────

export const branchesApi = {
  getBranches: (params) => tenantApi.get("/branches/", { params }),
  getMyBranches: () => tenantApi.get("/branches/my/"),
  getBranch: (id) => tenantApi.get(`/branches/${id}/`),
  createBranch: (data) => tenantApi.post("/branches/", data),
  updateBranch: (id, data) => tenantApi.patch(`/branches/${id}/`, data),
  deactivateBranch: (id) => tenantApi.delete(`/branches/${id}/`),
  getDepartments: (branchId, params) => tenantApi.get(`/branches/${branchId}/departments/`, { params }),
  createDepartment: (branchId, data) => tenantApi.post(`/branches/${branchId}/departments/`, data),
  updateDepartment: (branchId, deptId, data) => tenantApi.patch(`/branches/${branchId}/departments/${deptId}/`, data),
  deactivateDepartment: (branchId, deptId) => tenantApi.delete(`/branches/${branchId}/departments/${deptId}/`),
};

// ── Staff & Doctor API functions ──────────────────────────────────────────

export const staffApi = {
  getSpecialties: (params) => tenantApi.get("/specialties/", { params }),
  createSpecialty: (data) => tenantApi.post("/specialties/", data),
  getDoctors: (params) => tenantApi.get("/doctors/", { params }),
  getDoctor: (id) => tenantApi.get(`/doctors/${id}/`),
  createDoctor: (data) => tenantApi.post("/doctors/", data),
  updateDoctor: (id, data) => tenantApi.patch(`/doctors/${id}/`, data),
  deactivateDoctor: (id) => tenantApi.delete(`/doctors/${id}/`),
  assignDoctorBranch: (id, data) => tenantApi.post(`/doctors/${id}/branches/`, data),
  getDoctorSchedules: (id, params) => tenantApi.get(`/doctors/${id}/schedule/`, { params }),
  createDoctorSchedule: (id, data) => tenantApi.post(`/doctors/${id}/schedule/`, data),
  deleteDoctorSchedule: (id, tid) => tenantApi.delete(`/doctors/${id}/schedule/${tid}/`),
  getDoctorAvailability: (id, params) => tenantApi.get(`/doctors/${id}/availability/`, { params }),
  getEmployees: (params) => tenantApi.get("/employees/", { params }),
  getEmployee: (id) => tenantApi.get(`/employees/${id}/`),
  createEmployee: (data) => tenantApi.post("/employees/", data),
  updateEmployee: (id, data) => tenantApi.patch(`/employees/${id}/`, data),
  deactivateEmployee: (id) => tenantApi.delete(`/employees/${id}/`),
};



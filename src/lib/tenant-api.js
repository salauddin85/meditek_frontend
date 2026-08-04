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
  updateRolePermissions: (roleId, data) => tenantApi.patch(`/roles/${roleId}/permissions/`, data),

  // Permissions
  getPermissions: (params) => tenantApi.get("/permissions/", { params }),

  // Audit
  getAuditLogs: (params) => tenantApi.get("/audit/", { params }),
};

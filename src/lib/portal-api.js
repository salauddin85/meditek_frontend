import axios from "axios";
import { usePortalAuthStore } from "@/store/portal-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const portalApi = axios.create({
  baseURL: `${API_URL}/api/v1/portal`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach session token
portalApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const state = usePortalAuthStore.getState();
      const token = state.sessionToken;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 & normalize user errors
portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        usePortalAuthStore.getState().logout();
        if (!window.location.pathname.startsWith("/portal/login")) {
          window.location.href = "/portal/login";
        }
      }
    }

    if (error && typeof error === "object") {
      error.userMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred.";
    }

    return Promise.reject(error);
  }
);

export default portalApi;

export const portalService = {
  // Authentication
  requestOtp: (data) => portalApi.post("/login/request-otp/", data),
  verifyOtp: (data) => portalApi.post("/login/verify-otp/", data),
  logout: () => portalApi.post("/logout/"),

  // Patient Profile
  getMe: () => portalApi.get("/me/"),

  // Appointments
  getAppointments: () => portalApi.get("/appointments/"),
  bookAppointment: (data) => portalApi.post("/appointments/book/", data),
  cancelAppointment: (id, data) => portalApi.post(`/appointments/${id}/cancel/`, data),

  // Doctors & Scheduling
  getDoctors: () => portalApi.get("/doctors/"),
  getSlots: (params) => portalApi.get("/slots/", { params }),

  // Laboratory Reports
  getReports: () => portalApi.get("/reports/"),
  getDownloadUrl: (reportId) => `${API_URL}/api/v1/portal/reports/${reportId}/download/`,
  downloadReportPdf: async (reportId, filename = "lab_report.pdf") => {
    const res = await portalApi.get(`/reports/${reportId}/download/`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

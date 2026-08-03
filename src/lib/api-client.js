import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Request interceptor to attach auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Attach platform admin token if available
    if (typeof window !== "undefined") {
      const platformToken = localStorage.getItem("platform_token");
      const registrationToken = localStorage.getItem("registration_token");
      if (platformToken) {
        config.headers["Authorization"] = `Bearer ${platformToken}`;
      } else if (registrationToken) {
        config.headers["Authorization"] = `Bearer ${registrationToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && typeof error === "object") {
      error.userMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred.";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Convenience helpers
export const publicApi = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// For multipart form data (file uploads)
export const uploadApi = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: false,
});

uploadApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const registrationToken = localStorage.getItem("registration_token");
    if (registrationToken) {
      config.headers["Authorization"] = `Bearer ${registrationToken}`;
    }
  }
  return config;
});

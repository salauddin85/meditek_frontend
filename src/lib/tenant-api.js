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

// ── Patient API functions ─────────────────────────────────────────────

export const patientApi = {
  getPatients: (params) => tenantApi.get("/patients/", { params }),
  getPatient: (id) => tenantApi.get(`/patients/${id}/`),
  createPatient: (data) => tenantApi.post("/patients/", data),
  updatePatient: (id, data) => tenantApi.patch(`/patients/${id}/`, data),
  deletePatient: (id) => tenantApi.delete(`/patients/${id}/`),
  searchPatients: (query) => tenantApi.get("/patients/search/", { params: { q: query } }),
  lookupPatientByQR: (mrn) => tenantApi.get(`/patients/qr/${mrn}/`),
  checkDuplicate: (params) => tenantApi.get("/patients/check-duplicate/", { params }),
  getContacts: (id) => tenantApi.get(`/patients/${id}/contacts/`),
  addContact: (id, data) => tenantApi.post(`/patients/${id}/contacts/`, data),
  addFamilyLink: (id, data) => tenantApi.post(`/patients/${id}/family-links/`, data),
  removeFamilyLink: (id, linkId) => tenantApi.delete(`/patients/${id}/family-links/${linkId}/`),
  mergePatients: (data) => tenantApi.post("/patients/merge/", data),
  reverseMerge: (logId) => tenantApi.post(`/patients/merge/${logId}/reverse/`),
  getMergeLogs: () => tenantApi.get("/patients/merge/logs/"),
  getMergeHistory: (id) => tenantApi.get(`/patients/${id}/merge-history/`),
  getSummary: (id) => tenantApi.get(`/patients/${id}/summary/`),
};

// ── Appointment & Scheduling API functions ───────────────────────────────────

export const schedulingApi = {
  getSlots: (params) => tenantApi.get("/scheduling/slots/", { params }),
  bookAppointment: (data) => tenantApi.post("/scheduling/book/", data),
  registerWalkIn: (data) => tenantApi.post("/scheduling/walk-in/", data),
  getAppointments: (params) => tenantApi.get("/scheduling/appointments/", { params }),
  getAppointment: (id) => tenantApi.get(`/scheduling/appointments/${id}/`),
  updateAppointmentStatus: (id, data) => tenantApi.patch(`/scheduling/appointments/${id}/status/`, data),
  cancelAppointment: (id, data) => tenantApi.post(`/scheduling/appointments/${id}/cancel/`, data),
  createRecurringSeries: (id, data) => tenantApi.post(`/scheduling/appointments/${id}/recurring/`, data),
  getQueue: (params) => tenantApi.get("/scheduling/queue/", { params }),
  callNextQueue: (data) => tenantApi.post("/scheduling/queue/call-next/", data),
  loadDateQueue: (data) => tenantApi.post("/scheduling/queue/load-date/", data),
  pushBackQueue: (queueEntryId) => tenantApi.post(`/scheduling/queue/${queueEntryId}/push-back/`),
  reorderQueue: (queueEntryId, data) => tenantApi.patch(`/scheduling/queue/${queueEntryId}/reorder/`, data),
  getWaitlist: (params) => tenantApi.get("/scheduling/waitlist/", { params }),
  addToWaitlist: (data) => tenantApi.post("/scheduling/waitlist/", data),
  getBlackouts: (params) => tenantApi.get("/scheduling/blackout/", { params }),
  createBlackout: (data) => tenantApi.post("/scheduling/blackout/", data),
  getDoctorCalendar: (doctorId, params) => tenantApi.get(`/scheduling/doctor/${doctorId}/calendar/`, { params }),
  getPublicQueueDisplay: (branchId, doctorId) =>
    tenantApi.get(`/scheduling/public/queue/${branchId}/${doctorId}/`),
};

// ── Reception & Front Desk API functions ──────────────────────────────────
export const receptionApi = {
  getOverview: (params) => tenantApi.get("/reception/overview/", { params }),
  checkInQR: (data) => tenantApi.post("/reception/checkin/qr/", data),
  checkInNew: (data) => tenantApi.post("/reception/checkin/new/", data),
  checkInAppointment: (data) => tenantApi.post("/reception/checkin/appointment/", data),
  getVisitTokens: (params) => tenantApi.get("/reception/tokens/", { params }),
  getPrintPayload: (tokenId) => tenantApi.get(`/reception/tokens/${tokenId}/print/`),
  getActiveDrawer: (params) => tenantApi.get("/reception/cash-drawer/active/", { params }),
  openDrawer: (data) => tenantApi.post("/reception/cash-drawer/open/", data),
  getDrawerSessions: (params) => tenantApi.get("/reception/cash-drawer/sessions/", { params }),
  getDrawerSessionDetail: (sessionId) => tenantApi.get(`/reception/cash-drawer/${sessionId}/`),
  closeDrawer: (sessionId, data) => tenantApi.post(`/reception/cash-drawer/${sessionId}/close/`, data),
  approveDrawerVariance: (sessionId, data) => tenantApi.post(`/reception/cash-drawer/${sessionId}/supervisor-approve/`, data),
  recordDrawerTransaction: (sessionId, data) => tenantApi.post(`/reception/cash-drawer/${sessionId}/transaction/`, data),
  processSplitPayment: (data) => tenantApi.post("/reception/payments/split/", data),
  getPaymentSplits: (params) => tenantApi.get("/reception/payments/", { params }),
};

// ── Notification Engine API functions ──────────────────────────────────────────
export const notificationsApi = {
  getTemplates: (params) => tenantApi.get("/notifications/templates/", { params }),
  getTemplate: (id) => tenantApi.get(`/notifications/templates/${id}/`),
  createTemplate: (data) => tenantApi.post("/notifications/templates/", data),
  updateTemplate: (id, data) => tenantApi.patch(`/notifications/templates/${id}/`, data),
  deleteTemplate: (id) => tenantApi.delete(`/notifications/templates/${id}/`),
  getLogs: (params) => tenantApi.get("/notifications/logs/", { params }),
  retryLog: (id) => tenantApi.post(`/notifications/logs/${id}/retry/`),
  getPreferences: () => tenantApi.get("/notifications/preferences/"),
  updatePreferences: (data) => tenantApi.patch("/notifications/preferences/", data),
  getInbox: (params) => tenantApi.get("/notifications/inbox/", { params }),
  markInboxRead: (id) => tenantApi.post(`/notifications/inbox/${id}/read/`),
  markInboxReadAll: () => tenantApi.post("/notifications/inbox/read-all/"),
  sendTest: (data) => tenantApi.post("/notifications/send-test/", data),
  previewSegments: (data) => tenantApi.post("/notifications/preview-segments/", data),
};

// ── Clinical / EMR API functions (MODULE 10) ──────────────────────────────────────────
export const clinicalApi = {
  // Encounters
  getEncounters: (params) => tenantApi.get("/clinical/encounters/", { params }),
  getEncounter: (id) => tenantApi.get(`/clinical/encounters/${id}/`),
  createEncounter: (data) => tenantApi.post("/clinical/encounters/", data),
  updateEncounter: (id, data) => tenantApi.patch(`/clinical/encounters/${id}/`, data),
  closeEncounter: (id) => tenantApi.post(`/clinical/encounters/${id}/close/`),

  // Clinical Notes
  getNotes: (encounterId) => tenantApi.get(`/clinical/encounters/${encounterId}/notes/`),
  addNote: (encounterId, data) => tenantApi.post(`/clinical/encounters/${encounterId}/notes/`, data),

  // Vitals
  recordVitals: (encounterId, data) => tenantApi.post(`/clinical/encounters/${encounterId}/vitals/`, data),
  getPatientVitals: (patientId, params) => tenantApi.get(`/clinical/patients/${patientId}/vitals/`, { params }),

  // Diagnoses
  getDiagnoses: (encounterId) => tenantApi.get(`/clinical/encounters/${encounterId}/diagnoses/`),
  addDiagnosis: (encounterId, data) => tenantApi.post(`/clinical/encounters/${encounterId}/diagnoses/`, data),

  // Attachments
  getAttachments: (encounterId) => tenantApi.get(`/clinical/encounters/${encounterId}/attachments/`),
  uploadAttachment: (encounterId, formData) =>
    tenantApi.post(`/clinical/encounters/${encounterId}/attachments/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Allergies
  getAllergies: (patientId) => tenantApi.get(`/clinical/patients/${patientId}/allergies/`),
  addAllergy: (patientId, data) => tenantApi.post(`/clinical/patients/${patientId}/allergies/`, data),
  updateAllergy: (patientId, allergyId, data) =>
    tenantApi.patch(`/clinical/patients/${patientId}/allergies/${allergyId}/`, data),
  deleteAllergy: (patientId, allergyId) =>
    tenantApi.delete(`/clinical/patients/${patientId}/allergies/${allergyId}/`),

  // Patient Clinical Timeline
  getTimeline: (patientId, params) => tenantApi.get(`/clinical/patients/${patientId}/timeline/`, { params }),

  // ICD-10 Search
  searchICD10: (q, limit) => tenantApi.get("/clinical/icd10/search/", { params: { q, limit } }),

  // Break-Glass Emergency Access
  breakGlassAccess: (patientId, data) => tenantApi.post(`/clinical/break-glass/${patientId}/`, data),
};

// ── Prescription Management API functions (MODULE 11) ──────────────────────────────────
export const prescriptionApi = {
  getDrugs: (params) => tenantApi.get("/prescriptions/drugs/", { params }),
  createDrug: (data) => tenantApi.post("/prescriptions/drugs/", data),
  updateDrug: (id, data) => tenantApi.patch(`/prescriptions/drugs/${id}/`, data),
  deleteDrug: (id) => tenantApi.delete(`/prescriptions/drugs/${id}/`),
  searchDrugs: (q, limit = 20) => tenantApi.get("/prescriptions/drugs/search/", { params: { q, limit } }),
  checkDrugInteractions: (drugId, params) =>
    tenantApi.get(`/prescriptions/drugs/${drugId}/interactions/`, { params }),
  batchCheckInteractions: (data) => tenantApi.post("/prescriptions/check-interactions/", data),
  getPrescriptions: (params) => tenantApi.get("/prescriptions/", { params }),
  getPrescription: (id) => tenantApi.get(`/prescriptions/${id}/`),
  createPrescription: (data) => tenantApi.post("/prescriptions/", data),
  updatePrescription: (id, data) => tenantApi.patch(`/prescriptions/${id}/`, data),
  deletePrescription: (id) => tenantApi.delete(`/prescriptions/${id}/`),
  finalizePrescription: (id) => tenantApi.post(`/prescriptions/${id}/finalize/`),
  getPatientPrescriptions: (patientId) => tenantApi.get(`/prescriptions/patients/${patientId}/`),
  getTemplates: (params) => tenantApi.get("/prescriptions/templates/", { params }),
  createTemplate: (data) => tenantApi.post("/prescriptions/templates/", data),
  deleteTemplate: (id) => tenantApi.delete(`/prescriptions/templates/${id}/`),
  verifyPrescription: (id) => tenantApi.get(`/prescriptions/verify/${id}/`),
  getPdfDownloadUrl: (id) => `${API_URL}/api/v1/prescriptions/${id}/pdf/`,
};

// ── Laboratory Management API functions (MODULE 12) ─────────────────────────────────
export const laboratoryApi = {
  getCatalogue: (params) => tenantApi.get("/lab/catalogue/", { params: { page_size: 200, ...params } }),
  createTest: (data) => tenantApi.post("/lab/catalogue/", data),
  updateTest: (id, data) => tenantApi.patch(`/lab/catalogue/${id}/`, data),
  deleteTest: (id) => tenantApi.delete(`/lab/catalogue/${id}/`),
  getCatalogueGroups: () => tenantApi.get("/lab/catalogue/groups/"),
  getOrders: (params) => tenantApi.get("/lab/orders/", { params: { page_size: 50, ...params } }),
  getOrder: (id) => tenantApi.get(`/lab/orders/${id}/`),
  createOrder: (data) => tenantApi.post("/lab/orders/", data),
  collectSamples: (orderId) => tenantApi.post(`/lab/orders/${orderId}/collect/`),
  receiveSamples: (orderId) => tenantApi.post(`/lab/orders/${orderId}/receive/`),
  rejectSample: (sampleId, data) => tenantApi.post(`/lab/samples/${sampleId}/reject/`, data),
  scanBarcode: (barcode) => tenantApi.get(`/lab/samples/scan/${barcode}/`),
  enterResult: (itemId, data) => tenantApi.post(`/lab/results/${itemId}/enter/`, data),
  verifyResult: (itemId) => tenantApi.post(`/lab/results/${itemId}/verify/`),
  amendResult: (itemId, data) => tenantApi.post(`/lab/results/${itemId}/amend/`, data),
  getCriticalAlerts: (params) => tenantApi.get("/lab/critical-alerts/", { params }),
  acknowledgeCriticalAlert: (alertId, data) => tenantApi.post(`/lab/critical-alerts/${alertId}/acknowledge/`, data),
  releaseReport: (orderId) => tenantApi.post(`/lab/orders/${orderId}/release/`),
  getPdfDownloadUrl: (reportId) => `${API_URL}/api/v1/lab/reports/${reportId}/pdf/`,
  getPublicVerify: (token) => tenantApi.get(`/lab/verify/${token}/`),
  getHomeCollections: (params) => tenantApi.get("/lab/home-collection/", { params }),
  createHomeCollection: (data) => tenantApi.post("/lab/home-collection/", data),
  assignPhlebotomist: (reqId, data) => tenantApi.patch(`/lab/home-collection/${reqId}/assign/`, data),
  // Doctors (for ordering reference)
  getDoctors: (params) => tenantApi.get("/doctors/", { params: { page_size: 100, ...params } }),
};

// ── Financial Management API functions (MODULE 13) ──────────────────────────────────
export const financeApi = {
  // Chart of Accounts & Service Master
  getChartOfAccounts: () => tenantApi.get("/finance/chart-of-accounts/"),
  createChartOfAccount: (data) => tenantApi.post("/finance/chart-of-accounts/", data),
  getServiceItems: (params) => tenantApi.get("/finance/service-items/", { params }),
  createServiceItem: (data) => tenantApi.post("/finance/service-items/", data),
  getServiceItem: (id) => tenantApi.get(`/finance/service-items/${id}/`),
  updateServiceItem: (id, data) => tenantApi.patch(`/finance/service-items/${id}/`, data),
  setPricingTier: (itemId, data) => tenantApi.post(`/finance/service-items/${itemId}/pricing/`, data),

  // Invoices & Payments
  getInvoices: (params) => tenantApi.get("/finance/invoices/", { params }),
  getInvoice: (id) => tenantApi.get(`/finance/invoices/${id}/`),
  createInvoice: (data) => tenantApi.post("/finance/invoices/", data),
  recordPayment: (invoiceId, data) => tenantApi.post(`/finance/invoices/${invoiceId}/payment/`, data),
  processRefund: (invoiceId, data) => tenantApi.post(`/finance/invoices/${invoiceId}/refund/`, data),
  issueCreditNote: (invoiceId, data) => tenantApi.post(`/finance/invoices/${invoiceId}/credit-note/`, data),
  applyDiscount: (invoiceId, data) => tenantApi.post(`/finance/invoices/${invoiceId}/discount/`, data),
  getPatientInvoices: (patientId) => tenantApi.get(`/finance/invoices/patient/${patientId}/`),

  // Double-Entry Ledger & Financial Reports
  getGeneralLedger: (params) => tenantApi.get("/finance/gl/", { params }),
  getTrialBalance: (params) => tenantApi.get("/finance/trial-balance/", { params }),
  getProfitAndLoss: (params) => tenantApi.get("/finance/pnl/", { params }),
  getBalanceSheet: (params) => tenantApi.get("/finance/balance-sheet/", { params }),
  getAgedReceivables: (params) => tenantApi.get("/finance/aged-receivables/", { params }),
  getDayBook: (params) => tenantApi.get("/finance/day-book/", { params }),

  // Accounting Period Control
  closePeriod: (data) => tenantApi.post("/finance/period/close/", data),
  reopenPeriod: (data) => tenantApi.post("/finance/period/reopen/", data),

  // Doctor Revenue Share
  getDoctorRevenueConfigs: (params) => tenantApi.get("/finance/revenue-share/configs/", { params }),
  createDoctorRevenueConfig: (data) => tenantApi.post("/finance/revenue-share/configs/", data),
  getDoctorRevenueStatements: (params) => tenantApi.get("/finance/revenue-share/statements/", { params }),
  generateDoctorRevenueStatement: (data) => tenantApi.post("/finance/revenue-share/statements/generate/", data),
  disburseDoctorRevenueStatement: (id, data) => tenantApi.post(`/finance/revenue-share/statements/${id}/disburse/`, data),

  // Doctor & Patient Helpers for Invoicing
  getDoctors: (params) => tenantApi.get("/doctors/", { params }),
  getPatients: (params) => tenantApi.get("/patients/", { params }),
};









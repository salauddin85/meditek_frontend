import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Registration Store — tracks multi-step hospital registration wizard state.
 * Persisted in localStorage so users can resume after page refresh.
 */
export const useRegistrationStore = create(
  persist(
    (set, get) => ({
      // Access token for authenticated registration calls
      accessToken: null,
      registrationId: null,
      tenantId: null,
      slug: null,

      // Step completion state (mirrors backend)
      steps: {
        org_completed: false,
        email_verified: false,
        phone_verified: true, // skipped per project scope
        docs_uploaded: false,
        docs_verified: false,
        plan_selected: false,
        payment_completed: false,
      },

      // Current wizard step (UI state)
      currentStep: 1,

      // Org info (cached from step 1)
      orgInfo: null,

      // Document review status from backend
      docReviewStatus: "pending",

      // Selected plan
      selectedPlanId: null,

      // Actions
      setInitiation: ({ access_token, registration_id, tenant_id, slug }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("registration_token", access_token);
        }
        set({
          accessToken: access_token,
          registrationId: registration_id,
          tenantId: tenant_id,
          slug,
          steps: { ...get().steps, org_completed: true },
          currentStep: 2,
        });
      },

      setEmailVerified: (access_token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("registration_token", access_token);
        }
        set((state) => ({
          accessToken: access_token,
          steps: { ...state.steps, email_verified: true },
          currentStep: 3,
        }));
      },

      setDocsUploaded: () =>
        set((state) => ({
          steps: { ...state.steps, docs_uploaded: true },
        })),

      setSteps: (steps) => set({ steps }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setOrgInfo: (info) => set({ orgInfo: info }),

      setDocReviewStatus: (status) => set({ docReviewStatus: status }),

      setSelectedPlan: (planId) =>
        set((state) => ({
          selectedPlanId: planId,
          steps: { ...state.steps, plan_selected: true },
        })),

      setPaymentCompleted: () =>
        set((state) => ({
          steps: { ...state.steps, payment_completed: true },
          currentStep: 7,
        })),

      syncFromBackend: (statusData) => {
        set({
          steps: {
            org_completed: statusData.steps?.org_completed ?? false,
            email_verified: statusData.steps?.email_verified ?? false,
            phone_verified: statusData.steps?.phone_verified ?? true,
            docs_uploaded: statusData.steps?.docs_uploaded ?? false,
            docs_verified: statusData.steps?.docs_verified ?? false,
            plan_selected: statusData.steps?.plan_selected ?? false,
            payment_completed: statusData.steps?.payment_completed ?? false,
          },
          docReviewStatus: statusData.doc_review_status || "pending",
          selectedPlanId: statusData.selected_plan_id || null,
        });
      },

      reset: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("registration_token");
        }
        set({
          accessToken: null,
          registrationId: null,
          tenantId: null,
          slug: null,
          steps: {
            org_completed: false,
            email_verified: false,
            phone_verified: true,
            docs_uploaded: false,
            docs_verified: false,
            plan_selected: false,
            payment_completed: false,
          },
          currentStep: 1,
          orgInfo: null,
          docReviewStatus: "pending",
          selectedPlanId: null,
        });
      },
    }),
    {
      name: "meditek-registration",
      partialize: (state) => ({
        accessToken: state.accessToken,
        registrationId: state.registrationId,
        tenantId: state.tenantId,
        slug: state.slug,
        steps: state.steps,
        currentStep: state.currentStep,
        orgInfo: state.orgInfo,
        docReviewStatus: state.docReviewStatus,
        selectedPlanId: state.selectedPlanId,
      }),
    }
  )
);

/**
 * Platform Admin Auth Store — for the super admin control plane.
 */
export const usePlatformAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: ({ user, access }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("platform_token", access);
        }
        set({ user, token: access, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("platform_token");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "meditek-platform-auth",
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

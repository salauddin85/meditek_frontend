import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePortalAuthStore = create(
  persist(
    (set) => ({
      sessionToken: null,
      patient: null,
      sessionExpiresAt: null,
      isAuthenticated: false,

      setSession: ({ sessionToken, sessionExpiresAt, patient }) =>
        set({
          sessionToken,
          sessionExpiresAt,
          patient,
          isAuthenticated: true,
        }),

      updatePatient: (patientData) =>
        set((state) => ({
          patient: state.patient ? { ...state.patient, ...patientData } : patientData,
        })),

      logout: () =>
        set({
          sessionToken: null,
          patient: null,
          sessionExpiresAt: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "meditek-portal-auth",
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tenant Auth Store — for tenant users (cookie-based JWT).
 * NO tokens stored in state — they live in httpOnly cookies.
 * This store only holds the user profile and permission data.
 */
export const useTenantAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      branchId: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      requiresMfa: false,

      setAuth: ({ user, branchId, roles, permissions = [] }) => {
        set({
          user,
          branchId,
          roles,
          permissions,
          isAuthenticated: true,
          requiresMfa: false,
        });
      },

      setPermissions: (permissions) => set({ permissions }),

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      switchBranch: ({ branchId, roles }) =>
        set({ branchId, roles }),

      logout: () =>
        set({
          user: null,
          branchId: null,
          roles: [],
          permissions: [],
          isAuthenticated: false,
          requiresMfa: false,
        }),

      hasRole: (roleName) => {
        const { roles } = get();
        return roles.includes(roleName);
      },

      hasPermission: (permCode) => {
        const { permissions } = get();
        return permissions.includes(permCode);
      },

      isAdmin: () => {
        const { roles } = get();
        return roles.some((r) =>
          ["HOSPITAL_OWNER", "HOSPITAL_ADMIN"].includes(r)
        );
      },
    }),
    {
      name: "meditek-tenant-auth",
      // Only persist non-sensitive identity data, not tokens
      partialize: (state) => ({
        user: state.user,
        branchId: state.branchId,
        roles: state.roles,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

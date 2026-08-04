import { DashBoard, Settings } from "@/components/svg";

export const tenantMenusConfig = {
  mainNav: [
    {
      title: "Dashboard",
      icon: DashBoard,
      href: "/dashboard",
    },
  ],
  sidebarNav: {
    modern: [
      {
        title: "Dashboard",
        icon: DashBoard,
        href: "/dashboard",
      },
      {
        title: "Settings",
        icon: Settings,
        child: [
          {
            title: "Team Members",
            href: "/dashboard/settings/team",
          },
          {
            title: "Roles & Permissions",
            href: "/dashboard/settings/roles",
          },
          {
            title: "Security",
            href: "/dashboard/settings/security",
          },
          {
            title: "Audit Logs",
            href: "/dashboard/settings/audit",
          },
          {
            title: "My Profile",
            href: "/dashboard/settings/profile",
          },
        ],
      },
    ],
    classic: [
      {
        isHeader: true,
        title: "Main Menu",
      },
      {
        title: "Dashboard",
        icon: DashBoard,
        href: "/dashboard",
      },
      {
        title: "Workspace Settings",
        icon: Settings,
        child: [
          {
            title: "Team Members",
            href: "/dashboard/settings/team",
          },
          {
            title: "Roles & Permissions",
            href: "/dashboard/settings/roles",
          },
          {
            title: "Security",
            href: "/dashboard/settings/security",
          },
          {
            title: "Audit Logs",
            href: "/dashboard/settings/audit",
          },
          {
            title: "My Profile",
            href: "/dashboard/settings/profile",
          },
        ],
      },
    ],
  },
};

export const platformMenusConfig = {
  mainNav: [
    {
      title: "Platform Dashboard",
      icon: DashBoard,
      href: "/platform/dashboard",
    },
  ],
  sidebarNav: {
    modern: [
      {
        title: "Platform Dashboard",
        icon: DashBoard,
        href: "/platform/dashboard",
      },
    ],
    classic: [
      {
        isHeader: true,
        title: "Platform",
      },
      {
        title: "Overview",
        icon: DashBoard,
        href: "/platform/dashboard",
      },
    ],
  },
};

export const menusConfig = {
  tenant: tenantMenusConfig,
  platform: platformMenusConfig,
};

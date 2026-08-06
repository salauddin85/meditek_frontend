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
            title: "Subscription & Billing",
            href: "/dashboard/settings/billing",
          },
          {
            title: "Invoices & Payments",
            href: "/dashboard/settings/billing/invoices",
          },
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
            title: "Subscription & Billing",
            href: "/dashboard/settings/billing",
          },
          {
            title: "Invoices & Payments",
            href: "/dashboard/settings/billing/invoices",
          },
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


export const menusConfig = {
  tenant: tenantMenusConfig,
};

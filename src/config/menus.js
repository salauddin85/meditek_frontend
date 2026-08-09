import { DashBoard, Settings, Users } from "@/components/svg";

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
        title: "Staff & Doctors",
        icon: Users,
        child: [
          {
            title: "Doctors Directory",
            href: "/dashboard/staff/doctors",
          },
          {
            title: "Employee Directory",
            href: "/dashboard/staff/employees",
          },
        ],
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
            title: "Branches & Departments",
            href: "/dashboard/settings/branches",
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
        title: "Staff & Doctors",
        icon: Users,
        child: [
          {
            title: "Doctors Directory",
            href: "/dashboard/staff/doctors",
          },
          {
            title: "Employee Directory",
            href: "/dashboard/staff/employees",
          },
        ],
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
            title: "Branches & Departments",
            href: "/dashboard/settings/branches",
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

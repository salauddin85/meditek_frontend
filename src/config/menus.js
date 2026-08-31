import { DashBoard, Settings, Users, Bell } from "@/components/svg";

export const tenantMenusConfig = {
  mainNav: [
    {
      title: "Dashboard",
      icon: DashBoard,
      href: "/dashboard",
    },
    {
      title: "Appointments & Scheduling",
      icon: DashBoard,
      child: [
        {
          title: "Scheduling Dashboard",
          href: "/dashboard/scheduling",
        },
        {
          title: "Book Appointment",
          href: "/dashboard/scheduling/book",
        },
        {
          title: "Appointments List",
          href: "/dashboard/scheduling/appointments",
        },
        {
          title: "Live Queue Rooms",
          href: "/dashboard/scheduling/queue",
        },
        {
          title: "Doctor Calendar",
          href: "/dashboard/scheduling/calendar",
        },
        {
          title: "Schedule Audit",
          href: "/dashboard/scheduling/audit",
        },
      ],
    },
    {
      title: "Reception & Desk",
      icon: DashBoard,
      child: [
        {
          title: "Reception Overview",
          href: "/dashboard/reception",
        },
        {
          title: "Front Desk Check-In",
          href: "/dashboard/reception/checkin",
        },
        {
          title: "Visit Tokens",
          href: "/dashboard/reception/tokens",
        },
        {
          title: "Cash Drawer",
          href: "/dashboard/reception/cash_drawer",
        },
        {
          title: "Split Payment Counter",
          href: "/dashboard/reception/payments",
        },
      ],
    },
    {
      title: "Clinical / EMR",
      icon: Users,
      child: [
        {
          title: "Clinical Workspace",
          href: "/dashboard/clinical",
        },
      ],
    },
    {
      title: "Laboratory",
      icon: Users,
      child: [
        {
          title: "Lab Workstation & Orders",
          href: "/dashboard/laboratory",
        },
      ],
    },
    {
      title: "Financial Management",
      icon: DashBoard,
      child: [
        {
          title: "Financial Overview",
          href: "/dashboard/finance",
        },
        {
          title: "Invoice Workstation",
          href: "/dashboard/finance/invoices",
        },
        {
          title: "General Ledger",
          href: "/dashboard/finance/reports/gl",
        },
        {
          title: "Profit & Loss",
          href: "/dashboard/finance/reports/pnl",
        },
        {
          title: "Balance Sheet",
          href: "/dashboard/finance/reports/balance-sheet",
        },
        {
          title: "Aged Receivables",
          href: "/dashboard/finance/reports/aged-receivables",
        },
        {
          title: "Doctor Revenue Share",
          href: "/dashboard/finance/revenue-share",
        },
        {
          title: "Chart of Accounts",
          href: "/dashboard/finance/chart-of-accounts",
        },
        {
          title: "Charge Master Catalog",
          href: "/dashboard/finance/service-items",
        },
      ],
    },
    {
      title: "Notification Engine",
      icon: Bell,
      child: [
        {
          title: "Notification Hub",
          href: "/dashboard/notifications",
        },
        {
          title: "Templates Manager",
          href: "/dashboard/notifications/templates",
        },
        {
          title: "Delivery Logs",
          href: "/dashboard/notifications/logs",
        },
        {
          title: "User Preferences",
          href: "/dashboard/notifications/preferences",
        },
        {
          title: "SMS Segment Preview",
          href: "/dashboard/notifications/calculator",
        },
      ],
    },
    {
      title: "Reports & Analytics",
      icon: DashBoard,
      child: [
        {
          title: "Report Catalogue",
          href: "/dashboard/reports",
        },
        {
          title: "Execution History",
          href: "/dashboard/reports/runs",
        },
      ],
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
        title: "Appointments & Scheduling",
        icon: DashBoard,
        child: [
          {
            title: "Scheduling Dashboard",
            href: "/dashboard/scheduling",
          },
          {
            title: "Book Appointment",
            href: "/dashboard/scheduling/book",
          },
          {
            title: "Appointments List",
            href: "/dashboard/scheduling/appointments",
          },
          {
            title: "Live Queue Rooms",
            href: "/dashboard/scheduling/queue",
          },
          {
            title: "Doctor Calendar",
            href: "/dashboard/scheduling/calendar",
          },
          {
            title: "Schedule Audit",
            href: "/dashboard/scheduling/audit",
          },
        ],
      },
      {
        title: "Reception & Desk",
        icon: Users,
        child: [
          {
            title: "Reception Overview",
            href: "/dashboard/reception",
          },
          {
            title: "Front Desk Check-In",
            href: "/dashboard/reception/checkin",
          },
          {
            title: "Visit Tokens",
            href: "/dashboard/reception/tokens",
          },
          {
            title: "Cash Drawer",
            href: "/dashboard/reception/cash_drawer",
          },
          {
            title: "Split Payment Counter",
            href: "/dashboard/reception/payments",
          },
        ],
      },
      {
        title: "Patients",
        icon: Users,
        child: [
          {
            title: "Patient Directory",
            href: "/dashboard/patients",
          },
          {
            title: "Register Patient",
            href: "/dashboard/patients/register",
          },
          {
            title: "Merge Records",
            href: "/dashboard/patients/merge",
          },
        ],
      },
      {
        title: "Clinical / EMR",
        icon: Users,
        child: [
          {
            title: "Clinical Workspace",
            href: "/dashboard/clinical",
          },
        ],
      },
      {
        title: "Laboratory",
        icon: Users,
        child: [
          {
            title: "Lab Workstation & Orders",
            href: "/dashboard/laboratory",
          },
        ],
      },
      {
        title: "Prescriptions",
        icon: Users,
        child: [
          {
            title: "Prescription List",
            href: "/dashboard/prescriptions",
          },
          {
            title: "Write Prescription",
            href: "/dashboard/prescriptions/new",
          },
          {
            title: "Drug Master Registry",
            href: "/dashboard/prescriptions/drugs",
          },
          {
            title: "Prescription Templates",
            href: "/dashboard/prescriptions/templates",
          },
        ],
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
        title: "Financial Management",
        icon: DashBoard,
        child: [
          {
            title: "Financial Overview",
            href: "/dashboard/finance",
          },
          {
            title: "Invoice Workstation",
            href: "/dashboard/finance/invoices",
          },
          {
            title: "General Ledger",
            href: "/dashboard/finance/reports/gl",
          },
          {
            title: "Profit & Loss",
            href: "/dashboard/finance/reports/pnl",
          },
          {
            title: "Balance Sheet",
            href: "/dashboard/finance/reports/balance-sheet",
          },
          {
            title: "Aged Receivables",
            href: "/dashboard/finance/reports/aged-receivables",
          },
          {
            title: "Doctor Revenue Share",
            href: "/dashboard/finance/revenue-share",
          },
          {
            title: "Chart of Accounts",
            href: "/dashboard/finance/chart-of-accounts",
          },
          {
            title: "Charge Master Catalog",
            href: "/dashboard/finance/service-items",
          },
        ],
      },
      {
        title: "Notification Engine",
        icon: Bell,
        child: [
          {
            title: "Notification Hub",
            href: "/dashboard/notifications",
          },
          {
            title: "Templates Manager",
            href: "/dashboard/notifications/templates",
          },
          {
            title: "Delivery Logs",
            href: "/dashboard/notifications/logs",
          },
          {
            title: "User Preferences",
            href: "/dashboard/notifications/preferences",
          },
          {
            title: "SMS Segment Preview",
            href: "/dashboard/notifications/calculator",
          },
        ],
      },
      {
        title: "Reports & Analytics",
        icon: DashBoard,
        child: [
          {
            title: "Report Catalogue",
            href: "/dashboard/reports",
          },
          {
            title: "Execution History",
            href: "/dashboard/reports/runs",
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
        title: "Appointments & Scheduling",
        icon: DashBoard,
        child: [
          {
            title: "Scheduling Dashboard",
            href: "/dashboard/scheduling",
          },
          {
            title: "Book Appointment",
            href: "/dashboard/scheduling/book",
          },
          {
            title: "Appointments List",
            href: "/dashboard/scheduling/appointments",
          },
          {
            title: "Live Queue Rooms",
            href: "/dashboard/scheduling/queue",
          },
          {
            title: "Doctor Calendar",
            href: "/dashboard/scheduling/calendar",
          },
          {
            title: "Schedule Audit",
            href: "/dashboard/scheduling/audit",
          },
        ],
      },
      {
        title: "Reception & Desk",
        icon: Users,
        child: [
          {
            title: "Reception Overview",
            href: "/dashboard/reception",
          },
          {
            title: "Front Desk Check-In",
            href: "/dashboard/reception/checkin",
          },
          {
            title: "Visit Tokens",
            href: "/dashboard/reception/tokens",
          },
          {
            title: "Cash Drawer",
            href: "/dashboard/reception/cash_drawer",
          },
          {
            title: "Split Payment Counter",
            href: "/dashboard/reception/payments",
          },
        ],
      },
      {
        title: "Patients",
        icon: Users,
        child: [
          {
            title: "Patient Directory",
            href: "/dashboard/patients",
          },
          {
            title: "Register Patient",
            href: "/dashboard/patients/register",
          },
          {
            title: "Merge Records",
            href: "/dashboard/patients/merge",
          },
        ],
      },
      {
        title: "Clinical / EMR",
        icon: Users,
        child: [
          {
            title: "Clinical Workspace",
            href: "/dashboard/clinical",
          },
        ],
      },
      {
        title: "Laboratory",
        icon: Users,
        child: [
          {
            title: "Lab Workstation & Orders",
            href: "/dashboard/laboratory",
          },
        ],
      },
      {
        title: "Prescriptions",
        icon: Users,
        child: [
          {
            title: "Prescription List",
            href: "/dashboard/prescriptions",
          },
          {
            title: "Write Prescription",
            href: "/dashboard/prescriptions/new",
          },
          {
            title: "Prescription Templates",
            href: "/dashboard/prescriptions/templates",
          },
        ],
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
        title: "Financial Management",
        icon: DashBoard,
        child: [
          {
            title: "Financial Overview",
            href: "/dashboard/finance",
          },
          {
            title: "Invoice Workstation",
            href: "/dashboard/finance/invoices",
          },
          {
            title: "General Ledger",
            href: "/dashboard/finance/reports/gl",
          },
          {
            title: "Profit & Loss",
            href: "/dashboard/finance/reports/pnl",
          },
          {
            title: "Balance Sheet",
            href: "/dashboard/finance/reports/balance-sheet",
          },
          {
            title: "Aged Receivables",
            href: "/dashboard/finance/reports/aged-receivables",
          },
          {
            title: "Doctor Revenue Share",
            href: "/dashboard/finance/revenue-share",
          },
          {
            title: "Chart of Accounts",
            href: "/dashboard/finance/chart-of-accounts",
          },
          {
            title: "Charge Master Catalog",
            href: "/dashboard/finance/service-items",
          },
        ],
      },
      {
        title: "Notification Engine",
        icon: Bell,
        child: [
          {
            title: "Notification Hub",
            href: "/dashboard/notifications",
          },
          {
            title: "Templates Manager",
            href: "/dashboard/notifications/templates",
          },
          {
            title: "Delivery Logs",
            href: "/dashboard/notifications/logs",
          },
          {
            title: "User Preferences",
            href: "/dashboard/notifications/preferences",
          },
          {
            title: "SMS Segment Preview",
            href: "/dashboard/notifications/calculator",
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

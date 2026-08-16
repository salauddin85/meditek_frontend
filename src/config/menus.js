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

import { LayoutDashboard, Users, Receipt, Settings, ShieldCheck } from "lucide-react";

export const adminNavItems = [
  {
    title: "Overview",
    href: "/admin_dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    href: "/admin_dashboard/tenants",
    icon: Users,
  },
  {
    title: "Billing",
    href: "/admin_dashboard/billing",
    icon: Receipt,
  },
  {
    title: "Security",
    href: "/admin_dashboard/security",
    icon: ShieldCheck,
  },
  {
    title: "Settings",
    href: "/admin_dashboard/settings",
    icon: Settings,
  },
];

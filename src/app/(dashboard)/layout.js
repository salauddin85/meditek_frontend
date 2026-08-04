import DashboardLayoutShell from "@/components/dashboard/dashboard-layout-shell";
import "./dashboard.css";

export const metadata = {
  title: "Dashboard | Meditek",
  description: "Hospital Management Dashboard by Meditek.",
};

export default function DashboardLayout({ children }) {
  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}

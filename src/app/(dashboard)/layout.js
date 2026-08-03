import DashboardLayoutProvider from "@/components/dashboard/dashboard-layout-provider";
import "./dashboard.css";

export const metadata = {
  title: "Dashboard | Meditek",
  description: "Hospital Management Dashboard by Meditek.",
};

export default function DashboardLayout({ children }) {
  return <DashboardLayoutProvider>{children}</DashboardLayoutProvider>;
}

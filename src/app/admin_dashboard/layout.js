import AdminDashboardShell from "@/components/dashboard/admin-dashboard-shell";

export const metadata = {
  title: "Admin Dashboard | Meditek",
  description: "Platform administration workspace",
};

export default function AdminDashboardLayout({ children }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}

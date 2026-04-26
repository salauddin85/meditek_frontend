import DashboardLayoutProvider from "@/components/dashboard/dashboard-layout-provider";
import "./dashboard.css";
import Providers from "@/provider/providers";
export const metadata = {
  title: "Dashboard | HRM - Pepoltek",
  description: "HR Dashboard by Pepoltek Ltd.",
};

export default function DashboardLayout({ children }) {
  return (
    <>
      <Providers>
        {" "}
        <DashboardLayoutProvider>{children}</DashboardLayoutProvider>
      </Providers>
    </>
  );
}

import DashboardLayoutProvider from "@/components/dashboard/dashboard-layout-provider";
import "./dashboard.css";
import Providers from "@/provider/providers";
export const metadata = {
  title: "Dashboard | Meditek",
  description: "Hospital Management Dashboard by Meditek.",
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

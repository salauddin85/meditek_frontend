"use client";

import { usePathname } from "next/navigation";
import DashboardLayoutProvider from "./dashboard-layout-provider";

export default function DashboardLayoutShell({ children }) {
  const pathname = usePathname();
  const isPlatformRoute = pathname?.startsWith("/platform");

  if (isPlatformRoute) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return <DashboardLayoutProvider>{children}</DashboardLayoutProvider>;
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  LogOut,
  User,
  HeartPulse,
  Hospital,
  ChevronRight,
} from "lucide-react";
import { usePortalAuthStore } from "@/store/portal-auth";
import { portalService } from "@/lib/portal-api";

export default function PortalLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, patient, logout, updatePatient } = usePortalAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === "/portal/login";

  // Check auth and refresh me profile if logged in
  useEffect(() => {
    if (mounted && !isLoginPage) {
      if (!isAuthenticated) {
        router.replace("/portal/login");
        return;
      }
      // Fetch latest profile in background
      portalService
        .getMe()
        .then((res) => {
          if (res.data?.data) {
            updatePatient(res.data.data);
          }
        })
        .catch(() => {
          // Token expired, interceptor handles redirect
        });
    }
  }, [mounted, isAuthenticated, isLoginPage, router, updatePatient]);

  if (!mounted) {
    return null;
  }

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>;
  }

  const handleLogout = async () => {
    try {
      await portalService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      logout();
      router.push("/portal/login");
    }
  };

  const navLinks = [
    { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { label: "Appointments", href: "/portal/appointments", icon: Calendar },
    { label: "Lab Reports", href: "/portal/reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Tenant badge */}
          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  MEDITek
                </span>
                <span className="ml-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Portal
                </span>
              </div>
            </Link>

            {patient?.tenant_name && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Hospital className="h-3.5 w-3.5 text-emerald-500" />
                <span>{patient.tenant_name}</span>
              </div>
            )}
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Patient Badge & Logout */}
          <div className="flex items-center gap-3">
            {patient && (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {patient.full_name
                    ? patient.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "P"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none text-slate-900 dark:text-slate-100">
                    {patient.full_name}
                  </p>
                  <p className="mt-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {patient.mrn}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed for viewports <= 768px, works down to 360px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 text-xs transition-colors ${
                active
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="mt-0.5 text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

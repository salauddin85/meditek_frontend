"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, HeartPulse, ChevronRight, ShieldCheck } from "lucide-react";
import { usePlatformAuthStore } from "@/store/meditek";
import { adminNavItems } from "@/config/admin-menus";

function AdminSidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card shadow-sm transition-transform lg:static lg:translate-x-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <Link href="/admin_dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Meditek</p>
            <p className="text-xs text-muted-foreground">Platform Admin</p>
          </div>
        </Link>
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.title}
              </span>
              <ChevronRight className="h-4 w-4 opacity-70" />
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Control Plane
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Manage tenants, security, and subscriptions.</p>
        </div>
      </div>
    </aside>
  );
}

export default function AdminDashboardShell({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = usePlatformAuthStore();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!hasHydrated || !isAuthenticated) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const handleLogout = () => {
    logout();
    router.push("/auth/platform-login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${mobileOpen ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => setMobileOpen(false)} />
        <div className={`fixed inset-y-0 left-0 z-40 transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <AdminSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        </div>
        <div className="flex-1">
          <header className="border-b border-border bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 lg:px-6">
              <div className="flex items-center gap-3">
                <button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm font-semibold text-foreground">Platform Administration</p>
                  <p className="text-xs text-muted-foreground">{pathname === "/admin_dashboard" ? "Overview" : "Admin workspace"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-2 text-sm sm:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {user?.full_name?.charAt(0) || "A"}
                  </div>
                  <span>{user?.full_name || "Admin"}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

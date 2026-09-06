"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalAuthStore } from "@/store/portal-auth";

export default function PortalIndexPage() {
  const router = useRouter();
  const isAuthenticated = usePortalAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/portal/dashboard");
    } else {
      router.replace("/portal/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  );
}

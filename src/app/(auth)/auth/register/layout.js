"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRegistrationStore } from "@/store/meditek";
import { HeartPulse } from "lucide-react";
import Link from "next/link";

// Step labels for the wizard sidebar
const WIZARD_STEPS = [
  { num: 1, label: "Organization Info" },
  { num: 2, label: "Verify Email" },
  { num: 3, label: "Upload Documents" },
  { num: 4, label: "Select Plan" },
  { num: 5, label: "Payment" },
  { num: 6, label: "Provisioning" },
];

export default function RegisterLayout({ children }) {
  const { currentStep } = useRegistrationStore();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white p-8 shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <HeartPulse className="h-8 w-8 text-teal-400" strokeWidth={2.5} />
          <span className="text-2xl font-black tracking-tight">
            Medi<span className="text-teal-400">tek</span>
          </span>
        </Link>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Hospital Registration
          </h2>
          <p className="text-sm text-slate-500">Complete all steps to activate your workspace.</p>
        </div>

        <nav className="space-y-1 flex-1">
          {WIZARD_STEPS.map((step) => {
            const isDone = currentStep > step.num;
            const isActive = currentStep === step.num;
            return (
              <div
                key={step.num}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-teal-600/20 border border-teal-500/30"
                    : isDone
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isDone
                      ? "bg-teal-500 text-white"
                      : isActive
                      ? "bg-teal-600 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : step.num}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-white" : isDone ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-700 text-xs text-slate-500">
          <p>By registering, you agree to our</p>
          <a href="#" className="text-teal-400 hover:underline">Terms of Service</a>
          {" "}&amp;{" "}
          <a href="#" className="text-teal-400 hover:underline">Privacy Policy</a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <HeartPulse className="h-7 w-7 text-teal-600" strokeWidth={2.5} />
            <span className="text-xl font-black tracking-tight text-slate-900">
              Medi<span className="text-teal-600">tek</span>
            </span>
          </Link>

          {/* Mobile step indicator */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {WIZARD_STEPS.map((step, idx) => (
              <div
                key={step.num}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  currentStep > step.num
                    ? "bg-teal-500"
                    : currentStep === step.num
                    ? "bg-teal-400"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

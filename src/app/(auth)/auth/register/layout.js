"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
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

function getStepFromPath(pathname) {
  if (!pathname) return 1;
  if (pathname.includes("/verify")) return 2;
  if (pathname.includes("/documents")) return 3;
  if (pathname.includes("/plan")) return 4;
  if (pathname.includes("/payment")) return 5;
  if (pathname.includes("/status")) return 6;
  return 1;
}

export default function RegisterLayout({ children }) {
  const pathname = usePathname();
  const { currentStep, setCurrentStep } = useRegistrationStore();

  const activeStep = getStepFromPath(pathname);
  useEffect(() => {
    if (activeStep !== currentStep) {
      setCurrentStep(activeStep);
    }
  }, [activeStep, currentStep, setCurrentStep]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,166,126,0.10),_transparent_45%),linear-gradient(135deg,_#f8fffc_0%,_#f5fcf8_100%)] dark:bg-slate-950 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.10)] dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex flex-col lg:flex-row">
          <aside className="w-full lg:w-[320px] bg-[#00A67E] p-8 text-white lg:min-h-[720px]">
            <Link href="/" className="flex items-center gap-3 mb-10">
              <HeartPulse className="h-8 w-8" strokeWidth={2.5} />
              <span className="text-2xl font-black tracking-tight">Medi<span className="text-white/80">tek</span></span>
            </Link>

            <div className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70 mb-2">Hospital Registration</h2>
              <p className="text-sm text-white/85">Complete each step to activate your secure workspace.</p>
            </div>

            <nav className="space-y-2">
              {WIZARD_STEPS.map((step) => {
                const isDone = activeStep > step.num;
                const isActive = activeStep === step.num;
                return (
                  <div
                    key={step.num}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                      isActive
                        ? "border-white/40 bg-white/20"
                        : isDone
                        ? "border-white/20 bg-white/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isDone ? "bg-white text-[#00A67E]" : isActive ? "bg-white/95 text-[#00A67E]" : "bg-white/15 text-white/80"}`}>
                      {isDone ? "✓" : step.num}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? "text-white" : "text-white/80"}`}>{step.label}</span>
                  </div>
                );
              })}
            </nav>

            <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/80">
              <p>By registering, you agree to our</p>
              <a href="#" className="font-medium text-white hover:underline">Terms of Service</a>
              {" "}&amp;{" "}
              <a href="#" className="font-medium text-white hover:underline">Privacy Policy</a>
            </div>
          </aside>

          <main className="flex-1 p-6 lg:p-10">
            <div className="mx-auto flex max-w-2xl flex-col">
              <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
                <HeartPulse className="h-7 w-7 text-[#00A67E]" strokeWidth={2.5} />
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Medi<span className="text-[#00A67E]">tek</span></span>
              </Link>

              <div className="mb-6 flex items-center gap-2 lg:hidden">
                {WIZARD_STEPS.map((step) => (
                  <div key={step.num} className={`h-1.5 flex-1 rounded-full ${activeStep > step.num ? "bg-[#00A67E]" : activeStep === step.num ? "bg-[#00A67E]/70" : "bg-slate-200 dark:bg-slate-700"}`} />
                ))}
              </div>

              <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 lg:p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

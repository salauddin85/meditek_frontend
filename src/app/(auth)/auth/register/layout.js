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
  // Keep store in sync with active route
  useEffect(() => {
    if (activeStep !== currentStep) {
      setCurrentStep(activeStep);
    }
  }, [activeStep, currentStep, setCurrentStep]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-primary text-primary-foreground p-8 shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <HeartPulse className="h-8 w-8 text-primary-foreground/80" strokeWidth={2.5} />
          <span className="text-2xl font-black tracking-tight">
            Medi<span className="text-primary-foreground/80">tek</span>
          </span>
        </Link>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-primary-foreground/60 uppercase tracking-wider mb-1">
            Hospital Registration
          </h2>
          <p className="text-sm text-primary-foreground/50">Complete all steps to activate your workspace.</p>
        </div>

        <nav className="space-y-1 flex-1">
          {WIZARD_STEPS.map((step) => {
            const isDone = activeStep > step.num;
            const isActive = activeStep === step.num;
            return (
              <div
                key={step.num}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-foreground/20 border border-primary-foreground/30"
                    : isDone
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isDone
                      ? "bg-primary-foreground/60 text-primary-foreground"
                      : isActive
                      ? "bg-primary-foreground text-primary-foreground"
                      : "bg-primary-foreground/20 text-primary-foreground/60"
                  }`}
                >
                  {isDone ? "✓" : step.num}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-primary-foreground" : isDone ? "text-primary-foreground/70" : "text-primary-foreground/50"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-primary-foreground/20 text-xs text-primary-foreground/50">
          <p>By registering, you agree to our</p>
          <a href="#" className="text-primary-foreground/80 hover:underline">Terms of Service</a>
          {" "}&amp;{" "}
          <a href="#" className="text-primary-foreground/80 hover:underline">Privacy Policy</a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <HeartPulse className="h-7 w-7 text-primary" strokeWidth={2.5} />
            <span className="text-xl font-black tracking-tight text-foreground">
              Medi<span className="text-primary">tek</span>
            </span>
          </Link>

          {/* Mobile step indicator */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {WIZARD_STEPS.map((step) => (
              <div
                key={step.num}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  activeStep > step.num
                    ? "bg-primary"
                    : activeStep === step.num
                    ? "bg-primary/70"
                    : "bg-muted"
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

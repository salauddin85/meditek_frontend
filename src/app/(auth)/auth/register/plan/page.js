"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Check, Star, Zap, Building2, HeartPulse } from "lucide-react";
import { useRegistrationStore } from "@/store/meditek";
import apiClient from "@/lib/api-client";

const PLAN_ICONS = {
  diagnostic: HeartPulse,
  clinic: Zap,
  hospital: Building2,
};

function PlanCard({ plan, selected, onSelect }) {
  const Icon = PLAN_ICONS[plan.slug] || Star;
  const isHospital = plan.slug === "hospital";

  return (
    <div
      onClick={() => onSelect(plan)}
      className={`relative cursor-pointer border-2 rounded-2xl p-6 transition-all ${
        selected
          ? "border-teal-500 bg-teal-50 shadow-lg shadow-teal-100"
          : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-md"
      }`}
    >
      {isHospital && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            selected ? "bg-teal-600" : "bg-slate-100"
          }`}
        >
          <Icon className={`w-6 h-6 ${selected ? "text-white" : "text-slate-500"}`} />
        </div>
        {selected && (
          <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-4">{plan.description}</p>

      <div className="mb-4">
        <span className="text-3xl font-black text-slate-900">
          ৳{Number(plan.price_monthly).toLocaleString()}
        </span>
        <span className="text-sm text-slate-400">/month</span>
        {plan.price_yearly && (
          <div className="text-xs text-teal-600 mt-0.5">
            ৳{Number(plan.price_yearly).toLocaleString()}/year (save 17%)
          </div>
        )}
      </div>

      <ul className="space-y-1.5 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          Up to {plan.max_branches} branch{plan.max_branches > 1 ? "es" : ""}
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          {plan.max_doctors} doctors
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          {Number(plan.max_active_patients).toLocaleString()} patients
        </li>
        {plan.feature_laboratory && (
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            Laboratory module
          </li>
        )}
        {plan.feature_pharmacy && (
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            Pharmacy module
          </li>
        )}
        {plan.feature_radiology && (
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            Radiology module
          </li>
        )}
        {plan.feature_ipd && (
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            IPD / Inpatient module
          </li>
        )}
      </ul>
    </div>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const { setSelectedPlan } = useRegistrationStore();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlanState] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .get("/public/plans/")
      .then((res) => setPlans(res.data.data.plans || []))
      .catch(() => toast.error("Failed to load plans."))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post("/public/register/plan/", {
        plan_id: selectedPlan.id,
        billing_cycle: billingCycle,
      });
      const { payment_url } = res.data.data;
      setSelectedPlan(selectedPlan.id);
      toast.success("Plan selected! Redirecting to payment...");
      // Redirect to SSLCommerz payment gateway
      window.location.href = payment_url;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Choose Your Plan</h1>
        <p className="mt-2 text-slate-500">
          Step 4 of 5 — Select the plan that fits your facility size and needs.
        </p>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            billingCycle === "monthly"
              ? "bg-teal-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            billingCycle === "yearly"
              ? "bg-teal-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Yearly
          <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
            Save 17%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan?.id === plan.id}
            onSelect={setSelectedPlanState}
          />
        ))}
      </div>

      {selectedPlan && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {selectedPlan.name} ({billingCycle})
            </span>
            <span className="font-bold text-slate-900">
              ৳
              {billingCycle === "yearly" && selectedPlan.price_yearly
                ? Number(selectedPlan.price_yearly).toLocaleString()
                : Number(selectedPlan.price_monthly).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-500">VAT (15%)</span>
            <span className="text-slate-600">
              ৳
              {billingCycle === "yearly" && selectedPlan.price_yearly
                ? (Number(selectedPlan.price_yearly) * 0.15).toFixed(2)
                : (Number(selectedPlan.price_monthly) * 0.15).toFixed(2)}
            </span>
          </div>
          <div className="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="font-black text-slate-900 text-lg">
              ৳
              {billingCycle === "yearly" && selectedPlan.price_yearly
                ? (Number(selectedPlan.price_yearly) * 1.15).toFixed(2)
                : (Number(selectedPlan.price_monthly) * 1.15).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!selectedPlan || submitting}
        className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to payment...
          </>
        ) : (
          "Proceed to Payment →"
        )}
      </button>

      <button
        onClick={() => router.push("/auth/register/documents")}
        className="w-full mt-3 py-2.5 text-slate-500 text-sm hover:text-slate-700 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Check,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Tag,
  Loader2,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { billingApi } from "@/lib/tenant-api";

export default function UpgradePlanPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | yearly
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await billingApi.getPlans();
      if (res.data?.data) {
        setPlans(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedPlanId(res.data.data[1]?.id || res.data.data[0]?.id); // default Clinic
        }
      }
    } catch (err) {
      toast.error("Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await billingApi.validateCoupon({
        code: couponCode.trim(),
        plan_id: selectedPlanId,
      });
      if (res.data?.data) {
        setAppliedCoupon(res.data.data);
        toast.success(`Coupon '${res.data.data.code}' applied!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired coupon.");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleUpgradeCheckout = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan.");
      return;
    }
    setUpgrading(true);
    try {
      const res = await billingApi.upgradePlan({
        plan_id: selectedPlanId,
        billing_cycle: billingCycle,
        coupon_code: appliedCoupon ? appliedCoupon.code : "",
      });

      const data = res.data?.data;
      if (data?.requires_payment && data?.gateway_url) {
        toast.success("Redirecting to SSLCommerz payment portal...");
        window.location.href = data.gateway_url;
      } else {
        toast.success("Subscription upgraded successfully!");
        window.location.href = "/dashboard/settings/billing";
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upgrade failed.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings/billing"
            className="p-2 rounded-lg border border-input hover:bg-default-50 transition"
          >
            <ChevronLeft className="w-5 h-5 text-default-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Choose Your Subscription Plan
            </h1>
            <p className="text-sm text-default-500 mt-0.5">
              Scale your hospital operations with flexible modules and capacity.
            </p>
          </div>
        </div>

        {/* Billing Cycle Selector */}
        <div className="bg-card border border-border p-1 rounded-xl flex items-center gap-1 shadow-sm">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-default-600 hover:text-default-900"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-default-600 hover:text-default-900"
            }`}
          >
            Yearly Billing
            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-extrabold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const price =
              billingCycle === "yearly" && plan.price_yearly
                ? Math.round(plan.price_yearly / 12)
                : Math.round(plan.price_monthly);

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-gradient-to-b from-primary/5 via-card to-card border-primary shadow-xl ring-2 ring-primary/20"
                    : "bg-card border-border hover:border-default-300 shadow-sm"
                }`}
              >
                {plan.slug === "clinic" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-default-900">{plan.name}</h3>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-default-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <p className="text-xs text-default-500 min-h-[36px]">{plan.description}</p>

                  <div className="pt-2">
                    <span className="text-3xl font-black text-default-900">
                      {price.toLocaleString("en-BD")} {plan.currency}
                    </span>
                    <span className="text-xs text-default-500 font-medium"> / month</span>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border text-xs">
                    <div className="font-bold text-default-800 uppercase tracking-wider text-[10px]">
                      Capacity Limits
                    </div>
                    <ul className="space-y-2 text-default-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {plan.max_branches === -1 ? "Unlimited" : plan.max_branches} Branch(es)
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {plan.max_doctors === -1 ? "Unlimited" : plan.max_doctors} Doctor / Staff accounts
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {plan.max_active_patients === -1 ? "Unlimited" : plan.max_active_patients} Active Patients
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{plan.storage_gb} GB Cloud Storage</span>
                      </li>
                    </ul>

                    <div className="font-bold text-default-800 uppercase tracking-wider text-[10px] pt-2">
                      Modules Included
                    </div>
                    <ul className="space-y-2 text-default-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Laboratory & Diagnostic</span>
                      </li>
                      {plan.feature_pharmacy && (
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Pharmacy & Inventory</span>
                        </li>
                      )}
                      {plan.feature_telemedicine && (
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Telemedicine Video Consult</span>
                        </li>
                      )}
                      {plan.feature_ipd && (
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>IPD & Ward Management</span>
                        </li>
                      )}
                      {plan.feature_radiology && (
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Radiology & PACS</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coupon & Checkout Summary Section */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm max-w-2xl mx-auto">
        <h3 className="text-lg font-extrabold text-default-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Discount Code & Checkout
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter promo coupon code (e.g. PROMO20)..."
            className="flex-1 h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase tracking-wider font-mono"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={validatingCoupon || !couponCode.trim()}
            className="h-10 px-5 rounded-xl border border-input font-bold text-xs hover:bg-default-50 transition disabled:opacity-50"
          >
            {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
          </button>
        </div>

        {appliedCoupon && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold flex items-center justify-between">
            <span>
              Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discount_value}{" "}
              {appliedCoupon.discount_type === "percentage" ? "%" : "BDT"} off)
            </span>
            <button
              onClick={() => setAppliedCoupon(null)}
              className="text-destructive font-bold hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleUpgradeCheckout}
            disabled={upgrading || !selectedPlanId}
            id="confirm-upgrade-checkout-btn"
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/25 disabled:opacity-60"
          >
            {upgrading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Proceed to Checkout (SSLCommerz)
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-default-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secured with 256-bit SSL encryption via SSLCommerz gateway.</span>
        </div>
      </div>
    </div>
  );
}

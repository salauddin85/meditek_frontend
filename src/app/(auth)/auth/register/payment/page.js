"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import toast from "react-hot-toast";
import { XCircle, AlertTriangle } from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");

  useEffect(() => {
    if (status === "fail") {
      toast.error("Payment failed. Please try again.");
    } else if (status === "cancel") {
      toast.error("Payment was cancelled.");
    }
  }, [status]);

  if (status === "fail" || status === "cancel") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          {status === "fail" ? (
            <XCircle className="w-8 h-8 text-destructive" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          )}
        </div>
        <h1 className="text-2xl font-black text-foreground mb-2">
          {status === "fail" ? "Payment Failed" : "Payment Cancelled"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {status === "fail"
            ? "Your payment could not be processed. Please try again with a different payment method."
            : "You cancelled the payment. You can try again when ready."}
        </p>
        <button
          onClick={() => router.push("/auth/register/plan")}
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If no status, show waiting state
  return (
    <div className="text-center">
      <h1 className="text-2xl font-black text-foreground mb-2">Processing Payment</h1>
      <p className="text-muted-foreground">
        You will be redirected to the payment gateway. If nothing happens,{" "}
        <button
          onClick={() => router.push("/auth/register/plan")}
          className="text-primary hover:underline"
        >
          go back to plan selection
        </button>
        .
      </p>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">Payment</h1>
        <p className="mt-2 text-muted-foreground">Step 5 of 5 — Secure payment via SSLCommerz.</p>
      </div>
      <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
        <PaymentContent />
      </Suspense>
    </div>
  );
}

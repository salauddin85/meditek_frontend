"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  Loader2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { billingApi } from "@/lib/tenant-api";

const InvoiceStatusBadge = ({ status }) => {
  const styles = {
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    open: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    void: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    uncollectible: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider ${
        styles[status] || styles.open
      }`}
    >
      {status}
    </span>
  );
};

export default function InvoicesHistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await billingApi.getInvoices();
      if (res.data?.data) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load invoice history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    setDownloadingId(invoiceId);
    try {
      const response = await billingApi.downloadInvoicePdf(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded successfully.");
    } catch (err) {
      toast.error("Failed to download invoice PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePayNow = async (invoiceId) => {
    setPayingId(invoiceId);
    try {
      const res = await billingApi.initiatePayment({ invoice_id: invoiceId });
      const gatewayUrl = res.data?.data?.gateway_url;
      if (gatewayUrl) {
        toast.success("Redirecting to SSLCommerz payment portal...");
        window.location.href = gatewayUrl;
      } else {
        toast.error("Could not obtain payment gateway URL.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back & Title */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings/billing"
          className="p-2 rounded-lg border border-input hover:bg-default-50 transition"
        >
          <ChevronLeft className="w-5 h-5 text-default-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Invoices & Payment History
          </h1>
          <p className="text-sm text-default-500 mt-0.5">
            View platform subscription invoices, tax receipts, and payment status.
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border bg-default-50/50 text-default-700 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Plan / Cycle</th>
                <th className="p-4">Total (BDT)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-40 text-center text-default-500">
                    No platform invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-default-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-default-900">
                      {inv.invoice_number}
                    </td>
                    <td className="p-4 text-default-600">
                      {new Date(inv.created_at).toLocaleDateString("en-BD", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="p-4 text-default-700 capitalize font-medium">
                      {inv.plan_name || "Subscription"} ({inv.billing_cycle})
                    </td>
                    <td className="p-4 font-extrabold text-default-900">
                      {parseFloat(inv.total_amount).toFixed(2)} {inv.currency}
                    </td>
                    <td className="p-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === "open" && (
                          <button
                            onClick={() => handlePayNow(inv.id)}
                            disabled={payingId === inv.id}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition"
                          >
                            {payingId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                            Pay Now
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                          disabled={downloadingId === inv.id}
                          className="px-3 py-1.5 rounded-lg border border-input text-xs font-semibold flex items-center gap-1.5 hover:bg-default-50 transition"
                        >
                          {downloadingId === inv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

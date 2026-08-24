"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { financeApi } from "@/lib/tenant-api";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetail();
    }
  }, [invoiceId]);

  const fetchInvoiceDetail = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getInvoice(invoiceId);
      setInvoice(res.data?.data || null);
    } catch (err) {
      console.error("Error fetching invoice detail:", err);
      toast.error(err.userMessage || "Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-default-500">
        <Icon icon="heroicons:arrow-path" className="w-8 h-8 animate-spin mx-auto mb-2" />
        Loading invoice statement...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center text-default-500">
        <Icon icon="heroicons:exclamation-triangle" className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-default-900">Invoice Not Found</h2>
        <Button onClick={() => router.push("/dashboard/finance/invoices")} variant="outline" className="mt-4">
          Return to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.push("/dashboard/finance/invoices")}>
          <Icon icon="heroicons:arrow-left" className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Icon icon="heroicons:printer" className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>

          <Link href="/dashboard/finance/reports/gl">
            <Button variant="outline" size="sm">
              <Icon icon="heroicons:scale" className="w-4 h-4 mr-2" />
              View Ledger Postings
            </Button>
          </Link>
        </div>
      </div>

      {/* Printable Invoice Receipt Card */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8 space-y-6">
          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Icon icon="heroicons:building-office-2" className="w-7 h-7" />
                MediTek Hospital & Health Network
              </h1>
              <p className="text-xs text-default-500 mt-1">
                {invoice.branch_name || "Main Branch"} | Official Healthcare Tax Invoice
              </p>
              <p className="text-xs text-default-400">DGHS Reg No: 99402184 | VAT Reg: 001928374-0101</p>
            </div>

            <div className="text-right">
              <Badge className="mb-2 text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20">
                {invoice.is_credit_note ? "CREDIT NOTE" : "OFFICIAL INVOICE"}
              </Badge>
              <h2 className="text-xl font-bold font-mono text-default-900">{invoice.invoice_number}</h2>
              <p className="text-xs text-default-500 mt-1">Invoice Date: {invoice.invoice_date}</p>
              {invoice.due_date && <p className="text-xs text-default-500">Due Date: {invoice.due_date}</p>}
            </div>
          </div>

          {/* Patient Details & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-default-50 border border-border">
            <div>
              <p className="text-xs uppercase font-semibold text-default-400">Billed To (Patient)</p>
              <h3 className="text-base font-bold text-default-900 mt-1">{invoice.patient_name}</h3>
              <p className="text-xs text-default-500">MRN: <span className="font-mono">{invoice.patient_mrn}</span></p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs uppercase font-semibold text-default-400">Payment Status</p>
              <div className="mt-1">
                <Badge variant="soft" className="capitalize text-sm font-semibold">
                  {invoice.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-default-500 mt-1">Payment Method: {invoice.payment_mode || "Pending"}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="text-sm font-bold text-default-900 mb-3">Service Line Items</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-default-100 text-default-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Service / Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.line_items?.map((line, idx) => (
                    <tr key={line.id || idx}>
                      <td className="p-3 text-default-400">{idx + 1}</td>
                      <td className="p-3 font-medium text-default-900">
                        {line.description}
                        {line.doctor_name && (
                          <span className="block text-xs text-default-500">Doctor: {line.doctor_name}</span>
                        )}
                      </td>
                      <td className="p-3 text-center">{parseFloat(line.quantity)}</td>
                      <td className="p-3 text-right">৳{parseFloat(line.unit_price).toLocaleString()}</td>
                      <td className="p-3 text-right text-default-500">{parseFloat(line.discount_pct)}%</td>
                      <td className="p-3 text-right font-semibold text-default-900">৳{parseFloat(line.line_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t pt-4">
            <div className="text-xs text-default-500 space-y-1">
              <p>• Built in strict compliance with Bangladesh NBR Tax & DGHS Statutory Rules.</p>
              <p>• Corrections to issued invoices are executed via Credit Notes per FR-FIN-006.</p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-default-600">
                <span>Subtotal:</span>
                <span>৳{parseFloat(invoice.subtotal).toLocaleString()}</span>
              </div>

              {parseFloat(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Discount:</span>
                  <span>-৳{parseFloat(invoice.discount_amount).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-default-600">
                <span>VAT ({parseFloat(invoice.vat_rate) * 100}%):</span>
                <span>৳{parseFloat(invoice.vat_amount).toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-bold text-base text-default-900 border-t pt-2">
                <span>Total Amount:</span>
                <span>৳{parseFloat(invoice.total_amount).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Paid Amount:</span>
                <span>৳{parseFloat(invoice.paid_amount).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-amber-600 font-bold border-t pt-1">
                <span>Remaining Balance:</span>
                <span>৳{parseFloat(invoice.balance).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment History Section */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-bold uppercase text-default-500 mb-2">Payment Transaction Log</h4>
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg border bg-default-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold capitalize text-default-900">{p.is_refund ? "Refund" : "Payment"}: ৳{parseFloat(p.amount).toLocaleString()}</span>
                      <span className="text-default-500 ml-2">via {p.method} ({p.reference || "No ref"})</span>
                    </div>
                    <span className="text-default-400">{new Date(p.paid_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

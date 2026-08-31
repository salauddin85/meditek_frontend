import React from "react";
import ReportCatalogue from "@/components/reports/ReportCatalogue";

export const metadata = {
  title: "Standard Reports & Compliance | MediTek",
  description: "Generate, analyze, and download standard hospital reports.",
};

export default function ReportsPage() {
  return <ReportCatalogue />;
}

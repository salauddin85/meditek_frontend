import React from "react";
import ReportRunsHistory from "@/components/reports/ReportRunsHistory";

export const metadata = {
  title: "Report Execution History | MediTek",
  description: "History of all generated reports with direct download links.",
};

export default function ReportRunsPage() {
  return <ReportRunsHistory />;
}

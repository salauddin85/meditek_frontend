"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  ShieldAlert, 
  History, 
  Play, 
  FileSpreadsheet, 
  FileCode2, 
  CheckCircle2,
  DollarSign,
  Activity,
  FlaskConical,
  Pill,
  Users,
  Building2,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { reportsApi } from "@/lib/tenant-api";
import ReportGeneratorModal from "./ReportGeneratorModal";
import ReportResultViewer from "./ReportResultViewer";

const CATEGORIES = [
  { id: "all", label: "All Reports" },
  { id: "financial", label: "Financial" },
  { id: "clinical", label: "Clinical" },
  { id: "operational", label: "Operational" },
  { id: "laboratory", label: "Laboratory" },
  { id: "pharmacy", label: "Pharmacy" },
];

const CATEGORY_ICONS = {
  financial: DollarSign,
  clinical: Activity,
  operational: Users,
  laboratory: FlaskConical,
  pharmacy: Pill,
  general: FileText,
};

export default function ReportCatalogue() {
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal & Viewer state
  const [selectedDefinition, setSelectedDefinition] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewerData, setViewerData] = useState(null);
  const [viewerRun, setViewerRun] = useState(null);

  useEffect(() => {
    loadDefinitions();
  }, []);

  const loadDefinitions = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getDefinitions();
      if (res?.data?.data) {
        setDefinitions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load report catalogue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGenerator = (defn) => {
    setSelectedDefinition(defn);
    setModalOpen(true);
  };

  const handleReportGenerated = (data, run) => {
    setViewerData(data);
    setViewerRun(run);
  };

  // Filter definitions
  const filtered = definitions.filter((d) => {
    const matchCat = category === "all" || d.category.toLowerCase() === category;
    const matchSearch = !searchTerm || 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  if (viewerData) {
    return (
      <ReportResultViewer 
        reportData={viewerData} 
        reportRun={viewerRun} 
        onBack={() => {
          setViewerData(null);
          setViewerRun(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900 tracking-tight">
            Standard Reports & Compliance Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-default-500 mt-1">
            Generate and export verified clinical, diagnostic, financial, and operational reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports/runs">
            <Button variant="outline" className="h-9 gap-1.5 text-xs shadow-sm">
              <History className="h-3.5 w-3.5 text-default-500" />
              <span>Execution History</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={category} onValueChange={setCategory} className="w-full sm:w-auto">
          <TabsList className="h-9 p-1 bg-default-100 flex flex-wrap gap-1">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="text-xs h-7 px-3 capitalize font-medium">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-default-400" />
          <Input
            placeholder="Search reports by name or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Report Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 border border-default-200/60 shadow-sm">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3 w-full mb-4" />
              <Skeleton className="h-8 w-28" />
            </Card>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const Icon = CATEGORY_ICONS[d.category.toLowerCase()] || FileText;
            return (
              <Card 
                key={d.id} 
                className="flex flex-col justify-between border border-default-200/60 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-none">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      <Badge variant="outline" className="text-[10px] capitalize border-default-200 text-default-600">
                        {d.category}
                      </Badge>
                      {d.contains_phi && (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-0.5">
                          <ShieldAlert className="h-2.5 w-2.5 text-amber-600" /> PHI
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardTitle className="text-sm font-bold text-default-900 mt-3 leading-snug">
                    {d.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-default-500 mt-1 line-clamp-2 leading-relaxed">
                    {d.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 mt-auto">
                  <div className="flex items-center justify-between border-t border-default-100 pt-3 mt-2">
                    <div className="flex items-center gap-1 text-[11px] text-default-400">
                      <span className="font-mono font-medium text-default-600">
                        {d.export_formats?.join(", ").toUpperCase()}
                      </span>
                    </div>

                    <Button 
                      size="sm" 
                      onClick={() => handleOpenGenerator(d)}
                      className="h-8 gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                      <Play className="h-3 w-3" />
                      <span>Run Report</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl border-default-200">
          <FileText className="h-10 w-10 text-default-300 mb-2" />
          <h3 className="text-sm font-semibold text-default-700">No reports found</h3>
          <p className="text-xs text-default-400 max-w-xs mt-1">
            No report definitions matched your selected category or search criteria.
          </p>
        </div>
      )}

      {/* Generator Modal */}
      <ReportGeneratorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        definition={selectedDefinition}
        onReportGenerated={handleReportGenerated}
      />
    </div>
  );
}

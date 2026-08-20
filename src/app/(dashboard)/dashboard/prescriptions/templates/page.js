"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { prescriptionApi } from "@/lib/tenant-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  Plus,
  Trash2,
  Loader2,
  FileText,
  ArrowLeft,
  Stethoscope,
} from "lucide-react";

export default function PrescriptionTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prescriptionApi.getTemplates();
      const list = res.data?.data || res.data?.results || res.data || [];
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.userMessage || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm("Are you sure you want to delete this prescription template?")) return;
    setDeletingId(id);
    try {
      await prescriptionApi.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert("Failed to delete template: " + (err.userMessage || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard/prescriptions" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Prescriptions
            </Link>
            <span>/</span>
            <span>Templates</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="h-7 w-7 text-purple-600" />
            Doctor Prescription Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage reusable sets of medications for instant 1-click prescribing.
          </p>
        </div>

        <Link href="/dashboard/prescriptions/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow">
            <Plus className="h-4 w-4" />
            Create Template in Workspace
          </Button>
        </Link>
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          Loading prescription templates...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-600 bg-red-50 text-sm font-medium rounded-lg border border-red-200">
          {error}
        </div>
      ) : templates.length === 0 ? (
        <Card className="shadow-sm border-slate-200 p-12 text-center">
          <Bookmark className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Templates Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't saved any prescription templates yet. Open the Prescription Writer workspace to save recurring drug sets.
          </p>
          <div className="mt-4">
            <Link href="/dashboard/prescriptions/new">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                <Plus className="h-4 w-4" /> Go to Prescription Writer
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-purple-600" />
                  {tpl.name}
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteTemplate(tpl.id)}
                  disabled={deletingId === tpl.id}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingId === tpl.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Included Medicines ({tpl.items_json?.length || 0}):
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {tpl.items_json?.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          {it.drug_name} {it.brand_name ? `(${it.brand_name})` : ""}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Dose: {it.dose} | Freq: {it.frequency} | Dur: {it.duration || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Created: {new Date(tpl.created_at).toLocaleDateString()}</span>
                  <Link href={`/dashboard/prescriptions/new`}>
                    <Button size="xs" variant="outline" className="text-purple-700 border-purple-200">
                      Use Template
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

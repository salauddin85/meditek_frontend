"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Stethoscope,
  Tv,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { branchesApi, staffApi, schedulingApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LiveQueueSelectorPage() {
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loading, setLoading] = useState(true);

  // Load branches on mount
  useEffect(() => {
    async function loadBranches() {
      try {
        const brRes = await branchesApi.getBranches();
        if (brRes.data?.data) {
          setBranches(brRes.data.data);
          if (brRes.data.data.length > 0) {
            setSelectedBranchId(brRes.data.data[0].id);
          }
        }
      } catch (err) {
        toast.error("Failed to load branches.");
      }
    }
    loadBranches();
  }, []);

  // Fetch doctors whenever selectedBranchId changes
  useEffect(() => {
    async function loadDoctors() {
      setLoading(true);
      try {
        const params = selectedBranchId ? { branch_id: selectedBranchId } : {};
        const docRes = await staffApi.getDoctors(params);
        if (docRes.data?.data) {
          const list = docRes.data.data.results || docRes.data.data;
          setDoctors(Array.isArray(list) ? list : []);
        } else {
          setDoctors([]);
        }
      } catch (err) {
        toast.error("Failed to load doctors.");
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, [selectedBranchId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-default-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            Live Chamber Queue Rooms
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Select a doctor chamber to control real-time serial calling, walk-ins, and launch waiting room TV displays.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-xs font-bold text-default-700">Filter Branch:</Label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Doctors Chamber Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-16 text-center text-default-400 bg-default-50 rounded-2xl border border-dashed border-default-200">
          <Stethoscope className="w-12 h-12 text-default-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-default-800">No Doctors Configured</h3>
          <p className="text-xs text-default-500 mt-1">Please add doctors in Staff & Doctor Management first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Card key={doc.id} className="hover:border-primary/50 transition-all shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                      Dr
                    </div>
                    <div>
                      <CardTitle className="text-base font-extrabold text-default-900">
                        Dr. {doc.full_name}
                      </CardTitle>
                      <p className="text-xs text-default-500 mt-0.5">
                        {doc.qualification || doc.designation || "Consultant"}
                      </p>
                    </div>
                  </div>
                  <Badge color="primary" className="text-[10px] font-mono">
                    ৳{doc.consult_fee || 0}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center text-xs text-default-600 bg-default-50 p-3 rounded-lg border border-default-200">
                  <span>Session Duration:</span>
                  <strong className="text-default-900 font-mono">{doc.default_session_duration || 15} mins</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href={`/dashboard/scheduling/queue/${doc.id}`}>
                    <Button className="w-full h-10 text-xs font-bold gap-1.5 shadow-md shadow-primary/20">
                      <Activity className="w-4 h-4" />
                      Manage Queue
                    </Button>
                  </Link>

                  {selectedBranchId ? (
                    <Link href={`/queue-display/${selectedBranchId}/${doc.id}`} target="_blank">
                      <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1.5">
                        <Tv className="w-4 h-4 text-primary" />
                        TV Display
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full h-10 text-xs font-bold gap-1.5 opacity-50"
                    >
                      <Tv className="w-4 h-4" />
                      Select Branch
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

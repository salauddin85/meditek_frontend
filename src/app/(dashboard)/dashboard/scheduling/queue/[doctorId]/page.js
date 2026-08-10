"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  SkipForward,
  Tv,
  User,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { schedulingApi, branchesApi, staffApi, patientApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LiveQueueControllerPage({ params }) {
  const unwrappedParams = use(params);
  const doctorId = unwrappedParams.doctorId;

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [queue, setQueue] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);

  // Walk-in Register Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [registering, setRegistering] = useState(false);

  // Load initial branch & doctor data
  useEffect(() => {
    async function loadInfo() {
      try {
        const [brRes, docRes] = await Promise.all([
          branchesApi.getBranches(),
          staffApi.getDoctor(doctorId),
        ]);
        if (brRes.data?.data && brRes.data.data.length > 0) {
          setBranches(brRes.data.data);
          setSelectedBranchId(brRes.data.data[0].id);
        }
        if (docRes.data?.data) {
          setDoctor(docRes.data.data);
        }
      } catch (err) {
        toast.error("Failed to load queue details.");
      }
    }
    loadInfo();
  }, [doctorId]);

  // Fetch Queue data
  const fetchQueue = useCallback(async () => {
    if (!doctorId || !selectedBranchId) return;
    setLoading(true);
    try {
      const res = await schedulingApi.getQueue({
        doctor_id: doctorId,
        branch_id: selectedBranchId,
      });
      if (res.data?.data) {
        setQueue(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch live queue.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, selectedBranchId]);

  useEffect(() => {
    fetchQueue();
    // Auto polling every 10 seconds for receptionist screen
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Call Next Patient
  const handleCallNext = async () => {
    setCallingNext(true);
    try {
      const res = await schedulingApi.callNextQueue({
        doctor_id: doctorId,
        branch_id: selectedBranchId,
      });
      if (res.data?.data) {
        toast.success(`Called Serial #${res.data.data.queue_position} into chamber!`);
      } else {
        toast.info("No waiting patients in queue.");
      }
      fetchQueue();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Call next failed.");
    } finally {
      setCallingNext(false);
    }
  };

  // Search Patients for Walk-in
  const handleSearchPatients = async (query) => {
    setPatientQuery(query);
    if (!query.trim()) return setPatientResults([]);
    try {
      const res = await patientApi.searchPatients(query);
      if (res.data?.data) setPatientResults(res.data.data);
    } catch (err) {
      // Silently handled
    }
  };

  // Submit Walk-in Register
  const handleRegisterWalkIn = async () => {
    if (!selectedPatient) return toast.error("Please select a patient first.");
    setRegistering(true);
    try {
      await schedulingApi.registerWalkIn({
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        branch_id: selectedBranchId,
      });
      toast.success("Walk-in patient registered into queue!");
      setShowWalkInModal(false);
      setSelectedPatient(null);
      fetchQueue();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to register walk-in.");
    } finally {
      setRegistering(false);
    }
  };

  const currentlyServing = queue.find((q) => ["called", "in_progress"].includes(q.status));
  const waitingQueue = queue.filter((q) => q.status === "waiting");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb */}
      <Link
        href="/dashboard/scheduling"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scheduling Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-default-900">
              Live Queue Controller: Dr. {doctor?.full_name || "Doctor"}
            </h1>
            <Badge color="primary" className="text-xs uppercase font-extrabold">
              Live Chamber
            </Badge>
          </div>
          <p className="text-xs text-default-500 mt-1">
            Receptionist / Nurse control room to call next patient, manage walk-ins, and broadcast TV monitor serials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {selectedBranchId && (
            <Link href={`/queue-display/${selectedBranchId}/${doctorId}`} target="_blank">
              <Button variant="outline" className="h-10 px-4 font-bold gap-2">
                <Tv className="w-4 h-4 text-primary" />
                Launch TV Display
              </Button>
            </Link>
          )}

          <Button onClick={() => setShowWalkInModal(true)} className="h-10 px-4 font-bold gap-2">
            <Plus className="w-4 h-4" />
            Add Walk-in
          </Button>
        </div>
      </div>

      {/* Main Controller Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Currently Serving Hero Card */}
        <Card className="md:col-span-1 border-2 border-primary/30 bg-primary/5 shadow-xl">
          <CardHeader className="border-b border-primary/10 py-4 text-center">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-primary">
              Currently Serving Token
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            {currentlyServing ? (
              <>
                <div className="text-6xl font-black text-primary font-mono tracking-tight">
                  #{currentlyServing.queue_position}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-default-900">
                    {currentlyServing.appointment_details?.patient_name}
                  </h3>
                  <p className="text-xs font-mono text-default-500 mt-0.5">
                    MRN: {currentlyServing.appointment_details?.patient_mrn}
                  </p>
                </div>
                <Badge color="info" className="text-xs uppercase font-extrabold px-3 py-1">
                  Status: {currentlyServing.status}
                </Badge>
              </>
            ) : (
              <div className="py-8 text-center text-default-400 space-y-2">
                <Users className="w-12 h-12 text-default-300 mx-auto" />
                <p className="font-bold text-sm text-default-600">No Patient In Chamber</p>
                <p className="text-xs">Click "Call Next Patient" to advance queue.</p>
              </div>
            )}

            <div className="pt-4 border-t border-primary/10">
              <Button
                onClick={handleCallNext}
                disabled={callingNext || waitingQueue.length === 0}
                className="w-full h-12 text-base font-extrabold gap-2 shadow-lg shadow-primary/30"
              >
                {callingNext ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Call Next Patient
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Waiting Queue Table */}
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-border py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Waiting Patients Queue ({waitingQueue.length})
            </CardTitle>
            <Button size="xs" variant="outline" onClick={fetchQueue} className="gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {waitingQueue.length === 0 ? (
              <div className="py-12 text-center text-default-400 text-xs">
                No patients currently waiting in queue.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {waitingQueue.map((q) => (
                  <div key={q.id} className="p-4 flex items-center justify-between hover:bg-default-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-mono font-extrabold text-base border border-amber-500/20">
                        #{q.queue_position}
                      </div>
                      <div>
                        <span className="font-bold text-default-900 text-sm">
                          {q.appointment_details?.patient_name}
                        </span>
                        <p className="text-xs text-default-500 font-mono mt-0.5">
                          MRN: {q.appointment_details?.patient_mrn} | Phone: {q.appointment_details?.patient_phone}
                        </p>
                      </div>
                    </div>

                    <Badge color="warning" className="text-[10px] uppercase font-bold">
                      Waiting
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Register Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 border border-border">
            <h3 className="text-lg font-bold text-default-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Register Walk-in Queue Patient
            </h3>

            <div className="space-y-3">
              <Label className="font-semibold text-default-700">Search Patient</Label>
              <Input
                placeholder="Search by Name, MRN, or Phone..."
                value={patientQuery}
                onChange={(e) => handleSearchPatients(e.target.value)}
              />

              {patientResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-default-200 rounded-lg p-2">
                  {patientResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`p-2 rounded text-xs cursor-pointer flex justify-between ${
                        selectedPatient?.id === p.id ? "bg-primary text-white font-bold" : "hover:bg-default-100 text-default-800"
                      }`}
                    >
                      <span>{p.full_name} ({p.mrn})</span>
                      <span>{p.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowWalkInModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegisterWalkIn} disabled={!selectedPatient || registering} className="font-bold">
                {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register into Queue"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

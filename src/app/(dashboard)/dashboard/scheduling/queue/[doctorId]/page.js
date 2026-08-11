"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Activity,
  ArrowLeft,
  BellRing,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  GripVertical,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  SkipForward,
  Tv,
  User,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { schedulingApi, branchesApi, staffApi, patientApi } from "@/lib/tenant-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Quick Reason Options ─────────────────────────────────────
const QUICK_REASONS = [
  { label: "🚨 Emergency", value: "Emergency" },
  { label: "🤒 Very Sick", value: "Very Sick" },
  { label: "👨‍⚕️ Doctor Request", value: "Doctor Request" },
  { label: "🙋 Patient Request", value: "Patient Request" },
  { label: "🔧 Technical Issue", value: "Technical Issue" },
];

// ── Sortable Queue Item Component ────────────────────────────
function SortableQueueItem({ entry, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSelf } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelf ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 flex items-center justify-between hover:bg-default-50 transition-colors border-b border-border last:border-0
        ${entry.is_reordered ? "bg-rose-50/60 dark:bg-rose-950/20 border-l-4 border-l-rose-500" : ""}
      `}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mr-3 cursor-grab active:cursor-grabbing text-default-300 hover:text-default-500 p-1 rounded"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-extrabold text-base border shrink-0
          ${entry.is_reordered ? "bg-rose-500/10 text-rose-700 border-rose-500/30" : "bg-amber-500/10 text-amber-700 border-amber-500/20"}
        `}>
          #{entry.queue_position}
        </div>
        <div className="min-w-0">
          <span className="font-bold text-default-900 text-sm truncate block">
            {entry.appointment_details?.patient_name}
          </span>
          <p className="text-xs text-default-500 font-mono mt-0.5 truncate">
            MRN: {entry.appointment_details?.patient_mrn} · {entry.appointment_details?.patient_phone}
          </p>
          {entry.is_reordered && entry.reorder_reason && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-2.5 h-2.5" />
              Reordered: {entry.reorder_reason}
            </span>
          )}
        </div>
      </div>

      <Badge className={`text-[10px] uppercase font-bold ml-2 shrink-0 ${entry.is_reordered ? "bg-rose-100 text-rose-700 border-rose-200" : ""}`}>
        {entry.is_reordered ? "Reordered" : "Waiting"}
      </Badge>
    </div>
  );
}

// ── Drag Overlay Item ────────────────────────────────────────
function DragOverlayItem({ entry }) {
  if (!entry) return null;
  return (
    <div className="p-4 flex items-center gap-4 bg-card border border-primary shadow-2xl shadow-primary/20 rounded-xl">
      <GripVertical className="w-4 h-4 text-primary" />
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-mono font-extrabold text-base">
        #{entry.queue_position}
      </div>
      <div>
        <span className="font-bold text-sm text-default-900">{entry.appointment_details?.patient_name}</span>
        <p className="text-xs text-default-500 font-mono">MRN: {entry.appointment_details?.patient_mrn}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LiveQueueControllerPage({ params }) {
  const unwrappedParams = use(params);
  const doctorId = unwrappedParams.doctorId;

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [queue, setQueue] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [pushingBack, setPushingBack] = useState(false);

  // New checked-in detection banner
  const [newCheckedInCount, setNewCheckedInCount] = useState(0);

  // Walk-in register modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [registering, setRegistering] = useState(false);

  // Load Queue from date modal
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadDate, setLoadDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Drag-and-drop reorder reason modal
  const [pendingReorder, setPendingReorder] = useState(null); // { entryId, newPosition, oldIndex, newIndex }
  const [reorderReason, setReorderReason] = useState("");
  const [savingReorder, setSavingReorder] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // Optimistic queue items for dnd
  const [optimisticQueue, setOptimisticQueue] = useState([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Load initial branch & doctor data
  useEffect(() => {
    async function loadInfo() {
      try {
        const [brRes, docRes] = await Promise.all([
          branchesApi.getBranches(),
          staffApi.getDoctor(doctorId),
        ]);
        if (brRes.data?.data?.length > 0) {
          setBranches(brRes.data.data);
          setSelectedBranchId(brRes.data.data[0].id);
        }
        if (docRes.data?.data) setDoctor(docRes.data.data);
      } catch {
        toast.error("Failed to load queue details.");
      }
    }
    loadInfo();
  }, [doctorId]);

  // Fetch queue data (also checks for new unqueued appointments for today)
  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const [queueRes, apptRes] = await Promise.all([
        schedulingApi.getQueue({ doctor_id: doctorId, branch_id: selectedBranchId || undefined }),
        schedulingApi.getAppointments({
          doctor_id: doctorId,
          branch_id: selectedBranchId || undefined,
          date_from: format(new Date(), "yyyy-MM-dd"),
          date_to: format(new Date(), "yyyy-MM-dd"),
        }),
      ]);

      if (queueRes.data?.data) {
        const q = queueRes.data.data;
        setQueue(q);
        setOptimisticQueue(q.filter((e) => e.status === "waiting").sort((a, b) => a.queue_position - b.queue_position));

        // Detect appointments for today not yet in queue
        if (apptRes.data?.data) {
          const queueApptIds = new Set(q.map((e) => e.appointment));
          const notInQueue = apptRes.data.data.filter(
            (a) => !queueApptIds.has(a.id) && ["scheduled", "confirmed", "checked_in"].includes(a.status)
          );
          setNewCheckedInCount(notInQueue.length);
        }
      }
    } catch {
      toast.error("Failed to fetch live queue.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, selectedBranchId]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Call next patient
  const handleCallNext = async () => {
    setCallingNext(true);
    try {
      const res = await schedulingApi.callNextQueue({ doctor_id: doctorId, branch_id: selectedBranchId });
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

  // Push currently serving patient to back
  const handlePushBack = async () => {
    if (!currentlyServing) return;
    setPushingBack(true);
    try {
      await schedulingApi.pushBackQueue(currentlyServing.id);
      toast.success("Patient pushed to end of queue. Next patient can be called.");
      fetchQueue();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to push back.");
    } finally {
      setPushingBack(false);
    }
  };

  // Search patients for walk-in
  const handleSearchPatients = async (query) => {
    setPatientQuery(query);
    if (!query.trim()) return setPatientResults([]);
    try {
      const res = await patientApi.searchPatients(query);
      if (res.data?.data) setPatientResults(res.data.data);
    } catch {}
  };

  // Register walk-in
  const handleRegisterWalkIn = async () => {
    if (!selectedPatient) return toast.error("Please select a patient first.");
    setRegistering(true);
    try {
      await schedulingApi.registerWalkIn({ patient_id: selectedPatient.id, doctor_id: doctorId, branch_id: selectedBranchId });
      toast.success("Walk-in patient registered into queue!");
      setShowWalkInModal(false);
      setSelectedPatient(null);
      setPatientQuery("");
      setPatientResults([]);
      fetchQueue();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to register walk-in.");
    } finally {
      setRegistering(false);
    }
  };

  // Load queue from date
  const handleLoadDateQueue = async () => {
    setLoadingQueue(true);
    try {
      const payload = { doctor_id: doctorId, date: loadDate };
      if (selectedBranchId) payload.branch_id = selectedBranchId;
      const res = await schedulingApi.loadDateQueue(payload);
      const count = res.data?.data?.length || 0;
      if (count === 0) {
        toast.info("No patient available to add in queue.");
      } else {
        toast.success(`${count} patient(s) successfully loaded into queue!`);
      }
      setShowLoadModal(false);
      setNewCheckedInCount(0);
      fetchQueue();
    } catch (err) {
      toast.info(err?.response?.data?.message || "No patient available to add in queue.");
      setShowLoadModal(false);
    } finally {
      setLoadingQueue(false);
    }
  };



  // Drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Drag end — show reason modal
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = optimisticQueue.findIndex((e) => e.id === active.id);
    const newIndex = optimisticQueue.findIndex((e) => e.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic reorder
    const reordered = arrayMove(optimisticQueue, oldIndex, newIndex);
    setOptimisticQueue(reordered);

    const newPosition = optimisticQueue[newIndex].queue_position;

    // Show reason modal
    setPendingReorder({ entryId: active.id, newPosition, oldIndex, newIndex });
    setReorderReason("");
  };

  // Confirm reorder with reason
  const handleConfirmReorder = async () => {
    if (!reorderReason.trim()) return toast.error("Please provide a reason for reordering.");
    if (!pendingReorder) return;
    setSavingReorder(true);
    try {
      await schedulingApi.reorderQueue(pendingReorder.entryId, {
        new_position: pendingReorder.newPosition,
        reason: reorderReason.trim(),
      });
      toast.success("Queue reordered and saved.");
      setPendingReorder(null);
      setReorderReason("");
      fetchQueue();
    } catch (err) {
      // Revert optimistic update on failure
      setOptimisticQueue(queue.filter((e) => e.status === "waiting").sort((a, b) => a.queue_position - b.queue_position));
      toast.error(err?.response?.data?.message || "Failed to save reorder.");
      setPendingReorder(null);
    } finally {
      setSavingReorder(false);
    }
  };

  // Cancel reorder — revert optimistic
  const handleCancelReorder = () => {
    setOptimisticQueue(queue.filter((e) => e.status === "waiting").sort((a, b) => a.queue_position - b.queue_position));
    setPendingReorder(null);
    setReorderReason("");
  };

  const currentlyServing = queue.find((q) => q.status === "in_progress");
  const activeItem = optimisticQueue.find((e) => e.id === activeId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb */}
      <Link href="/dashboard/scheduling" className="inline-flex items-center gap-1.5 text-xs font-bold text-default-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Scheduling
      </Link>

      {/* ── New Checked-In Banner ───────────────────────── */}
      {newCheckedInCount > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-amber-600 animate-pulse" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                {newCheckedInCount} new checked-in patient{newCheckedInCount > 1 ? "s" : ""} detected
              </p>
              <p className="text-xs text-amber-600">They are checked in but not yet in the queue.</p>
            </div>
          </div>
          <Button
            size="sm"
            className="font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => { setLoadDate(format(new Date(), "yyyy-MM-dd")); setShowLoadModal(true); }}
          >
            <Plus className="w-4 h-4" /> Load into Queue
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-default-900">
              Live Queue Controller: Dr. {doctor?.full_name || "Doctor"}
            </h1>
            <Badge color="primary" className="text-xs uppercase font-extrabold">Live</Badge>
          </div>
          <p className="text-xs text-default-500 mt-1">
            Receptionist control room to call patients, manage walk-ins, and broadcast TV.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-default-200 bg-background text-xs font-bold text-default-800"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>

          {selectedBranchId && (
            <Link href={`/queue-display/${selectedBranchId}/${doctorId}`} target="_blank">
              <Button variant="outline" className="h-10 px-4 font-bold gap-2">
                <Tv className="w-4 h-4 text-primary" /> TV Display
              </Button>
            </Link>
          )}

          <Button onClick={() => setShowWalkInModal(true)} className="h-10 px-4 font-bold gap-2">
            <Plus className="w-4 h-4" /> Add Walk-in
          </Button>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Currently Serving Card ─────────────────────── */}
        <Card className="md:col-span-1 border-2 border-primary/30 bg-primary/5 shadow-xl">
          <CardHeader className="border-b border-primary/10 py-4 text-center">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-primary">
              Currently Serving Token
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            {currentlyServing ? (
              <>
                <div className="text-7xl font-black text-primary font-mono tracking-tight animate-pulse">
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
                  In Chamber
                </Badge>

                {/* Not Available Button */}
                <Button
                  variant="outline"
                  className="w-full border-rose-300 text-rose-600 font-bold gap-2"
                  onClick={handlePushBack}
                  disabled={pushingBack}
                >
                  {pushingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
                  Not Available (Push to End)
                </Button>
              </>
            ) : (
              <div className="py-8 text-center text-default-400 space-y-2">
                <Users className="w-12 h-12 text-default-300 mx-auto" />
                <p className="font-bold text-sm text-default-600">No Patient In Chamber</p>
                <p className="text-xs">Click "Call Next Patient" below.</p>
              </div>
            )}

            <div className={`pt-4 border-t border-primary/10 ${currentlyServing ? "mt-2" : ""}`}>
              <Button
                onClick={handleCallNext}
                disabled={callingNext || optimisticQueue.length === 0}
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

        {/* ── Waiting Queue ───────────────────────────────── */}
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-border py-4 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-default-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Waiting Patients Queue ({optimisticQueue.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => { setLoadDate(format(new Date(), "yyyy-MM-dd")); setShowLoadModal(true); }}
                  className="gap-1 font-bold text-primary border-primary/30 "
                >
                  <Calendar className="w-3.5 h-3.5" /> Load Queue
                </Button>
                <Button size="xs" variant="outline" onClick={fetchQueue} className="gap-1">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </div>
            <p className="text-xs text-default-400 mt-1">
              Drag rows to reorder. A reason will be required for any reorder.
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {optimisticQueue.length === 0 ? (
              <div className="py-12 text-center text-default-400 text-xs space-y-2">
                <Users className="w-10 h-10 text-default-300 mx-auto" />
                <p>No patients currently waiting in queue.</p>
                <Button size="sm" variant="outline" onClick={() => setShowLoadModal(true)} className="mt-2 font-bold gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Load from Date
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={optimisticQueue.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  <div>
                    {optimisticQueue.map((entry) => (
                      <SortableQueueItem key={entry.id} entry={entry} />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  <DragOverlayItem entry={activeItem} />
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── MODALS ───────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* Reorder Reason Modal */}
      {pendingReorder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-default-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Reason for Reorder
              </h3>
              <button onClick={handleCancelReorder} className="text-default-400 hover:text-default-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-default-500">
              Why is this patient being moved to a different position? This will be saved permanently and visible on the TV display.
            </p>

            {/* Quick reasons */}
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReorderReason(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    reorderReason === r.value
                      ? "bg-primary text-white border-primary"
                      : "border-default-200 text-default-700 hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Free text */}
            <Input
              placeholder="Or type a custom reason..."
              value={reorderReason}
              onChange={(e) => setReorderReason(e.target.value)}
              className="text-sm"
            />

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={handleCancelReorder} className="flex-1 font-bold">
                Cancel Reorder
              </Button>
              <Button
                onClick={handleConfirmReorder}
                disabled={!reorderReason.trim() || savingReorder}
                className="flex-1 font-bold"
              >
                {savingReorder ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Load Queue from Date Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-default-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Load Queue from Date
              </h3>
              <button onClick={() => setShowLoadModal(false)} className="text-default-400 hover:text-default-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-default-500">
              All booked or checked-in appointments for the selected date will be loaded into the queue. Duplicates are skipped automatically.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-default-700">Select Date</label>
              <Input
                type="date"
                value={loadDate}
                onChange={(e) => setLoadDate(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowLoadModal(false)} className="flex-1 font-bold">
                Cancel
              </Button>
              <Button onClick={handleLoadDateQueue} disabled={loadingQueue} className="flex-1 font-bold gap-2">
                {loadingQueue ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Load Queue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Register Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-default-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Register Walk-in Patient
              </h3>
              <button onClick={() => { setShowWalkInModal(false); setSelectedPatient(null); setPatientQuery(""); setPatientResults([]); }} className="text-default-400 hover:text-default-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search by Name, MRN, or Phone..."
                  value={patientQuery}
                  onChange={(e) => handleSearchPatients(e.target.value)}
                />
              </div>

              {patientResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 border border-default-200 rounded-lg p-2">
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

              {selectedPatient && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-default-900">{selectedPatient.full_name}</span>
                  <span className="text-xs text-default-500 font-mono ml-auto">{selectedPatient.mrn}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => { setShowWalkInModal(false); setSelectedPatient(null); }}>Cancel</Button>
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
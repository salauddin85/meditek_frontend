"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Building,
  PlusCircle,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { portalService } from "@/lib/portal-api";
import { usePortalAuthStore } from "@/store/portal-auth";

export default function PortalAppointmentsPage() {
  const patient = usePortalAuthStore((s) => s.patient);
  const [tab, setTab] = useState("upcoming"); // "upcoming" | "past"
  const [loading, setLoading] = useState(true);
  const [appointmentsData, setAppointmentsData] = useState({
    upcoming: [],
    past: [],
    all: [],
  });

  // Self-booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cancellation modal state
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await portalService.getAppointments();
      if (res.data?.data) {
        setAppointmentsData(res.data.data);
      }
    } catch (err) {
      toast.error(err.userMessage || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await portalService.getDoctors();
      if (res.data?.data) {
        setDoctors(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDoctorId(res.data.data[0].id);
        }
      }
    } catch {
      // doctor load fallback
    }
  };

  // Load available slots whenever doctor or date changes
  useEffect(() => {
    if (isBookingOpen && selectedDoctorId && bookingDate) {
      fetchSlots(selectedDoctorId, bookingDate);
    }
  }, [isBookingOpen, selectedDoctorId, bookingDate]);

  const fetchSlots = async (doctorId, dateStr) => {
    setLoadingSlots(true);
    try {
      const res = await portalService.getSlots({
        doctor_id: doctorId,
        date: dateStr,
      });
      const slots = res.data?.data || [];
      setAvailableSlots(slots);
      setSelectedSlotId(slots[0]?.id || "");
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !bookingDate) {
      toast.error("Please select a doctor and date.");
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        doctor_id: selectedDoctorId,
        appointment_date: bookingDate,
        slot_id: selectedSlotId || null,
        notes: bookingNotes.trim(),
        appointment_type: "regular",
      };

      await portalService.bookAppointment(payload);
      toast.success("Appointment successfully booked!");
      setIsBookingOpen(false);
      setBookingNotes("");
      loadAppointments();
    } catch (err) {
      toast.error(err.userMessage || "Booking failed.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancellingAppt) return;
    setCancelLoading(true);
    try {
      await portalService.cancelAppointment(cancellingAppt.id, {
        cancellation_reason: cancelReason.trim() || "Cancelled by patient via portal.",
      });
      toast.success("Appointment has been cancelled.");
      setCancellingAppt(null);
      setCancelReason("");
      loadAppointments();
    } catch (err) {
      toast.error(err.userMessage || "Failed to cancel appointment.");
    } finally {
      setCancelLoading(false);
    }
  };

  const currentList = tab === "upcoming" ? appointmentsData.upcoming : appointmentsData.past;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View consultation schedules, upcoming doctor visits, and book new appointments.
          </p>
        </div>

        <button
          onClick={() => setIsBookingOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setTab("upcoming")}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            tab === "upcoming"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <span>Upcoming Appointments</span>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold">
            {appointmentsData.upcoming.length}
          </span>
          {tab === "upcoming" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setTab("past")}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            tab === "past"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <span>Past Visits</span>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold">
            {appointmentsData.past.length}
          </span>
          {tab === "past" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Appointments Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((appt) => {
            const isUpcoming =
              tab === "upcoming" && ["scheduled", "confirmed"].includes(appt.status);

            return (
              <div
                key={appt.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          appt.status === "scheduled" || appt.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : appt.status === "completed"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {appt.status}
                      </span>
                      <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {appt.doctor_name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {appt.doctor_specialization || appt.department_name || "Specialist"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {appt.start_time || `Serial: #${appt.serial_number}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {appt.appointment_date}
                      </div>
                    </div>
                  </div>

                  {appt.notes && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Notes: </span>
                      {appt.notes}
                    </div>
                  )}

                  {appt.cancellation_reason && (
                    <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      <span className="font-semibold">Cancelled: </span>
                      {appt.cancellation_reason}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" />
                    <span>{appt.branch_name || "Hospital Campus"}</span>
                  </div>

                  {isUpcoming && (
                    <button
                      onClick={() => setCancellingAppt(appt)}
                      className="text-rose-600 hover:text-rose-700 font-medium transition"
                    >
                      Cancel Visit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Calendar className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No {tab} appointments found
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tab === "upcoming"
              ? "You do not have any appointments booked for future dates."
              : "No historical appointment records found."}
          </p>
          {tab === "upcoming" && (
            <button
              onClick={() => setIsBookingOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Book Appointment Now</span>
            </button>
          )}
        </div>
      )}

      {/* Self-Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Book Consultation
              </h2>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="mt-4 space-y-4">
              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Select Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.full_name} — {doc.specialization || doc.department_name} (BDT {Number(doc.consult_fee || 0).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                </input>
              </div>

              {/* Slots Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Available Slots
                </label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>Checking slot availability...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`rounded-lg border p-2 text-xs text-center transition ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {slot.start_time ? slot.start_time.slice(0, 5) : `#${slot.serial_number}`}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-1">
                    No predefined slots found for this date. Booking will create a standard visit slot.
                  </p>
                )}
              </div>

              {/* Consultation Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. routine check-up, chest discomfort, medication review"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {bookingLoading ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cancel Appointment?
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to cancel your visit with{" "}
              <strong>{cancellingAppt.doctor_name}</strong> on{" "}
              {cancellingAppt.appointment_date}?
            </p>

            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. scheduling conflict, feeling better"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                Keep Visit
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleCancelAppointment}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

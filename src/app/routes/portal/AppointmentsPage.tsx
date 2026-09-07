import React, { useState } from "react";
import { useApi } from "@/lib/api/hooks";
import { ApiClient } from "@/lib/api/client";
import { Calendar, Plus, AlertCircle, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentStateMachine } from "@/domain/stateMachines/AppointmentStateMachine";
import type { AppointmentResponseDto } from "@/application/dto/AppDtos";
import {
  APPOINTMENT_TIME_SLOTS,
  TIME_SLOT_LABELS,
  formatPreferredDate,
  type AppointmentTimeSlot,
} from "@/lib/appointmentDisplay";

export const AppointmentsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useApi<{ appointments: AppointmentResponseDto[] }>("/appointments");
  const { data: vehiclesData } = useApi<{ vehicles: any[] }>("/vehicles");
  
  const appointments = data?.appointments || [];
  const vehicles = vehiclesData?.vehicles || [];

  const [isBooking, setIsBooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  const [formData, setFormData] = useState({
    vehicleId: "",
    serviceType: "Maintenance",
    preferredDate: "",
    preferredTimeSlot: "morning" as AppointmentTimeSlot,
    dropoffType: "customer_dropoff",
    customerNotes: ""
  });

  const handleCancel = async (id: string) => {
    try {
      await ApiClient.post(`/appointments/${id}/cancel`);
      refetch();
    } catch (err: any) {
      alert("Failed to cancel appointment: " + err.message);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSubmitError("");
      
      await ApiClient.post("/appointments", formData);
      
      setIsBooking(false);
      refetch();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Appointments</h1>
          <p className="text-zinc-500">Manage your upcoming service bookings.</p>
        </div>
        {!isBooking && (
          <Button onClick={() => setIsBooking(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" />
          Failed to load appointments. {error.message}
        </div>
      )}

      {isBooking && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
          <div className="flex justify-between items-center p-6 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-lg font-semibold text-zinc-900">Book New Appointment</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsBooking(false)}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
          
          <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
            {submitError && (
              <div className="bg-red-50 text-red-800 p-3 rounded text-sm mb-4 border border-red-200 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {submitError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 block">Vehicle</label>
                <select 
                  required
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-white"
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} ({v.plateCode}-{v.plateNumber})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 block">Service Type</label>
                <select 
                  required
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-white"
                >
                  <option value="Maintenance">General Maintenance</option>
                  <option value="Repair">Repair</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Diagnostics">Diagnostics</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 block">Preferred Date</label>
                <input 
                  type="date"
                  required
                  min={today}
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 block">Time Slot</label>
                <select 
                  required
                  value={formData.preferredTimeSlot}
                  onChange={(e) => setFormData({...formData, preferredTimeSlot: e.target.value as AppointmentTimeSlot})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 bg-white"
                >
                  {APPOINTMENT_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{TIME_SLOT_LABELS[slot]}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-zinc-700 block">Notes (Optional)</label>
              <textarea 
                value={formData.customerNotes}
                onChange={(e) => setFormData({...formData, customerNotes: e.target.value})}
                placeholder="Any specific concerns or details?"
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 h-20 resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Booking..." : <><Save className="w-4 h-4 mr-2" /> Confirm Booking</>}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading && !isBooking ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col sm:flex-row">
              <div className="bg-zinc-50 border-r border-zinc-100 p-6 flex flex-col items-center justify-center sm:w-48 text-center shrink-0">
                <Calendar className="w-6 h-6 text-zinc-400 mb-2" />
                <p className="font-semibold text-zinc-900">
                  {formatPreferredDate(apt.preferredDate)}
                </p>
                <p className="text-sm text-zinc-500">
                  {TIME_SLOT_LABELS[apt.preferredTimeSlot] ?? apt.preferredTimeSlot}
                </p>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-3 capitalize
                      ${apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                         apt.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                         apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                         apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>
                      {String(apt.status).replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-medium text-zinc-900 mb-1">{apt.serviceType?.replace(/_/g, ' ') || 'General Service'}</h3>
                    {apt.customerNotes && <p className="text-sm text-zinc-500 line-clamp-2">{apt.customerNotes}</p>}
                  </div>
                  {AppointmentStateMachine.canTransition(apt.status, 'cancelled') && (
                    <Button variant="outline" size="sm" onClick={() => handleCancel(apt.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isBooking && (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
          <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No upcoming appointments</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            You don't have any service appointments scheduled.
          </p>
          <Button onClick={() => setIsBooking(true)}>
            Book a Service
          </Button>
        </div>
      )}
    </div>
  );
};

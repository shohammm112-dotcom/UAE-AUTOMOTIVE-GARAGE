import React from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { Car, Wrench, FileText, Calendar, Clock, AlertCircle, CheckCircle2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DashboardPage: React.FC = () => {
  const { data: vehiclesData, isLoading: vehiclesLoading } = useApi<{ vehicles: any[] }>("/vehicles");
  const { data: jobsData, isLoading: jobsLoading } = useApi<{ activeJobs: any[], history: any[] }>("/jobs");
  const { data: notificationsData, isLoading: notifsLoading } = useApi<{ notifications: any[] }>("/notifications");
  const { data: appointmentsData, isLoading: aptsLoading } = useApi<{ appointments: any[] }>("/appointments");

  const activeJobs = jobsData?.activeJobs || [];
  const vehicles = vehiclesData?.vehicles || [];
  const unreadNotifications = notificationsData?.notifications?.filter(n => !n.read) || [];
  const upcomingAppointments =
    appointmentsData?.appointments?.filter(
      (a) => a.status === 'requested' || a.status === 'confirmed'
    ) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Customer Dashboard</h1>
        <p className="text-zinc-500">Overview of your vehicles and active services.</p>
      </div>

      {unreadNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <div className="bg-blue-100 p-2 rounded-full shrink-0">
            <Bell className="w-5 h-5 text-blue-700" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-blue-900 font-semibold mb-1">You have {unreadNotifications.length} unread notification{unreadNotifications.length > 1 ? 's' : ''}</h3>
            <p className="text-blue-800 text-sm mb-3">Check your notifications for important updates regarding your vehicle service.</p>
            <Link to="/portal/notifications">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm">
                View Notifications
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicles Summary */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <Car className="w-5 h-5 mr-2 text-zinc-400" />
              My Vehicles
            </h2>
            <Link to="/portal/vehicles" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {vehiclesLoading ? (
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-16 bg-zinc-100 rounded-lg"></div>
                <div className="h-16 bg-zinc-100 rounded-lg"></div>
              </div>
            ) : vehicles.length > 0 ? (
              <div className="space-y-4 w-full">
                {vehicles.slice(0, 3).map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-100 transition-colors hover:bg-zinc-100/50">
                    <div>
                      <p className="font-semibold text-zinc-900">{v.year} {v.make} {v.model}</p>
                      <p className="text-sm text-zinc-500">{v.plateCode}-{v.plateNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 w-full">
                <p className="mb-4">No vehicles registered yet.</p>
                <Link to="/portal/vehicles">
                  <Button variant="outline" size="sm">Add Vehicle</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-zinc-400" />
              Active Jobs
            </h2>
            <Link to="/portal/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {jobsLoading ? (
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-20 bg-zinc-100 rounded-lg"></div>
              </div>
            ) : activeJobs.length > 0 ? (
              <div className="space-y-4 w-full">
                {activeJobs.slice(0, 3).map((job: any) => (
                  <div key={job.id} className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-zinc-100/50">
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">Job #{job.id.substring(0, 8)}</p>
                      <p className="text-sm text-zinc-500 capitalize">Status: {job.stage.replace(/_/g, ' ')}</p>
                    </div>
                    <Link to={`/portal/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">View Details</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 flex flex-col items-center w-full">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3 opacity-20" />
                <p>No active repairs right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden md:col-span-2">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-zinc-400" />
              Upcoming Appointments
            </h2>
            <Link to="/portal/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="p-6">
            {aptsLoading ? (
              <div className="animate-pulse w-full">
                <div className="h-16 bg-zinc-100 rounded-lg"></div>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingAppointments.slice(0, 3).map((apt: any) => (
                  <div key={apt.id} className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="font-medium text-zinc-900 mb-1">{new Date(apt.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm text-zinc-500 capitalize">{apt.serviceType.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <p className="mb-4">You have no upcoming appointments.</p>
                <Link to="/portal/appointments">
                  <Button variant="outline" size="sm">Schedule Service</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

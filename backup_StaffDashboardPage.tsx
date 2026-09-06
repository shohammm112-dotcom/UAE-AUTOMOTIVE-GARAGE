import React from "react";
import { Link } from "react-router-dom";
import { Wrench, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StaffDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Workshop Board</h1>
        <p className="text-zinc-500">Overview of today's operational queue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Vehicles In Shop</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">12</div>
          <p className="text-xs text-zinc-500 mt-1">4 arriving today</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Awaiting Inspection</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">3</div>
          <p className="text-xs text-zinc-500 mt-1">Needs attention</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Pending Approvals</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">5</div>
          <p className="text-xs text-zinc-500 mt-1">Estimates sent to customer</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Ready for Delivery</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">2</div>
          <p className="text-xs text-zinc-500 mt-1">Completed jobs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-80">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Priority Job Queue</h3>
            <Link to="/staff/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-zinc-500">
            <Wrench className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="font-medium">No priority jobs loaded</p>
            <p className="text-sm mt-1 mb-4">List endpoint pending implementation.</p>
            <Link to="/staff/jobs">
              <Button variant="outline" size="sm">Go to Job Queue</Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-80">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Recent Estimates</h3>
            <Link to="/staff/estimates" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-zinc-500">
            <FileText className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="font-medium">No estimates available</p>
            <p className="text-sm mt-1 mb-4">List endpoint pending implementation.</p>
            <Link to="/staff/estimates">
              <Button variant="outline" size="sm">Go to Estimates</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

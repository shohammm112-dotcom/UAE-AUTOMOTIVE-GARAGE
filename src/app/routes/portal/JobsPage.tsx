import React from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { Wrench, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const JobsPage: React.FC = () => {
  const { data, isLoading, error } = useApi<{ activeJobs: any[], history: any[] }>("/jobs");
  
  const activeJobs = data?.activeJobs || [];
  const history = data?.history || []; // In real implementation we might separate them or just use active.

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Active Repairs</h1>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-zinc-100 rounded-xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
        <AlertCircle className="w-5 h-5 mr-3" />
        Failed to load active repairs. {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Active Repairs</h1>
        <p className="text-zinc-500">Track the status of your current vehicle services.</p>
      </div>

      {activeJobs.length > 0 ? (
        <div className="space-y-6">
          {activeJobs.map((job: any) => (
            <div key={job.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                    <Wrench className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Job #{job.id.substring(0, 8)}</h3>
                    <p className="text-sm text-zinc-500 capitalize">{job.stage.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <Link to={`/portal/jobs/${job.id}`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">View Timeline</Button>
                </Link>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Customer Concern</p>
                  <p className="text-sm font-medium">{job.customerConcern}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Service Advisor</p>
                  <p className="text-sm font-medium">{job.serviceAdvisorName}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{new Date(job.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No active repairs</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            You don't have any vehicles currently in the workshop.
          </p>
          <Link to="/portal/appointments">
            <Button>Book a Service</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

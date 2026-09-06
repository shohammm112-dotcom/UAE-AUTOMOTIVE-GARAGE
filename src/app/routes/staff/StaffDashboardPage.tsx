import React from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { Wrench, FileText, Activity, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobResponseDto, EstimateResponseDto, InvoiceResponseDto } from "@/application/dto/AppDtos";
import { Skeleton } from "@/components/ui/skeleton";

export const StaffDashboardPage: React.FC = () => {
  const { data: jobsData, isLoading: isLoadingJobs } = useApi<{ jobs: JobResponseDto[] }>("/internal/jobs");
  const { data: estimatesData, isLoading: isLoadingEstimates } = useApi<{ estimates: EstimateResponseDto[] }>("/internal/estimates");
  const { data: invoicesData, isLoading: isLoadingInvoices } = useApi<{ invoices: InvoiceResponseDto[] }>("/internal/invoices");

  const jobs = jobsData?.jobs || [];
  const estimates = estimatesData?.estimates || [];
  const invoices = invoicesData?.invoices || [];

  const activeJobs = jobs.filter(j => j.stage !== 'delivered');
  const awaitingInspection = jobs.filter(j => j.stage === 'intake' || j.stage === 'inspection');
  const pendingApprovals = estimates.filter(e => e.status === 'draft' || e.status === 'sent');
  const readyForDelivery = jobs.filter(j => j.stage === 'qc' || j.stage === 'ready_for_delivery');

  const isLoading = isLoadingJobs || isLoadingEstimates || isLoadingInvoices;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Workshop Board</h1>
          <p className="text-zinc-500">Overview of today's operational queue.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Workshop Board</h1>
        <p className="text-zinc-500">Overview of today's operational queue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Active Jobs</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{activeJobs.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Vehicles in shop</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Intake / Inspection</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{awaitingInspection.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Needs attention</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Pending Approvals</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{pendingApprovals.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Estimates sent to customer</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-zinc-500">Ready for Delivery</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{readyForDelivery.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Completed jobs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-80">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Priority Job Queue</h3>
            <Link to="/staff/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeJobs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6">
                <Wrench className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="font-medium">No active jobs</p>
                <p className="text-sm mt-1 mb-4">Workshop queue is clear.</p>
                <Link to="/staff/jobs">
                  <Button variant="outline" size="sm">Go to Job Queue</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {activeJobs.slice(0, 5).map(job => (
                  <li key={job.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <Link to={`/staff/jobs/${job.id}`} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-zinc-900">Job {job.id.substring(0, 8)}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 capitalize">{job.stage.replace('_', ' ')}</p>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-80">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Recent Estimates</h3>
            <Link to="/staff/estimates" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {estimates.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6">
                <FileText className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="font-medium">No estimates available</p>
                <p className="text-sm mt-1 mb-4">No draft or active estimates.</p>
                <Link to="/staff/estimates">
                  <Button variant="outline" size="sm">Go to Estimates</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {estimates.slice(0, 5).map(estimate => (
                  <li key={estimate.id} className="p-4 hover:bg-zinc-50 transition-colors">
                    <Link to={`/staff/estimates/${estimate.id}`} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-zinc-900">Est {estimate.id.substring(0, 8)}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 capitalize">{estimate.status}</p>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


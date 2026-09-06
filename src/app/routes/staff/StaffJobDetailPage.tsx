import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { ApiClient } from "@/lib/api/client";
import { 
  Wrench, CheckCircle2, Clock, AlertCircle, ArrowLeft, 
  CarFront, User, Calendar, Activity, ChevronRight, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ORDERED_JOB_STAGES, JobStateMachine } from "@/domain/stateMachines/JobStateMachine.ts";

export const StaffJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  
  const { data, isLoading, error, refetch } = useApi<{ job: any }>(`/internal/jobs/${id}`);
  
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        <div className="h-64 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-200 flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="w-10 h-10 mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Error Loading Job</h2>
        <p>{error.message}</p>
        <Link to="/staff/jobs" className="mt-6">
          <Button variant="outline" className="bg-white">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const job = data?.job;
  if (!job) return null;

  const currentStageIndex = ORDERED_JOB_STAGES.indexOf(job.stage);
  
  const canAdvanceJob = hasRole('advisor') || hasRole('service_advisor') || hasRole('technician') || hasRole('mechanic') || hasRole('workshop_manager') || hasRole('admin');

  const advanceJobStage = async (targetStage: string) => {
    try {
      setIsAdvancing(true);
      setAdvanceError("");
      
      await ApiClient.post(`/internal/jobs/${job.id}/stage`, { targetStage });
      refetch();
    } catch (err: any) {
      setAdvanceError(err.message || "Failed to advance job stage");
    } finally {
      setIsAdvancing(false);
    }
  };

  const availableNextStages = JobStateMachine.getLegalNextStages(job.stage);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/staff/jobs" className="p-2 rounded-full hover:bg-zinc-200 text-zinc-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            Job #{job.id.substring(0, 8)}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase tracking-wider">
              {job.stage.replace(/_/g, ' ')}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Created on {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {advanceError && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          {advanceError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h3 className="font-semibold mb-6 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Workshop Execution Workbench
            </h3>
            
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg mb-8">
               <h4 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">Next Operational Actions</h4>
               {canAdvanceJob ? (
                  availableNextStages.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {availableNextStages.map(stage => (
                        <Button 
                          key={stage}
                          onClick={() => advanceJobStage(stage)}
                          disabled={isAdvancing}
                          variant={stage.includes('repair') || stage.includes('delivery') ? 'default' : 'outline'}
                        >
                          {isAdvancing ? "Updating..." : (
                            <>Move to {stage.replace(/_/g, ' ')} <ChevronRight className="w-4 h-4 ml-1" /></>
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 flex items-center">
                       <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                       This job has reached its terminal stage.
                    </div>
                  )
               ) : (
                  <div className="text-sm text-zinc-500">
                    You do not have permission to advance job stages.
                  </div>
               )}
            </div>

            <div className="relative border-l-2 border-zinc-200 ml-4 space-y-8 pb-4">
              {ORDERED_JOB_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                
                return (
                  <div key={stage} className="relative flex items-start">
                    <div className={`absolute -left-[25px] w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 
                      ${isCompleted ? 'bg-green-100 text-green-600 border border-green-200' : 
                        isCurrent ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-50' : 'bg-zinc-100 text-zinc-400 border border-zinc-200'}`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                        isCurrent ? <Clock className="w-5 h-5" /> :
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>}
                    </div>
                    <div className="ml-10 pt-3 flex-1 flex items-center justify-between">
                      <div>
                        <p className={`font-medium capitalize ${isCurrent ? 'text-blue-900' : 'text-zinc-900'}`}>
                          {stage.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 font-semibold text-zinc-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" />
              Service Information
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-zinc-500 mb-1">Customer Concern</dt>
                  <dd className="text-sm text-zinc-900 bg-zinc-50 p-3 rounded-md border border-zinc-100">{job.customerConcern}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500 mb-1">Diagnostic Summary</dt>
                  <dd className="text-sm text-zinc-900 bg-zinc-50 p-3 rounded-md border border-zinc-100">
                    {job.diagnosticSummary || <span className="italic text-zinc-400">Pending inspection</span>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 font-semibold text-zinc-900 flex items-center gap-2">
              <CarFront className="w-4 h-4 text-zinc-500" />
              Vehicle Context
            </div>
            <div className="p-5 space-y-4">
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Vehicle ID</dt>
                <dd className="text-sm font-mono text-blue-600 hover:underline">
                   <Link to={`/staff/vehicles/${job.vehicleId}`}>{job.vehicleId}</Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Mileage</dt>
                <dd className="text-sm text-zinc-900">{job.mileageInKm.toLocaleString()} km</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 font-semibold text-zinc-900 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-500" />
              Assignment
            </div>
            <div className="p-5 space-y-4">
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Customer ID</dt>
                <dd className="text-sm font-mono text-blue-600 hover:underline">
                   <Link to={`/staff/customers/${job.customerId}`}>{job.customerId}</Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Service Advisor</dt>
                <dd className="text-sm text-zinc-900">{job.serviceAdvisorName || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Lead Technician</dt>
                <dd className="text-sm text-zinc-900">
                  {job.assignedTechnician || 'Unassigned'}
                  <div className="text-xs text-zinc-400 mt-1 italic">Technician assignment mutation infrastructure deferred</div>
                </dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 font-semibold text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              Related Estimates
            </div>
            <div className="p-5">
              <p className="text-sm text-zinc-500">
                To view estimates associated with this job, navigate to the Estimates portal.
              </p>
              <Link to={`/staff/estimates`}>
                 <Button variant="outline" size="sm" className="mt-3 w-full">Go to Estimates</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

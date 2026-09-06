import React from "react";
import { useParams, Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { Wrench, CheckCircle2, Clock, AlertCircle, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentDownloadButton } from "@/components/DocumentDownloadButton";
import { ORDERED_JOB_STAGES, JobStateMachine } from "@/domain/stateMachines/JobStateMachine.ts";

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useApi<{ job: any }>(`/jobs/${id}`);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-zinc-100 rounded w-1/4"></div>
        <div className="h-48 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data?.job) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 mr-3 inline" />
        Failed to load job details.
      </div>
    );
  }

  const job = data.job;
  const currentStageIndex = JobStateMachine.getStageIndex(job.stage);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/portal/jobs" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Job #{job.id.substring(0, 8)}</h1>
          <p className="text-sm text-zinc-500 capitalize">{job.stage.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">Repair Timeline</h2>
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-[15px] w-0.5 bg-zinc-100"></div>
          <div className="space-y-6 relative">
            {ORDERED_JOB_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <div key={stage} className={`flex items-start ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 
                    ${isCompleted ? 'bg-green-100 text-green-600' : 
                      isCurrent ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-100 text-zinc-400'}`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                      isCurrent ? <Clock className="w-4 h-4" /> :
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-300"></div>}
                  </div>
                  <div className="ml-4 pt-1">
                    <p className={`font-medium capitalize ${isCurrent ? 'text-blue-700' : 'text-zinc-900'}`}>
                      {stage.replace(/_/g, ' ')}
                    </p>
                    {isCurrent && <p className="text-sm text-zinc-500 mt-1">This is the current stage of your vehicle.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Wrench className="w-4 h-4 mr-2" />
            Service Details
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Customer Concern</dt>
              <dd className="font-medium">{job.customerConcern}</dd>
            </div>
            {job.diagnosticSummary && (
              <div>
                <dt className="text-zinc-500 mt-3">Diagnostic Summary</dt>
                <dd className="font-medium p-3 bg-zinc-50 rounded-lg mt-1 border border-zinc-100">{job.diagnosticSummary}</dd>
              </div>
            )}
            <div>
              <dt className="text-zinc-500 mt-3">Service Advisor</dt>
              <dd className="font-medium">{job.serviceAdvisorName}</dd>
            </div>
            {job.estimatedCompletionAt && (
              <div>
                <dt className="text-zinc-500 mt-3">Estimated Completion</dt>
                <dd className="font-medium">{new Date(job.estimatedCompletionAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </div>
        
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 flex flex-col">
           <h3 className="font-semibold mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Documents & Actions
          </h3>
          
          <div className="space-y-4 flex-1">
            {/*
              Inspection report download is intentionally not rendered.
              The control could never succeed: it passed `job.id` as
              `parentResourceId` while DocumentAccessApplicationService resolves
              that id via inspectionRepo.findById (an InspectionReportId), and it
              hardcoded documentKey="multipoint-report", which must instead be a
              member of inspection.findings[].mediaStorageKeys.
              To restore it, GET /api/v1/jobs/:id must first expose the job's
              inspection report id and its available media keys
              (IInspectionRepository.findByJobId already exists but is not
              reachable from any HTTP route).
            */}

            <div className="p-4 border border-zinc-200 rounded-lg">
              <p className="text-sm text-zinc-600 mb-3">
                Check your estimates to see if there are any pending approvals required to proceed with the repair.
              </p>
              {/* Note: In a real system, we would link directly to the estimate if available, but API gap prevents listing estimates by job directly without iterating or relying on notifications */}
              <Link to="/portal/estimates" className="block"> 
                <Button variant="outline" className="w-full">Go to Estimates</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

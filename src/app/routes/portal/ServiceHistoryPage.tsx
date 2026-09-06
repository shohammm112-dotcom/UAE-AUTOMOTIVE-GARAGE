import React from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { History, AlertCircle, CheckCircle2, ChevronRight, FileText } from "lucide-react";

export const ServiceHistoryPage: React.FC = () => {
  const { data, isLoading, error } = useApi<{ history: any[] }>("/jobs");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-white p-6 rounded-xl border border-zinc-200 h-32"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-3" />
        Failed to load service history.
      </div>
    );
  }

  // Filter for completed/delivered jobs to represent actual history, 
  // or show all jobs but sort them. Let's just show all jobs from 'history' array.
  const history = data?.history || [];
  
  // Sort by date descending
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Service History</h1>
        <p className="text-zinc-500">View past and current service records for your vehicles.</p>
      </div>

      {sortedHistory.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
          <History className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No service history</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            You don't have any past or active service jobs yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-200">
          {sortedHistory.map((job) => (
            <Link 
              key={job.id} 
              to={`/portal/jobs/${job.id}`}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-zinc-900 text-lg">Job #{job.id.substring(0, 8)}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
                    job.stage === 'delivered' ? 'bg-green-100 text-green-700' : 
                    job.stage === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {job.stage}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-zinc-500 gap-4">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Created: {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-zinc-900">View Details</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

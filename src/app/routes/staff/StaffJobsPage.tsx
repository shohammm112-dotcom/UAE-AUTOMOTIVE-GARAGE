import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, Search, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StaffJobsPage: React.FC = () => {
  const [jobIdSearch, setJobIdSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobIdSearch.trim()) {
      navigate(`/staff/jobs/${jobIdSearch.trim()}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Job Queue</h1>
          <p className="text-zinc-500">Manage active workshop repairs and inspections.</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700">Filter by stage:</span>
            <select className="text-sm border border-zinc-300 rounded-md px-3 py-1.5 bg-white">
              <option>All Active Jobs</option>
              <option>Intake / Check-in</option>
              <option>Inspection</option>
              <option>In Repair</option>
              <option>Ready for QC</option>
            </select>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by Job ID..." 
              value={jobIdSearch}
              onChange={(e) => setJobIdSearch(e.target.value)}
              className="w-full pl-9 pr-20 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <Button 
              type="submit" 
              size="sm" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
              disabled={!jobIdSearch.trim()}
            >
              Go
            </Button>
          </form>
        </div>

        {/* Empty State due to API Gap */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50">
          <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Job List Unavailable</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            The internal endpoint to list all workshop jobs is currently deferred. You can search for a specific Job ID if you know it, or wait for the API implementation.
          </p>
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 text-sm max-w-md flex text-left gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong>API Gap:</strong> <code>GET /api/v1/internal/jobs</code> is not implemented in the backend. 
              The application correctly restricts the customer <code>/api/v1/jobs</code> endpoint to customer-owned jobs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

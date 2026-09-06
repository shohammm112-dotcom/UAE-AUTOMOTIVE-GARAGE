import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { Wrench, Search, ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { JobResponseDto } from "@/application/dto/AppDtos";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const StaffJobsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, error } = useApi<{ jobs: JobResponseDto[] }>("/internal/jobs");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Job Queue</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const jobs = data?.jobs || [];
  const filteredJobs = jobs.filter((j) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      j.id.toLowerCase().includes(searchLower) ||
      j.customerId.toLowerCase().includes(searchLower) ||
      j.vehicleId.toLowerCase().includes(searchLower) ||
      (j.serviceAdvisorName && j.serviceAdvisorName.toLowerCase().includes(searchLower)) ||
      j.stage.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Queue</h1>
          <p className="text-zinc-500">Manage active workshop repairs and inspections.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search jobs..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No jobs found"
          description={
            searchTerm
              ? `No jobs match the search "${searchTerm}".`
              : "There are no jobs in the system."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <Link key={job.id} to={`/staff/jobs/${job.id}`}>
              <Card className="hover:border-zinc-400 transition-colors cursor-pointer h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate pr-2">Job {job.id.substring(0, 8)}...</span>
                    <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2.5 text-sm flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Stage:</span>
                      <Badge variant={job.stage === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                        {job.stage.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {job.estimatedCompletionAt && (
                      <div className="flex items-center gap-2 text-zinc-600">
                        <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                        <span>Due: {new Date(job.estimatedCompletionAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="pt-2 text-xs text-zinc-500 line-clamp-2">
                      <span className="font-medium text-zinc-700">Concern: </span>
                      {job.customerConcern}
                    </div>
                  </div>
                  <div className="pt-4 mt-auto flex gap-2">
                     <Badge variant="outline" className="font-normal text-xs text-zinc-500 truncate">
                        Cust: {job.customerId.substring(0, 8)}
                     </Badge>
                     <Badge variant="outline" className="font-normal text-xs text-zinc-500 truncate">
                        Veh: {job.vehicleId.substring(0, 8)}
                     </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

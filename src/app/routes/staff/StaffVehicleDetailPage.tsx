import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { 
  ArrowLeft, 
  Car, 
  User, 
  Wrench,
  Gauge,
  Hash,
  Calendar,
  ChevronRight
} from "lucide-react";

import { CustomerResponseDto, VehicleResponseDto, JobResponseDto } from "@/application/dto/AppDtos";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const StaffVehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicleData, isLoading: isVehicleLoading, error: vehicleError } = useApi<{ vehicle: VehicleResponseDto }>(`/internal/vehicles/${id}`);
  
  const customerId = vehicleData?.vehicle?.customerId;

  const { data: customerData, isLoading: isCustomerLoading } = useApi<{ customer: CustomerResponseDto }>(customerId ? `/internal/customers/${customerId}` : "");
  
  const { data: jobsData, isLoading: isJobsLoading } = useApi<{ jobs: JobResponseDto[] }>(`/internal/vehicles/${id}/jobs`);
  

  if (isVehicleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (vehicleError) {
    return <ErrorState message={vehicleError.message} />;
  }

  const vehicle = vehicleData?.vehicle;
  const customer = customerData?.customer;
  const jobs = jobsData?.jobs || [];

  if (!vehicle) {
    return <EmptyState icon={Car} title="Vehicle not found" description="The requested vehicle could not be found." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2 text-zinc-500 hover:text-zinc-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <Badge className="bg-zinc-900 text-white text-sm px-3 py-1">{vehicle.plate.displayString}</Badge>
        </div>
        <p className="text-zinc-500 mt-1">Vehicle ID: {vehicle.id}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {}
        <Card className="md:col-span-1 shadow-sm border-zinc-200 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs text-zinc-500 font-medium mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> VIN</p>
              <p className="text-sm font-mono bg-zinc-100 p-2 rounded border border-zinc-200 text-zinc-800 break-all">{vehicle.vin}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 font-medium mb-1">Make</p>
                <p className="text-sm font-medium">{vehicle.make}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium mb-1">Model</p>
                <p className="text-sm font-medium">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium mb-1">Year</p>
                <p className="text-sm font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium mb-1">Color</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full border border-zinc-300 block"
                    style={{ backgroundColor: vehicle.color.toLowerCase() }}
                  ></span>
                  {vehicle.color}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <p className="text-xs text-zinc-500 font-medium mb-1 flex items-center gap-1"><Gauge className="w-3 h-3"/> Current Mileage</p>
              <p className="text-lg font-semibold">{vehicle.odometerReadingKm.toLocaleString()} <span className="text-sm font-normal text-zinc-500">km</span></p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg">Owner Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isCustomerLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : customer ? (
                <Link to={`/staff/customers/${customer.id}`}>
                  <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors bg-white group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                        <User className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">{customer.fullName}</h4>
                        <p className="text-xs text-zinc-500">{customer.email} • {customer.phone}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />
                  </div>
                </Link>
              ) : (
                <div className="text-sm text-zinc-500 italic">Owner information unavailable</div>
              )}
            </CardContent>
          </Card>

          {}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Workshop Jobs</CardTitle>
                <CardDescription>Service history for this vehicle</CardDescription>
              </div>
              <Badge variant="secondary" className="px-2.5 py-0.5">{jobs.length}</Badge>
            </CardHeader>
            <CardContent>
              {isJobsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : jobs.length === 0 ? (
                <div className="text-center py-6 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                  <Wrench className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
                  <p className="text-sm text-zinc-500">No jobs recorded for this vehicle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <Link key={job.id} to={`/staff/jobs/${job.id}`}>
                      <div className="flex items-center justify-between p-4 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs uppercase bg-white">{job.stage}</Badge>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-zinc-900 mb-1">
                            {job.customerConcern || "No concern specified"}
                          </p>
                          <div className="flex gap-4 text-xs text-zinc-500">
                            <span>Advisor: {job.serviceAdvisorName}</span>
                            {job.assignedTechnician && <span>Tech: {job.assignedTechnician}</span>}
                            <span>Recorded Mileage: {job.mileageInKm.toLocaleString()} km</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

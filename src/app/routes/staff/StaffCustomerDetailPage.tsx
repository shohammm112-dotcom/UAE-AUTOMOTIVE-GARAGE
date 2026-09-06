import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  Wrench,
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

export const StaffCustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customerData, isLoading: isCustomerLoading, error: customerError } = useApi<{ customer: CustomerResponseDto }>(`/internal/customers/${id}`);
  const { data: vehiclesData, isLoading: isVehiclesLoading } = useApi<{ vehicles: VehicleResponseDto[] }>(`/internal/customers/${id}/vehicles`);
  const { data: jobsData, isLoading: isJobsLoading } = useApi<{ jobs: JobResponseDto[] }>(`/internal/customers/${id}/jobs`);


  if (isCustomerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (customerError) {
    return <ErrorState message={customerError.message} />;
  }

  const customer = customerData?.customer;
  const vehicles = vehiclesData?.vehicles || [];
  const jobs = jobsData?.jobs || [];

  if (!customer) {
    return <EmptyState icon={User} title="Customer not found" description="The requested customer could not be found." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2 text-zinc-500 hover:text-zinc-900"
          onClick={() => navigate("/staff/customers")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{customer.fullName}</h1>
        <p className="text-zinc-500">Customer ID: {customer.id}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {}
        <Card className="md:col-span-1 shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-700">
              <Phone className="w-5 h-5 text-zinc-400" />
              <span>{customer.phone || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Mail className="w-5 h-5 text-zinc-400" />
              <span className="break-all">{customer.email}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <MapPin className="w-5 h-5 text-zinc-400" />
              <span>{customer.emirate}, UAE</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Calendar className="w-5 h-5 text-zinc-400" />
              <span>Registered {new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="pt-2">
              <Badge variant="outline">{customer.preferredLanguage === 'ar' ? 'Arabic' : 'English'} Speaker</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Registered Vehicles</CardTitle>
                <CardDescription>Vehicles owned by this customer</CardDescription>
              </div>
              <Badge variant="secondary" className="px-2.5 py-0.5">{vehicles.length}</Badge>
            </CardHeader>
            <CardContent>
              {isVehiclesLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : vehicles.length === 0 ? (
                <div className="text-center py-6 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                  <Car className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
                  <p className="text-sm text-zinc-500">No vehicles registered</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {vehicles.map((vehicle) => (
                    <Link key={vehicle.id} to={`/staff/vehicles/${vehicle.id}`}>
                      <div className="group border border-zinc-200 rounded-lg p-4 hover:border-zinc-400 transition-colors cursor-pointer bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-zinc-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h4>
                          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs mb-3">
                          <Badge variant="outline" className="bg-zinc-50">{vehicle.plate.displayString}</Badge>
                          <Badge variant="outline" className="bg-zinc-50">{vehicle.color}</Badge>
                        </div>
                        <div className="text-xs text-zinc-500 flex justify-between">
                          <span>VIN: {vehicle.vin}</span>
                          <span>{vehicle.odometerReadingKm.toLocaleString()} km</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Workshop History</CardTitle>
                <CardDescription>Recent jobs for this customer</CardDescription>
              </div>
              <Badge variant="secondary" className="px-2.5 py-0.5">{jobs.length}</Badge>
            </CardHeader>
            <CardContent>
              {isJobsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : jobs.length === 0 ? (
                <div className="text-center py-6 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                  <Wrench className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
                  <p className="text-sm text-zinc-500">No workshop history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const jobVehicle = vehicles.find(v => v.id === job.vehicleId);
                    return (
                      <Link key={job.id} to={`/staff/jobs/${job.id}`}>
                        <div className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs uppercase bg-white">{job.stage.replace(/_/g, ' ')}</Badge>
                              <span className="text-sm font-medium">
                                {jobVehicle ? `${jobVehicle.make} ${jobVehicle.model}` : 'Unknown Vehicle'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 truncate max-w-md">
                              {job.customerConcern}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {}
          <Card className="shadow-sm border-zinc-200 bg-zinc-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Commercial Summary</CardTitle>
              <CardDescription>Financial history and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 border border-dashed border-zinc-200 rounded-lg">
                <p className="text-sm text-zinc-500">
                  Consolidated commercial summary is not yet available in the current ERP release.
                  <br/>
                  (Deferred to future milestone)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

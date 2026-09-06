import React from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { Search, ChevronRight, User, Phone, Mail, MapPin } from "lucide-react";

import { CustomerResponseDto } from "@/application/dto/AppDtos";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const StaffCustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data, isLoading, error } = useApi<{ customers: CustomerResponseDto[] }>("/internal/customers");


  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Customer Master</h1>
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

  const customers = data?.customers || [];

  const filteredCustomers = customers.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Master</h1>
          <p className="text-zinc-500">Manage workshop customers and their vehicles.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={User}
          title="No customers found"
          description={
            searchTerm
              ? `No customers match the search "${searchTerm}".`
              : "There are no registered customers in the system yet."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Link key={customer.id} to={`/staff/customers/${customer.id}`}>
              <Card className="hover:border-zinc-400 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate pr-2">{customer.fullName}</span>
                    <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{customer.phone || "No phone"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600">
                      <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span>{customer.emirate}</span>
                    </div>
                    <div className="pt-3 flex gap-2">
                      <Badge variant="secondary" className="font-normal text-xs">
                        ID: {customer.id.split("_")[1] || customer.id.substring(0, 8)}
                      </Badge>
                    </div>
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

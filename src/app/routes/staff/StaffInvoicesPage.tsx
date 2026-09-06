import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { FileCheck, Search, ChevronRight, Plus } from "lucide-react";
import { InvoiceResponseDto } from "@/application/dto/AppDtos";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const StaffInvoicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { data, isLoading, error } = useApi<{ invoices: InvoiceResponseDto[] }>("/internal/invoices");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
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

  const invoices = data?.invoices || [];
  const filteredInvoices = invoices.filter((inv) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      inv.id.toLowerCase().includes(searchLower) ||
      inv.jobId.toLowerCase().includes(searchLower) ||
      inv.customerId.toLowerCase().includes(searchLower) ||
      inv.status.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-zinc-500">Manage billing and record customer payments.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => navigate("/staff/invoices/new")} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No invoices found"
          description={
            searchTerm
              ? `No invoices match the search "${searchTerm}".`
              : "There are no invoices in the system."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <Link key={invoice.id} to={`/staff/invoices/${invoice.id}`}>
              <Card className="hover:border-zinc-400 transition-colors cursor-pointer h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate pr-2">Inv {invoice.id.substring(0, 8)}...</span>
                    <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2.5 text-sm flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Status:</span>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Total:</span>
                      <span className="font-semibold">{invoice.totalDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Issued:</span>
                      <span>{new Date(invoice.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="pt-4 mt-auto flex gap-2">
                     <Badge variant="outline" className="font-normal text-xs text-zinc-500 truncate">
                        Job: {invoice.jobId.substring(0, 8)}
                     </Badge>
                     <Badge variant="outline" className="font-normal text-xs text-zinc-500 truncate">
                        Cust: {invoice.customerId.substring(0, 8)}
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

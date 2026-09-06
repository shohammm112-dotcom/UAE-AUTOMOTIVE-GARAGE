import React from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StaffInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Invoices</h1>
          <p className="text-zinc-500">Manage billing and record customer payments.</p>
        </div>
        <Button onClick={() => navigate("/staff/invoices/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Empty State due to API Gap */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50">
          <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4">
            <FileCheck className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Invoice List Unavailable</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            The internal endpoint to list workshop invoices is currently deferred. You can still generate invoices from locked estimates when navigating from a job.
          </p>
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 text-sm max-w-md flex text-left gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong>API Gap:</strong> There is no <code>GET /api/v1/internal/invoices</code> endpoint available in the backend. 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

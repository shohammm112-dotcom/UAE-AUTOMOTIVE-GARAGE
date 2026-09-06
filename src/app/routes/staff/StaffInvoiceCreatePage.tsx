import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiClient } from "@/lib/api/client";
import { hasCapability } from "@/lib/auth/StaffCapabilities";

export const StaffInvoiceCreatePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [approvalId, setApprovalId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !hasCapability(user.roles, "invoices:generate")) {
    return (
      <div className="p-8 text-center text-red-600">
        You do not have permission to generate invoices.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalId.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await ApiClient.post<{ invoice: { id: string } }>('/internal/invoices/generate', {
        approvalId: approvalId.trim()
      });
      navigate(`/staff/invoices/${response.invoice.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/staff/invoices")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Generate Invoice</h1>
            <p className="text-zinc-500">Create an authoritative invoice from an approval record.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="p-6 bg-white border border-zinc-200 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Approval Record ID</label>
            <input 
              type="text" 
              required
              value={approvalId} 
              onChange={e => setApprovalId(e.target.value)} 
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. app-123"
            />
            <p className="text-xs text-zinc-500 mt-2">
              The invoice will be deterministically derived from the locked estimate approval snapshot.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate("/staff/invoices")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !approvalId.trim()}>
            {isSubmitting ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
};

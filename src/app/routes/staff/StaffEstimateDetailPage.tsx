import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle, FileText, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasCapability } from "@/lib/auth/StaffCapabilities";

interface EstimateItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPriceDisplay: string;
  lineTotalDisplay: string;
  isMandatory: boolean;
  decision?: string;
}

interface Estimate {
  id: string;
  jobId: string;
  customerId: string;
  status: string;
  items: EstimateItem[];
  subtotalDisplay: string;
  vatDisplay: string;
  totalDisplay: string;
  approvedTotalDisplay: string;
}

export const StaffEstimateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      // We don't have GET /api/v1/internal/estimates/:id, but we DO have GET /api/v1/estimates/:id for customers.
      // Wait, is there a staff way to get an estimate?
      // Wait, let's check EstimateApplicationService. getEstimate asserts customer owns entity unless actor is staff!
      // So GET /api/v1/estimates/:id works for staff too. Let's verify.
      const response = await ApiClient.get<{ estimate: Estimate }>(`/estimates/${id}`);
      setEstimate(response.estimate);
    } catch (err: any) {
      setError(err.message || "Failed to load estimate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEstimate();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!id || !hasCapability(user?.roles || [], "estimates:submit")) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await ApiClient.post(`/internal/estimates/${id}/submit`, {});
      await fetchEstimate();
    } catch (err: any) {
      setError(err.message || "Failed to submit estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading estimate details...</div>;
  }

  if (error || !estimate) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block border border-red-200">
          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
          {error || "Estimate not found"}
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/staff/estimates")}>Back to Estimates</Button>
        </div>
      </div>
    );
  }

  const canSubmit = estimate.status === 'draft' && hasCapability(user?.roles || [], "estimates:submit");
  const isImmutable = ['locked', 'approved', 'partially_approved', 'rejected'].includes(estimate.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/staff/estimates")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Estimate {estimate.id.split('-').pop()}</h1>
            <p className="text-zinc-500">Job: {estimate.jobId} • Customer: {estimate.customerId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
            estimate.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
            estimate.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
            estimate.status === 'partially_approved' ? 'bg-amber-100 text-amber-800 border-amber-200' :
            estimate.status === 'locked' ? 'bg-zinc-100 text-zinc-800 border-zinc-200' :
            'bg-blue-100 text-blue-800 border-blue-200'
          }`}>
            {estimate.status.replace(/_/g, ' ').toUpperCase()}
          </div>
          
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit to Customer"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <h3 className="font-semibold text-zinc-900">Line Items</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                    <th className="px-4 py-3 font-medium text-right">Line Total</th>
                    <th className="px-4 py-3 font-medium text-center">Customer Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {estimate.items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{item.description}</div>
                        {item.isMandatory && <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Mandatory</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 capitalize">{item.type}</td>
                      <td className="px-4 py-3 text-right text-zinc-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-zinc-900">{item.unitPriceDisplay}</td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900">{item.lineTotalDisplay}</td>
                      <td className="px-4 py-3 text-center">
                        {item.decision === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : item.decision === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                            <AlertCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {isImmutable && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex gap-3 text-zinc-700 text-sm">
              <Lock className="w-5 h-5 text-zinc-500 shrink-0" />
              <div>
                <strong>Estimate Locked.</strong> This estimate has received a customer decision and is now immutable. 
                Any further changes require generating a new estimate version.
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{estimate.subtotalDisplay}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>VAT (5%)</span>
                <span>{estimate.vatDisplay}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-zinc-900 pt-3 border-t border-zinc-100">
                <span>Total</span>
                <span>{estimate.totalDisplay}</span>
              </div>
            </div>
          </div>
          
          {(estimate.status === 'approved' || estimate.status === 'partially_approved' || estimate.status === 'locked') && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Approved Scope</h3>
              <p className="text-blue-800/80 text-sm mb-4">Total value of items approved by customer.</p>
              <div className="text-2xl font-bold text-blue-900">
                {estimate.approvedTotalDisplay}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

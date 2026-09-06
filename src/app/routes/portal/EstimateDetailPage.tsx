import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { ApiClient } from "@/lib/api/client";
import { FileText, AlertCircle, CheckCircle2, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EstimateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useApi<{ estimate: any }>(`/estimates/${id}`);
  
  const [selectedItems, setSelectedItems] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-zinc-100 rounded w-1/4"></div>
        <div className="h-64 bg-zinc-100 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data?.estimate) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 mr-3 inline" />
        Failed to load estimate. {error?.message}
      </div>
    );
  }

  const estimate = data.estimate;
  const isDraftOrPending = estimate.status === 'draft' || estimate.status === 'pending';
  
  const handleToggleItem = (itemId: string, status: 'approved' | 'rejected') => {
    if (!isDraftOrPending) return; // Cannot modify sealed estimate
    
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: status
    }));
  };

  const calculateSelectedTotal = () => {
    let total = 0;
    estimate.items.forEach((item: any) => {
      if (item.isMandatory || selectedItems[item.id] === 'approved') {
        total += item.unitPriceFils * item.quantity;
      }
    });
    return total;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError("");
      
      const decisions = estimate.items.map((item: any) => ({
        itemId: item.id,
        decision: item.isMandatory ? 'approved' : (selectedItems[item.id] || 'rejected')
      }));

      // A simple idempotency key for this session
      const idempotencyKey = `estimate-${estimate.id}-${Date.now()}`;

      await ApiClient.post(`/estimates/${estimate.id}/decision`, {
        decisions,
        idempotencyKey
      });

      // Navigate to a success view or reload
      await refetch();
      alert("Decisions successfully submitted!");
      navigate("/portal/jobs/" + estimate.jobId);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit decisions");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Link to={`/portal/jobs/${estimate.jobId}`} className="text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Estimate #{estimate.id.substring(0, 8)}</h1>
            <p className="text-sm text-zinc-500 capitalize">Status: {estimate.status}</p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-lg font-semibold">Service Recommendations</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {isDraftOrPending 
              ? "Please review and approve the recommended services below." 
              : "This estimate has been locked and can no longer be modified."}
          </p>
        </div>

        <div className="divide-y divide-zinc-200">
          {estimate.items.map((item: any) => (
            <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-zinc-900">{item.description}</h3>
                  {item.isMandatory && (
                    <span className="bg-red-100 text-red-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Mandatory</span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">Part/Labor: {item.partNumber || 'N/A'}</p>
              </div>
              
              <div className="flex flex-col sm:items-end gap-3">
                <div className="text-right">
                  <p className="font-semibold text-lg">AED {((item.unitPriceFils * item.quantity) / 100).toFixed(2)}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-zinc-500">{item.quantity} × AED {(item.unitPriceFils / 100).toFixed(2)}</p>
                  )}
                </div>
                
                {isDraftOrPending ? (
                  <div className="flex bg-zinc-100 rounded-lg p-1 w-full sm:w-auto">
                    {item.isMandatory ? (
                      <div className="px-4 py-2 text-sm font-medium text-zinc-500 flex items-center w-full justify-center">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Auto-Approved
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleToggleItem(item.id, 'approved')}
                          className={`flex-1 sm:px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${selectedItems[item.id] === 'approved' ? 'bg-green-600 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-200'}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                        </button>
                        <button 
                          onClick={() => handleToggleItem(item.id, 'rejected')}
                          className={`flex-1 sm:px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${selectedItems[item.id] === 'rejected' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-200'}`}
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-2 text-sm font-medium flex items-center">
                    {/* If it's sealed, we can't reliably know what was rejected unless it's in the DTO. Assuming items present were approved. */}
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Approved
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-500">Subtotal (Selected): AED {(calculateSelectedTotal() / 100).toFixed(2)}</p>
            <p className="text-sm text-zinc-500">VAT (5%): AED {((calculateSelectedTotal() * 0.05) / 100).toFixed(2)}</p>
            <p className="text-xl font-bold mt-1">Total: AED {((calculateSelectedTotal() * 1.05) / 100).toFixed(2)}</p>
          </div>
          
          {isDraftOrPending && (
            <Button 
              size="lg" 
              onClick={handleSubmit} 
              disabled={isSubmitting || (!Object.keys(selectedItems).length && estimate.items.some((i: any) => !i.isMandatory))}
              className="w-full md:w-auto"
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              Submit Approval
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

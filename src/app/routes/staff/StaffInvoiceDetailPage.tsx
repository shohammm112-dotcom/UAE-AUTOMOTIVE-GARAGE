import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle, FileText, Banknote, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasCapability } from "@/lib/auth/StaffCapabilities";

interface InvoiceItem {
  itemId: string;
  type: string;
  description: string;
  quantity: number;
  unitPriceDisplay: string;
  lineTotalDisplay: string;
}

interface Invoice {
  id: string;
  jobId: string;
  customerId: string;
  status: string;
  items: InvoiceItem[];
  subtotalDisplay: string;
  vatDisplay: string;
  totalDisplay: string;
  amountPaidDisplay: string;
  balanceDueDisplay: string;
}

export const StaffInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pos_terminal");

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ invoice: Invoice }>(`/invoices/${id}`);
      setInvoice(response.invoice);
    } catch (err: any) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handleRecordPayment = async () => {
    if (!id || !hasCapability(user?.roles || [], "payments:record")) return;
    try {
      setIsRecording(true);
      setError(null);
      await ApiClient.post(`/internal/invoices/${id}/record-payment`, {
        paymentMethod
      });
      setShowPaymentDialog(false);
      await fetchInvoice();
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    } finally {
      setIsRecording(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading invoice details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block border border-red-200">
          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
          {error || "Invoice not found"}
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/staff/invoices")}>Back to Invoices</Button>
        </div>
      </div>
    );
  }

  const canRecordPayment = invoice.status === 'issued' && hasCapability(user?.roles || [], "payments:record");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/staff/invoices")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Invoice {invoice.id.split('-').pop()}</h1>
            <p className="text-zinc-500">Job: {invoice.jobId} • Customer: {invoice.customerId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
            invoice.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
            invoice.status === 'void' ? 'bg-zinc-100 text-zinc-800 border-zinc-200' :
            'bg-blue-100 text-blue-800 border-blue-200'
          }`}>
            {invoice.status.toUpperCase()}
          </div>
          
          {canRecordPayment && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <Banknote className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <h3 className="font-semibold text-zinc-900">Billed Items</h3>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="bg-white">
                      <td className="px-4 py-3 font-medium text-zinc-900">{item.description}</td>
                      <td className="px-4 py-3 text-zinc-500 capitalize">{item.type}</td>
                      <td className="px-4 py-3 text-right text-zinc-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-zinc-900">{item.unitPriceDisplay}</td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900">{item.lineTotalDisplay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">Financial Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{invoice.subtotalDisplay}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>VAT (5%)</span>
                <span>{invoice.vatDisplay}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-zinc-900 pt-3 border-t border-zinc-100">
                <span>Total</span>
                <span>{invoice.totalDisplay}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Payment Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Amount Paid</span>
                <span className="text-green-700 font-medium">{invoice.amountPaidDisplay}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-zinc-900 pt-3 border-t border-zinc-200">
                <span>Balance Due</span>
                <span className={invoice.status === 'paid' ? 'text-zinc-400' : 'text-blue-700'}>
                  {invoice.balanceDueDisplay}
                </span>
              </div>
            </div>
            
            {invoice.status === 'paid' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg font-medium text-sm border border-green-200">
                <ShieldCheck className="w-4 h-4" /> Paid in Full
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Record Payment</h3>
            <p className="text-zinc-500 text-sm mb-6">
              You are recording a payment for <strong>{invoice.balanceDueDisplay}</strong>. 
              The backend remains authoritative for amounts.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                >
                  <option value="pos_terminal">Credit Card (POS)</option>
                  <option value="cash_counter">Cash at Counter</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card_online">Online Card Payment</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isRecording}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={isRecording}>
                {isRecording ? "Recording..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

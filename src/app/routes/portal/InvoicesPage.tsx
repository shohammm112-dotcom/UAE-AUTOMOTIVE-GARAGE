import React from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/lib/api/hooks";
import { FileText, AlertCircle } from "lucide-react";
import { DocumentDownloadButton } from "@/components/DocumentDownloadButton";

export const InvoicesPage: React.FC = () => {
  const { data, isLoading, error } = useApi<{ invoices: any[] }>("/invoices");
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Invoices</h1>
        <p className="text-zinc-500">View your billing history and receipts.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" />
          Failed to load invoices. {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : invoices.length > 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium text-zinc-500 uppercase tracking-wider text-xs">Invoice #</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 uppercase tracking-wider text-xs">Job ID</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 uppercase tracking-wider text-xs text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4 font-medium text-zinc-900">{inv.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-zinc-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-zinc-500">
                      <Link to={`/portal/jobs/${inv.jobId}`} className="hover:underline text-blue-600">
                        {inv.jobId.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900">
                      AED {(inv.grandTotalFils / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DocumentDownloadButton 
                        parentResourceType="invoice"
                        parentResourceId={inv.id}
                        documentKey="invoice-pdf"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No invoices yet</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            You don't have any billing history at this time.
          </p>
        </div>
      )}
    </div>
  );
};

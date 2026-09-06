import React from "react";
import { Link } from "react-router-dom";
import { FileText, AlertCircle } from "lucide-react";

export const EstimatesPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Estimates</h1>
        <p className="text-zinc-500">Review and approve service estimates.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
        <h3 className="font-semibold text-lg flex items-center mb-2">
          <AlertCircle className="w-5 h-5 mr-2" />
          API GAP: Endpoint Missing
        </h3>
        <p className="mb-4">
          There is currently no API endpoint to list all estimates for a customer 
          (<code className="bg-yellow-100 px-1 rounded text-sm">GET /api/v1/estimates</code> does not exist).
          The backend service <code>EstimateApplicationService</code> lacks a method to list estimates by customer ID.
        </p>
        <p className="text-sm">
          In a complete implementation, you would see a list of pending and approved estimates here. 
          For testing the approval flow, you would need the exact Estimate ID from the backend logs or notifications.
        </p>
      </div>

      <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
        <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-900 mb-2">No pending estimates</h3>
        <p className="text-zinc-500 max-w-md mx-auto mb-6">
          When an advisor creates an estimate for your vehicle, it will appear here for your review and approval.
        </p>
      </div>
    </div>
  );
};

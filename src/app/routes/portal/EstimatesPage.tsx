import React from "react";
import { Link } from "react-router-dom";
import { FileText, AlertCircle, ChevronRight } from "lucide-react";
import { useApi } from "@/lib/api/hooks";
import type { EstimateResponseDto } from "@/application/dto/AppDtos";
import type { EstimateStatus } from "@/domain/stateMachines/EstimateStateMachine";

/**
 * Status presentation. Typed as a Record over EstimateStatus so a new domain status becomes a
 * compile error here rather than silently rendering unstyled.
 */
const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft: "Draft",
  pending_customer_decision: "Awaiting your approval",
  partially_approved: "Partially approved",
  approved: "Approved",
  rejected: "Declined",
  locked: "Finalised",
};

const STATUS_CLASS: Record<EstimateStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  pending_customer_decision: "bg-amber-100 text-amber-800",
  partially_approved: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  locked: "bg-zinc-100 text-zinc-700",
};

export const EstimatesPage: React.FC = () => {
  const { data, isLoading, error } = useApi<{ estimates: EstimateResponseDto[] }>("/estimates");
  const estimates = data?.estimates ?? [];

  // Actionable estimates first — that is what the customer is here to do.
  const sorted = [...estimates].sort(
    (a, b) => Number(b.isActionable) - Number(a.isActionable)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Estimates</h1>
        <p className="text-zinc-500">Review and approve service estimates.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          Failed to load estimates. {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-4">
          {sorted.map((e) => (
            <Link
              key={e.id}
              to={`/portal/estimates/${e.id}`}
              className="block bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CLASS[e.status]}`}
                    >
                      {STATUS_LABEL[e.status]}
                    </span>
                    {e.isActionable && (
                      <span className="text-xs font-medium text-amber-700">Action required</span>
                    )}
                  </div>
                  <h3 className="font-medium text-zinc-900 truncate">
                    {e.items.length} item{e.items.length === 1 ? "" : "s"} · Job {e.jobId}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Created {new Date(e.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Total</p>
                    <p className="text-lg font-bold text-zinc-900">{e.totalDisplay}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
          <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-semibold text-zinc-900 mb-1">No estimates yet</h3>
          <p className="text-zinc-500">
            When an advisor prepares an estimate for your vehicle, it will appear here for review.
          </p>
        </div>
      )}
    </div>
  );
};

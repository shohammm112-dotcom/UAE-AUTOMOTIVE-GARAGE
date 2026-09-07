import React, { useState } from "react";
import { useApi } from "@/lib/api/hooks";
import { ApiClient } from "@/lib/api/client";
import { CalendarClock, AlertCircle } from "lucide-react";
import { AppointmentResponseDto } from "@/application/dto/AppDtos";
import { AppointmentStateMachine } from "@/domain/stateMachines/AppointmentStateMachine";
import type { AppointmentStatus } from "@/domain/stateMachines/AppointmentStateMachine";
import {
  formatPreferredDate,
  TIME_SLOT_LABELS,
} from "@/lib/appointmentDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Status filter
// ---------------------------------------------------------------------------
type FilterValue = "all" | AppointmentStatus;

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Requested", value: "requested" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No-show", value: "no_show" },
];

// ---------------------------------------------------------------------------
// Badge variant map keyed by AppointmentStatus — compile-error on missing key
// ---------------------------------------------------------------------------
const STATUS_BADGE_VARIANT: Record<
  AppointmentStatus,
  "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
> = {
  requested: "warning",
  confirmed: "default",
  completed: "success",
  cancelled: "destructive",
  no_show: "secondary",
};

// ---------------------------------------------------------------------------
// Display labels map — single source, no bare status literals in render
// ---------------------------------------------------------------------------
const STATUS_DISPLAY: Record<AppointmentStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

// ---------------------------------------------------------------------------
// Per-row action buttons — ALL visibility gated by canTransition(), never by
// bare status-string comparisons (drift guard enforcement).
// ---------------------------------------------------------------------------
interface ActionButtonsProps {
  apt: AppointmentResponseDto;
  onAction: (id: string, action: string) => void;
  busyId: string | null;
}

function ActionButtons({ apt, onAction, busyId }: ActionButtonsProps) {
  const isBusy = busyId === apt.id;

  const canConfirm  = AppointmentStateMachine.canTransition(apt.status, "confirmed");
  const canCancel   = AppointmentStateMachine.canTransition(apt.status, "cancelled");
  const canComplete = AppointmentStateMachine.canTransition(apt.status, "completed");
  const canNoShow   = AppointmentStateMachine.canTransition(apt.status, "no_show");

  if (!canConfirm && !canCancel && !canComplete && !canNoShow) {
    return null; // terminal status — nothing to render
  }

  return (
    <div className="flex flex-wrap gap-1.5 pt-3 mt-auto border-t border-zinc-100">
      {canConfirm && (
        <Button
          size="sm"
          variant="default"
          disabled={isBusy}
          onClick={() => onAction(apt.id, "confirm")}
        >
          Confirm
        </Button>
      )}
      {canComplete && (
        <Button
          size="sm"
          variant="secondary"
          disabled={isBusy}
          onClick={() => onAction(apt.id, "complete")}
        >
          Complete
        </Button>
      )}
      {canNoShow && (
        <Button
          size="sm"
          variant="outline"
          disabled={isBusy}
          onClick={() => onAction(apt.id, "no-show")}
        >
          No-show
        </Button>
      )}
      {canCancel && (
        <Button
          size="sm"
          variant="destructive"
          disabled={isBusy}
          onClick={() => onAction(apt.id, "cancel")}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export const StaffAppointmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [busyId, setBusyId]             = useState<string | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);

  const endpoint =
    statusFilter === "all"
      ? "/internal/appointments"
      : `/internal/appointments?status=${statusFilter}`;

  const { data, isLoading, error, refetch } = useApi<{
    appointments: AppointmentResponseDto[];
  }>(endpoint);

  // -------------------------------------------------------------------------
  // POST action then refetch
  // -------------------------------------------------------------------------
  const handleAction = async (id: string, action: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await ApiClient.post(`/internal/appointments/${id}/${action}`);
      await refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed. Please try again.";
      setActionError(msg);
    } finally {
      setBusyId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Loading skeleton — matches other staff pages exactly
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (error) {
    return <ErrorState message={error.message} />;
  }

  const appointments = data?.appointments ?? [];

  // -------------------------------------------------------------------------
  // Full render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-zinc-500">
            Review and action customer appointment requests.
          </p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={
              statusFilter === opt.value
                ? "px-3 py-1 rounded-full text-sm font-medium bg-zinc-900 text-white transition-colors"
                : "px-3 py-1 rounded-full text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Inline action error banner */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Empty state */}
      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No appointments found"
          description={
            statusFilter === "all"
              ? "There are no appointments in the system."
              : `No appointments with status "${STATUS_DISPLAY[statusFilter as AppointmentStatus] ?? statusFilter}".`
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((apt) => (
            <Card key={apt.id} className="h-full flex flex-col border-zinc-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate pr-2 font-semibold">
                    {apt.serviceType}
                  </span>
                  <Badge
                    variant={STATUS_BADGE_VARIANT[apt.status]}
                    className="shrink-0"
                  >
                    {STATUS_DISPLAY[apt.status]}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 text-sm flex-1">
                  {/* Date — via formatPreferredDate (UTC-safe, no own parsing) */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Date:</span>
                    <span className="font-medium">
                      {formatPreferredDate(apt.preferredDate)}
                    </span>
                  </div>

                  {/* Time slot — via TIME_SLOT_LABELS (no own label map) */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Time slot:</span>
                    <span>{TIME_SLOT_LABELS[apt.preferredTimeSlot]}</span>
                  </div>

                  {/* Drop-off type */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Drop-off:</span>
                    <span className="capitalize">
                      {apt.dropoffType.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Customer notes — only when present and non-empty */}
                  {apt.customerNotes && (
                    <div className="pt-1">
                      <p className="text-xs font-medium text-zinc-500 mb-0.5">
                        Notes:
                      </p>
                      <p className="text-xs text-zinc-700 line-clamp-3">
                        {apt.customerNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* ID footer badges */}
                <div className="pt-3 flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className="font-normal text-xs text-zinc-500 truncate"
                  >
                    Cust: {apt.customerId.substring(0, 8)}
                  </Badge>
                  {apt.vehicleId && (
                    <Badge
                      variant="outline"
                      className="font-normal text-xs text-zinc-500 truncate"
                    >
                      Veh: {apt.vehicleId.substring(0, 8)}
                    </Badge>
                  )}
                </div>

                {/* Action buttons gated entirely by canTransition — no hardcoded status literals */}
                <ActionButtons
                  apt={apt}
                  onAction={handleAction}
                  busyId={busyId}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

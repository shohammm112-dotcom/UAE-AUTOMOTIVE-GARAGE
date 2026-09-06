import React from "react";
import { AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this data. Please try again later.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-100 bg-red-50/50",
        className
      )}
      {...props}
    >
      <AlertOctagon className="h-10 w-10 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
      <p className="text-sm text-red-700 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="destructive" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

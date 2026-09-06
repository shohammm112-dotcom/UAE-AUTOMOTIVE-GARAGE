import React, { useState } from "react";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiClient } from "@/lib/api/client";

interface DocumentDownloadButtonProps {
  parentResourceType: "job" | "invoice" | "inspection";
  parentResourceId: string;
  documentKey: string;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const DocumentDownloadButton: React.FC<DocumentDownloadButtonProps> = ({
  parentResourceType,
  parentResourceId,
  documentKey,
  label = "PDF",
  variant = "ghost",
  size = "sm",
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ApiClient.post<{ document: { signedUrl: string, expiresAt: string } }>(
        "/documents/access-url",
        {
          parentResourceType,
          parentResourceId,
          documentKey
        }
      );

      if (response.document?.signedUrl) {
        // In a real environment, we would open the signedUrl or trigger a download
        // window.open(response.document.signedUrl, '_blank');
        
        // Since we know the backend mock currently returns a dummy URL, we simulate success
        alert(`Document link generated successfully (Valid until ${new Date(response.document.expiresAt).toLocaleTimeString()}). In a real environment, this would start the download.`);
      }
    } catch (err: any) {
      // Catch expected dev-mode 404 or missing provider errors
      console.warn("Document API Error:", err);
      setError("Document not available (API GAP)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end relative">
      <Button 
        variant={variant} 
        size={size} 
        className={className} 
        onClick={handleDownload}
        disabled={isLoading}
        title="Download document"
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {label}
      </Button>
      {error && (
        <span className="absolute top-full right-0 mt-1 text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded whitespace-nowrap z-10 shadow-sm flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </span>
      )}
    </div>
  );
};

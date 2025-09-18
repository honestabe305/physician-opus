import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { Download, ExternalLink, FileText, AlertCircle } from "lucide-react";
import type { SelectLicenseDocument } from "../../shared/schema";

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: SelectLicenseDocument | null;
}

export function DocumentPreview({
  open,
  onOpenChange,
  document,
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest(`/documents/${documentId}/download`);
      return response.downloadUrl;
    },
    onSuccess: (downloadUrl) => {
      setPreviewUrl(downloadUrl);
      setIsLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  // Load preview when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && document) {
      setIsLoading(true);
      setError(null);
      downloadMutation.mutate(document.id);
    } else {
      setPreviewUrl(null);
      setError(null);
    }
    onOpenChange(open);
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const downloadFile = () => {
    if (previewUrl) {
      const link = window.document.createElement("a");
      link.href = previewUrl;
      link.download = document?.fileName || "download";
      link.click();
    }
  };

  const canPreview = document?.fileName.match(/\.(pdf|png|jpg|jpeg)$/i);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.fileName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <DocumentTypeBadge type={document.documentType} />
            <span>Version {document.version}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[600px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="space-y-4 text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full p-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {!isLoading && !error && previewUrl && (
            <>
              {canPreview ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={document.fileName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Preview not available for this file type
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    DOCX files cannot be previewed in the browser
                  </p>
                  <Button onClick={downloadFile} data-testid="button-download-preview">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {canPreview && previewUrl && (
              <Button variant="outline" onClick={openInNewTab} data-testid="button-open-new-tab">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            )}
            {previewUrl && (
              <Button variant="outline" onClick={downloadFile} data-testid="button-download">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => handleOpenChange(false)} data-testid="button-close-preview">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
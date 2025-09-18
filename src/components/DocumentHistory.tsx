import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import {
  FileText,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import type { SelectLicenseDocument } from "../../shared/schema";

interface DocumentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: SelectLicenseDocument[];
  documentType: string;
  physicianId: string;
}

export function DocumentHistory({
  open,
  onOpenChange,
  documents,
  documentType,
  physicianId,
}: DocumentHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const setCurrentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/documents/${documentId}/current`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document version restored successfully",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/documents/physician", physicianId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/documents", physicianId, "history", documentType] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest(`/documents/${documentId}/download`);
      return response.downloadUrl;
    },
    onSuccess: (downloadUrl) => {
      window.open(downloadUrl, "_blank");
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const sortedDocuments = [...documents].sort((a, b) => b.version - a.version);
  const currentDocument = sortedDocuments.find((doc) => doc.isCurrent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            <DocumentTypeBadge type={documentType} />
            <span className="ml-2">
              {sortedDocuments.length} version{sortedDocuments.length !== 1 ? "s" : ""} available
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sortedDocuments.map((document, index) => (
              <div
                key={document.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedVersion === document.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 dark:border-gray-800"
                } ${document.isCurrent ? "bg-green-50 dark:bg-green-900/10" : ""}`}
                onClick={() => setSelectedVersion(document.id)}
                data-testid={`version-card-${document.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{document.fileName}</span>
                      <Badge variant="outline">v{document.version}</Badge>
                      {document.isCurrent && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Current
                        </Badge>
                      )}
                      {index === sortedDocuments.length - 1 && (
                        <Badge variant="secondary">Original</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(document.uploadDate), "MMM dd, yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{formatFileSize(document.fileSize)}</span>
                      </div>
                    </div>

                    {document.uploadedBy && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <User className="h-3 w-3" />
                        <span>Uploaded by user</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMutation.mutate(document.id);
                      }}
                      disabled={downloadMutation.isPending}
                      data-testid={`button-download-${document.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!document.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMutation.mutate(document.id);
                        }}
                        disabled={setCurrentMutation.isPending}
                        data-testid={`button-restore-${document.id}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {index < sortedDocuments.length - 1 && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Version {document.version} replaced version{" "}
                        {sortedDocuments[index + 1].version}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  History,
  Eye,
  MoreVertical,
  Archive,
  RefreshCw,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { SelectLicenseDocument } from "../../shared/schema";

interface DocumentListProps {
  documents: SelectLicenseDocument[];
  loading?: boolean;
  onViewHistory?: (physicianId: string, documentType: string) => void;
  onPreview?: (document: SelectLicenseDocument) => void;
  showActions?: boolean;
}

export function DocumentList({
  documents,
  loading = false,
  onViewHistory,
  onPreview,
  showActions = true,
}: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SelectLicenseDocument | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/documents/${documentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, documentId) => {
      toast({
        title: "Success",
        description: "Document archived successfully",
      });
      
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        queryClient.invalidateQueries({ 
          queryKey: ["/documents/physician", doc.physicianId] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/documents/${documentId}/current`, {
        method: "PUT",
      });
    },
    onSuccess: (_, documentId) => {
      toast({
        title: "Success",
        description: "Document version updated",
      });
      
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        queryClient.invalidateQueries({ 
          queryKey: ["/documents/physician", doc.physicianId] 
        });
      }
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

  const handleArchive = (document: SelectLicenseDocument) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const confirmArchive = () => {
    if (selectedDocument) {
      archiveMutation.mutate(selectedDocument.id);
    }
    setDeleteDialogOpen(false);
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Upload Date</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} data-testid={`document-row-${document.id}`}>
              <TableCell>
                <DocumentTypeBadge type={document.documentType} />
              </TableCell>
              <TableCell className="font-medium">{document.fileName}</TableCell>
              <TableCell>
                <Badge variant="outline">v{document.version}</Badge>
              </TableCell>
              <TableCell>
                {document.isCurrent ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Current
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Archived
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatFileSize(document.fileSize)}</TableCell>
              <TableCell>
                {format(new Date(document.uploadDate), "MMM dd, yyyy HH:mm")}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-actions-${document.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => downloadMutation.mutate(document.id)}
                        disabled={downloadMutation.isPending}
                        data-testid={`action-download-${document.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      
                      {onPreview && (
                        <DropdownMenuItem
                          onClick={() => onPreview(document)}
                          data-testid={`action-preview-${document.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                      )}
                      
                      {onViewHistory && (
                        <DropdownMenuItem
                          onClick={() => onViewHistory(document.physicianId, document.documentType)}
                          data-testid={`action-history-${document.id}`}
                        >
                          <History className="h-4 w-4 mr-2" />
                          View History
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {!document.isCurrent && (
                        <DropdownMenuItem
                          onClick={() => setCurrentMutation.mutate(document.id)}
                          disabled={setCurrentMutation.isPending}
                          data-testid={`action-set-current-${document.id}`}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Make Current
                        </DropdownMenuItem>
                      )}
                      
                      {document.isCurrent && (
                        <DropdownMenuItem
                          onClick={() => handleArchive(document)}
                          className="text-red-600 dark:text-red-400"
                          data-testid={`action-archive-${document.id}`}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this document? It will no longer be the current
              version but will remain in the version history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-archive">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-archive"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
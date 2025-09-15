
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileText, Download, Upload, Trash2, Calendar, ArrowLeft, Home, Users, AlertCircle } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { DocumentUploader } from "@/components/DocumentUploader";
import { formatDistanceToNow } from "date-fns";
import type { SelectPhysician } from "../../shared/schema";

export default function PhysicianDocumentsPage() {
  const { id } = useParams() as { id: string };
  const [, setLocation] = useLocation();
  const [showUploader, setShowUploader] = useState(false);

  // Get physician basic info
  const { data: physician, isLoading: isLoadingPhysician, error: physicianError } = useQuery<SelectPhysician>({
    queryKey: ['/physicians', id],
    queryFn: () => apiRequest(`/physicians/${id}`),
    enabled: !!id,
  });

  // Get documents for this physician
  const { data: documentsData, refetch: refetchDocuments, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/physicians', id, 'documents'],
    queryFn: () => apiRequest(`/physicians/${id}/documents`),
    enabled: !!id,
  });

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await apiRequest(`/documents/${documentId}`, { method: 'DELETE' });
      refetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (physicianError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load physician: {physicianError instanceof Error ? physicianError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingPhysician || !physician) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/physicians" data-testid="breadcrumb-physicians">
                <Users className="h-4 w-4 mr-1" />
                All Physicians
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/physicians/${id}`} data-testid="breadcrumb-profile">
                Dr. {physician.fullLegalName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Documents</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation(`/physicians/${id}`)}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
              Documents - Dr. {physician.fullLegalName}
            </h1>
            <p className="text-muted-foreground">Manage documents and files for this physician</p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>Upload new documents for Dr. {physician.fullLegalName}</CardDescription>
            </div>
            <Button
              onClick={() => setShowUploader(!showUploader)}
              variant={showUploader ? "secondary" : "default"}
              data-testid="button-toggle-uploader"
            >
              <Upload className="h-4 w-4 mr-2" />
              {showUploader ? 'Hide Uploader' : 'Upload Document'}
            </Button>
          </div>
        </CardHeader>
        {showUploader && (
          <CardContent>
            <DocumentUploader
              physicianId={id}
              onUploadComplete={() => {
                refetchDocuments();
                setShowUploader(false);
              }}
            />
          </CardContent>
        )}
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            View and manage uploaded documents
            {documentsData && ` (${documentsData.length} documents)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDocuments ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : !documentsData || documentsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload the first document using the upload button above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documentsData.map((document: any, index: number) => (
                <div key={document.id}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="font-medium">{document.fileName}</div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">
                            {formatDocumentType(document.documentType)}
                          </Badge>
                          <span>•</span>
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document.id, document.fileName)}
                        data-testid={`button-download-${document.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${document.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {index < documentsData.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

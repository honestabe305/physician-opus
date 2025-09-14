import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Upload, Trash2, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DocumentUploader } from "@/components/DocumentUploader";
import { formatDistanceToNow } from "date-fns";

export default function DocumentsPage() {
  const [selectedPhysicianId, setSelectedPhysicianId] = useState<string>('');
  const [showUploader, setShowUploader] = useState(false);

  // Get all physicians for selection
  const { data: physiciansData } = useQuery({
    queryKey: ['/api/physicians'],
    enabled: true,
  });

  // Get documents for selected physician
  const { data: documentsData, refetch: refetchDocuments } = useQuery({
    queryKey: ['/api/physicians', selectedPhysicianId, 'documents'],
    queryFn: () => apiRequest(`/api/physicians/${selectedPhysicianId}/documents`),
    enabled: !!selectedPhysicianId,
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
      await apiRequest(`/api/documents/${documentId}`, { method: 'DELETE' });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Documents</h1>
          <p className="text-muted-foreground">Manage physician documents and files</p>
        </div>
      </div>

      {/* Physician Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Physician</CardTitle>
          <CardDescription>Choose a physician to view and manage their documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPhysicianId} onValueChange={setSelectedPhysicianId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a physician" />
            </SelectTrigger>
            <SelectContent>
              {(physiciansData as any)?.physicians?.map((physician: any) => (
                <SelectItem key={physician.id} value={physician.id}>
                  {physician.fullLegalName} {physician.npi && `(NPI: ${physician.npi})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Upload Section */}
      {selectedPhysicianId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>Upload new documents for the selected physician</CardDescription>
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
                physicianId={selectedPhysicianId}
                onUploadComplete={() => {
                  refetchDocuments();
                  setShowUploader(false);
                }}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Documents List */}
      {selectedPhysicianId && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              View and manage uploaded documents
              {documentsData && ` (${documentsData.length} documents)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!documentsData || documentsData.length === 0 ? (
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
      )}
    </div>
  );
}
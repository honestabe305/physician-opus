import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Building,
  Calendar,
  CheckCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Practice document schema for form validation
const practiceDocumentFormSchema = z.object({
  documentType: z.enum(["irs_cp575_letter", "irs_147c_letter", "w9_form", "bank_letter", "void_check", "tax_id_confirmation", "operational_agreement", "business_license"], {
    required_error: "Document type is required"
  }),
  documentName: z.string().min(1, "Document name is required"),
  notes: z.string().optional(),
  expirationDate: z.string().optional()
});

type PracticeDocumentFormData = z.infer<typeof practiceDocumentFormSchema>;

interface PracticeDocument {
  id: string;
  practiceId: string;
  documentType: string;
  documentName: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  version: number;
  isActive: boolean;
  expirationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Practice {
  id: string;
  practiceName: string;
}

const documentTypeLabels = {
  irs_cp575_letter: "IRS CP575 Letter",
  irs_147c_letter: "IRS 147C Letter", 
  w9_form: "W-9 Form",
  bank_letter: "Bank Letter",
  void_check: "Void Check",
  tax_id_confirmation: "Tax ID Confirmation",
  operational_agreement: "Operational Agreement",
  business_license: "Business License"
};

const allowedFileTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

export default function ProviderBankingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<PracticeDocument | null>(null);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  // Fetch practices for dropdown
  const { data: practicesResponse } = useQuery({
    queryKey: ['/api/practices'],
  });
  
  const practices = practicesResponse?.data || [];

  // Fetch practice documents for selected practice
  const { data: documentsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/practices', selectedPracticeId, 'documents'],
    queryFn: async () => {
      if (!selectedPracticeId) return { data: [] };
      return await apiRequest(`/api/practices/${selectedPracticeId}/documents`);
    },
    enabled: !!selectedPracticeId
  });
  
  const documents = documentsResponse?.data || [];

  // Auto-select first practice if none selected
  useEffect(() => {
    if (practices.length > 0 && !selectedPracticeId) {
      setSelectedPracticeId(practices[0].id);
    }
  }, [practices, selectedPracticeId]);

  // Upload form
  const uploadForm = useForm<PracticeDocumentFormData>({
    resolver: zodResolver(practiceDocumentFormSchema),
    defaultValues: {
      documentType: "w9_form",
      documentName: "",
      notes: "",
      expirationDate: ""
    }
  });

  // Edit form
  const editForm = useForm<PracticeDocumentFormData>({
    resolver: zodResolver(practiceDocumentFormSchema),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: PracticeDocumentFormData & { file: File }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('documentType', data.documentType);
      formData.append('documentName', data.documentName);
      if (data.notes) formData.append('notes', data.notes);
      if (data.expirationDate) formData.append('expirationDate', data.expirationDate);
      
      return await apiRequest(`/api/practices/${selectedPracticeId}/documents`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', selectedPracticeId, 'documents'] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      uploadForm.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PracticeDocumentFormData> }) => {
      return await apiRequest(`/api/practices/${selectedPracticeId}/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', selectedPracticeId, 'documents'] });
      setIsEditDialogOpen(false);
      setSelectedDocument(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/practices/${selectedPracticeId}/documents/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/practices', selectedPracticeId, 'documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  });

  // Download document
  const downloadDocument = async (doc: PracticeDocument) => {
    try {
      const response = await fetch(`/api/practices/${selectedPracticeId}/documents/${doc.id}/download`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `${doc.fileName} is being downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  // Filter documents based on search
  const filteredDocuments = documents?.filter(doc =>
    doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    documentTypeLabels[doc.documentType as keyof typeof documentTypeLabels]?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (document: PracticeDocument) => {
    setSelectedDocument(document);
    editForm.reset({
      documentType: document.documentType as any,
      documentName: document.documentName,
      notes: document.notes || "",
      expirationDate: document.expirationDate || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (document: PracticeDocument) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (document: PracticeDocument) => {
    deleteMutation.mutate(document.id);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF, image, or Word document.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size
      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Auto-populate document name from filename
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      uploadForm.setValue('documentName', nameWithoutExtension);
    }
  };

  const handleUploadSubmit = (data: PracticeDocumentFormData) => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get selected practice name
  const selectedPractice = practices.find(p => p.id === selectedPracticeId);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load documents</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the practice documents.
          </p>
          <Button onClick={() => refetch()} data-testid="button-retry">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="practice-documents-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Practice Banking Documents
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Manage group-level banking documents (IRS letters, W-9 forms, bank letters)
          </p>
          {selectedPractice && (
            <div className="flex items-center gap-2 mt-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">
                Viewing documents for: {selectedPractice.practiceName}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={selectedPracticeId} onValueChange={setSelectedPracticeId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a practice" />
            </SelectTrigger>
            <SelectContent>
              {practices.map((practice) => (
                <SelectItem key={practice.id} value={practice.id}>
                  {practice.practiceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPracticeId && (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-upload-document">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card data-testid="card-search">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by document name, file name, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card data-testid="card-documents-list">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Practice Documents ({filteredDocuments.length})
          </CardTitle>
          <CardDescription>
            Group-level banking documents for payer enrollment and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search criteria" : selectedPracticeId ? "Start by uploading documents" : "Select a practice to view documents"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document, index) => (
                <div key={document.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`document-card-${index}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium" data-testid={`document-name-${index}`}>
                        {document.documentName}
                      </h3>
                      <Badge 
                        variant={document.isActive ? "default" : "secondary"}
                        data-testid={`document-status-${index}`}
                      >
                        {document.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        v{document.version}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Type:</span> {documentTypeLabels[document.documentType as keyof typeof documentTypeLabels]}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">File:</span> {document.fileName} ({formatFileSize(document.fileSize)})
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <Calendar className="w-3 h-3 inline mr-1" />
                          <span className="text-muted-foreground">Uploaded:</span> {formatDate(document.createdAt)}
                        </span>
                        {document.expirationDate && (
                          <span>
                            <span className="text-muted-foreground">Expires:</span> {formatDate(document.expirationDate)}
                          </span>
                        )}
                      </div>
                      {document.notes && (
                        <p className="text-sm text-muted-foreground">
                          {document.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`document-menu-${index}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadDocument(document)} data-testid={`button-download-${index}`}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleView(document)} data-testid={`button-view-${index}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => handleEdit(document)} data-testid={`button-edit-${index}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} data-testid={`button-delete-${index}`}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{document.documentName}" ({document.fileName}). 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(document)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      {selectedPracticeId && (
        <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) {
            setSelectedFile(null);
            uploadForm.reset();
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-upload-document">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Practice Document
              </DialogTitle>
              <DialogDescription>
                Upload group-level banking documents (IRS letters, W-9 forms, bank letters) for {selectedPractice?.practiceName}.
              </DialogDescription>
            </DialogHeader>

            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(handleUploadSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">File *</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      data-testid="input-file"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported: PDF, Word documents, images (max 10MB)
                    </p>
                    {selectedFile && (
                      <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                      </div>
                    )}
                  </div>
                  
                  <FormField
                    control={uploadForm.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-document-type">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(documentTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="documentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-document-name" placeholder="W-9 Form 2024" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-expiration-date" />
                        </FormControl>
                        <FormDescription>
                          Set if this document has an expiration date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={uploadForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="input-notes" placeholder="Additional notes about this document..." rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsUploadDialogOpen(false)}
                    data-testid="button-cancel-upload"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploadMutation.isPending || !selectedFile}
                    data-testid="button-submit-upload"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {selectedDocument && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedDocument(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-document">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Document Information
              </DialogTitle>
              <DialogDescription>
                Update metadata for {selectedDocument.documentName}. File content cannot be changed.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: selectedDocument.id, data }))} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="edit-select-document-type">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(documentTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="documentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="edit-input-document-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="edit-input-expiration-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="edit-input-notes" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    data-testid="button-submit-edit"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Document
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      {selectedDocument && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-view-document">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Document Name</label>
                  <p className="text-sm" data-testid="view-document-name">{selectedDocument.documentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm">{documentTypeLabels[selectedDocument.documentType as keyof typeof documentTypeLabels]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Name</label>
                  <p className="text-sm" data-testid="view-file-name">{selectedDocument.fileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Size</label>
                  <p className="text-sm">{formatFileSize(selectedDocument.fileSize)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm">v{selectedDocument.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={selectedDocument.isActive ? "default" : "secondary"}>
                    {selectedDocument.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Uploaded</label>
                  <p className="text-sm">{formatDate(selectedDocument.createdAt)}</p>
                </div>
                {selectedDocument.expirationDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expires</label>
                    <p className="text-sm">{formatDate(selectedDocument.expirationDate)}</p>
                  </div>
                )}
              </div>
              
              {selectedDocument.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1" data-testid="view-notes">{selectedDocument.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => downloadDocument(selectedDocument)} data-testid="button-download-from-view">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {isAdmin && (
                  <Button variant="outline" onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEdit(selectedDocument);
                  }} data-testid="button-edit-from-view">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
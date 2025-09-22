import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  AlertCircle,
  Building2,
  Calendar,
  User
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Practice document types from schema
const practiceDocumentTypes = [
  'irs_determination_letter',
  'w9_form',
  'bank_letter',
  'group_npi_letter',
  'malpractice_certificate',
  'hipaa_compliance',
  'organizational_chart',
  'provider_roster',
  'credentialing_packet',
  'other'
] as const;

// Document form schema
const practiceDocumentSchema = z.object({
  practiceId: z.string().min(1, "Practice is required"),
  documentType: z.enum(practiceDocumentTypes),
  documentName: z.string().min(1, "Document name is required"),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
  file: z.instanceof(File).optional().or(z.literal(undefined)),
});

type PracticeDocumentData = z.infer<typeof practiceDocumentSchema>;

interface PracticeDocumentsSectionProps {
  practices: any[];
  searchTerm: string;
  onRefresh: () => void;
}

export function PracticeDocumentsSection({ practices, searchTerm, onRefresh }: PracticeDocumentsSectionProps) {
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [selectedPracticeFilter, setSelectedPracticeFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const { toast } = useToast();

  // Fetch practice documents
  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ['/practice-documents'],
  });

  const documents = documentsData?.data || [];

  // Upload form
  const uploadForm = useForm<PracticeDocumentData>({
    resolver: zodResolver(practiceDocumentSchema),
    defaultValues: {
      practiceId: "",
      documentType: "other",
      documentName: "",
      expirationDate: "",
      notes: "",
      file: undefined,
    },
  });

  // Edit form
  const editForm = useForm<PracticeDocumentData>({
    resolver: zodResolver(practiceDocumentSchema),
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { formData: FormData; practiceId: string }) => {
      return apiRequest(`/practice-documents`, {
        method: 'POST',
        body: data.formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Practice document uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/practice-documents'] });
      setIsUploadDialogOpen(false);
      uploadForm.reset();
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/practice-documents/${documentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Practice document deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/practice-documents'] });
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((document: any) => {
      const matchesSearch = 
        document.documentName?.toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
        document.fileName?.toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
        document.notes?.toLowerCase().includes(documentSearchTerm.toLowerCase());
      
      const matchesPractice = selectedPracticeFilter === "all" || document.practiceId === selectedPracticeFilter;
      const matchesDocumentType = documentTypeFilter === "all" || document.documentType === documentTypeFilter;
      
      return matchesSearch && matchesPractice && matchesDocumentType;
    });
  }, [documents, documentSearchTerm, selectedPracticeFilter, documentTypeFilter]);

  const onUploadSubmit = (data: PracticeDocumentData) => {
    if (!data.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('practiceId', data.practiceId);
    formData.append('documentType', data.documentType);
    formData.append('documentName', data.documentName);
    if (data.expirationDate) formData.append('expirationDate', data.expirationDate);
    if (data.notes) formData.append('notes', data.notes);

    uploadDocumentMutation.mutate({ formData, practiceId: data.practiceId });
  };

  const handleEdit = (document: any) => {
    setEditingDocument(document);
    editForm.reset({
      practiceId: document.practiceId,
      documentType: document.documentType,
      documentName: document.documentName,
      expirationDate: document.expirationDate || "",
      notes: document.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (documentId: string) => {
    deleteDocumentMutation.mutate(documentId);
  };

  const handleDownload = async (document: any) => {
    try {
      const response = await apiRequest(`/practice-documents/${document.id}/download`, {
        method: 'GET',
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.fileName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getPracticeNameById = (practiceId: string) => {
    const practice = practices.find(p => p.id === practiceId);
    return practice?.name || 'Unknown Practice';
  };

  const getDocumentTypeLabel = (documentType: string) => {
    const labels: { [key: string]: string } = {
      'irs_determination_letter': 'IRS Determination Letter',
      'w9_form': 'W-9 Form',
      'bank_letter': 'Bank Letter',
      'group_npi_letter': 'Group NPI Letter',
      'malpractice_certificate': 'Malpractice Certificate',
      'hipaa_compliance': 'HIPAA Compliance',
      'organizational_chart': 'Organizational Chart',
      'provider_roster': 'Provider Roster',
      'credentialing_packet': 'Credentialing Packet',
      'other': 'Other'
    };
    return labels[documentType] || documentType;
  };

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysDiff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return { status: 'expired', variant: 'destructive' as const, text: 'Expired' };
    if (daysDiff <= 30) return { status: 'expiring', variant: 'secondary' as const, text: `Expires in ${daysDiff} days` };
    return { status: 'active', variant: 'default' as const, text: `Valid until ${format(expDate, 'MMM dd, yyyy')}` };
  };

  if (documentsError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Practice Documents</h2>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Failed to load practice documents: {documentsError instanceof Error ? documentsError.message : 'Unknown error'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Practice Documents</h2>
          <p className="text-sm text-muted-foreground">
            Manage important practice documents and certifications
          </p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-document">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Practice Document</DialogTitle>
              <DialogDescription>
                Upload a new document for one of your practices.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-4">
                <FormField
                  control={uploadForm.control}
                  name="practiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-document-practice">
                            <SelectValue placeholder="Select practice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {practices.map((practice) => (
                            <SelectItem key={practice.id} value={practice.id}>
                              {practice.name}
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
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-document-type">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {practiceDocumentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getDocumentTypeLabel(type)}
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
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Practice IRS Letter 2024" {...field} data-testid="input-document-name" />
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
                        <Input type="date" {...field} data-testid="input-document-expiration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={uploadForm.control}
                  name="file"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          data-testid="input-document-file"
                          onChange={(e) => onChange(e.target.files?.[0])}
                          {...fieldProps}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB)
                      </p>
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
                        <Textarea placeholder="Additional information about this document..." {...field} data-testid="input-document-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploadDocumentMutation.isPending}
                    data-testid="button-submit-document"
                  >
                    {uploadDocumentMutation.isPending ? "Uploading..." : "Upload Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search documents..."
            value={documentSearchTerm}
            onChange={(e) => setDocumentSearchTerm(e.target.value)}
            className="w-full"
            data-testid="input-search-documents"
          />
        </div>
        <Select value={selectedPracticeFilter} onValueChange={setSelectedPracticeFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-practice-docs">
            <SelectValue placeholder="Filter by practice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Practices</SelectItem>
            {practices.map((practice) => (
              <SelectItem key={practice.id} value={practice.id}>
                {practice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-document-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {practiceDocumentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getDocumentTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {documentsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document: any) => {
            const expirationStatus = getExpirationStatus(document.expirationDate);
            
            return (
              <Card key={document.id} className="hover:shadow-md transition-shadow" data-testid={`card-document-${document.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{document.documentName}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {getPracticeNameById(document.practiceId)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {getDocumentTypeLabel(document.documentType)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-document-menu-${document.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(document)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the document "{document.documentName}". 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(document.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{document.fileName}</span>
                  </div>
                  
                  {document.expirationDate && expirationStatus && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={expirationStatus.variant} className="text-xs">
                        {expirationStatus.text}
                      </Badge>
                    </div>
                  )}
                  
                  {document.uploadedBy && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Uploaded by {document.uploadedBy}</span>
                    </div>
                  )}
                  
                  {document.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {document.notes}
                    </p>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Uploaded {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredDocuments.length === 0 && !documentsLoading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
            {documentSearchTerm || selectedPracticeFilter !== "all" || documentTypeFilter !== "all" 
              ? 'No documents found' 
              : 'No practice documents yet'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {documentSearchTerm || selectedPracticeFilter !== "all" || documentTypeFilter !== "all"
              ? 'Try adjusting your search criteria or filters' 
              : 'Get started by uploading your first practice document'
            }
          </p>
        </div>
      )}
    </div>
  );
}
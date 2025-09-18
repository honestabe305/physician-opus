import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DocumentUploadDialog } from "@/components/DocumentUploadDialog";
import { DocumentList } from "@/components/DocumentList";
import { DocumentHistory } from "@/components/DocumentHistory";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DocumentTypeBadge } from "@/components/DocumentTypeBadge";
import { format } from "date-fns";
import {
  Home,
  Upload,
  FileText,
  Filter,
  Search,
  Download,
  History,
  Shield,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Activity,
} from "lucide-react";
import { Link, useParams } from "wouter";
import type { SelectLicenseDocument, SelectPhysician } from "../../shared/schema";

// Document audit trail entry interface
interface DocumentAuditEntry {
  id: string;
  documentId: string;
  action: 'upload' | 'update' | 'archive' | 'delete' | 'restore' | 'version_change';
  performedBy: string;
  performedByName?: string;
  timestamp: Date;
  details: Record<string, any>;
  previousVersion?: number;
  newVersion?: number;
}

export default function DocumentManagementPage() {
  const { physicianId } = useParams() as { physicianId?: string };
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SelectLicenseDocument | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [historyDocuments, setHistoryDocuments] = useState<SelectLicenseDocument[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Fetch physician information if physicianId is provided
  const { data: physician } = useQuery<SelectPhysician>({
    queryKey: ['/physicians', physicianId],
    enabled: !!physicianId,
  });

  // Fetch all physicians for selection if no physicianId
  const { data: physicians } = useQuery<SelectPhysician[]>({
    queryKey: ['/physicians'],
    enabled: !physicianId,
  });

  const [selectedPhysicianId, setSelectedPhysicianId] = useState<string>(physicianId || "");

  // Fetch documents for selected physician
  const { data: documents = [], isLoading: loadingDocuments } = useQuery<SelectLicenseDocument[]>({
    queryKey: ['/documents/physician', selectedPhysicianId],
    enabled: !!selectedPhysicianId,
  });

  // Fetch document statistics
  const { data: documentStats } = useQuery({
    queryKey: ['/documents', selectedPhysicianId, 'stats'],
    queryFn: () => apiRequest(`/documents/${selectedPhysicianId}/stats`),
    enabled: !!selectedPhysicianId,
  });

  // Fetch audit trail
  const { data: auditTrail = [] } = useQuery<DocumentAuditEntry[]>({
    queryKey: ['/documents/audit-trail', selectedPhysicianId],
    queryFn: () => apiRequest(`/documents/audit-trail?physicianId=${selectedPhysicianId}`),
    enabled: !!selectedPhysicianId,
  });

  useEffect(() => {
    if (physicianId) {
      setSelectedPhysicianId(physicianId);
    }
  }, [physicianId]);

  const handleViewHistory = async (physicianId: string, documentType: string) => {
    setSelectedDocumentType(documentType);
    const history = documents.filter(doc => doc.documentType === documentType);
    setHistoryDocuments(history);
    setHistoryDialogOpen(true);
  };

  const handlePreview = (document: SelectLicenseDocument) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter((doc) => {
    // Search filter
    if (searchQuery && !doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType !== "all" && doc.documentType !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus === "current" && !doc.isCurrent) {
      return false;
    }
    if (filterStatus === "archived" && doc.isCurrent) {
      return false;
    }

    // Date range filter
    if (dateRange !== "all") {
      const uploadDate = new Date(doc.uploadDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateRange === "today" && daysDiff > 0) return false;
      if (dateRange === "week" && daysDiff > 7) return false;
      if (dateRange === "month" && daysDiff > 30) return false;
      if (dateRange === "year" && daysDiff > 365) return false;
    }

    return true;
  });

  const documentTypeOptions = [
    { value: "license", label: "License" },
    { value: "dea_cert", label: "DEA Certificate" },
    { value: "csr_cert", label: "CSR Certificate" },
    { value: "supervision_agreement", label: "Supervision Agreement" },
    { value: "collaboration_agreement", label: "Collaboration Agreement" },
    { value: "cme_cert", label: "CME Certificate" },
    { value: "mate_cert", label: "MATE Certificate" },
  ];

  const getDocumentCountByType = (type: string) => {
    return documents.filter(doc => doc.documentType === type && doc.isCurrent).length;
  };

  if (!selectedPhysicianId && !physicians?.length) {
    return (
      <div className="space-y-6">
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
              <BreadcrumbPage>Document Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">No Physicians Found</p>
            <p className="text-sm text-gray-500">Please add physicians first</p>
            <Button className="mt-4" asChild>
              <Link href="/physicians/new" data-testid="button-add-physician">Add Physician</Link>
            </Button>
          </CardContent>
        </Card>
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
            <BreadcrumbPage>Document Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-gray-500 mt-1">Manage physician documents with version control</p>
        </div>
        <div className="flex gap-2">
          {!physicianId && physicians && (
            <Select value={selectedPhysicianId} onValueChange={setSelectedPhysicianId}>
              <SelectTrigger className="w-64" data-testid="select-physician">
                <SelectValue placeholder="Select a physician" />
              </SelectTrigger>
              <SelectContent>
                {physicians.map((p) => (
                  <SelectItem key={p.id} value={p.id} data-testid={`physician-option-${p.id}`}>
                    Dr. {p.fullLegalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => setUploadDialogOpen(true)}
            disabled={!selectedPhysicianId}
            data-testid="button-upload-document"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {selectedPhysicianId && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats?.totalDocuments || 0}</div>
                <p className="text-xs text-gray-500">All versions included</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter(d => d.isCurrent).length}
                </div>
                <p className="text-xs text-gray-500">Active versions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documentStats?.totalSize 
                    ? `${(documentStats.totalSize / (1024 * 1024)).toFixed(2)} MB`
                    : "0 MB"}
                </div>
                <p className="text-xs text-gray-500">Storage used</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documentStats?.lastUploadDate
                    ? format(new Date(documentStats.lastUploadDate), "MMM dd")
                    : "N/A"}
                </div>
                <p className="text-xs text-gray-500">
                  {documentStats?.lastUploadDate
                    ? format(new Date(documentStats.lastUploadDate), "yyyy HH:mm")
                    : "No uploads yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="documents" data-testid="tab-documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="overview" data-testid="tab-overview">
                <Shield className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="audit" data-testid="tab-audit">
                <Activity className="h-4 w-4 mr-2" />
                Audit Trail
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <Input
                        placeholder="Search by filename..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search"
                      />
                    </div>

                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger data-testid="select-filter-type">
                        <SelectValue placeholder="Document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {documentTypeOptions.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger data-testid="select-filter-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger data-testid="select-date-range">
                        <SelectValue placeholder="Date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Document List */}
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentList
                    documents={filteredDocuments}
                    loading={loadingDocuments}
                    onViewHistory={handleViewHistory}
                    onPreview={handlePreview}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentTypeOptions.map((type) => {
                  const count = getDocumentCountByType(type.value);
                  const hasDocument = count > 0;
                  
                  return (
                    <Card key={type.value}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <DocumentTypeBadge type={type.value} />
                          {hasDocument ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Missing
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status</span>
                          <span className="font-medium">
                            {hasDocument ? `${count} version(s)` : "Not uploaded"}
                          </span>
                        </div>
                        {hasDocument && (
                          <Button
                            variant="link"
                            className="p-0 h-auto mt-2"
                            onClick={() => handleViewHistory(selectedPhysicianId, type.value)}
                            data-testid={`button-view-history-${type.value}`}
                          >
                            <History className="h-3 w-3 mr-1" />
                            View History
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>
                    Document activity history and changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {auditTrail.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No audit entries yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {auditTrail.map((entry) => (
                          <div
                            key={entry.id}
                            className="border rounded-lg p-4 space-y-2"
                            data-testid={`audit-entry-${entry.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{entry.action}</Badge>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm")}
                                </span>
                              </div>
                              {entry.performedBy && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <User className="h-3 w-3" />
                                  <span>{entry.performedByName || "User"}</span>
                                </div>
                              )}
                            </div>
                            
                            {entry.details && (
                              <div className="text-sm text-gray-600">
                                {entry.details.fileName && (
                                  <div>File: {entry.details.fileName}</div>
                                )}
                                {entry.previousVersion && entry.newVersion && (
                                  <div>
                                    Version: {entry.previousVersion} → {entry.newVersion}
                                  </div>
                                )}
                                {entry.details.reason && (
                                  <div>Reason: {entry.details.reason}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        physicianId={selectedPhysicianId}
      />

      {/* History Dialog */}
      <DocumentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        documents={historyDocuments}
        documentType={selectedDocumentType}
        physicianId={selectedPhysicianId}
      />

      {/* Preview Dialog */}
      <DocumentPreview
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        document={selectedDocument}
      />
    </div>
  );
}
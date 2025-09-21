import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  Shield,
  FileText,
  Edit,
  Calendar,
  Clock,
  AlertCircle,
  ArrowLeft,
  Home,
  Users,
  CheckCircle,
  XCircle,
  ExternalLink,
  Upload,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { DocumentUploadDialog } from "@/components/DocumentUploadDialog";
import { DocumentList } from "@/components/DocumentList";
import { DocumentHistory } from "@/components/DocumentHistory";
import { DocumentPreview } from "@/components/DocumentPreview";
import type { SelectPhysician, SelectPhysicianEducation, SelectPhysicianWorkHistory, SelectPhysicianDocument, SelectPhysicianLicense, SelectPhysicianCertification, SelectLicenseDocument } from "../../shared/schema";

interface PhysicianDetails extends SelectPhysician {
  age?: number;
}

export default function PhysicianProfilePage() {
  const { id } = useParams() as { id: string };
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SelectLicenseDocument | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [historyDocuments, setHistoryDocuments] = useState<SelectLicenseDocument[]>([]);

  // Fetch physician basic information
  const { data: physician, isLoading: isLoadingPhysician, error: physicianError } = useQuery<PhysicianDetails>({
    queryKey: ['/physicians', id],
    queryFn: () => apiRequest(`/physicians/${id}`),
    enabled: !!id,
  });

  // Fetch education records
  const { data: educationData, isLoading: isLoadingEducation } = useQuery<SelectPhysicianEducation[]>({
    queryKey: ['/physicians', id, 'education'],
    queryFn: () => apiRequest(`/physicians/${id}/education`),
    enabled: !!id,
  });

  // Fetch work history
  const { data: workHistoryData, isLoading: isLoadingWorkHistory } = useQuery<SelectPhysicianWorkHistory[]>({
    queryKey: ['/physicians', id, 'work-history'],
    queryFn: () => apiRequest(`/physicians/${id}/work-history`),
    enabled: !!id,
  });

  // Fetch documents
  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery<SelectPhysicianDocument[]>({
    queryKey: ['/physicians', id, 'documents'],
    queryFn: () => apiRequest(`/physicians/${id}/documents`),
    enabled: !!id,
  });

  // Fetch licenses
  const { data: licensesData, isLoading: isLoadingLicenses } = useQuery<SelectPhysicianLicense[]>({
    queryKey: ['/physicians', id, 'licenses'],
    queryFn: () => apiRequest(`/physicians/${id}/licenses`),
    enabled: !!id,
  });

  // Fetch certifications
  const { data: certificationsData, isLoading: isLoadingCertifications } = useQuery<SelectPhysicianCertification[]>({
    queryKey: ['/physicians', id, 'certifications'],
    queryFn: () => apiRequest(`/physicians/${id}/certifications`),
    enabled: !!id,
  });

  // Fetch license documents
  const { data: licenseDocuments = [], isLoading: isLoadingLicenseDocuments } = useQuery<SelectLicenseDocument[]>({
    queryKey: ['/documents/physician', id],
    queryFn: () => apiRequest(`/documents/physician/${id}`),
    enabled: !!id,
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "review":
      case "under review":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhoneNumbers = (phoneNumbers?: string[] | null) => {
    if (!phoneNumbers || phoneNumbers.length === 0) return 'N/A';
    return phoneNumbers.join(', ');
  };

  // Document handler functions
  const handleViewHistory = async (physicianId: string, documentType: string) => {
    setSelectedDocumentType(documentType);
    const history = licenseDocuments.filter(doc => doc.documentType === documentType);
    setHistoryDocuments(history);
    setHistoryDialogOpen(true);
  };

  const handlePreview = (document: SelectLicenseDocument) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  if (physicianError) {
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
              <BreadcrumbLink asChild>
                <Link href="/physicians" data-testid="breadcrumb-physicians">
                  <Users className="h-4 w-4 mr-1" />
                  All Physicians
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Error</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load physician profile: {physicianError instanceof Error ? physicianError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingPhysician) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-80" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!physician) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Physician not found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const age = calculateAge(physician.dateOfBirth);
  const education = educationData || [];
  const workHistory = workHistoryData || [];
  const documents = documentsData || [];
  const licenses = licensesData || [];
  const certifications = certificationsData || [];

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
            <BreadcrumbPage data-testid="breadcrumb-current">
              Dr. {physician.fullLegalName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/physicians')}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground" data-testid="physician-name">
                Dr. {physician.fullLegalName}
              </h1>
              <Badge 
                className={getStatusColor(physician.status || 'unknown')}
                data-testid={`status-${physician.status || 'unknown'}`}
              >
                {physician.status || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span data-testid="physician-npi">NPI: {physician.npi || 'N/A'}</span>
              {age && <span data-testid="physician-age">Age: {age} years</span>}
              {physician.gender && (
                <span data-testid="physician-gender">
                  Gender: {physician.gender.charAt(0).toUpperCase() + physician.gender.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-primary to-accent"
          onClick={() => {
            if (id && typeof id === 'string' && id.trim() !== '') {
              setLocation(`/physicians/${id}/edit`);
            } else {
              console.error('Invalid physician ID for edit:', id);
            }
          }}
          data-testid="button-edit-physician"
        >
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Details */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="education" data-testid="tab-education">
                <GraduationCap className="h-4 w-4 mr-2" />
                Education
              </TabsTrigger>
              <TabsTrigger value="work-history" data-testid="tab-work-history">
                <Briefcase className="h-4 w-4 mr-2" />
                Work History
              </TabsTrigger>
              <TabsTrigger value="credentials" data-testid="tab-credentials">
                <Shield className="h-4 w-4 mr-2" />
                Credentials
              </TabsTrigger>
              <TabsTrigger value="documents" data-testid="tab-documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Contact Information */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <p className="text-foreground" data-testid="contact-email">
                        {physician.emailAddress || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                      <p className="text-foreground" data-testid="contact-phone">
                        {formatPhoneNumbers(physician.phoneNumbers)}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Mailing Address
                      </div>
                      <p className="text-foreground text-sm" data-testid="contact-mailing-address">
                        {physician.mailingAddress || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </div>
                      <p className="text-foreground" data-testid="contact-dob">
                        {formatDate(physician.dateOfBirth)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Practice Information */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Practice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Practice Name</div>
                      <p className="text-foreground" data-testid="practice-name">
                        {physician.practiceName || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Office Phone</div>
                      <p className="text-foreground" data-testid="practice-phone">
                        {physician.officePhone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Primary Practice Address</div>
                    <p className="text-foreground text-sm" data-testid="practice-address">
                      {physician.primaryPracticeAddress || 'Not provided'}
                    </p>
                  </div>

                  {physician.groupNpi && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Group NPI</div>
                      <p className="text-foreground" data-testid="practice-group-npi">
                        {physician.groupNpi}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Education History
                  </CardTitle>
                  <CardDescription>
                    Academic background and training
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEducation ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-24" />
                      ))}
                    </div>
                  ) : education.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No education records found.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div 
                          key={edu.id} 
                          className="border rounded-lg p-4 space-y-2"
                          data-testid={`education-item-${index}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground" data-testid={`education-institution-${index}`}>
                                {edu.institutionName}
                              </h4>
                              <p className="text-sm text-muted-foreground" data-testid={`education-type-${index}`}>
                                {edu.educationType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                {edu.specialty && ` - ${edu.specialty}`}
                              </p>
                              {edu.location && (
                                <p className="text-sm text-muted-foreground" data-testid={`education-location-${index}`}>
                                  {edu.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {edu.startDate && edu.completionDate ? (
                                <p data-testid={`education-dates-${index}`}>
                                  {formatDate(edu.startDate)} - {formatDate(edu.completionDate)}
                                </p>
                              ) : edu.graduationYear ? (
                                <p data-testid={`education-year-${index}`}>
                                  Graduated {edu.graduationYear}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Work History Tab */}
            <TabsContent value="work-history" className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Work History
                  </CardTitle>
                  <CardDescription>
                    Employment history and experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingWorkHistory ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-32" />
                      ))}
                    </div>
                  ) : workHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No work history records found.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {workHistory.map((work, index) => (
                        <div 
                          key={work.id} 
                          className="border rounded-lg p-4 space-y-3"
                          data-testid={`work-item-${index}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground" data-testid={`work-employer-${index}`}>
                                {work.employerName}
                              </h4>
                              {work.position && (
                                <p className="text-sm font-medium text-muted-foreground" data-testid={`work-position-${index}`}>
                                  {work.position}
                                </p>
                              )}
                              {work.address && (
                                <p className="text-sm text-muted-foreground" data-testid={`work-address-${index}`}>
                                  {work.address}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p data-testid={`work-dates-${index}`}>
                                {formatDate(work.startDate)} - {work.endDate ? formatDate(work.endDate) : 'Present'}
                              </p>
                            </div>
                          </div>
                          {work.supervisorName && (
                            <div className="text-sm">
                              <span className="font-medium">Supervisor: </span>
                              <span data-testid={`work-supervisor-${index}`}>{work.supervisorName}</span>
                            </div>
                          )}
                          {work.reasonForLeaving && (
                            <div className="text-sm">
                              <span className="font-medium">Reason for leaving: </span>
                              <span data-testid={`work-reason-${index}`}>{work.reasonForLeaving}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credentials Tab */}
            <TabsContent value="credentials" className="space-y-6">
              {/* Licenses */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Medical Licenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingLicenses ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <Skeleton key={index} className="h-16" />
                      ))}
                    </div>
                  ) : licenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No license records found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {licenses.map((license, index) => (
                        <div 
                          key={license.id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`license-item-${index}`}
                        >
                          <div>
                            <div className="font-medium" data-testid={`license-state-${index}`}>
                              {license.state} Medical License
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`license-number-${index}`}>
                              License #{license.licenseNumber}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm" data-testid={`license-expiry-${index}`}>
                              Expires: {formatDate(license.expirationDate)}
                            </div>
                            <Badge 
                              variant={new Date(license.expirationDate) > new Date() ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {new Date(license.expirationDate) > new Date() ? "Valid" : "Expired"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Board Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingCertifications ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <Skeleton key={index} className="h-20" />
                      ))}
                    </div>
                  ) : certifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No certification records found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {certifications.map((cert, index) => (
                        <div 
                          key={cert.id} 
                          className="p-3 border rounded-lg space-y-2"
                          data-testid={`certification-item-${index}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium" data-testid={`cert-specialty-${index}`}>
                                {cert.specialty}
                                {cert.subspecialty && ` - ${cert.subspecialty}`}
                              </div>
                              <div className="text-sm text-muted-foreground" data-testid={`cert-board-${index}`}>
                                {cert.boardName}
                              </div>
                            </div>
                            {cert.expirationDate && (
                              <div className="text-right">
                                <div className="text-sm" data-testid={`cert-expiry-${index}`}>
                                  Expires: {formatDate(cert.expirationDate)}
                                </div>
                                <Badge 
                                  variant={new Date(cert.expirationDate) > new Date() ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {new Date(cert.expirationDate) > new Date() ? "Valid" : "Expired"}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {cert.certificationDate && (
                            <div className="text-sm text-muted-foreground">
                              Certified: {formatDate(cert.certificationDate)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        License Documents
                      </CardTitle>
                      <CardDescription>
                        Manage and view all license-related documents with version control
                      </CardDescription>
                    </div>
                    <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-document">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DocumentList
                    documents={licenseDocuments}
                    loading={isLoadingLicenseDocuments}
                    onViewHistory={handleViewHistory}
                    onPreview={handlePreview}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Documents</span>
                </div>
                <Badge variant="outline" data-testid="documents-count">
                  {isLoadingDocuments ? '...' : documents.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Education</span>
                </div>
                <Badge variant="outline" data-testid="education-count">
                  {isLoadingEducation ? '...' : education.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Work History</span>
                </div>
                <Badge variant="outline" data-testid="work-history-count">
                  {isLoadingWorkHistory ? '...' : workHistory.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Licenses</span>
                </div>
                <Badge variant="outline" data-testid="licenses-count">
                  {isLoadingLicenses ? '...' : licenses.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Profile created</span>
                  <span data-testid="profile-created-date">
                    {formatDate(physician.createdAt?.toString())}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last updated</span>
                  <span data-testid="profile-updated-date">
                    {formatDate(physician.updatedAt?.toString())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                data-testid="button-view-documents"
              >
                <FileText className="h-4 w-4" />
                View Documents
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                data-testid="button-download-profile"
              >
                <ExternalLink className="h-4 w-4" />
                Download Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Management Dialogs */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        physicianId={id}
      />

      <DocumentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        documents={historyDocuments}
        documentType={selectedDocumentType}
        physicianId={id}
      />

      <DocumentPreview
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        document={selectedDocument}
      />
    </div>
  );
}
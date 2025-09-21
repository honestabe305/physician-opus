import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bell,
  FileText,
  RefreshCw,
  Clock,
  MapPin,
  Award,
  Building,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Info,
  ShieldAlert,
  ShieldCheck,
  CalendarX,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician, SelectPhysicianLicense, SelectPhysicianCertification } from "../../shared/schema";
import { format, differenceInDays, addDays, isAfter, isBefore } from "date-fns";

interface LicenseWithPhysician extends SelectPhysicianLicense {
  physician?: SelectPhysician;
}

interface CertificationWithPhysician extends SelectPhysicianCertification {
  physician?: SelectPhysician;
}

// Form schema for adding license
const licenseFormSchema = z.object({
  physicianId: z.string().min(1, "Physician is required"),
  state: z.string().min(1, "State is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  licenseType: z.string().optional(),
});

type LicenseFormData = z.infer<typeof licenseFormSchema>;

// Form schema for adding certification
const certificationFormSchema = z.object({
  physicianId: z.string().min(1, "Physician is required"),
  specialty: z.string().min(1, "Specialty is required"),
  subspecialty: z.string().optional(),
  boardName: z.string().min(1, "Board name is required"),
  certificationDate: z.string().optional(),
  expirationDate: z.string().optional(),
});

type CertificationFormData = z.infer<typeof certificationFormSchema>;

export default function LicensurePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [certStatusFilter, setCertStatusFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("licenses");
  const [showTimeline, setShowTimeline] = useState(false);
  const [isAddLicenseDialogOpen, setIsAddLicenseDialogOpen] = useState(false);
  const [isAddCertDialogOpen, setIsAddCertDialogOpen] = useState(false);
  const [selectedPhysicianId, setSelectedPhysicianId] = useState<string>("");
  const { toast } = useToast();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch physicians data
  const { data: physiciansData, isLoading: loadingPhysicians } = useQuery({
    queryKey: ['/physicians'],
    queryFn: () => apiRequest('/physicians'),
  });

  // Fetch all licenses for all physicians
  const { data: licensesData, isLoading: loadingLicenses, refetch: refetchLicenses } = useQuery({
    queryKey: ['/licenses/all'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/licenses');
        return response;
      } catch (error) {
        // If no direct licenses endpoint, fetch for each physician
        if (physiciansData?.physicians) {
          const allLicenses: LicenseWithPhysician[] = [];
          for (const physician of physiciansData.physicians) {
            try {
              const licenses = await apiRequest(`/physicians/${physician.id}/licenses`);
              if (Array.isArray(licenses)) {
                licenses.forEach((license: SelectPhysicianLicense) => {
                  allLicenses.push({ ...license, physician });
                });
              }
            } catch (err) {
              // Continue if individual physician has no licenses
            }
          }
          return { licenses: allLicenses };
        }
        return { licenses: [] };
      }
    },
    enabled: !!physiciansData,
  });

  // Fetch all certifications for all physicians
  const { data: certificationsData, isLoading: loadingCertifications, refetch: refetchCertifications } = useQuery({
    queryKey: ['/certifications/all'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/certifications');
        return response;
      } catch (error) {
        // If no direct certifications endpoint, fetch for each physician
        if (physiciansData?.physicians) {
          const allCertifications: CertificationWithPhysician[] = [];
          for (const physician of physiciansData.physicians) {
            try {
              const certifications = await apiRequest(`/physicians/${physician.id}/certifications`);
              if (Array.isArray(certifications)) {
                certifications.forEach((cert: SelectPhysicianCertification) => {
                  allCertifications.push({ ...cert, physician });
                });
              }
            } catch (err) {
              // Continue if individual physician has no certifications
            }
          }
          return { certifications: allCertifications };
        }
        return { certifications: [] };
      }
    },
    enabled: !!physiciansData,
  });

  // Fetch expiring licenses
  const { data: expiringLicensesData } = useQuery({
    queryKey: ['/licenses/expiring/30'],
    queryFn: () => apiRequest('/licenses/expiring/30'),
  });

  // Fetch expiring certifications
  const { data: expiringCertsData } = useQuery({
    queryKey: ['/certifications/expiring/30'],
    queryFn: () => apiRequest('/certifications/expiring/30'),
  });

  const physicians = physiciansData?.physicians || [];
  const licenses = licensesData?.licenses || [];
  const certifications = certificationsData?.certifications || [];

  // Form setup for adding license
  const licenseForm = useForm<LicenseFormData>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      physicianId: selectedPhysicianId,
      state: "",
      licenseNumber: "",
      expirationDate: "",
      licenseType: "medical",
    },
  });

  // Form setup for adding certification
  const certForm = useForm<CertificationFormData>({
    resolver: zodResolver(certificationFormSchema),
    defaultValues: {
      physicianId: selectedPhysicianId,
      specialty: "",
      subspecialty: "",
      boardName: "",
      certificationDate: "",
      expirationDate: "",
    },
  });

  // Mutation for adding license
  const addLicenseMutation = useMutation({
    mutationFn: async (data: LicenseFormData) => {
      const response = await apiRequest(`/physicians/${data.physicianId}/licenses`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "License added successfully",
      });
      setIsAddLicenseDialogOpen(false);
      licenseForm.reset();
      refetchLicenses();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add license",
      });
    },
  });

  // Mutation for adding certification
  const addCertificationMutation = useMutation({
    mutationFn: async (data: CertificationFormData) => {
      const response = await apiRequest(`/physicians/${data.physicianId}/certifications`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certification added successfully",
      });
      setIsAddCertDialogOpen(false);
      certForm.reset();
      refetchCertifications();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add certification",
      });
    },
  });

  const handleLicenseSubmit = (data: LicenseFormData) => {
    addLicenseMutation.mutate(data);
  };

  const handleCertificationSubmit = (data: CertificationFormData) => {
    addCertificationMutation.mutate(data);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    const in30Days = addDays(today, 30);
    const in90Days = addDays(today, 90);

    let activeLicenses = 0;
    let expiring30Days = 0;
    let expiring90Days = 0;
    let expiredLicenses = 0;
    let activeCertifications = 0;
    let expiredCertifications = 0;
    let totalDEA = 0;
    let expiredDEA = 0;

    // Process licenses
    licenses.forEach((license: LicenseWithPhysician) => {
      if (license.expirationDate) {
        const expDate = new Date(license.expirationDate);
        if (isBefore(expDate, today)) {
          expiredLicenses++;
        } else {
          activeLicenses++;
          if (isBefore(expDate, in30Days)) {
            expiring30Days++;
          } else if (isBefore(expDate, in90Days)) {
            expiring90Days++;
          }
        }
      } else {
        activeLicenses++; // Count as active if no expiration date
      }
    });

    // Process certifications
    certifications.forEach((cert: CertificationWithPhysician) => {
      if (cert.expirationDate) {
        const expDate = new Date(cert.expirationDate);
        if (isBefore(expDate, today)) {
          expiredCertifications++;
        } else {
          activeCertifications++;
        }
      } else {
        activeCertifications++; // Count as active if no expiration date
      }
    });

    // Process DEA numbers from physicians
    physicians.forEach((physician: SelectPhysician) => {
      if (physician.deaNumber) {
        totalDEA++;
        // Note: DEA expiration dates would need to be tracked separately
        // For now, we're just counting the presence of DEA numbers
      }
    });

    return {
      activeLicenses,
      expiring30Days,
      expiring90Days,
      expiredLicenses,
      activeCertifications,
      expiredCertifications,
      totalDEA,
      expiredDEA,
      totalLicenses: licenses.length,
      totalCertifications: certifications.length,
    };
  }, [licenses, certifications, physicians]);

  // Get unique states from licenses
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    licenses.forEach((license: LicenseWithPhysician) => {
      if (license.state) {
        states.add(license.state);
      }
    });
    return Array.from(states).sort();
  }, [licenses]);

  // Get unique license types
  const uniqueLicenseTypes = useMemo(() => {
    const types = new Set<string>();
    licenses.forEach((license: LicenseWithPhysician) => {
      if (license.licenseType) {
        types.add(license.licenseType);
      }
    });
    return Array.from(types).sort();
  }, [licenses]);

  // Filter licenses based on search and filters
  const filteredLicenses = useMemo(() => {
    return licenses.filter((license: LicenseWithPhysician) => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const physicianName = license.physician?.fullLegalName?.toLowerCase() || '';
        const licenseNumber = license.licenseNumber?.toLowerCase() || '';
        if (!physicianName.includes(searchLower) && !licenseNumber.includes(searchLower)) {
          return false;
        }
      }

      // State filter
      if (stateFilter !== "all" && license.state !== stateFilter) {
        return false;
      }

      // License type filter
      if (licenseTypeFilter !== "all" && license.licenseType !== licenseTypeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const today = new Date();
        const expDate = license.expirationDate ? new Date(license.expirationDate) : null;
        
        if (statusFilter === "active") {
          if (!expDate || isBefore(expDate, today)) return false;
        } else if (statusFilter === "expiring") {
          const in90Days = addDays(today, 90);
          if (!expDate || !isBefore(expDate, in90Days) || isBefore(expDate, today)) return false;
        } else if (statusFilter === "expired") {
          if (!expDate || !isBefore(expDate, today)) return false;
        }
      }

      return true;
    });
  }, [licenses, debouncedSearch, stateFilter, licenseTypeFilter, statusFilter]);

  // Filter certifications
  const filteredCertifications = useMemo(() => {
    return certifications.filter((cert: CertificationWithPhysician) => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const physicianName = cert.physician?.fullLegalName?.toLowerCase() || '';
        const specialty = cert.specialty?.toLowerCase() || '';
        const boardName = cert.boardName?.toLowerCase() || '';
        if (!physicianName.includes(searchLower) && !specialty.includes(searchLower) && !boardName.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (certStatusFilter !== "all") {
        const today = new Date();
        const expDate = cert.expirationDate ? new Date(cert.expirationDate) : null;
        
        if (certStatusFilter === "active") {
          if (!expDate || isBefore(expDate, today)) return false;
        } else if (certStatusFilter === "expired") {
          if (!expDate || !isBefore(expDate, today)) return false;
        }
      }

      return true;
    });
  }, [certifications, debouncedSearch, certStatusFilter]);

  // Get license status and badge variant
  const getLicenseStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { status: 'Active', variant: 'success' as const, icon: CheckCircle };
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = differenceInDays(expDate, today);
    
    if (daysUntilExpiration < 0) {
      return { status: 'Expired', variant: 'destructive' as const, icon: XCircle };
    } else if (daysUntilExpiration <= 30) {
      return { status: 'Expiring Soon', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (daysUntilExpiration <= 90) {
      return { status: 'Expiring', variant: 'warning' as const, icon: Clock };
    }
    return { status: 'Active', variant: 'success' as const, icon: CheckCircle };
  };

  // Format date for display
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvHeaders = [
      'Physician Name',
      'License Type',
      'State',
      'License Number',
      'Issue Date',
      'Expiration Date',
      'Status',
      'Days Until Expiration'
    ];

    const csvData = filteredLicenses.map((license: LicenseWithPhysician) => {
      const status = getLicenseStatus(license.expirationDate);
      const daysUntil = license.expirationDate 
        ? differenceInDays(new Date(license.expirationDate), new Date())
        : 'N/A';
      
      return [
        license.physician?.fullLegalName || 'Unknown',
        license.licenseType || 'Medical',
        license.state || '',
        license.licenseNumber || '',
        'N/A', // Issue date not in schema
        license.expirationDate ? formatDate(license.expirationDate) : 'N/A',
        status.status,
        daysUntil
      ];
    });

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `license_renewals_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredLicenses.length} license records to CSV`,
    });
  };

  // Get upcoming expirations for timeline
  const upcomingExpirations = useMemo(() => {
    const allExpirations: Array<{
      type: 'license' | 'certification';
      item: LicenseWithPhysician | CertificationWithPhysician;
      expirationDate: Date;
      daysUntil: number;
    }> = [];

    // Add licenses
    licenses.forEach((license: LicenseWithPhysician) => {
      if (license.expirationDate) {
        const expDate = new Date(license.expirationDate);
        const daysUntil = differenceInDays(expDate, new Date());
        if (daysUntil >= -30 && daysUntil <= 180) {
          allExpirations.push({
            type: 'license',
            item: license,
            expirationDate: expDate,
            daysUntil,
          });
        }
      }
    });

    // Add certifications
    certifications.forEach((cert: CertificationWithPhysician) => {
      if (cert.expirationDate) {
        const expDate = new Date(cert.expirationDate);
        const daysUntil = differenceInDays(expDate, new Date());
        if (daysUntil >= -30 && daysUntil <= 180) {
          allExpirations.push({
            type: 'certification',
            item: cert,
            expirationDate: expDate,
            daysUntil,
          });
        }
      }
    });

    // Sort by expiration date
    return allExpirations.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [licenses, certifications]);

  const isLoading = loadingPhysicians || loadingLicenses || loadingCertifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Licensure & Credentials</h1>
            <p className="text-muted-foreground">Manage physician licenses, certifications, and credential tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddLicenseDialogOpen(true)}
            className="gap-2"
            data-testid="button-add-license"
          >
            <Plus className="h-4 w-4" />
            Add License
          </Button>
          <Button
            onClick={() => setIsAddCertDialogOpen(true)}
            className="gap-2"
            variant="outline"
            data-testid="button-add-certification"
          >
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-licenses">
              {isLoading ? <Skeleton className="h-8 w-20" /> : stats.activeLicenses}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {stats.totalLicenses} total licenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring in 30 Days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-expiring-30">
              {isLoading ? <Skeleton className="h-8 w-20" /> : stats.expiring30Days}
            </div>
            <p className="text-xs text-muted-foreground">
              Urgent renewal required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring in 90 Days</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-expiring-90">
              {isLoading ? <Skeleton className="h-8 w-20" /> : stats.expiring90Days}
            </div>
            <p className="text-xs text-muted-foreground">
              Schedule renewal soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Licenses</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600" data-testid="stat-expired">
              {isLoading ? <Skeleton className="h-8 w-20" /> : stats.expiredLicenses}
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate action needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by physician name or license number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchLicenses();
                  refetchCertifications();
                  toast({
                    title: "Data Refreshed",
                    description: "License and certification data has been updated",
                  });
                }}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimeline(!showTimeline)}
                data-testid="button-timeline"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showTimeline ? 'Hide' : 'Show'} Timeline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline View */}
      {showTimeline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Expirations Timeline
            </CardTitle>
            <CardDescription>
              Licenses and certifications expiring in the next 180 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {upcomingExpirations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming expirations in the next 180 days
                </p>
              ) : (
                upcomingExpirations.map((item, index) => {
                  const isLicense = item.type === 'license';
                  const license = isLicense ? item.item as LicenseWithPhysician : null;
                  const cert = !isLicense ? item.item as CertificationWithPhysician : null;
                  const status = getLicenseStatus(item.item.expirationDate);
                  
                  return (
                    <div
                      key={`${item.type}-${item.item.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      data-testid={`timeline-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <status.icon className={`h-4 w-4 ${
                          status.variant === 'destructive' ? 'text-red-500' :
                          status.variant === 'warning' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {isLicense 
                              ? `${license?.physician?.fullLegalName || 'Unknown'} - ${license?.state} License`
                              : `${cert?.physician?.fullLegalName || 'Unknown'} - ${cert?.specialty}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isLicense ? 'Medical License' : `${cert?.boardName} Certification`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={status.variant}>
                          {item.daysUntil < 0 
                            ? `Expired ${Math.abs(item.daysUntil)} days ago`
                            : item.daysUntil === 0 
                            ? 'Expires Today'
                            : `${item.daysUntil} days`}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.item.expirationDate)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="licenses" data-testid="tab-licenses">
            <Shield className="h-4 w-4 mr-2" />
            Medical Licenses ({stats.totalLicenses})
          </TabsTrigger>
          <TabsTrigger value="certifications" data-testid="tab-certifications">
            <Award className="h-4 w-4 mr-2" />
            Board Certifications ({stats.totalCertifications})
          </TabsTrigger>
          <TabsTrigger value="dea" data-testid="tab-dea">
            <FileText className="h-4 w-4 mr-2" />
            DEA & Registrations ({stats.totalDEA})
          </TabsTrigger>
        </TabsList>

        {/* Licenses Tab */}
        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Medical Licenses</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="w-32" data-testid="filter-state">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {uniqueStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={licenseTypeFilter} onValueChange={setLicenseTypeFilter}>
                    <SelectTrigger className="w-32" data-testid="filter-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueLicenseTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="filter-status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredLicenses.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {debouncedSearch || stateFilter !== "all" || statusFilter !== "all"
                      ? "No licenses found matching your filters"
                      : "No license records found"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Physician</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>License #</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLicenses.map((license: LicenseWithPhysician) => {
                        const status = getLicenseStatus(license.expirationDate);
                        const isExpanded = expandedRows.has(license.id);
                        
                        return (
                          <>
                            <TableRow key={license.id} data-testid={`license-row-${license.id}`}>
                              <TableCell className="font-medium">
                                <Link href={`/physicians/${license.physicianId}`}>
                                  <a className="text-primary hover:underline" data-testid={`link-physician-${license.id}`}>
                                    {license.physician?.fullLegalName || 'Unknown Physician'}
                                  </a>
                                </Link>
                              </TableCell>
                              <TableCell>{license.licenseType || 'Medical'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {license.state}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {license.licenseNumber}
                              </TableCell>
                              <TableCell>
                                {license.expirationDate ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="cursor-help">
                                          {formatDate(license.expirationDate)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{differenceInDays(new Date(license.expirationDate), new Date())} days from today</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  'No Expiration'
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                                  <status.icon className="h-3 w-3" />
                                  {status.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleRowExpansion(license.id)}
                                          data-testid={`button-expand-${license.id}`}
                                        >
                                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {isExpanded ? 'Hide' : 'Show'} Details
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {status.variant === 'destructive' && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              toast({
                                                title: "Renewal Reminder",
                                                description: `Reminder set for ${license.physician?.fullLegalName} - ${license.state} license`,
                                              });
                                            }}
                                            data-testid={`button-remind-${license.id}`}
                                          >
                                            <Bell className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Send Renewal Reminder
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/50">
                                  <div className="p-4 space-y-2">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <Label className="text-muted-foreground">License Type</Label>
                                        <p className="font-medium">{license.licenseType || 'Medical License'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">State of Issue</Label>
                                        <p className="font-medium">{license.state}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">License Number</Label>
                                        <p className="font-medium font-mono">{license.licenseNumber}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Expiration Date</Label>
                                        <p className="font-medium">
                                          {license.expirationDate ? formatDate(license.expirationDate) : 'No Expiration'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Days Until Expiration</Label>
                                        <p className="font-medium">
                                          {license.expirationDate 
                                            ? differenceInDays(new Date(license.expirationDate), new Date())
                                            : 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <Badge variant={status.variant} className="mt-1">
                                          {status.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                      <Button variant="outline" size="sm" data-testid={`button-edit-${license.id}`}>
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit License
                                      </Button>
                                      <Button variant="outline" size="sm" data-testid={`button-renew-${license.id}`}>
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Start Renewal
                                      </Button>
                                      <Button variant="outline" size="sm" data-testid={`button-verify-${license.id}`}>
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Verify Online
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Board Certifications</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={certStatusFilter} onValueChange={setCertStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="filter-cert-status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredCertifications.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {debouncedSearch || certStatusFilter !== "all"
                      ? "No certifications found matching your filters"
                      : "No certification records found"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Physician</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Board</TableHead>
                        <TableHead>Certification Date</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertifications.map((cert: CertificationWithPhysician) => {
                        const status = getLicenseStatus(cert.expirationDate);
                        const isExpanded = expandedRows.has(cert.id);
                        
                        return (
                          <>
                            <TableRow key={cert.id} data-testid={`cert-row-${cert.id}`}>
                              <TableCell className="font-medium">
                                <Link href={`/physicians/${cert.physicianId}`}>
                                  <a className="text-primary hover:underline" data-testid={`link-cert-physician-${cert.id}`}>
                                    {cert.physician?.fullLegalName || 'Unknown Physician'}
                                  </a>
                                </Link>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Award className="h-3 w-3 text-muted-foreground" />
                                  {cert.specialty}
                                </div>
                              </TableCell>
                              <TableCell>{cert.boardName}</TableCell>
                              <TableCell>
                                {cert.certificationDate ? formatDate(cert.certificationDate) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {cert.expirationDate ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="cursor-help">
                                          {formatDate(cert.expirationDate)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{differenceInDays(new Date(cert.expirationDate), new Date())} days from today</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  'No Expiration'
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                                  <status.icon className="h-3 w-3" />
                                  {status.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleRowExpansion(cert.id)}
                                          data-testid={`button-expand-cert-${cert.id}`}
                                        >
                                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {isExpanded ? 'Hide' : 'Show'} Details
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/50">
                                  <div className="p-4 space-y-2">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <Label className="text-muted-foreground">Specialty</Label>
                                        <p className="font-medium">{cert.specialty}</p>
                                      </div>
                                      {cert.subspecialty && (
                                        <div>
                                          <Label className="text-muted-foreground">Subspecialty</Label>
                                          <p className="font-medium">{cert.subspecialty}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-muted-foreground">Certifying Board</Label>
                                        <p className="font-medium">{cert.boardName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Initial Certification</Label>
                                        <p className="font-medium">
                                          {cert.certificationDate ? formatDate(cert.certificationDate) : 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Expiration Date</Label>
                                        <p className="font-medium">
                                          {cert.expirationDate ? formatDate(cert.expirationDate) : 'No Expiration'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <Badge variant={status.variant} className="mt-1">
                                          {status.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                      <Button variant="outline" size="sm" data-testid={`button-edit-cert-${cert.id}`}>
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit Certification
                                      </Button>
                                      <Button variant="outline" size="sm" data-testid={`button-verify-cert-${cert.id}`}>
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Verify with Board
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEA & Registrations Tab */}
        <TabsContent value="dea" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DEA & Controlled Substance Registrations</CardTitle>
              <CardDescription>
                Track DEA numbers and controlled substance registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Physician</TableHead>
                        <TableHead>DEA Number</TableHead>
                        <TableHead>Registration Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {physicians.filter((p: SelectPhysician) => p.deaNumber).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-muted-foreground">No DEA registrations found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        physicians
                          .filter((physician: SelectPhysician) => physician.deaNumber)
                          .map((physician: SelectPhysician) => (
                            <TableRow key={physician.id} data-testid={`dea-row-${physician.id}`}>
                              <TableCell className="font-medium">
                                <Link href={`/physicians/${physician.id}`}>
                                  <a className="text-primary hover:underline" data-testid={`link-dea-physician-${physician.id}`}>
                                    {physician.fullLegalName}
                                  </a>
                                </Link>
                              </TableCell>
                              <TableCell className="font-mono">
                                {physician.deaNumber}
                              </TableCell>
                              <TableCell>DEA Registration</TableCell>
                              <TableCell>
                                <Badge variant="success" className="flex items-center gap-1 w-fit">
                                  <CheckCircle className="h-3 w-3" />
                                  Registered
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        data-testid={`button-verify-dea-${physician.id}`}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Verify DEA Registration
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts Section */}
      {stats.expiring30Days > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Urgent Action Required:</strong> {stats.expiring30Days} license(s) will expire within 30 days.
            Please initiate renewal procedures immediately to avoid lapses in licensing.
          </AlertDescription>
        </Alert>
      )}

      {stats.expiredLicenses > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical:</strong> {stats.expiredLicenses} license(s) have already expired.
            Physicians with expired licenses should not practice until licenses are renewed.
          </AlertDescription>
        </Alert>
      )}

      {/* Add License Dialog */}
      <Dialog open={isAddLicenseDialogOpen} onOpenChange={setIsAddLicenseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add License</DialogTitle>
            <DialogDescription>
              Add a new medical license for a physician
            </DialogDescription>
          </DialogHeader>
          <Form {...licenseForm}>
            <form onSubmit={licenseForm.handleSubmit(handleLicenseSubmit)} className="space-y-4">
              <FormField
                control={licenseForm.control}
                name="physicianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physician *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a physician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {physicians.map((physician) => (
                          <SelectItem key={physician.id} value={physician.id}>
                            {physician.fullLegalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={licenseForm.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CA, NY, TX" {...field} />
                    </FormControl>
                    <FormDescription>
                      State where the license is issued
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={licenseForm.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter license number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={licenseForm.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={licenseForm.control}
                name="licenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select license type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="dea">DEA</SelectItem>
                        <SelectItem value="controlled_substance">Controlled Substance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddLicenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addLicenseMutation.isPending}>
                  {addLicenseMutation.isPending ? "Adding..." : "Add License"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={isAddCertDialogOpen} onOpenChange={setIsAddCertDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
            <DialogDescription>
              Add board certification for a physician
            </DialogDescription>
          </DialogHeader>
          <Form {...certForm}>
            <form onSubmit={certForm.handleSubmit(handleCertificationSubmit)} className="space-y-4">
              <FormField
                control={certForm.control}
                name="physicianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physician *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a physician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {physicians.map((physician) => (
                          <SelectItem key={physician.id} value={physician.id}>
                            {physician.fullLegalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certForm.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Internal Medicine, Surgery" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certForm.control}
                name="subspecialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subspecialty</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cardiology, Neurosurgery" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certForm.control}
                name="boardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Board Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., American Board of Internal Medicine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certForm.control}
                name="certificationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certForm.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddCertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addCertificationMutation.isPending}>
                  {addCertificationMutation.isPending ? "Adding..." : "Add Certification"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
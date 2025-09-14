import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Building2,
  Phone,
  Printer,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  Users,
  MapPin,
  UserCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  FileText,
  Calendar,
  DollarSign,
  Hash,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician } from "../../shared/schema";

export default function PracticePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [practiceFilter, setPracticeFilter] = useState<string>("all");
  const [insuranceFilter, setInsuranceFilter] = useState<string>("all");
  const [groupByPractice, setGroupByPractice] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch physicians data
  const { data: physiciansData, isLoading, error } = useQuery({
    queryKey: debouncedSearch ? ['/physicians', { search: debouncedSearch }] : ['/physicians'],
    queryFn: () => {
      const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
      return apiRequest(`/physicians${params}`);
    },
  });

  const physicians = physiciansData?.physicians || [];

  // Calculate practice statistics
  const practiceStats = useMemo(() => {
    if (!physicians || physicians.length === 0) {
      return {
        total: 0,
        withPracticeInfo: 0,
        uniquePractices: 0,
        withGroupNPI: 0,
        withMalpractice: 0,
        expiredMalpractice: 0,
        activeMalpractice: 0,
      };
    }

    const uniquePracticesSet = new Set<string>();
    let withPracticeInfo = 0;
    let withGroupNPI = 0;
    let withMalpractice = 0;
    let expiredMalpractice = 0;
    let activeMalpractice = 0;
    const today = new Date();

    physicians.forEach((physician: SelectPhysician) => {
      if (physician.practiceName || physician.primaryPracticeAddress) {
        withPracticeInfo++;
        if (physician.practiceName) {
          uniquePracticesSet.add(physician.practiceName);
        }
      }
      if (physician.groupNpi) withGroupNPI++;
      if (physician.malpracticeCarrier || physician.malpracticePolicyNumber) {
        withMalpractice++;
        if (physician.malpracticeExpirationDate) {
          const expDate = new Date(physician.malpracticeExpirationDate);
          if (expDate < today) {
            expiredMalpractice++;
          } else {
            activeMalpractice++;
          }
        }
      }
    });

    return {
      total: physicians.length,
      withPracticeInfo,
      uniquePractices: uniquePracticesSet.size,
      withGroupNPI,
      withMalpractice,
      expiredMalpractice,
      activeMalpractice,
    };
  }, [physicians]);

  // Get unique practice names for filter
  const uniquePracticeNames = useMemo(() => {
    const practices = new Set<string>();
    physicians.forEach((physician: SelectPhysician) => {
      if (physician.practiceName) {
        practices.add(physician.practiceName);
      }
    });
    return Array.from(practices).sort();
  }, [physicians]);

  // Filter physicians based on search and filters
  const filteredPhysicians = useMemo(() => {
    return physicians.filter((physician: SelectPhysician) => {
      // Apply practice filter
      if (practiceFilter !== "all") {
        if (practiceFilter === "no-practice" && physician.practiceName) return false;
        if (practiceFilter !== "no-practice" && physician.practiceName !== practiceFilter) return false;
      }

      // Apply insurance filter
      if (insuranceFilter !== "all") {
        const hasMalpractice = physician.malpracticeCarrier || physician.malpracticePolicyNumber;
        const today = new Date();
        const expDate = physician.malpracticeExpirationDate ? new Date(physician.malpracticeExpirationDate) : null;
        
        if (insuranceFilter === "active") {
          if (!hasMalpractice || !expDate || expDate < today) return false;
        } else if (insuranceFilter === "expired") {
          if (!hasMalpractice || !expDate || expDate >= today) return false;
        } else if (insuranceFilter === "missing") {
          if (hasMalpractice) return false;
        }
      }

      return true;
    });
  }, [physicians, practiceFilter, insuranceFilter]);

  // Group physicians by practice if enabled
  const groupedPhysicians = useMemo(() => {
    if (!groupByPractice) return { ungrouped: filteredPhysicians };

    const grouped: Record<string, SelectPhysician[]> = {};
    filteredPhysicians.forEach((physician: SelectPhysician) => {
      const practice = physician.practiceName || 'No Practice Listed';
      if (!grouped[practice]) {
        grouped[practice] = [];
      }
      grouped[practice].push(physician);
    });

    // Sort practices alphabetically
    const sortedGrouped: Record<string, SelectPhysician[]> = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }, [filteredPhysicians, groupByPractice]);

  // Format phone/fax number
  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Format address for display
  const formatAddress = (address: string | null | undefined) => {
    if (!address) return 'N/A';
    const lines = address.split('\n');
    if (lines.length > 1) {
      return `${lines[0]}...`;
    }
    return address.length > 40 ? `${address.substring(0, 37)}...` : address;
  };

  // Check malpractice insurance status
  const getMalpracticeStatus = (physician: SelectPhysician) => {
    if (!physician.malpracticeCarrier && !physician.malpracticePolicyNumber) {
      return { status: 'missing', label: 'No Insurance', color: 'text-gray-500' };
    }
    
    if (!physician.malpracticeExpirationDate) {
      return { status: 'unknown', label: 'No Expiry Date', color: 'text-yellow-500' };
    }

    const today = new Date();
    const expDate = new Date(physician.malpracticeExpirationDate);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'text-red-500' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `Expires in ${daysUntilExpiry} days`, color: 'text-orange-500' };
    } else {
      return { status: 'active', label: `Active (${expDate.toLocaleDateString()})`, color: 'text-green-500' };
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (physicianId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(physicianId)) {
      newExpanded.delete(physicianId);
    } else {
      newExpanded.add(physicianId);
    }
    setExpandedRows(newExpanded);
  };

  // Stats cards configuration
  const stats = [
    {
      title: "Total Physicians",
      value: isLoading ? "..." : practiceStats.withPracticeInfo.toString(),
      change: "with practice info",
      icon: UserCheck,
      description: "Have practice details",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Unique Practices",
      value: isLoading ? "..." : practiceStats.uniquePractices.toString(),
      change: "practices",
      icon: Building2,
      description: "Different practice locations",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Group Affiliations",
      value: isLoading ? "..." : practiceStats.withGroupNPI.toString(),
      change: `${practiceStats.total ? Math.round(practiceStats.withGroupNPI / practiceStats.total * 100) : 0}%`,
      icon: Users,
      description: "Have Group NPI",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Malpractice Insurance",
      value: isLoading ? "..." : practiceStats.activeMalpractice.toString(),
      change: practiceStats.expiredMalpractice > 0 ? `${practiceStats.expiredMalpractice} expired` : "active",
      icon: Shield,
      description: "Current insurance status",
      color: practiceStats.expiredMalpractice > 0 ? "text-orange-500" : "text-emerald-500",
      bgColor: practiceStats.expiredMalpractice > 0 ? "bg-orange-50 dark:bg-orange-950/20" : "bg-emerald-50 dark:bg-emerald-950/20",
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Practice Information</h1>
            <p className="text-muted-foreground">Manage physician practice details</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading practice information. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Practice Information</h1>
          <p className="text-muted-foreground">Manage physician practice details and affiliations</p>
        </div>
      </div>

      {/* Alert for expired malpractice insurance */}
      {practiceStats.expiredMalpractice > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{practiceStats.expiredMalpractice} physicians</strong> have expired malpractice insurance that needs immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stat.change} • {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Practice Directory
          </CardTitle>
          <CardDescription>
            View and manage physician practice information, group affiliations, and malpractice insurance status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by physician or practice name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={practiceFilter} onValueChange={setPracticeFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-practice-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by practice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Practices</SelectItem>
                <SelectItem value="no-practice">No Practice Listed</SelectItem>
                {uniquePracticeNames.map((practice) => (
                  <SelectItem key={practice} value={practice}>
                    {practice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-insurance-filter">
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Insurance status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Insurance Status</SelectItem>
                <SelectItem value="active">Active Insurance</SelectItem>
                <SelectItem value="expired">Expired Insurance</SelectItem>
                <SelectItem value="missing">No Insurance</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={groupByPractice ? "default" : "outline"}
              onClick={() => setGroupByPractice(!groupByPractice)}
              data-testid="button-group-toggle"
            >
              <Users className="h-4 w-4 mr-2" />
              {groupByPractice ? "Ungroup" : "Group by Practice"}
            </Button>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredPhysicians.length} of {physicians.length} physicians
          </div>

          {/* Practice Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPhysicians.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No practice information found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Physician Name</TableHead>
                    <TableHead>Practice Name</TableHead>
                    <TableHead>Primary Address</TableHead>
                    <TableHead>Office Phone</TableHead>
                    <TableHead>Office Fax</TableHead>
                    <TableHead>Group NPI</TableHead>
                    <TableHead>Malpractice Insurance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupByPractice ? (
                    Object.entries(groupedPhysicians).map(([practice, physicians]) => (
                      <>
                        <TableRow key={`group-${practice}`} className="bg-muted/50">
                          <TableCell colSpan={8} className="font-semibold">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {practice}
                              <Badge variant="secondary" className="ml-2">
                                {physicians.length} physician{physicians.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        {physicians.map((physician: SelectPhysician) => {
                          const malpracticeStatus = getMalpracticeStatus(physician);
                          const isExpanded = expandedRows.has(physician.id);
                          
                          return (
                            <>
                              <TableRow key={physician.id} data-testid={`row-physician-${physician.id}`}>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(physician.id)}
                                    data-testid={`button-expand-${physician.id}`}
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <Link href={`/physicians/${physician.id}`}>
                                    <Button variant="link" className="p-0 h-auto text-left justify-start" data-testid={`link-physician-${physician.id}`}>
                                      {physician.fullLegalName}
                                    </Button>
                                  </Link>
                                </TableCell>
                                <TableCell>{physician.practiceName || 'N/A'}</TableCell>
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help">
                                          {formatAddress(physician.primaryPracticeAddress)}
                                        </span>
                                      </TooltipTrigger>
                                      {physician.primaryPracticeAddress && (
                                        <TooltipContent>
                                          <p className="max-w-xs whitespace-pre-wrap">{physician.primaryPracticeAddress}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                  {physician.officePhone ? (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-muted-foreground" />
                                      {formatPhoneNumber(physician.officePhone)}
                                    </div>
                                  ) : (
                                    'N/A'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {physician.officeFax ? (
                                    <div className="flex items-center gap-1">
                                      <Printer className="h-3 w-3 text-muted-foreground" />
                                      {formatPhoneNumber(physician.officeFax)}
                                    </div>
                                  ) : (
                                    'N/A'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {physician.groupNpi ? (
                                    <Badge variant="outline" className="font-mono">
                                      {physician.groupNpi}
                                    </Badge>
                                  ) : (
                                    'N/A'
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {malpracticeStatus.status === 'expired' && (
                                      <AlertTriangle className={`h-4 w-4 ${malpracticeStatus.color}`} />
                                    )}
                                    {malpracticeStatus.status === 'active' && (
                                      <CheckCircle className={`h-4 w-4 ${malpracticeStatus.color}`} />
                                    )}
                                    {malpracticeStatus.status === 'missing' && (
                                      <XCircle className={`h-4 w-4 ${malpracticeStatus.color}`} />
                                    )}
                                    <span className={`text-sm ${malpracticeStatus.color}`}>
                                      {malpracticeStatus.label}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow key={`${physician.id}-expanded`}>
                                  <TableCell colSpan={8} className="bg-muted/20">
                                    <Collapsible open={isExpanded}>
                                      <CollapsibleContent>
                                        <div className="p-4 space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Practice Details */}
                                            <div className="space-y-2">
                                              <h4 className="font-semibold flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Practice Details
                                              </h4>
                                              <div className="space-y-1 text-sm">
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">Contact Person:</span>
                                                  <span>{physician.officeContactPerson || 'N/A'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">Group Tax ID:</span>
                                                  <span className="font-mono">{physician.groupTaxId || 'N/A'}</span>
                                                </div>
                                                {physician.secondaryPracticeAddresses && physician.secondaryPracticeAddresses.length > 0 && (
                                                  <div>
                                                    <span className="text-muted-foreground">Secondary Addresses:</span>
                                                    <ul className="mt-1 ml-4 list-disc">
                                                      {physician.secondaryPracticeAddresses.map((addr, idx) => (
                                                        <li key={idx} className="text-sm">{addr}</li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Malpractice Insurance Details */}
                                            <div className="space-y-2">
                                              <h4 className="font-semibold flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Malpractice Insurance
                                              </h4>
                                              <div className="space-y-1 text-sm">
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">Carrier:</span>
                                                  <span>{physician.malpracticeCarrier || 'N/A'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">Policy Number:</span>
                                                  <span className="font-mono">{physician.malpracticePolicyNumber || 'N/A'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">Coverage Limits:</span>
                                                  <span>{physician.coverageLimits || 'N/A'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">Expiration Date:</span>
                                                  <span className={malpracticeStatus.color}>
                                                    {physician.malpracticeExpirationDate 
                                                      ? new Date(physician.malpracticeExpirationDate).toLocaleDateString()
                                                      : 'N/A'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Identification Numbers */}
                                            <div className="space-y-2">
                                              <h4 className="font-semibold flex items-center gap-2">
                                                <Hash className="h-4 w-4" />
                                                Identification Numbers
                                              </h4>
                                              <div className="space-y-1 text-sm">
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">NPI:</span>
                                                  <span className="font-mono">{physician.npi || 'N/A'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">DEA Number:</span>
                                                  <span className="font-mono">{physician.deaNumber || 'N/A'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">CAQH ID:</span>
                                                  <span className="font-mono">{physician.caqhId || 'N/A'}</span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Full Primary Address */}
                                            {physician.primaryPracticeAddress && (
                                              <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                  <MapPin className="h-4 w-4" />
                                                  Primary Practice Address
                                                </h4>
                                                <p className="text-sm whitespace-pre-wrap">
                                                  {physician.primaryPracticeAddress}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })}
                      </>
                    ))
                  ) : (
                    filteredPhysicians.map((physician: SelectPhysician) => {
                      const malpracticeStatus = getMalpracticeStatus(physician);
                      const isExpanded = expandedRows.has(physician.id);
                      
                      return (
                        <>
                          <TableRow key={physician.id} data-testid={`row-physician-${physician.id}`}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(physician.id)}
                                data-testid={`button-expand-${physician.id}`}>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Link href={`/physicians/${physician.id}`}>
                                <Button variant="link" className="p-0 h-auto text-left justify-start" data-testid={`link-physician-${physician.id}`}>
                                  {physician.fullLegalName}
                                </Button>
                              </Link>
                            </TableCell>
                            <TableCell>{physician.practiceName || 'N/A'}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {formatAddress(physician.primaryPracticeAddress)}
                                    </span>
                                  </TooltipTrigger>
                                  {physician.primaryPracticeAddress && (
                                    <TooltipContent>
                                      <p className="max-w-xs whitespace-pre-wrap">{physician.primaryPracticeAddress}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              {physician.officePhone ? (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {formatPhoneNumber(physician.officePhone)}
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              {physician.officeFax ? (
                                <div className="flex items-center gap-1">
                                  <Printer className="h-3 w-3 text-muted-foreground" />
                                  {formatPhoneNumber(physician.officeFax)}
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              {physician.groupNpi ? (
                                <Badge variant="outline" className="font-mono">
                                  {physician.groupNpi}
                                </Badge>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {malpracticeStatus.status === 'expired' && (
                                  <AlertTriangle className={`h-4 w-4 ${malpracticeStatus.color}`} />
                                )}
                                {malpracticeStatus.status === 'active' && (
                                  <CheckCircle className={`h-4 w-4 ${malpracticeStatus.color}`} />
                                )}
                                {malpracticeStatus.status === 'missing' && (
                                  <XCircle className={`h-4 w-4 ${malpracticeStatus.color}`} />
                                )}
                                <span className={`text-sm ${malpracticeStatus.color}`}>
                                  {malpracticeStatus.label}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${physician.id}-expanded`}>
                              <TableCell colSpan={8} className="bg-muted/20">
                                <Collapsible open={isExpanded}>
                                  <CollapsibleContent>
                                    <div className="p-4 space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Practice Details */}
                                        <div className="space-y-2">
                                          <h4 className="font-semibold flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Practice Details
                                          </h4>
                                          <div className="space-y-1 text-sm">
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">Contact Person:</span>
                                              <span>{physician.officeContactPerson || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">Group Tax ID:</span>
                                              <span className="font-mono">{physician.groupTaxId || 'N/A'}</span>
                                            </div>
                                            {physician.secondaryPracticeAddresses && physician.secondaryPracticeAddresses.length > 0 && (
                                              <div>
                                                <span className="text-muted-foreground">Secondary Addresses:</span>
                                                <ul className="mt-1 ml-4 list-disc">
                                                  {physician.secondaryPracticeAddresses.map((addr, idx) => (
                                                    <li key={idx} className="text-sm">{addr}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Malpractice Insurance Details */}
                                        <div className="space-y-2">
                                          <h4 className="font-semibold flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            Malpractice Insurance
                                          </h4>
                                          <div className="space-y-1 text-sm">
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">Carrier:</span>
                                              <span>{physician.malpracticeCarrier || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">Policy Number:</span>
                                              <span className="font-mono">{physician.malpracticePolicyNumber || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">Coverage Limits:</span>
                                              <span>{physician.coverageLimits || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">Expiration Date:</span>
                                              <span className={malpracticeStatus.color}>
                                                {physician.malpracticeExpirationDate 
                                                  ? new Date(physician.malpracticeExpirationDate).toLocaleDateString()
                                                  : 'N/A'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Identification Numbers */}
                                        <div className="space-y-2">
                                          <h4 className="font-semibold flex items-center gap-2">
                                            <Hash className="h-4 w-4" />
                                            Identification Numbers
                                          </h4>
                                          <div className="space-y-1 text-sm">
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">NPI:</span>
                                              <span className="font-mono">{physician.npi || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">DEA Number:</span>
                                              <span className="font-mono">{physician.deaNumber || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">CAQH ID:</span>
                                              <span className="font-mono">{physician.caqhId || 'N/A'}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Full Primary Address */}
                                        {physician.primaryPracticeAddress && (
                                          <div className="space-y-2">
                                            <h4 className="font-semibold flex items-center gap-2">
                                              <MapPin className="h-4 w-4" />
                                              Primary Practice Address
                                            </h4>
                                            <p className="text-sm whitespace-pre-wrap">
                                              {physician.primaryPracticeAddress}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect, useMemo, Fragment } from "react";
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
  Phone,
  Mail,
  Home,
  MapPin,
  AlertCircle,
  Search,
  Filter,
  Download,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  PhoneOff,
  MailX,
  UserX,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician } from "../../shared/schema";

interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export default function ContactPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
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

  const physicians = physiciansData?.data || [];

  // Calculate contact statistics
  const contactStats = useMemo(() => {
    if (!physicians || physicians.length === 0) {
      return {
        total: 0,
        withEmail: 0,
        withPhone: 0,
        withEmergencyContact: 0,
        missingEmail: 0,
        missingPhone: 0,
        missingEmergencyContact: 0,
      };
    }

    let withEmail = 0;
    let withPhone = 0;
    let withEmergencyContact = 0;

    physicians.forEach((physician: SelectPhysician) => {
      if (physician.emailAddress) withEmail++;
      if (physician.phoneNumbers?.length > 0 || physician.officePhone) withPhone++;
      if (physician.emergencyContact && 
          typeof physician.emergencyContact === 'object' && 
          (physician.emergencyContact as EmergencyContact).name) {
        withEmergencyContact++;
      }
    });

    const total = physicians.length;
    return {
      total,
      withEmail,
      withPhone,
      withEmergencyContact,
      missingEmail: total - withEmail,
      missingPhone: total - withPhone,
      missingEmergencyContact: total - withEmergencyContact,
    };
  }, [physicians]);

  // Filter physicians based on search and filter type
  const filteredPhysicians = useMemo(() => {
    return physicians.filter((physician: SelectPhysician) => {
      // Apply filter type
      if (filterType === "missing-email" && physician.emailAddress) return false;
      if (filterType === "missing-phone" && 
          (physician.phoneNumbers?.length > 0 || physician.officePhone)) return false;
      if (filterType === "missing-emergency") {
        const hasEmergency = physician.emergencyContact && 
          typeof physician.emergencyContact === 'object' && 
          (physician.emergencyContact as EmergencyContact).name;
        if (hasEmergency) return false;
      }
      if (filterType === "complete") {
        const hasEmail = physician.emailAddress;
        const hasPhone = physician.phoneNumbers?.length > 0 || physician.officePhone;
        const hasEmergency = physician.emergencyContact && 
          typeof physician.emergencyContact === 'object' && 
          (physician.emergencyContact as EmergencyContact).name;
        if (!hasEmail || !hasPhone || !hasEmergency) return false;
      }

      return true;
    });
  }, [physicians, filterType]);

  // Format phone number
  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return 'N/A';
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX if US number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    // Return original if not standard US format
    return phone;
  };

  // Format address
  const formatAddress = (address: string | null | undefined) => {
    if (!address) return 'N/A';
    // If address is multiline, truncate for display
    const lines = address.split('\n');
    if (lines.length > 1) {
      return `${lines[0]}...`;
    }
    return address.length > 50 ? `${address.substring(0, 47)}...` : address;
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

  // Export to CSV
  const exportToCSV = () => {
    const csvHeaders = [
      'Full Name',
      'Email',
      'Phone Numbers',
      'Office Phone',
      'Office Fax',
      'Home Address',
      'Mailing Address',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Emergency Contact Relationship'
    ];

    const csvData = filteredPhysicians.map((physician: SelectPhysician) => {
      const emergency = physician.emergencyContact as EmergencyContact | null;
      return [
        physician.fullLegalName,
        physician.emailAddress || '',
        physician.phoneNumbers?.join('; ') || '',
        physician.officePhone || '',
        physician.officeFax || '',
        physician.homeAddress || '',
        physician.mailingAddress || '',
        emergency?.name || '',
        emergency?.phone || '',
        emergency?.relationship || ''
      ];
    });

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `physician_contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats cards configuration
  const stats = [
    {
      title: "Total Physicians",
      value: isLoading ? "..." : contactStats.total.toString(),
      change: "in system",
      icon: Users,
      description: "Registered physicians",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "With Email",
      value: isLoading ? "..." : contactStats.withEmail.toString(),
      change: `${contactStats.total ? Math.round(contactStats.withEmail / contactStats.total * 100) : 0}%`,
      icon: Mail,
      description: "Have email addresses",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "With Phone",
      value: isLoading ? "..." : contactStats.withPhone.toString(),
      change: `${contactStats.total ? Math.round(contactStats.withPhone / contactStats.total * 100) : 0}%`,
      icon: Phone,
      description: "Have phone numbers",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Emergency Contacts",
      value: isLoading ? "..." : contactStats.withEmergencyContact.toString(),
      change: `${contactStats.total ? Math.round(contactStats.withEmergencyContact / contactStats.total * 100) : 0}%`,
      icon: User,
      description: "Have emergency contact",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Contact Information</h1>
            <p className="text-muted-foreground">Manage physician contact details</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load contact information: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Contact Information</h1>
          <p className="text-muted-foreground">Manage physician contact details</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 dark:text-green-400">{stat.change}</span> {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>View physicians with missing contact information</CardDescription>
            </div>
            <Button onClick={exportToCSV} className="gap-2" variant="outline" data-testid="button-export-csv">
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={filterType === "missing-email" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filterType === "missing-email" ? "all" : "missing-email")}
              className="gap-2"
              data-testid="button-filter-missing-email"
            >
              <MailX className="h-4 w-4" />
              Missing Email ({contactStats.missingEmail})
            </Button>
            <Button 
              variant={filterType === "missing-phone" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filterType === "missing-phone" ? "all" : "missing-phone")}
              className="gap-2"
              data-testid="button-filter-missing-phone"
            >
              <PhoneOff className="h-4 w-4" />
              Missing Phone ({contactStats.missingPhone})
            </Button>
            <Button 
              variant={filterType === "missing-emergency" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filterType === "missing-emergency" ? "all" : "missing-emergency")}
              className="gap-2"
              data-testid="button-filter-missing-emergency"
            >
              <UserX className="h-4 w-4" />
              Missing Emergency ({contactStats.missingEmergencyContact})
            </Button>
            <Button 
              variant={filterType === "complete" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filterType === "complete" ? "all" : "complete")}
              className="gap-2"
              data-testid="button-filter-complete"
            >
              <User className="h-4 w-4" />
              Complete Info ({contactStats.withEmail && contactStats.withPhone && contactStats.withEmergencyContact ? 
                physicians.filter((p: SelectPhysician) => 
                  p.emailAddress && 
                  (p.phoneNumbers?.length > 0 || p.officePhone) && 
                  p.emergencyContact && 
                  typeof p.emergencyContact === 'object' && 
                  (p.emergencyContact as EmergencyContact).name
                ).length : 0})
            </Button>
            {filterType !== "all" && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setFilterType("all")}
                className="gap-2"
                data-testid="button-clear-filter"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Directory</CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  `${filteredPhysicians.length} physician${filteredPhysicians.length !== 1 ? 's' : ''} ${filterType !== 'all' ? '(filtered)' : ''}`
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-contacts"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold w-12"></TableHead>
                  <TableHead className="font-semibold">Physician</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Phone Numbers</TableHead>
                  <TableHead className="font-semibold">Addresses</TableHead>
                  <TableHead className="font-semibold">Emergency Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPhysicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No physicians found matching your search.' : 
                       filterType !== 'all' ? 'No physicians match the selected filter.' : 
                       'No physicians found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPhysicians.map((physician: SelectPhysician) => {
                    const emergency = physician.emergencyContact as EmergencyContact | null;
                    const isExpanded = expandedRows.has(physician.id);
                    
                    return (
                      <Fragment key={physician.id}>
                        <TableRow className="hover:bg-muted/20" data-testid={`row-contact-${physician.id}`}>
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
                            <Link 
                              href={`/physicians/${physician.id}`}
                              className="font-medium text-primary hover:underline" 
                              data-testid={`link-physician-${physician.id}`}
                            >
                              {physician.fullLegalName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {physician.emailAddress ? (
                                <>
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm" data-testid={`text-email-${physician.id}`}>
                                    {physician.emailAddress}
                                  </span>
                                </>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  Missing
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {physician.phoneNumbers && physician.phoneNumbers.length > 0 ? (
                                physician.phoneNumbers.map((phone, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm" data-testid={`text-phone-${physician.id}-${idx}`}>
                                      {formatPhoneNumber(phone)}
                                    </span>
                                  </div>
                                ))
                              ) : physician.officePhone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm" data-testid={`text-office-phone-${physician.id}`}>
                                    {formatPhoneNumber(physician.officePhone)} (Office)
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  Missing
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <div className="space-y-1">
                                {physician.homeAddress && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 cursor-help">
                                        <Home className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm truncate max-w-[200px]" data-testid={`text-home-address-${physician.id}`}>
                                          {formatAddress(physician.homeAddress)}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="whitespace-pre-wrap">{physician.homeAddress}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {physician.mailingAddress && physician.mailingAddress !== physician.homeAddress && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 cursor-help">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm truncate max-w-[200px]" data-testid={`text-mailing-address-${physician.id}`}>
                                          {formatAddress(physician.mailingAddress)}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="whitespace-pre-wrap">{physician.mailingAddress}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {!physician.homeAddress && !physician.mailingAddress && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    No Address
                                  </Badge>
                                )}
                              </div>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            {emergency && emergency.name ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm" data-testid={`text-emergency-name-${physician.id}`}>
                                  {emergency.name}
                                </div>
                                {emergency.relationship && (
                                  <div className="text-xs text-muted-foreground" data-testid={`text-emergency-relationship-${physician.id}`}>
                                    {emergency.relationship}
                                  </div>
                                )}
                                {emergency.phone && (
                                  <div className="text-xs text-muted-foreground" data-testid={`text-emergency-phone-${physician.id}`}>
                                    {formatPhoneNumber(emergency.phone)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                Not Provided
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/10 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Full Address Details</h4>
                                  {physician.homeAddress && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium">Home Address:</span>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {physician.homeAddress}
                                      </p>
                                    </div>
                                  )}
                                  {physician.mailingAddress && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium">Mailing Address:</span>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {physician.mailingAddress}
                                      </p>
                                    </div>
                                  )}
                                  {physician.primaryPracticeAddress && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium">Practice Address:</span>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {physician.primaryPracticeAddress}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Office Contact</h4>
                                  {physician.officePhone && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium">Office Phone:</span>
                                      <p className="text-sm text-muted-foreground">
                                        {formatPhoneNumber(physician.officePhone)}
                                      </p>
                                    </div>
                                  )}
                                  {physician.officeFax && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium">Office Fax:</span>
                                      <p className="text-sm text-muted-foreground">
                                        {formatPhoneNumber(physician.officeFax)}
                                      </p>
                                    </div>
                                  )}
                                  {physician.officeContactPerson && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium">Office Contact Person:</span>
                                      <p className="text-sm text-muted-foreground">
                                        {physician.officeContactPerson}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
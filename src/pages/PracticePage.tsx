import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Save,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician, SelectPractice, InsertPractice } from "../../shared/schema";
import { insertPracticeSchema } from "../../shared/schema";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { PhysicianManagementDialogContent, PhysicianList } from "./PracticePage-components";

// Practice Management Card Component
interface PracticeManagementCardProps {
  practice: {
    id: string;
    name: string;
    primaryAddress?: string;
    phone?: string;
    specialty?: string;
    physicianCount: number;
    locations: string[];
  };
  onManagePhysicians: (practiceId: string) => void;
}

function PracticeManagementCard({ practice, onManagePhysicians }: PracticeManagementCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{practice.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {practice.specialty || 'General Practice'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {practice.physicianCount} physicians
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {practice.primaryAddress && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{practice.primaryAddress}</span>
          </div>
        )}
        
        {practice.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{practice.phone}</span>
          </div>
        )}
        
        {practice.locations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Geographic Coverage:</div>
            <div className="flex flex-wrap gap-1">
              {practice.locations.map((location, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onManagePhysicians(practice.id)}
            size="sm"
            className="flex-1"
            data-testid={`button-manage-physicians-${practice.id}`}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Physicians
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Form schema for practice creation
const practiceFormSchema = insertPracticeSchema.pick({
  name: true,
  primaryAddress: true,
  phone: true,
  fax: true,
  contactPerson: true,
  email: true,
  website: true,
  npi: true,
  practiceType: true,
  specialty: true,
});

type PracticeFormData = z.infer<typeof practiceFormSchema>;

export default function PracticePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [practiceFilter, setPracticeFilter] = useState<string>("all");
  const [insuranceFilter, setInsuranceFilter] = useState<string>("all");
  const [groupByPractice, setGroupByPractice] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [managePhysiciansDialogOpen, setManagePhysiciansDialogOpen] = useState(false);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
  const [selectedPhysicians, setSelectedPhysicians] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState<string>('');
  const { toast } = useToast();

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

  // Fetch practices data
  const { data: practices = [], isLoading: practicesLoading } = useQuery<SelectPractice[]>({
    queryKey: ['/practices'],
  });

  // Practice creation form
  const form = useForm<PracticeFormData>({
    resolver: zodResolver(practiceFormSchema),
    defaultValues: {
      name: "",
      primaryAddress: "",
      phone: "",
      fax: "",
      contactPerson: "",
      email: "",
      website: "",
      npi: "",
      practiceType: "",
      specialty: "",
    },
  });

  // Practice creation mutation
  const createPracticeMutation = useMutation({
    mutationFn: async (data: PracticeFormData) => {
      return apiRequest('/practices', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          isActive: true,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Practice created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/practices'] });
      queryClient.invalidateQueries({ queryKey: ['/physicians'] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create practice",
        variant: "destructive",
      });
    },
  });

  // Bulk physician assignment mutations
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ practiceId, physicianIds }: { practiceId: string; physicianIds: string[] }) => {
      return apiRequest(`/practices/${practiceId}/assign-physicians`, {
        method: 'PUT',
        body: JSON.stringify({ physicianIds }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully assigned ${data.updatedPhysicians.length} physicians to practice`,
      });
      queryClient.invalidateQueries({ queryKey: ['/physicians'] });
      queryClient.invalidateQueries({ queryKey: ['/practices'] });
      setSelectedPhysicians(new Set());
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign physicians",
        variant: "destructive",
      });
    },
  });

  const bulkUnassignMutation = useMutation({
    mutationFn: async ({ practiceId, physicianIds }: { practiceId: string; physicianIds: string[] }) => {
      return apiRequest(`/practices/${practiceId}/unassign-physicians`, {
        method: 'PUT',
        body: JSON.stringify({ physicianIds }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully unassigned ${data.updatedPhysicians.length} physicians from practice`,
      });
      queryClient.invalidateQueries({ queryKey: ['/physicians'] });
      queryClient.invalidateQueries({ queryKey: ['/practices'] });
      setSelectedPhysicians(new Set());
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unassign physicians",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PracticeFormData) => {
    createPracticeMutation.mutate(data);
  };

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
      if (physician.practiceId) {
        withPracticeInfo++;
        uniquePracticesSet.add(physician.practiceId);
      }
      // Note: groupNpi field doesn't exist on physicians table
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

  // Get unique practice IDs for filter (practice names are in separate table)
  const uniquePracticeIds = useMemo(() => {
    const practices = new Set<string>();
    physicians.forEach((physician: SelectPhysician) => {
      if (physician.practiceId) {
        practices.add(physician.practiceId);
      }
    });
    return Array.from(practices).sort();
  }, [physicians]);

  // Create a map of practice names for quick lookup
  const practiceMap = useMemo(() => {
    const map = new Map();
    practices.forEach(practice => {
      map.set(practice.id, practice.name);
    });
    return map;
  }, [practices]);

  // Calculate practice statistics with enhanced data
  const practiceMetrics = useMemo(() => {
    const practicePhysicianCounts = new Map();
    const practiceLocations = new Map();
    
    physicians.forEach((physician: SelectPhysician) => {
      if (physician.practiceId) {
        const count = practicePhysicianCounts.get(physician.practiceId) || 0;
        practicePhysicianCounts.set(physician.practiceId, count + 1);
        
        // Extract state/location from homeAddress for geographical distribution
        if (physician.homeAddress) {
          const locations = practiceLocations.get(physician.practiceId) || new Set();
          // Simple state extraction - assume last part after comma is state
          const parts = physician.homeAddress.split(',');
          if (parts.length > 1) {
            const state = parts[parts.length - 1].trim();
            locations.add(state);
            practiceLocations.set(physician.practiceId, locations);
          }
        }
      }
    });
    
    return { practicePhysicianCounts, practiceLocations };
  }, [physicians]);

  // Enhanced practice data with physician counts and locations
  const enrichedPractices = useMemo(() => {
    return practices.map(practice => ({
      ...practice,
      physicianCount: practiceMetrics.practicePhysicianCounts.get(practice.id) || 0,
      locations: Array.from(practiceMetrics.practiceLocations.get(practice.id) || []),
    }));
  }, [practices, practiceMetrics]);

  // Filter physicians based on search and filters
  const filteredPhysicians = useMemo(() => {
    return physicians.filter((physician: SelectPhysician) => {
      // Apply practice filter
      if (practiceFilter !== "all") {
        if (practiceFilter === "no-practice" && physician.practiceId) return false;
        if (practiceFilter !== "no-practice" && physician.practiceId !== practiceFilter) return false;
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
      const practice = physician.practiceId || 'No Practice Listed';
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
      title: "Total Practices",
      value: practicesLoading ? "..." : practices.length.toString(),
      change: "registered",
      icon: Building2,
      description: "All practices in system",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Total Physicians",
      value: isLoading ? "..." : practiceStats.total.toString(),
      change: "with practice info",
      icon: UserCheck,
      description: "Have practice details",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Assigned Practices",
      value: isLoading ? "..." : practiceStats.uniquePractices.toString(),
      change: "practices",
      icon: Building,
      description: "Practices with physicians",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Group NPI (N/A)",
      value: "0",
      change: "0%",
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Practice Information</h1>
            <p className="text-muted-foreground">Manage physician practice details and affiliations</p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-practice">
              <Plus className="h-4 w-4" />
              Create Practice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Practice</DialogTitle>
              <DialogDescription>
                Add a new practice to the system. Only the practice name is required - other fields are optional.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Practice Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter practice name"
                            data-testid="input-practice-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="primaryAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Primary Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter primary address"
                            data-testid="input-primary-address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(555) 123-4567"
                            data-testid="input-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fax</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(555) 123-4567"
                            data-testid="input-fax"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contact person name"
                            data-testid="input-contact-person"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@practice.com"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://practice.com"
                            data-testid="input-website"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="npi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group NPI</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1234567890"
                            data-testid="input-npi"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="practiceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger data-testid="select-practice-type">
                              <SelectValue placeholder="Select practice type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solo">Solo Practice</SelectItem>
                              <SelectItem value="group">Group Practice</SelectItem>
                              <SelectItem value="hospital">Hospital</SelectItem>
                              <SelectItem value="clinic">Clinic</SelectItem>
                              <SelectItem value="urgent_care">Urgent Care</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Specialty</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Family Medicine, Cardiology"
                            data-testid="input-specialty"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel-practice"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPracticeMutation.isPending}
                    className="gap-2"
                    data-testid="button-save-practice"
                  >
                    {createPracticeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {createPracticeMutation.isPending ? "Creating..." : "Create Practice"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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

      {/* Practice Management Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant={!groupByPractice ? "default" : "outline"}
            onClick={() => setGroupByPractice(false)}
            data-testid="button-physician-view"
          >
            <Users className="h-4 w-4 mr-2" />
            Physician View
          </Button>
          <Button
            variant={groupByPractice ? "default" : "outline"}
            onClick={() => setGroupByPractice(true)}
            data-testid="button-practice-view"
          >
            <Building className="h-4 w-4 mr-2" />
            Practice Management
          </Button>
        </div>
      </div>

      {/* Practice Management Cards - Only show when in practice view */}
      {groupByPractice && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Practice Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedPractices.map((practice) => (
              <PracticeManagementCard
                key={practice.id}
                practice={practice}
                onManagePhysicians={(practiceId) => {
                  setSelectedPracticeId(practiceId);
                  setManagePhysiciansDialogOpen(true);
                }}
              />
            ))}
          </div>
        </div>
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
                {uniquePracticeIds.map((practice) => (
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
                                <TableCell>
                              {physician.practiceId ? (
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <span>{practiceMap.get(physician.practiceId) || 'Unknown Practice'}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No Practice Assigned</span>
                              )}
                            </TableCell>
                                <TableCell>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help">
                                          {physician.practiceId ? 'Practice Address Available' : 'N/A'}
                                        </span>
                                      </TooltipTrigger>
                                      {physician.practiceId && (
                                        <TooltipContent>
                                          <p className="max-w-xs whitespace-pre-wrap">Practice address stored in separate table</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                  {'N/A'}
                                </TableCell>
                                <TableCell>
                                  {'N/A'}
                                </TableCell>
                                <TableCell>
                                  {'N/A'}
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
                                                  <span>{'N/A'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <span className="text-muted-foreground">Group Tax ID:</span>
                                                  <span className="font-mono">{'N/A'}</span>
                                                </div>
                                                {false && (
                                                  <div>
                                                    <span className="text-muted-foreground">Secondary Addresses:</span>
                                                    <ul className="mt-1 ml-4 list-disc">
                                                      {[].map((addr, idx) => (
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
                                            {physician.practiceId && (
                                              <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                  <MapPin className="h-4 w-4" />
                                                  Primary Practice Address
                                                </h4>
                                                <p className="text-sm whitespace-pre-wrap">
                                                  Practice address stored in separate table
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
                            <TableCell>
                              {physician.practiceId ? (
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <span>{practiceMap.get(physician.practiceId) || 'Unknown Practice'}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No Practice Assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {physician.practiceId ? 'Practice Address Available' : 'N/A'}
                                    </span>
                                  </TooltipTrigger>
                                  {physician.practiceId && (
                                    <TooltipContent>
                                      <p className="max-w-xs whitespace-pre-wrap">Practice address stored in separate table</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              {'N/A'}
                            </TableCell>
                            <TableCell>
                              {'N/A'}
                            </TableCell>
                            <TableCell>
                              {'N/A'}
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
                                              <span>{'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                              <span className="text-muted-foreground">Group Tax ID:</span>
                                              <span className="font-mono">{'N/A'}</span>
                                            </div>
                                            {false && (
                                              <div>
                                                <span className="text-muted-foreground">Secondary Addresses:</span>
                                                <ul className="mt-1 ml-4 list-disc">
                                                  {[].map((addr, idx) => (
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
                                        {physician.practiceId && (
                                          <div className="space-y-2">
                                            <h4 className="font-semibold flex items-center gap-2">
                                              <MapPin className="h-4 w-4" />
                                              Primary Practice Address
                                            </h4>
                                            <p className="text-sm whitespace-pre-wrap">
                                              Practice address stored in separate table
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

    {/* Physician Management Dialog */}
    <Dialog open={managePhysiciansDialogOpen} onOpenChange={setManagePhysiciansDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Physicians - {selectedPracticeId ? practiceMap.get(selectedPracticeId) : 'Practice'}</DialogTitle>
          <DialogDescription>
            Assign or unassign physicians to this practice. Use location filtering to find physicians from specific areas.
          </DialogDescription>
        </DialogHeader>
        
        <PhysicianManagementDialogContent
          practiceId={selectedPracticeId}
          physicians={physicians}
          practiceMap={practiceMap}
          selectedPhysicians={selectedPhysicians}
          setSelectedPhysicians={setSelectedPhysicians}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          onBulkAssign={(physicianIds) => {
            if (selectedPracticeId) {
              bulkAssignMutation.mutate({ practiceId: selectedPracticeId, physicianIds });
            }
          }}
          onBulkUnassign={(physicianIds) => {
            if (selectedPracticeId) {
              bulkUnassignMutation.mutate({ practiceId: selectedPracticeId, physicianIds });
            }
          }}
          isAssigning={bulkAssignMutation.isPending}
          isUnassigning={bulkUnassignMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

// Import the component definitions to make them available
// (The actual component implementations are in PracticePage-components.tsx for organization)
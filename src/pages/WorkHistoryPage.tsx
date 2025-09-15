import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Briefcase,
  Building,
  Calendar,
  MapPin,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Users,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  User,
  Building2,
  CalendarDays,
  Target,
  Activity,
  BarChart3,
  Timer,
  AlertTriangle,
  CheckCircle,
  FileDown,
  ArrowUpRight,
  History,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician, SelectPhysicianWorkHistory, InsertPhysicianWorkHistory } from "../../shared/schema";
import { insertPhysicianWorkHistorySchema } from "../../shared/schema";
import { z } from "zod";
import { format, differenceInYears, differenceInMonths, parseISO } from "date-fns";

interface WorkHistoryWithPhysician extends SelectPhysicianWorkHistory {
  physician?: SelectPhysician;
}

interface PhysicianWithWorkHistory extends SelectPhysician {
  workHistory?: SelectPhysicianWorkHistory[];
  currentPosition?: SelectPhysicianWorkHistory;
  totalExperience?: number;
  employmentGaps?: Array<{ start: Date; end: Date; duration: number }>;
}

export default function WorkHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [employerFilter, setEmployerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [groupByEmployer, setGroupByEmployer] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedPhysician, setSelectedPhysician] = useState<SelectPhysician | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorkHistory, setEditingWorkHistory] = useState<SelectPhysicianWorkHistory | null>(null);
  const { toast } = useToast();

  // Form for adding/editing work history
  const workHistoryFormSchema = z.object({
    employerName: z.string().min(1, "Employer name is required"),
    position: z.string().default(""),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().default(""),
    address: z.string().default(""),
    supervisorName: z.string().default(""),
    reasonForLeaving: z.string().default(""),
  });
  const form = useForm<z.infer<typeof workHistoryFormSchema>>({
    resolver: zodResolver(workHistoryFormSchema),
    defaultValues: {
      employerName: "",
      position: "",
      startDate: "",
      endDate: "",
      address: "",
      supervisorName: "",
      reasonForLeaving: "",
    },
  });

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

  // Fetch all work history records for all physicians
  const { data: workHistoryData, isLoading: loadingWorkHistory, refetch: refetchWorkHistory } = useQuery({
    queryKey: ['/work-history/all'],
    queryFn: async () => {
      if (physiciansData?.physicians) {
        const allWorkHistory: WorkHistoryWithPhysician[] = [];
        for (const physician of physiciansData.physicians) {
          try {
            const response = await apiRequest(`/physicians/${physician.id}/work-history`);
            const workHistories = Array.isArray(response) ? response : response?.workHistory || [];
            workHistories.forEach((history: SelectPhysicianWorkHistory) => {
              allWorkHistory.push({ ...history, physician });
            });
          } catch (err) {
            // Continue if individual physician has no work history
          }
        }
        return { workHistory: allWorkHistory };
      }
      return { workHistory: [] };
    },
    enabled: !!physiciansData,
  });

  const physicians = physiciansData?.physicians || [];
  const workHistories = workHistoryData?.workHistory || [];

  // Loading state - define early to avoid temporal dead zone issues
  const isLoading = loadingPhysicians || loadingWorkHistory;

  // Create mutation for adding work history
  const addWorkHistoryMutation = useMutation({
    mutationFn: (data: { physicianId: string; workHistory: InsertPhysicianWorkHistory }) =>
      apiRequest(`/physicians/${data.physicianId}/work-history`, {
        method: 'POST',
        body: JSON.stringify(data.workHistory),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Work history added successfully",
      });
      refetchWorkHistory();
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add work history",
        variant: "destructive",
      });
    },
  });

  // Create mutation for updating work history
  const updateWorkHistoryMutation = useMutation({
    mutationFn: (data: { id: string; workHistory: Partial<InsertPhysicianWorkHistory> }) =>
      apiRequest(`/work-history/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data.workHistory),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Work history updated successfully",
      });
      refetchWorkHistory();
      setIsEditDialogOpen(false);
      setEditingWorkHistory(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update work history",
        variant: "destructive",
      });
    },
  });

  // Create mutation for deleting work history
  const deleteWorkHistoryMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/work-history/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Work history deleted successfully",
      });
      refetchWorkHistory();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete work history",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const physiciansWithHistory = new Set<string>();
    const uniqueEmployers = new Set<string>();
    let totalExperienceYears = 0;
    let currentlyEmployed = 0;
    let totalPositions = 0;
    const positionTypes = new Map<string, number>();
    const employerCounts = new Map<string, number>();

    // Map physicians with their work history
    const physicianHistoryMap = new Map<string, SelectPhysicianWorkHistory[]>();
    
    workHistories.forEach((history: WorkHistoryWithPhysician) => {
      if (history.physicianId) {
        physiciansWithHistory.add(history.physicianId);
        
        if (!physicianHistoryMap.has(history.physicianId)) {
          physicianHistoryMap.set(history.physicianId, []);
        }
        physicianHistoryMap.get(history.physicianId)?.push(history);
        
        if (history.employerName) {
          uniqueEmployers.add(history.employerName);
          employerCounts.set(history.employerName, (employerCounts.get(history.employerName) || 0) + 1);
        }
        
        totalPositions++;
        
        // Count position types
        if (history.position) {
          const positionType = history.position.toLowerCase();
          if (positionType.includes('attending')) {
            positionTypes.set('attending', (positionTypes.get('attending') || 0) + 1);
          } else if (positionType.includes('fellow')) {
            positionTypes.set('fellow', (positionTypes.get('fellow') || 0) + 1);
          } else if (positionType.includes('resident')) {
            positionTypes.set('resident', (positionTypes.get('resident') || 0) + 1);
          } else {
            positionTypes.set('other', (positionTypes.get('other') || 0) + 1);
          }
        }
        
        // Calculate experience
        if (history.startDate) {
          const startDate = new Date(history.startDate);
          const endDate = history.endDate ? new Date(history.endDate) : new Date();
          const years = differenceInYears(endDate, startDate);
          totalExperienceYears += years;
          
          // Check if currently employed
          if (!history.endDate) {
            currentlyEmployed++;
          }
        }
      }
    });

    // Calculate average experience per physician
    const avgExperience = physiciansWithHistory.size > 0 
      ? Math.round(totalExperienceYears / physiciansWithHistory.size) 
      : 0;

    // Find top employers
    const topEmployers = Array.from(employerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalPhysicians: physicians.length,
      physiciansWithHistory: physiciansWithHistory.size,
      uniqueEmployers: uniqueEmployers.size,
      avgExperience,
      currentlyEmployed,
      seekingPositions: physiciansWithHistory.size - currentlyEmployed,
      totalPositions,
      positionTypes: Array.from(positionTypes.entries()),
      topEmployers,
    };
  }, [physicians, workHistories]);

  // Get unique employers for filter
  const uniqueEmployers = useMemo(() => {
    const employers = new Set<string>();
    workHistories.forEach((history: WorkHistoryWithPhysician) => {
      if (history.employerName) {
        employers.add(history.employerName);
      }
    });
    return Array.from(employers).sort();
  }, [workHistories]);

  // Create physician work history profiles
  const physicianProfiles = useMemo(() => {
    const profileMap = new Map<string, PhysicianWithWorkHistory>();

    // Initialize with physicians
    physicians.forEach((physician: SelectPhysician) => {
      profileMap.set(physician.id, {
        ...physician,
        workHistory: [],
        totalExperience: 0,
        employmentGaps: [],
      });
    });

    // Add work history data
    workHistories.forEach((history: WorkHistoryWithPhysician) => {
      const profile = profileMap.get(history.physicianId);
      if (profile) {
        if (!profile.workHistory) {
          profile.workHistory = [];
        }
        profile.workHistory.push(history);
      }
    });

    // Calculate total experience and find current position for each physician
    profileMap.forEach((profile) => {
      if (profile.workHistory && profile.workHistory.length > 0) {
        // Sort work history by start date (most recent first)
        profile.workHistory.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
          const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        // Find current position
        profile.currentPosition = profile.workHistory.find(h => !h.endDate);

        // Calculate total experience
        let totalMonths = 0;
        profile.workHistory.forEach(history => {
          if (history.startDate) {
            const startDate = new Date(history.startDate);
            const endDate = history.endDate ? new Date(history.endDate) : new Date();
            totalMonths += differenceInMonths(endDate, startDate);
          }
        });
        profile.totalExperience = Math.round(totalMonths / 12);

        // Find employment gaps
        const gaps: Array<{ start: Date; end: Date; duration: number }> = [];
        const sortedHistory = [...profile.workHistory].sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
          const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
          return dateA.getTime() - dateB.getTime();
        });

        for (let i = 0; i < sortedHistory.length - 1; i++) {
          const current = sortedHistory[i];
          const next = sortedHistory[i + 1];
          
          if (current.endDate && next.startDate) {
            const gapStart = new Date(current.endDate);
            const gapEnd = new Date(next.startDate);
            const gapMonths = differenceInMonths(gapEnd, gapStart);
            
            if (gapMonths > 1) { // Only count gaps greater than 1 month
              gaps.push({
                start: gapStart,
                end: gapEnd,
                duration: gapMonths,
              });
            }
          }
        }
        profile.employmentGaps = gaps;
      }
    });

    return Array.from(profileMap.values());
  }, [physicians, workHistories]);

  // Filter physician profiles based on search and filters
  const filteredProfiles = useMemo(() => {
    return physicianProfiles.filter((profile: PhysicianWithWorkHistory) => {
      // Apply search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const nameMatch = profile.fullLegalName?.toLowerCase().includes(searchLower);
        const positionMatch = profile.workHistory?.some(h => 
          h.position?.toLowerCase().includes(searchLower) ||
          h.employerName?.toLowerCase().includes(searchLower)
        );
        if (!nameMatch && !positionMatch) return false;
      }

      // Apply employer filter
      if (employerFilter !== "all") {
        const hasEmployer = profile.workHistory?.some(h => h.employerName === employerFilter);
        if (!hasEmployer) return false;
      }

      // Apply status filter
      if (statusFilter !== "all") {
        const isCurrentlyEmployed = profile.currentPosition !== undefined;
        if (statusFilter === "employed" && !isCurrentlyEmployed) return false;
        if (statusFilter === "seeking" && isCurrentlyEmployed) return false;
        if (statusFilter === "no-history" && profile.workHistory && profile.workHistory.length > 0) return false;
      }

      // Apply experience filter
      if (experienceFilter !== "all") {
        const exp = profile.totalExperience || 0;
        if (experienceFilter === "0-5" && (exp < 0 || exp > 5)) return false;
        if (experienceFilter === "5-10" && (exp < 5 || exp > 10)) return false;
        if (experienceFilter === "10-20" && (exp < 10 || exp > 20)) return false;
        if (experienceFilter === "20+" && exp < 20) return false;
      }

      return true;
    });
  }, [physicianProfiles, debouncedSearch, employerFilter, statusFilter, experienceFilter]);

  // Sort profiles
  const sortedProfiles = useMemo(() => {
    const sorted = [...filteredProfiles];
    
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.fullLegalName || "").localeCompare(b.fullLegalName || "");
        case "experience":
          return (b.totalExperience || 0) - (a.totalExperience || 0);
        case "current":
          const aDate = a.currentPosition?.startDate ? new Date(a.currentPosition.startDate) : new Date(0);
          const bDate = b.currentPosition?.startDate ? new Date(b.currentPosition.startDate) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        case "positions":
          return (b.workHistory?.length || 0) - (a.workHistory?.length || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [filteredProfiles, sortBy]);

  // Group profiles by employer if enabled
  const groupedProfiles = useMemo(() => {
    if (!groupByEmployer) {
      return { ungrouped: sortedProfiles };
    }

    const grouped: Record<string, PhysicianWithWorkHistory[]> = {};
    sortedProfiles.forEach((profile) => {
      const employer = profile.currentPosition?.employerName || "No Current Employer";
      if (!grouped[employer]) {
        grouped[employer] = [];
      }
      grouped[employer].push(profile);
    });

    // Sort employers alphabetically
    const sortedGrouped: Record<string, PhysicianWithWorkHistory[]> = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }, [sortedProfiles, groupByEmployer]);

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
    const csvData: string[] = [];
    csvData.push("Physician Name,Current Position,Current Employer,Start Date,Total Experience (Years),Previous Positions,Employment Gaps");

    sortedProfiles.forEach(profile => {
      const currentPos = profile.currentPosition;
      const previousCount = (profile.workHistory?.length || 0) - (currentPos ? 1 : 0);
      const gaps = profile.employmentGaps?.length || 0;
      
      csvData.push([
        profile.fullLegalName || "",
        currentPos?.position || "N/A",
        currentPos?.employerName || "N/A",
        currentPos?.startDate || "N/A",
        profile.totalExperience?.toString() || "0",
        previousCount.toString(),
        gaps.toString(),
      ].join(","));
    });

    const blob = new Blob([csvData.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-history-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Work history data has been exported to CSV",
    });
  };

  // Format date range
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return "N/A";
    const start = format(parseISO(startDate), "MMM yyyy");
    const end = endDate ? format(parseISO(endDate), "MMM yyyy") : "Present";
    return `${start} - ${end}`;
  };

  // Calculate tenure
  const calculateTenure = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return "N/A";
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = differenceInMonths(end, start);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years}y ${remainingMonths}m`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  };

  // Handle add work history
  const handleAddWorkHistory = (values: z.infer<typeof workHistoryFormSchema>) => {
    if (selectedPhysician) {
      const workHistoryData: InsertPhysicianWorkHistory = {
        physicianId: selectedPhysician.id,
        employerName: values.employerName,
        position: values.position || null,
        startDate: values.startDate,
        endDate: values.endDate || null,
        address: values.address || null,
        supervisorName: values.supervisorName || null,
        reasonForLeaving: values.reasonForLeaving || null,
      };
      addWorkHistoryMutation.mutate({
        physicianId: selectedPhysician.id,
        workHistory: workHistoryData,
      });
    }
  };

  // Handle edit work history
  const handleEditWorkHistory = (values: z.infer<typeof workHistoryFormSchema>) => {
    if (editingWorkHistory) {
      const workHistoryData: Partial<InsertPhysicianWorkHistory> = {
        employerName: values.employerName,
        position: values.position || null,
        startDate: values.startDate,
        endDate: values.endDate || null,
        address: values.address || null,
        supervisorName: values.supervisorName || null,
        reasonForLeaving: values.reasonForLeaving || null,
      };
      updateWorkHistoryMutation.mutate({
        id: editingWorkHistory.id,
        workHistory: workHistoryData,
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (workHistory: SelectPhysicianWorkHistory) => {
    setEditingWorkHistory(workHistory);
    form.reset({
      employerName: workHistory.employerName,
      position: workHistory.position || "",
      startDate: workHistory.startDate || "",
      endDate: workHistory.endDate || "",
      address: workHistory.address || "",
      supervisorName: workHistory.supervisorName || "",
      reasonForLeaving: workHistory.reasonForLeaving || "",
    });
    setIsEditDialogOpen(true);
  };


  // Stats cards configuration
  const statsCards = [
    {
      title: "Physicians with History",
      value: isLoading ? "..." : stats.physiciansWithHistory.toString(),
      subtitle: `of ${stats.totalPhysicians} total`,
      icon: UserCheck,
      description: "Have work history records",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      progress: stats.totalPhysicians > 0 ? (stats.physiciansWithHistory / stats.totalPhysicians) * 100 : 0,
    },
    {
      title: "Average Experience",
      value: isLoading ? "..." : `${stats.avgExperience}`,
      subtitle: "years",
      icon: Clock,
      description: "Per physician",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Currently Employed",
      value: isLoading ? "..." : stats.currentlyEmployed.toString(),
      subtitle: `${stats.seekingPositions} seeking`,
      icon: Briefcase,
      description: "Active positions",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      progress: stats.physiciansWithHistory > 0 ? (stats.currentlyEmployed / stats.physiciansWithHistory) * 100 : 0,
    },
    {
      title: "Unique Employers",
      value: isLoading ? "..." : stats.uniqueEmployers.toString(),
      subtitle: "institutions",
      icon: Building2,
      description: "Total organizations",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Work History</h1>
            <p className="text-muted-foreground">Manage physician employment history and career progression</p>
          </div>
        </div>
        <Button onClick={exportToCSV} data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
                {stat.subtitle && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {stat.subtitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.progress !== undefined && (
                <Progress value={stat.progress} className="mt-2 h-1" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-gaps">Employment Gaps</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
              <CardDescription>Find and filter physician work history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, position, or employer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                <Select value={employerFilter} onValueChange={setEmployerFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-employer">
                    <SelectValue placeholder="Filter by employer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employers</SelectItem>
                    {uniqueEmployers.map(employer => (
                      <SelectItem key={employer} value={employer}>{employer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status">
                    <SelectValue placeholder="Employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="employed">Currently Employed</SelectItem>
                    <SelectItem value="seeking">Seeking Position</SelectItem>
                    <SelectItem value="no-history">No History</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-experience">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Experience</SelectItem>
                    <SelectItem value="0-5">0-5 years</SelectItem>
                    <SelectItem value="5-10">5-10 years</SelectItem>
                    <SelectItem value="10-20">10-20 years</SelectItem>
                    <SelectItem value="20+">20+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="experience">Total Experience</SelectItem>
                    <SelectItem value="current">Current Position Date</SelectItem>
                    <SelectItem value="positions">Number of Positions</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="groupByEmployer"
                    checked={groupByEmployer}
                    onChange={(e) => setGroupByEmployer(e.target.checked)}
                    className="rounded border-gray-300"
                    data-testid="checkbox-group"
                  />
                  <Label htmlFor="groupByEmployer" className="text-sm">
                    Group by current employer
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Employment History</CardTitle>
              <CardDescription>
                {filteredProfiles.length} physician{filteredProfiles.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredProfiles.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No work history records found. Try adjusting your search criteria.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedProfiles).map(([groupName, profiles]) => (
                    <div key={groupName} className="space-y-2">
                      {groupByEmployer && groupName !== "ungrouped" && (
                        <div className="flex items-center gap-2 py-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{groupName}</h3>
                          <Badge variant="secondary">{profiles.length} physicians</Badge>
                        </div>
                      )}
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[30px]"></TableHead>
                              <TableHead>Physician Name</TableHead>
                              <TableHead>Current Position</TableHead>
                              <TableHead>Institution</TableHead>
                              <TableHead>Years at Current</TableHead>
                              <TableHead>Total Experience</TableHead>
                              <TableHead>Previous Positions</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {profiles.map((profile) => (
                              <Collapsible
                                key={profile.id}
                                open={expandedRows.has(profile.id)}
                                onOpenChange={() => toggleRowExpansion(profile.id)}
                              >
                                <TableRow 
                                  className="cursor-pointer hover:bg-muted/50"
                                  data-testid={`row-physician-${profile.id}`}
                                >
                                  <TableCell>
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-0 h-6 w-6"
                                        data-testid={`button-expand-${profile.id}`}
                                      >
                                        {expandedRows.has(profile.id) ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </CollapsibleTrigger>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <Link href={`/physicians/${profile.id}`} className="hover:underline">
                                      {profile.fullLegalName || "N/A"}
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    {profile.currentPosition ? (
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {profile.currentPosition.position}
                                        </Badge>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">No current position</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {profile.currentPosition?.employerName || (
                                      <span className="text-muted-foreground">N/A</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {profile.currentPosition ? (
                                      calculateTenure(profile.currentPosition.startDate, profile.currentPosition.endDate)
                                    ) : (
                                      <span className="text-muted-foreground">N/A</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>{profile.totalExperience || 0} years</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {profile.workHistory && profile.workHistory.length > 1 ? (
                                      <Badge>{profile.workHistory.length - 1} previous</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">None</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedPhysician(profile);
                                              setIsAddDialogOpen(true);
                                            }}
                                            data-testid={`button-add-${profile.id}`}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Add work history</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                </TableRow>
                                
                                <CollapsibleContent asChild>
                                  <TableRow>
                                    <TableCell colSpan={8} className="p-0">
                                      <div className="bg-muted/50 p-6">
                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold flex items-center gap-2">
                                              <History className="h-4 w-4" />
                                              Complete Employment Timeline
                                            </h4>
                                            {profile.employmentGaps && profile.employmentGaps.length > 0 && (
                                              <Badge variant="outline" className="text-orange-600">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                {profile.employmentGaps.length} employment gap{profile.employmentGaps.length > 1 ? 's' : ''}
                                              </Badge>
                                            )}
                                          </div>

                                          {profile.workHistory && profile.workHistory.length > 0 ? (
                                            <div className="relative pl-8">
                                              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border"></div>
                                              {profile.workHistory.map((history, index) => (
                                                <div key={history.id} className="relative mb-6">
                                                  <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 ${
                                                    !history.endDate 
                                                      ? 'bg-green-500 border-green-500' 
                                                      : 'bg-background border-muted-foreground'
                                                  }`}></div>
                                                  
                                                  <Card className="ml-4">
                                                    <CardHeader className="pb-3">
                                                      <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                          <CardTitle className="text-base">
                                                            {history.position || "Position not specified"}
                                                          </CardTitle>
                                                          <CardDescription className="flex items-center gap-2">
                                                            <Building2 className="h-3 w-3" />
                                                            {history.employerName}
                                                          </CardDescription>
                                                        </div>
                                                        <div className="flex gap-2">
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(history)}
                                                            data-testid={`button-edit-${history.id}`}
                                                          >
                                                            <Edit className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                              if (window.confirm("Are you sure you want to delete this work history entry?")) {
                                                                deleteWorkHistoryMutation.mutate(history.id);
                                                              }
                                                            }}
                                                            data-testid={`button-delete-${history.id}`}
                                                          >
                                                            <Trash2 className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                                          <span>{formatDateRange(history.startDate, history.endDate)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                          <Timer className="h-3 w-3 text-muted-foreground" />
                                                          <span>{calculateTenure(history.startDate, history.endDate)}</span>
                                                        </div>
                                                        {history.address && (
                                                          <div className="flex items-center gap-2 col-span-2">
                                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-muted-foreground">{history.address}</span>
                                                          </div>
                                                        )}
                                                        {history.supervisorName && (
                                                          <div className="flex items-center gap-2 col-span-2">
                                                            <User className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Supervisor: {history.supervisorName}</span>
                                                          </div>
                                                        )}
                                                        {history.reasonForLeaving && (
                                                          <div className="col-span-2 pt-2 border-t">
                                                            <p className="text-muted-foreground text-xs">
                                                              <span className="font-medium">Reason for leaving:</span> {history.reasonForLeaving}
                                                            </p>
                                                          </div>
                                                        )}
                                                      </div>
                                                      {!history.endDate && (
                                                        <Badge className="mt-3" variant="default">
                                                          <CheckCircle className="h-3 w-3 mr-1" />
                                                          Current Position
                                                        </Badge>
                                                      )}
                                                    </CardContent>
                                                  </Card>

                                                  {/* Show employment gap after this position if exists */}
                                                  {index < profile.workHistory!.length - 1 && profile.employmentGaps?.find(gap => {
                                                    const gapStart = new Date(gap.start).getTime();
                                                    const historyEnd = history.endDate ? new Date(history.endDate).getTime() : 0;
                                                    return Math.abs(gapStart - historyEnd) < 86400000; // Within 1 day
                                                  }) && (
                                                    <div className="ml-4 my-2">
                                                      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                                                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                                                        <AlertDescription className="text-orange-800 dark:text-orange-200">
                                                          Employment gap: {
                                                            profile.employmentGaps?.find(gap => {
                                                              const gapStart = new Date(gap.start).getTime();
                                                              const historyEnd = history.endDate ? new Date(history.endDate).getTime() : 0;
                                                              return Math.abs(gapStart - historyEnd) < 86400000;
                                                            })?.duration
                                                          } months
                                                        </AlertDescription>
                                                      </Alert>
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <Alert>
                                              <AlertCircle className="h-4 w-4" />
                                              <AlertDescription>
                                                No work history records available for this physician.
                                              </AlertDescription>
                                            </Alert>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Career Timeline Visualization</CardTitle>
              <CardDescription>Visual representation of physician career progressions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedProfiles.slice(0, 10).map((profile) => (
                  <div key={profile.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{profile.fullLegalName}</h3>
                      <span className="text-sm text-muted-foreground">
                        {profile.totalExperience || 0} years total experience
                      </span>
                    </div>
                    
                    {profile.workHistory && profile.workHistory.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-0 right-0 h-1 bg-muted rounded-full top-4"></div>
                        <div className="relative flex justify-between">
                          {profile.workHistory.slice(0, 5).map((history, index) => (
                            <TooltipProvider key={history.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${
                                    !history.endDate 
                                      ? 'bg-green-500 text-white' 
                                      : history.position?.toLowerCase().includes('fellow')
                                      ? 'bg-purple-500 text-white'
                                      : history.position?.toLowerCase().includes('resident')
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-500 text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-semibold">{history.position}</p>
                                    <p className="text-xs">{history.employerName}</p>
                                    <p className="text-xs">{formatDateRange(history.startDate, history.endDate)}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No work history available</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Position Type Distribution</CardTitle>
                <CardDescription>Breakdown of current and past positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.positionTypes.map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          type === 'attending' ? 'bg-green-500' :
                          type === 'fellow' ? 'bg-purple-500' :
                          type === 'resident' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}></div>
                        <span className="capitalize">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{count}</span>
                        <Progress 
                          value={(count / stats.totalPositions) * 100} 
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Employers</CardTitle>
                <CardDescription>Most common institutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topEmployers.map(([employer, count], index) => (
                    <div key={employer} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-sm truncate max-w-[200px]">{employer}</span>
                      </div>
                      <Badge>{count} physicians</Badge>
                    </div>
                  ))}
                  {stats.topEmployers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No employer data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Career Progression Patterns</CardTitle>
              <CardDescription>Common career paths and advancement trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Average Career Length</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.avgExperience} years</p>
                  <p className="text-xs text-muted-foreground">Across all physicians</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Positions per Physician</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.physiciansWithHistory > 0 
                      ? (stats.totalPositions / stats.physiciansWithHistory).toFixed(1)
                      : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">Average number</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Employment Rate</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.physiciansWithHistory > 0 
                      ? Math.round((stats.currentlyEmployed / stats.physiciansWithHistory) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Currently employed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Gaps Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employment Gap Analysis</CardTitle>
              <CardDescription>Physicians with gaps in their employment history</CardDescription>
            </CardHeader>
            <CardContent>
              {physicianProfiles.filter(p => p.employmentGaps && p.employmentGaps.length > 0).length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No employment gaps detected in the current physician records.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {physicianProfiles
                    .filter(p => p.employmentGaps && p.employmentGaps.length > 0)
                    .map(profile => (
                      <Card key={profile.id} className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {profile.fullLegalName}
                            </CardTitle>
                            <Badge variant="outline" className="text-orange-600">
                              {profile.employmentGaps?.length} gap{profile.employmentGaps?.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {profile.employmentGaps?.map((gap, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  <span>
                                    {format(gap.start, "MMM yyyy")} - {format(gap.end, "MMM yyyy")}
                                  </span>
                                </div>
                                <Badge variant="secondary">
                                  {gap.duration} month{gap.duration !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Work History Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Work History</DialogTitle>
            <DialogDescription>
              Add a new employment record for {selectedPhysician?.fullLegalName}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddWorkHistory)} className="space-y-4">
              <FormField
                control={form.control}
                name="employerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter employer name" data-testid="input-employer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter position title" data-testid="input-position" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-end-date" />
                      </FormControl>
                      <FormDescription>Leave empty if current position</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter workplace address" data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supervisorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervisor Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter supervisor name" data-testid="input-supervisor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reasonForLeaving"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leaving</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter reason for leaving" data-testid="input-reason" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addWorkHistoryMutation.isPending}
                  data-testid="button-submit"
                >
                  {addWorkHistoryMutation.isPending ? "Adding..." : "Add Work History"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Work History Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Work History</DialogTitle>
            <DialogDescription>
              Update employment record
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditWorkHistory)} className="space-y-4">
              <FormField
                control={form.control}
                name="employerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter employer name" data-testid="input-edit-employer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter position title" data-testid="input-edit-position" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-edit-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-edit-end-date" />
                      </FormControl>
                      <FormDescription>Leave empty if current position</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter workplace address" data-testid="input-edit-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supervisorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervisor Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter supervisor name" data-testid="input-edit-supervisor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reasonForLeaving"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leaving</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter reason for leaving" data-testid="input-edit-reason" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingWorkHistory(null);
                    form.reset();
                  }}
                  data-testid="button-edit-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateWorkHistoryMutation.isPending}
                  data-testid="button-edit-submit"
                >
                  {updateWorkHistoryMutation.isPending ? "Updating..." : "Update Work History"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
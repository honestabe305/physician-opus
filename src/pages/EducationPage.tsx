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
  GraduationCap,
  School,
  Award,
  BookOpen,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Clock,
  Building,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Users,
  Trophy,
  Star,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle,
  BookMarked,
  Stethoscope,
  BrainCircuit,
  CalendarDays,
  School2,
  Download,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician, SelectPhysicianEducation, SelectPhysicianCertification } from "../../shared/schema";
import { format, differenceInYears, parseISO } from "date-fns";

interface EducationWithPhysician extends SelectPhysicianEducation {
  physician?: SelectPhysician;
}

interface PhysicianWithEducation extends SelectPhysician {
  educations?: SelectPhysicianEducation[];
  certifications?: SelectPhysicianCertification[];
}

// Form schema for adding education
const educationFormSchema = z.object({
  physicianId: z.string().min(1, "Physician is required"),
  educationType: z.enum(["medical_school", "residency", "fellowship"], {
    required_error: "Education type is required",
  }),
  institutionName: z.string().min(1, "Institution name is required"),
  specialty: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  graduationYear: z.number().optional(),
});

type EducationFormData = z.infer<typeof educationFormSchema>;

export default function EducationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const [showTimeline, setShowTimeline] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  // Fetch all education records for all physicians
  const { data: educationData, isLoading: loadingEducation, refetch: refetchEducation } = useQuery({
    queryKey: ['/education/all'],
    queryFn: async () => {
      if (physiciansData?.physicians) {
        const allEducation: EducationWithPhysician[] = [];
        for (const physician of physiciansData.physicians) {
          try {
            const response = await apiRequest(`/physicians/${physician.id}/education`);
            const educations = Array.isArray(response) ? response : response?.educations || [];
            educations.forEach((edu: SelectPhysicianEducation) => {
              allEducation.push({ ...edu, physician });
            });
          } catch (err) {
            // Continue if individual physician has no education records
          }
        }
        return { educations: allEducation };
      }
      return { educations: [] };
    },
    enabled: !!physiciansData,
  });

  // Fetch certifications for all physicians
  const { data: certificationsData, isLoading: loadingCertifications } = useQuery({
    queryKey: ['/certifications/all'],
    queryFn: async () => {
      if (physiciansData?.physicians) {
        const allCertifications: SelectPhysicianCertification[] = [];
        for (const physician of physiciansData.physicians) {
          try {
            const response = await apiRequest(`/physicians/${physician.id}/certifications`);
            const certifications = Array.isArray(response) ? response : response?.certifications || [];
            certifications.forEach((cert: SelectPhysicianCertification) => {
              allCertifications.push(cert);
            });
          } catch (err) {
            // Continue if individual physician has no certifications
          }
        }
        return { certifications: allCertifications };
      }
      return { certifications: [] };
    },
    enabled: !!physiciansData,
  });

  const physicians = physiciansData?.physicians || [];
  const educations = educationData?.educations || [];
  const certifications = certificationsData?.certifications || [];

  // Form setup for adding education
  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationFormSchema),
    defaultValues: {
      physicianId: selectedPhysicianId,
      educationType: undefined,
      institutionName: "",
      specialty: "",
      location: "",
      startDate: "",
      completionDate: "",
      graduationYear: undefined,
    },
  });

  // Mutation for adding education
  const addEducationMutation = useMutation({
    mutationFn: async (data: EducationFormData) => {
      const response = await apiRequest(`/physicians/${data.physicianId}/education`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Education record added successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
      refetchEducation();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add education record",
      });
    },
  });

  const handleSubmit = (data: EducationFormData) => {
    addEducationMutation.mutate(data);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const medicalSchools = new Set<string>();
    const residencyPrograms = new Set<string>();
    const specialties = new Set<string>();
    let totalGraduationYears = 0;
    let graduationCount = 0;
    let fellowshipCount = 0;
    let boardCertifiedCount = 0;
    let residencyCount = 0;
    let medicalSchoolCount = 0;

    // Map physicians with their education
    const physiciansWithEducationCount = new Set<string>();

    educations.forEach((edu: EducationWithPhysician) => {
      if (edu.physicianId) {
        physiciansWithEducationCount.add(edu.physicianId);
      }

      if (edu.educationType === 'medical_school') {
        medicalSchoolCount++;
        if (edu.institutionName) {
          medicalSchools.add(edu.institutionName);
        }
        if (edu.graduationYear) {
          totalGraduationYears += new Date().getFullYear() - edu.graduationYear;
          graduationCount++;
        }
      } else if (edu.educationType === 'residency') {
        residencyCount++;
        if (edu.institutionName) {
          residencyPrograms.add(edu.institutionName);
        }
        if (edu.specialty) {
          specialties.add(edu.specialty);
        }
      } else if (edu.educationType === 'fellowship') {
        fellowshipCount++;
        if (edu.specialty) {
          specialties.add(edu.specialty);
        }
      }
    });

    // Count board certified physicians
    const boardCertifiedPhysicians = new Set<string>();
    certifications.forEach((cert: SelectPhysicianCertification) => {
      if (cert.physicianId && cert.boardName) {
        boardCertifiedPhysicians.add(cert.physicianId);
      }
    });
    boardCertifiedCount = boardCertifiedPhysicians.size;

    const avgExperience = graduationCount > 0 ? Math.round(totalGraduationYears / graduationCount) : 0;

    return {
      totalPhysicians: physicians.length,
      physiciansWithEducation: physiciansWithEducationCount.size,
      medicalSchools: medicalSchools.size,
      residencyPrograms: residencyPrograms.size,
      avgExperience,
      fellowshipCount,
      boardCertifiedCount,
      specialties: specialties.size,
      medicalSchoolCount,
      residencyCount,
    };
  }, [physicians, educations, certifications]);

  // Get unique medical schools
  const uniqueMedicalSchools = useMemo(() => {
    const schools = new Set<string>();
    educations.forEach((edu: EducationWithPhysician) => {
      if (edu.educationType === 'medical_school' && edu.institutionName) {
        schools.add(edu.institutionName);
      }
    });
    return Array.from(schools).sort();
  }, [educations]);

  // Get unique specialties
  const uniqueSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    educations.forEach((edu: EducationWithPhysician) => {
      if (edu.specialty) {
        specialties.add(edu.specialty);
      }
    });
    return Array.from(specialties).sort();
  }, [educations]);

  // Create physician education profiles
  const physicianProfiles = useMemo(() => {
    const profileMap = new Map<string, PhysicianWithEducation>();

    // Initialize with physicians
    physicians.forEach((physician: SelectPhysician) => {
      profileMap.set(physician.id, {
        ...physician,
        educations: [],
        certifications: [],
      });
    });

    // Add education records
    educations.forEach((edu: EducationWithPhysician) => {
      const profile = profileMap.get(edu.physicianId);
      if (profile) {
        if (!profile.educations) profile.educations = [];
        profile.educations.push(edu);
      }
    });

    // Add certifications
    certifications.forEach((cert: SelectPhysicianCertification) => {
      const profile = profileMap.get(cert.physicianId);
      if (profile) {
        if (!profile.certifications) profile.certifications = [];
        profile.certifications.push(cert);
      }
    });

    // Sort education records by date for each physician
    profileMap.forEach((profile) => {
      if (profile.educations) {
        profile.educations.sort((a, b) => {
          // Sort by education type order: medical_school, residency, fellowship
          const typeOrder = { medical_school: 0, residency: 1, fellowship: 2 };
          const aOrder = typeOrder[a.educationType as keyof typeof typeOrder] || 3;
          const bOrder = typeOrder[b.educationType as keyof typeof typeOrder] || 3;
          if (aOrder !== bOrder) return aOrder - bOrder;

          // Then by start date
          if (a.startDate && b.startDate) {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          }
          return 0;
        });
      }
    });

    return Array.from(profileMap.values());
  }, [physicians, educations, certifications]);

  // Filter physician profiles
  const filteredProfiles = useMemo(() => {
    return physicianProfiles.filter((profile) => {
      // Apply search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const nameMatch = profile.fullLegalName?.toLowerCase().includes(searchLower);
        const schoolMatch = profile.educations?.some(edu => 
          edu.institutionName?.toLowerCase().includes(searchLower)
        );
        if (!nameMatch && !schoolMatch) return false;
      }

      // Apply school filter
      if (schoolFilter !== "all") {
        const hasMedicalSchool = profile.educations?.some(edu => 
          edu.educationType === 'medical_school' && edu.institutionName === schoolFilter
        );
        if (!hasMedicalSchool) return false;
      }

      // Apply type filter
      if (typeFilter !== "all") {
        if (typeFilter === "fellowship") {
          const hasFellowship = profile.educations?.some(edu => edu.educationType === 'fellowship');
          if (!hasFellowship) return false;
        } else if (typeFilter === "board-certified") {
          const isBoardCertified = profile.certifications && profile.certifications.length > 0;
          if (!isBoardCertified) return false;
        } else if (typeFilter === "no-education") {
          const hasEducation = profile.educations && profile.educations.length > 0;
          if (hasEducation) return false;
        }
      }

      // Apply specialty filter
      if (specialtyFilter !== "all") {
        const hasSpecialty = profile.educations?.some(edu => edu.specialty === specialtyFilter);
        if (!hasSpecialty) return false;
      }

      return true;
    });
  }, [physicianProfiles, debouncedSearch, schoolFilter, typeFilter, specialtyFilter]);

  // Sort profiles
  const sortedProfiles = useMemo(() => {
    const sorted = [...filteredProfiles];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.fullLegalName || "").localeCompare(b.fullLegalName || "");
        case "graduation":
          const aGrad = a.educations?.find(e => e.educationType === 'medical_school')?.graduationYear || 0;
          const bGrad = b.educations?.find(e => e.educationType === 'medical_school')?.graduationYear || 0;
          return bGrad - aGrad;
        case "experience":
          const aExp = a.educations?.find(e => e.educationType === 'medical_school')?.graduationYear;
          const bExp = b.educations?.find(e => e.educationType === 'medical_school')?.graduationYear;
          if (!aExp) return 1;
          if (!bExp) return -1;
          return aExp - bExp;
        default:
          return 0;
      }
    });

    return sorted;
  }, [filteredProfiles, sortBy]);

  // Group profiles
  const groupedProfiles = useMemo(() => {
    if (groupBy === "none") {
      return { "All Physicians": sortedProfiles };
    }

    const grouped: Record<string, PhysicianWithEducation[]> = {};

    sortedProfiles.forEach((profile) => {
      let groupKey = "No Education Data";

      if (groupBy === "medical-school") {
        const medSchool = profile.educations?.find(e => e.educationType === 'medical_school');
        if (medSchool?.institutionName) {
          groupKey = medSchool.institutionName;
        }
      } else if (groupBy === "residency") {
        const residency = profile.educations?.find(e => e.educationType === 'residency');
        if (residency?.institutionName) {
          groupKey = residency.institutionName;
        } else {
          groupKey = "No Residency Data";
        }
      } else if (groupBy === "specialty") {
        const specialty = profile.educations?.find(e => e.specialty)?.specialty;
        if (specialty) {
          groupKey = specialty;
        } else {
          groupKey = "No Specialty";
        }
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(profile);
    });

    // Sort group keys alphabetically
    const sortedGrouped: Record<string, PhysicianWithEducation[]> = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }, [sortedProfiles, groupBy]);

  // Calculate years of experience
  const calculateExperience = (graduationYear: number | null | undefined) => {
    if (!graduationYear) return "N/A";
    const years = new Date().getFullYear() - graduationYear;
    return `${years} years`;
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

  // Get education summary for display
  const getEducationSummary = (profile: PhysicianWithEducation) => {
    const medSchool = profile.educations?.find(e => e.educationType === 'medical_school');
    const residency = profile.educations?.find(e => e.educationType === 'residency');
    const fellowship = profile.educations?.find(e => e.educationType === 'fellowship');

    return {
      medicalSchool: medSchool?.institutionName || "N/A",
      graduationYear: medSchool?.graduationYear || null,
      residency: residency ? `${residency.specialty || ""} - ${residency.institutionName || ""}` : "N/A",
      fellowship: fellowship ? `${fellowship.specialty || ""} - ${fellowship.institutionName || ""}` : "None",
      hasFellowship: !!fellowship,
      isBoardCertified: profile.certifications && profile.certifications.length > 0,
    };
  };

  // Format date range for education
  const formatEducationDateRange = (edu: SelectPhysicianEducation) => {
    if (edu.startDate && edu.completionDate) {
      return `${format(parseISO(edu.startDate), 'MMM yyyy')} - ${format(parseISO(edu.completionDate), 'MMM yyyy')}`;
    } else if (edu.startDate) {
      return `Started ${format(parseISO(edu.startDate), 'MMM yyyy')}`;
    } else if (edu.completionDate) {
      return `Completed ${format(parseISO(edu.completionDate), 'MMM yyyy')}`;
    } else if (edu.graduationYear) {
      return `Graduated ${edu.graduationYear}`;
    }
    return "Dates not specified";
  };

  // Identify prestigious institutions (example list)
  const prestigiousInstitutions = [
    "Harvard Medical School", "Johns Hopkins", "Mayo Clinic", "Stanford",
    "Yale", "Columbia", "University of Pennsylvania", "Duke",
    "Washington University", "Cornell", "UCLA", "UCSF"
  ];

  const isPrestigiousInstitution = (institutionName: string | null | undefined) => {
    if (!institutionName) return false;
    return prestigiousInstitutions.some(inst => 
      institutionName.toLowerCase().includes(inst.toLowerCase())
    );
  };

  const isLoading = loadingPhysicians || loadingEducation || loadingCertifications;

  // Stats cards configuration
  const statsCards = [
    {
      title: "Total Physicians",
      value: isLoading ? "..." : stats.physiciansWithEducation.toString(),
      subtitle: `of ${stats.totalPhysicians} total`,
      change: "with education records",
      icon: UserCheck,
      description: "Have education data",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Medical Schools",
      value: isLoading ? "..." : stats.medicalSchools.toString(),
      subtitle: "institutions",
      change: `${stats.medicalSchoolCount} records`,
      icon: School,
      description: "Unique schools represented",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Avg Experience",
      value: isLoading ? "..." : `${stats.avgExperience}`,
      subtitle: "years",
      change: "since graduation",
      icon: Clock,
      description: "Average years of practice",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Fellowship Training",
      value: isLoading ? "..." : stats.fellowshipCount.toString(),
      subtitle: "physicians",
      change: `${stats.boardCertifiedCount} board certified`,
      icon: Trophy,
      description: "Advanced training completed",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Education & Training</h1>
            <p className="text-muted-foreground">Manage physician education history and academic credentials</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2"
          data-testid="button-add-education"
        >
          <Plus className="h-4 w-4" />
          Add Education
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <span className="text-sm text-muted-foreground">{stat.subtitle}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BookOpen className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="statistics" data-testid="tab-statistics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Education Records</CardTitle>
                  <CardDescription>
                    Track medical education, residency, and fellowship training
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-export">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by physician name or institution..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger className="w-[200px]" data-testid="select-school">
                      <School2 className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Medical Schools</SelectItem>
                      {uniqueMedicalSchools.map((school) => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-type">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="fellowship">Has Fellowship</SelectItem>
                      <SelectItem value="board-certified">Board Certified</SelectItem>
                      <SelectItem value="no-education">No Education Data</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-specialty">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {uniqueSpecialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]" data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="graduation">Graduation (Recent)</SelectItem>
                      <SelectItem value="experience">Experience (Most)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger className="w-[200px]" data-testid="select-group">
                      <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Grouping</SelectItem>
                      <SelectItem value="medical-school">Medical School</SelectItem>
                      <SelectItem value="residency">Residency Program</SelectItem>
                      <SelectItem value="specialty">Specialty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold">{filteredProfiles.length}</span> of{" "}
                  <span className="font-semibold">{physicianProfiles.length}</span> physicians
                </p>
              </div>

              {/* Education Table */}
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedProfiles).map(([groupName, profiles]) => (
                    <div key={groupName} className="space-y-3">
                      {groupBy !== "none" && (
                        <div className="flex items-center gap-2 mb-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-sm">
                            {groupName}
                            <Badge variant="secondary" className="ml-2">
                              {profiles.length} physicians
                            </Badge>
                          </h3>
                        </div>
                      )}
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[30px]"></TableHead>
                              <TableHead>Physician Name</TableHead>
                              <TableHead>Medical School</TableHead>
                              <TableHead>Graduation Year</TableHead>
                              <TableHead>Residency</TableHead>
                              <TableHead>Fellowship</TableHead>
                              <TableHead>Experience</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {profiles.map((profile) => {
                              const summary = getEducationSummary(profile);
                              const isExpanded = expandedRows.has(profile.id);

                              return (
                                <>
                                  <TableRow 
                                    key={profile.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    data-testid={`row-physician-${profile.id}`}
                                  >
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleRowExpansion(profile.id)}
                                        data-testid={`button-expand-${profile.id}`}
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <Link href={`/physicians/${profile.id}`}>
                                        <a className="text-primary hover:underline" data-testid={`link-physician-${profile.id}`}>
                                          {profile.fullLegalName || "Unknown"}
                                        </a>
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {summary.medicalSchool}
                                        {isPrestigiousInstitution(summary.medicalSchool) && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Star className="h-3 w-3 text-yellow-500" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Prestigious Institution</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {summary.graduationYear || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">
                                        {summary.residency}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {summary.hasFellowship ? (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                          <Award className="h-3 w-3 mr-1" />
                                          {summary.fellowship}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">None</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm font-medium">
                                        {calculateExperience(summary.graduationYear)}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        {summary.isBoardCertified && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Badge variant="outline" className="border-green-500 text-green-600">
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Certified
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Board Certified</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow>
                                      <TableCell colSpan={8} className="bg-muted/20 p-4">
                                        <div className="space-y-4">
                                          <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4" />
                                            Complete Education Timeline
                                          </h4>
                                          
                                          {profile.educations && profile.educations.length > 0 ? (
                                            <div className="space-y-3 ml-6">
                                              {profile.educations.map((edu, index) => (
                                                <div key={edu.id} className="flex gap-4 items-start">
                                                  <div className="relative">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                      edu.educationType === 'medical_school' ? 'bg-blue-500' :
                                                      edu.educationType === 'residency' ? 'bg-green-500' :
                                                      'bg-purple-500'
                                                    }`} />
                                                    {index < profile.educations!.length - 1 && (
                                                      <div className="absolute top-3 left-1.5 w-0.5 h-16 bg-gray-300" />
                                                    )}
                                                  </div>
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <Badge variant={
                                                        edu.educationType === 'medical_school' ? 'default' :
                                                        edu.educationType === 'residency' ? 'secondary' :
                                                        'outline'
                                                      }>
                                                        {edu.educationType.replace('_', ' ').toUpperCase()}
                                                      </Badge>
                                                      <span className="text-sm text-muted-foreground">
                                                        {formatEducationDateRange(edu)}
                                                      </span>
                                                    </div>
                                                    <p className="font-medium">
                                                      {edu.institutionName}
                                                      {isPrestigiousInstitution(edu.institutionName) && (
                                                        <Star className="inline h-3 w-3 text-yellow-500 ml-1" />
                                                      )}
                                                    </p>
                                                    {edu.specialty && (
                                                      <p className="text-sm text-muted-foreground">
                                                        Specialty: {edu.specialty}
                                                      </p>
                                                    )}
                                                    {edu.location && (
                                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {edu.location}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-muted-foreground ml-6">
                                              No education records available
                                            </p>
                                          )}

                                          {profile.certifications && profile.certifications.length > 0 && (
                                            <>
                                              <h4 className="font-semibold text-sm flex items-center gap-2 mt-4">
                                                <Award className="h-4 w-4" />
                                                Board Certifications
                                              </h4>
                                              <div className="grid grid-cols-2 gap-3 ml-6">
                                                {profile.certifications.map((cert) => (
                                                  <div key={cert.id} className="flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                    <div>
                                                      <p className="text-sm font-medium">{cert.specialty}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {cert.boardName}
                                                        {cert.certificationDate && (
                                                          <span> • Certified {format(parseISO(cert.certificationDate), 'yyyy')}</span>
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </>
                                          )}
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
                    </div>
                  ))}
                </div>
              )}

              {filteredProfiles.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <School className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    No education records found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {debouncedSearch
                      ? "Try adjusting your search criteria"
                      : "Start by adding education records for physicians"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Education Timeline View</CardTitle>
              <CardDescription>
                Visualize the educational journey of physicians over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Select a physician from the overview tab to view their detailed education timeline.
                  Timeline visualization helps track the progression from medical school through residency and fellowship training.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Education Analytics</CardTitle>
              <CardDescription>
                Insights and statistics about physician education and training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Top Medical Schools</h4>
                  <div className="space-y-2">
                    {uniqueMedicalSchools.slice(0, 5).map((school, index) => {
                      const count = educations.filter(e => 
                        e.educationType === 'medical_school' && e.institutionName === school
                      ).length;
                      return (
                        <div key={school} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm">
                              {school}
                              {isPrestigiousInstitution(school) && (
                                <Star className="inline h-3 w-3 text-yellow-500 ml-1" />
                              )}
                            </span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Specialties Distribution</h4>
                  <div className="space-y-2">
                    {uniqueSpecialties.slice(0, 5).map((specialty, index) => {
                      const count = educations.filter(e => e.specialty === specialty).length;
                      return (
                        <div key={specialty} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm">{specialty}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Education Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.physiciansWithEducation > 0 
                        ? Math.round((stats.physiciansWithEducation / stats.totalPhysicians) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Physicians with education data
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Fellowship Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.physiciansWithEducation > 0
                        ? Math.round((stats.fellowshipCount / stats.physiciansWithEducation) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completed fellowship training
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Board Certification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalPhysicians > 0
                        ? Math.round((stats.boardCertifiedCount / stats.totalPhysicians) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Board certified physicians
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Education Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Education Record</DialogTitle>
            <DialogDescription>
              Add education and training information for a physician
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
                name="educationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select education type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="medical_school">Medical School</SelectItem>
                        <SelectItem value="residency">Residency</SelectItem>
                        <SelectItem value="fellowship">Fellowship</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of medical education or training
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institutionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter institution name" {...field} />
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
                    <FormLabel>Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter specialty (if applicable)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State or Country" {...field} />
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
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="completionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="graduationYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Graduation Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 2020" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addEducationMutation.isPending}>
                  {addEducationMutation.isPending ? "Adding..." : "Add Education"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
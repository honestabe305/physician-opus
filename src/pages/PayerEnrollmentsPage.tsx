import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Building2,
  Calendar,
  Filter,
  Download,
  Upload,
  Workflow,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

import { insertPayerEnrollmentSchema, type InsertPayerEnrollment } from "../../shared/schema";

// Extended schema with additional UI fields
const payerEnrollmentFormSchema = insertPayerEnrollmentSchema.extend({
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium').optional(),
  notes: z.string().optional(),
});

type PayerEnrollmentFormData = z.infer<typeof payerEnrollmentFormSchema>;

interface PayerEnrollment {
  id: string;
  physicianId: string;
  physicianName?: string;
  payerId: string;
  payerName?: string;
  practiceLocationId: string;
  practiceLocationName?: string;
  enrollmentStatus: string;
  progressPercentage: number;
  submissionDate?: string;
  approvalDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  providerNumber?: string;
  notes?: string;
  priority: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Physician {
  id: string;
  fullLegalName: string;
}

interface Payer {
  id: string;
  name: string;
  isActive: boolean;
}

interface PracticeLocation {
  id: string;
  name: string;
  isActive: boolean;
}

const enrollmentStatusLabels = {
  discovery: "Discovery",
  data_complete: "Data Complete",
  submitted: "Submitted",
  payer_processing: "Payer Processing",
  approved: "Approved",
  active: "Active",
  denied: "Denied",
  stopped: "Stopped"
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent"
};

const statusColors = {
  discovery: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  data_complete: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  submitted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  payer_processing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  denied: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  stopped: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const statusIcons = {
  discovery: <Search className="w-4 h-4" />,
  data_complete: <FileText className="w-4 h-4" />,
  submitted: <TrendingUp className="w-4 h-4" />,
  payer_processing: <Clock className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  active: <CheckCircle className="w-4 h-4" />,
  denied: <AlertCircle className="w-4 h-4" />,
  stopped: <AlertCircle className="w-4 h-4" />
};

export default function PayerEnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payerFilter, setPayerFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedEnrollment, setSelectedEnrollment] = useState<PayerEnrollment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const { toast } = useToast();

  // Fetch payer enrollments
  const { data: enrollments, isLoading, error, refetch } = useQuery<PayerEnrollment[]>({
    queryKey: ['/api/payer-enrollments'],
    queryFn: async () => {
      const response = await apiRequest('/api/payer-enrollments');
      return response || [];
    }
  });

  // Fetch supporting data for dropdowns
  const { data: physicians } = useQuery<Physician[]>({
    queryKey: ['/api/physicians'],
    queryFn: async () => {
      const response = await apiRequest('/api/physicians');
      return response || [];
    }
  });

  const { data: payers } = useQuery<Payer[]>({
    queryKey: ['/api/payers'],
    queryFn: async () => {
      const response = await apiRequest('/api/payers');
      return response || [];
    }
  });

  const { data: practiceLocations } = useQuery<PracticeLocation[]>({
    queryKey: ['/api/practice-locations'],
    queryFn: async () => {
      const response = await apiRequest('/api/practice-locations');
      return response || [];
    }
  });

  // Create form
  const createForm = useForm<PayerEnrollmentFormData>({
    resolver: zodResolver(payerEnrollmentSchema),
    defaultValues: {
      physicianId: "",
      payerId: "",
      practiceLocationId: "",
      enrollmentStatus: "discovery",
      progressPercentage: 0,
      submissionDate: "",
      approvalDate: "",
      effectiveDate: "",
      expirationDate: "",
      providerNumber: "",
      notes: "",
      priority: "medium",
      isActive: true,
    }
  });

  // Status update form
  const statusForm = useForm<{ status: string; notes: string }>({
    defaultValues: {
      status: "",
      notes: "",
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: PayerEnrollmentFormData) => {
      return await apiRequest('/api/payer-enrollments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payer-enrollments'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Payer enrollment created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payer enrollment",
        variant: "destructive",
      });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return await apiRequest(`/api/payer-enrollments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payer-enrollments'] });
      setIsStatusUpdateDialogOpen(false);
      setSelectedEnrollment(null);
      statusForm.reset();
      toast({
        title: "Success",
        description: "Enrollment status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update enrollment status",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/payer-enrollments/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payer-enrollments'] });
      toast({
        title: "Success",
        description: "Payer enrollment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payer enrollment",
        variant: "destructive",
      });
    }
  });

  // Filter enrollments based on search and filters
  const filteredEnrollments = enrollments?.filter(enrollment => {
    const matchesSearch = 
      enrollment.physicianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.payerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.practiceLocationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.providerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || enrollment.enrollmentStatus === statusFilter;
    const matchesPayer = payerFilter === "all" || enrollment.payerId === payerFilter;
    const matchesPriority = priorityFilter === "all" || enrollment.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPayer && matchesPriority;
  }) || [];

  // Group enrollments by status for kanban view
  const enrollmentsByStatus = enrollments?.reduce((acc, enrollment) => {
    const status = enrollment.enrollmentStatus;
    if (!acc[status]) acc[status] = [];
    acc[status].push(enrollment);
    return acc;
  }, {} as Record<string, PayerEnrollment[]>) || {};

  const handleView = (enrollment: PayerEnrollment) => {
    setSelectedEnrollment(enrollment);
    setIsViewDialogOpen(true);
  };

  const handleStatusUpdate = (enrollment: PayerEnrollment) => {
    setSelectedEnrollment(enrollment);
    statusForm.reset({
      status: enrollment.enrollmentStatus,
      notes: "",
    });
    setIsStatusUpdateDialogOpen(true);
  };

  const handleDelete = (enrollment: PayerEnrollment) => {
    deleteMutation.mutate(enrollment.id);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getDaysFromSubmission = (submissionDate?: string) => {
    if (!submissionDate) return null;
    const submission = new Date(submissionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load payer enrollments</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the payer enrollments data.
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
    <div className="p-6 space-y-6" data-testid="payer-enrollments-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Payer Enrollments
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Complete lifecycle management of payer enrollment processes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-enrollment">
                <Plus className="w-4 h-4 mr-2" />
                New Enrollment
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search by physician, payer, location, or provider number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(enrollmentStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={payerFilter} onValueChange={setPayerFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-payer-filter">
                    <SelectValue placeholder="All Payers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payers</SelectItem>
                    {payers?.map((payer) => (
                      <SelectItem key={payer.id} value={payer.id}>
                        {payer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-priority-filter">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''} found
              </p>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  data-testid="button-list-view"
                >
                  List View
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  data-testid="button-kanban-view"
                >
                  Kanban View
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'list' ? (
        /* List View */
        <Card data-testid="card-enrollments-list">
          <CardHeader>
            <CardTitle>Payer Enrollments ({filteredEnrollments.length})</CardTitle>
            <CardDescription>
              Manage the complete lifecycle of payer enrollment processes
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
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No payer enrollments found</p>
                <p className="text-sm">
                  {searchTerm || statusFilter !== "all" || payerFilter !== "all" || priorityFilter !== "all" 
                    ? "Try adjusting your search criteria" 
                    : "Start by creating your first payer enrollment"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEnrollments.map((enrollment, index) => (
                  <div key={enrollment.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`enrollment-card-${index}`}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {statusIcons[enrollment.enrollmentStatus as keyof typeof statusIcons]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium" data-testid={`enrollment-physician-${index}`}>
                          {enrollment.physicianName}
                        </h3>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{enrollment.payerName}</span>
                        <Badge 
                          variant="secondary" 
                          className={priorityColors[enrollment.priority as keyof typeof priorityColors]}
                          data-testid={`enrollment-priority-${index}`}
                        >
                          {priorityLabels[enrollment.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <Badge 
                          variant="secondary" 
                          className={statusColors[enrollment.enrollmentStatus as keyof typeof statusColors]}
                          data-testid={`enrollment-status-${index}`}
                        >
                          {statusIcons[enrollment.enrollmentStatus as keyof typeof statusIcons]}
                          <span className="ml-1">{enrollmentStatusLabels[enrollment.enrollmentStatus as keyof typeof enrollmentStatusLabels]}</span>
                        </Badge>
                        {enrollment.providerNumber && (
                          <span className="text-xs text-muted-foreground">
                            Provider #: {enrollment.providerNumber}
                          </span>
                        )}
                        {enrollment.submissionDate && (
                          <span className="text-xs text-muted-foreground">
                            Submitted: {getDaysFromSubmission(enrollment.submissionDate)} days ago
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{enrollment.progressPercentage}%</span>
                          </div>
                          <Progress 
                            value={enrollment.progressPercentage} 
                            className="h-2"
                            data-testid={`enrollment-progress-${index}`}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Building2 className="w-3 h-3 inline mr-1" />
                          {enrollment.practiceLocationName}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`enrollment-menu-${index}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(enrollment)} data-testid={`button-view-${index}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(enrollment)} data-testid={`button-status-${index}`}>
                          <Workflow className="w-4 h-4 mr-2" />
                          Update Status
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
                                This will permanently delete the enrollment for "{enrollment.physicianName}" with "{enrollment.payerName}" and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(enrollment)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4" data-testid="kanban-view">
          {Object.entries(enrollmentStatusLabels).map(([status, label]) => (
            <Card key={status} className="min-h-[400px]" data-testid={`kanban-column-${status}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {statusIcons[status as keyof typeof statusIcons]}
                  {label}
                  <Badge variant="secondary" className="ml-auto">
                    {enrollmentsByStatus[status]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {enrollmentsByStatus[status]?.map((enrollment, index) => (
                  <div 
                    key={enrollment.id} 
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleView(enrollment)}
                    data-testid={`kanban-card-${status}-${index}`}
                  >
                    <h4 className="font-medium text-sm mb-1">{enrollment.physicianName}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{enrollment.payerName}</p>
                    <div className="flex items-center justify-between text-xs">
                      <Badge 
                        variant="outline" 
                        className={priorityColors[enrollment.priority as keyof typeof priorityColors]}
                      >
                        {priorityLabels[enrollment.priority as keyof typeof priorityLabels]}
                      </Badge>
                      <span className="text-muted-foreground">{enrollment.progressPercentage}%</span>
                    </div>
                    <Progress value={enrollment.progressPercentage} className="h-1 mt-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-enrollment">
          <DialogHeader>
            <DialogTitle>Create New Enrollment</DialogTitle>
            <DialogDescription>
              Start a new payer enrollment process for a physician
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="physicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physician</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-physician">
                            <SelectValue placeholder="Select physician" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {physicians?.map((physician) => (
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
                  control={createForm.control}
                  name="payerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-payer">
                            <SelectValue placeholder="Select payer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {payers?.filter(p => p.isActive).map((payer) => (
                            <SelectItem key={payer.id} value={payer.id}>
                              {payer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="practiceLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-create-location">
                          <SelectValue placeholder="Select practice location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {practiceLocations?.filter(l => l.isActive).map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-create-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([value, label]) => (
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
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes about this enrollment..." {...field} data-testid="textarea-create-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-create-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-create-submit"
                >
                  {createMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Create Enrollment
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-status-update">
          <DialogHeader>
            <DialogTitle>Update Enrollment Status</DialogTitle>
            <DialogDescription>
              Change the status of this enrollment and add notes
            </DialogDescription>
          </DialogHeader>
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit((data) => 
              selectedEnrollment && updateStatusMutation.mutate({ 
                id: selectedEnrollment.id, 
                status: data.status, 
                notes: data.notes 
              })
            )} className="space-y-4">
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-update-status">
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(enrollmentStatusLabels).map(([value, label]) => (
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
                control={statusForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add notes about this status change..." {...field} data-testid="textarea-status-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsStatusUpdateDialogOpen(false)}
                  data-testid="button-status-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-status-submit"
                >
                  {updateStatusMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Update Status
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog would show detailed enrollment information */}
      {/* ... */}
    </div>
  );
}
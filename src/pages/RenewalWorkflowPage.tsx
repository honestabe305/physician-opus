import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RenewalDashboard } from "@/components/RenewalDashboard";
import { RenewalWorkflowCard } from "@/components/RenewalWorkflowCard";
import { RenewalTimeline } from "@/components/RenewalTimeline";
import { RenewalChecklist } from "@/components/RenewalChecklist";
import { RenewalStatusBadge } from "@/components/RenewalStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, RefreshCw, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { type SelectRenewalWorkflow, type SelectPhysician } from "../../shared/schema";

export default function RenewalWorkflowPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<SelectRenewalWorkflow | null>(null);
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  // Fetch renewal statistics
  const { data: statistics, isLoading: statsLoading, refetch: refetchStats, error: statsError } = useQuery<{
    total: number;
    inProgress: number;
    pending: number;
    completed: number;
    expired: number;
    upcomingIn30Days: number;
    upcomingIn60Days: number;
    upcomingIn90Days: number;
  }>({
    queryKey: ['/api/renewal/statistics'],
    retry: 3,
    refetchInterval: 30000, // Refresh every 30 seconds
    onError: (error) => {
      console.error('Error fetching renewal statistics:', error);
      toast({
        title: "Error",
        description: "Failed to load renewal statistics. Please refresh the page.",
        variant: "destructive"
      });
    }
  });

  // Fetch upcoming renewals
  const { data: upcomingRenewals, isLoading: renewalsLoading, refetch: refetchRenewals, error: renewalsError } = useQuery<SelectRenewalWorkflow[]>({
    queryKey: ['/api/renewal/upcoming', { days: 90 }],
    retry: 3,
    onError: (error) => {
      console.error('Error fetching upcoming renewals:', error);
      toast({
        title: "Error", 
        description: "Failed to load renewal workflows. Please refresh the page.",
        variant: "destructive"
      });
    }
  });

  // Fetch all physicians for display
  const { data: physicians } = useQuery<SelectPhysician[]>({
    queryKey: ['/api/physicians']
  });

  // Fetch timeline for selected workflow
  const { data: timeline } = useQuery<Array<{
    status: string;
    date: Date | string | null;
    description: string;
    completed: boolean;
  }>>({
    queryKey: selectedWorkflow ? ['/api/renewal', selectedWorkflow.id, 'timeline'] : null,
    enabled: !!selectedWorkflow
  });

  // Fetch checklist for selected workflow
  const { data: checklist } = useQuery<{
    items: Array<{
      id: string;
      task: string;
      completed: boolean;
      required: boolean;
      dueDate?: string;
    }>;
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
  }>({
    queryKey: selectedWorkflow ? ['/api/renewal', selectedWorkflow.id, 'checklist'] : null,
    enabled: !!selectedWorkflow
  });

  // Mutation to update workflow status
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; rejectionReason?: string }) => {
      return apiRequest(`/api/renewal/${data.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: data.status,
          rejectionReason: data.rejectionReason
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The renewal workflow status has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/renewal'] });
      setUpdateStatusDialog(false);
      setNewStatus("");
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the workflow status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to complete checklist task
  const completeTaskMutation = useMutation({
    mutationFn: async (data: { workflowId: string; taskId: string; completed: boolean }) => {
      return apiRequest(`/api/renewal/${data.workflowId}/complete-task`, {
        method: 'POST',
        body: JSON.stringify({
          taskId: data.taskId,
          completed: data.completed
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/renewal'] });
    }
  });

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    if (!selectedWorkflow) return;
    await completeTaskMutation.mutateAsync({
      workflowId: selectedWorkflow.id,
      taskId,
      completed
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedWorkflow || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedWorkflow.id,
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined
    });
  };

  const handleRefresh = () => {
    refetchStats();
    refetchRenewals();
    queryClient.invalidateQueries({ queryKey: ['/api/renewal'] });
    toast({
      title: "Refreshed",
      description: "Data has been refreshed successfully."
    });
  };

  // Filter renewals based on search and status
  const filteredRenewals = upcomingRenewals?.filter((renewal: SelectRenewalWorkflow) => {
    const physician = physicians?.find(p => p.id === renewal.physicianId);
    const matchesSearch = !searchTerm || 
      physician?.fullLegalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      renewal.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || renewal.renewalStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Debug logging
  console.log('RenewalWorkflowPage Debug:', {
    statsLoading,
    renewalsLoading,
    statistics,
    upcomingRenewals: upcomingRenewals?.length || 0,
    statsError,
    renewalsError
  });

  if (statsLoading || renewalsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6" data-testid="page-loading">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show error states
  if (statsError || renewalsError) {
    return (
      <div className="container mx-auto py-6 space-y-6" data-testid="page-error">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Renewal Workflows</h1>
            <p className="text-muted-foreground">
              Manage license, DEA, and CSR renewal processes
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-all">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load renewal workflow data. Please try refreshing the page or contact support if the issue persists.
            <br />
            <small className="text-xs opacity-70">
              {statsError && `Statistics: ${statsError.message}`}
              {renewalsError && `Renewals: ${renewalsError.message}`}
            </small>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-renewal-workflow">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Renewal Workflows</h1>
          <p className="text-muted-foreground">
            Manage license, DEA, and CSR renewal processes
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-all">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Dashboard Statistics */}
      <RenewalDashboard 
        statistics={statistics || {
          total: 0,
          inProgress: 0,
          pending: 0,
          completed: 0,
          expired: 0,
          upcomingIn30Days: 0,
          upcomingIn60Days: 0,
          upcomingIn90Days: 0
        }} 
        loading={statsLoading}
      />
      
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-xs">
            <strong>Debug Info:</strong> 
            Statistics: {statistics ? 'loaded' : 'null'}, 
            Renewals: {upcomingRenewals ? `${upcomingRenewals.length} items` : 'null'}, 
            Filtered: {filteredRenewals ? `${filteredRenewals.length} items` : 'null'}
          </AlertDescription>
        </Alert>
      )}

      {/* Renewal Workflows List and Details */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" data-testid="tab-list">
            <FileText className="h-4 w-4 mr-2" />
            All Workflows
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedWorkflow} data-testid="tab-details">
            <Clock className="h-4 w-4 mr-2" />
            Workflow Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Active Renewal Workflows</CardTitle>
              <CardDescription>
                View and manage all active renewal workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by physician or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="filed">Filed</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workflows Grid */}
              {!upcomingRenewals || upcomingRenewals.length === 0 ? (
                <Alert data-testid="alert-no-workflows">
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">No renewal workflows found</p>
                      {!upcomingRenewals ? (
                        <p className="text-sm">Loading renewal data...</p>
                      ) : searchTerm || statusFilter !== 'all' ? (
                        <p className="text-sm">Try adjusting your filters to see more results.</p>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p>No upcoming renewals in the next 90 days.</p>
                          <p className="text-xs text-muted-foreground">
                            Renewal workflows are automatically created 90 days before expiration dates.
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : filteredRenewals?.length === 0 ? (
                <Alert data-testid="alert-no-filtered-workflows">
                  <AlertDescription>
                    No renewal workflows match your current filters. 
                    Found {upcomingRenewals.length} total workflows.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRenewals?.map((workflow: SelectRenewalWorkflow) => {
                    const physician = physicians?.find(p => p.id === workflow.physicianId);
                    return (
                      <RenewalWorkflowCard
                        key={workflow.id}
                        workflow={workflow}
                        physicianName={physician?.fullLegalName}
                        compact
                        onView={() => setSelectedWorkflow(workflow)}
                        onUpdateStatus={() => {
                          setSelectedWorkflow(workflow);
                          setUpdateStatusDialog(true);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedWorkflow && (
            <>
              {/* Selected Workflow Details */}
              <RenewalWorkflowCard
                workflow={selectedWorkflow}
                physicianName={physicians?.find(p => p.id === selectedWorkflow.physicianId)?.fullLegalName}
                onUpdateStatus={() => setUpdateStatusDialog(true)}
              />

              {/* Timeline and Checklist */}
              <div className="grid gap-4 lg:grid-cols-2">
                {timeline && (
                  <RenewalTimeline 
                    timeline={timeline || []} 
                    currentStatus={selectedWorkflow.renewalStatus}
                  />
                )}
                {checklist && (
                  <RenewalChecklist
                    workflowId={selectedWorkflow.id}
                    items={checklist.items || []}
                    totalItems={checklist.totalItems || 0}
                    completedItems={checklist.completedItems || 0}
                    progressPercentage={checklist.progressPercentage || 0}
                    editable={['not_started', 'in_progress'].includes(selectedWorkflow.renewalStatus)}
                    onTaskComplete={handleTaskComplete}
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/api/renewal', selectedWorkflow.id] })}
                  />
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialog} onOpenChange={setUpdateStatusDialog}>
        <DialogContent data-testid="dialog-update-status">
          <DialogHeader>
            <DialogTitle>Update Workflow Status</DialogTitle>
            <DialogDescription>
              Change the status of this renewal workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status" data-testid="select-new-status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'rejected' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  data-testid="textarea-rejection-reason"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUpdateStatusDialog(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={!newStatus || updateStatusMutation.isPending}
              data-testid="button-confirm-update"
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
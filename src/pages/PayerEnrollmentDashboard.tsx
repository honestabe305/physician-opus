import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  CreditCard, 
  Users, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface EnrollmentStats {
  total: number;
  discovery: number;
  data_complete: number;
  submitted: number;
  payer_processing: number;
  approved: number;
  active: number;
  denied: number;
  stopped: number;
}

interface DashboardData {
  enrollmentStats: EnrollmentStats;
  recentEnrollments: any[];
  upcomingDeadlines: any[];
  payerSummary: any[];
}

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

export default function PayerEnrollmentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payerFilter, setPayerFilter] = useState("all");

  // Optimized queries using server-side aggregations for better performance
  const { data: dashboardData, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard/data'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Individual queries for performance metrics and trends
  const { data: performanceMetrics } = useQuery({
    queryKey: ['/api/dashboard/performance-metrics'],
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const { data: enrollmentTrends } = useQuery({
    queryKey: ['/api/dashboard/enrollment-trends'],
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });

  const calculateCompletionRate = (stats: EnrollmentStats) => {
    if (stats.total === 0) return 0;
    return Math.round(((stats.approved + stats.active) / stats.total) * 100);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load dashboard</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the payer enrollment dashboard data.
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
    <div className="p-6 space-y-6" data-testid="payer-enrollment-dashboard">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="dashboard-title">
            Payer Enrollment Management
          </h1>
          <p className="text-muted-foreground" data-testid="dashboard-description">
            Comprehensive CAQH-aligned payer enrollment tracking and management
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild data-testid="button-new-enrollment">
            <Link to="/payer-enrollment/enrollments/new">
              <Plus className="w-4 h-4 mr-2" />
              New Enrollment
            </Link>
          </Button>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search enrollments, physicians, or payers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="discovery">Discovery</SelectItem>
                  <SelectItem value="data_complete">Data Complete</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="payer_processing">Payer Processing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
              <Select value={payerFilter} onValueChange={setPayerFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-payer-filter">
                  <SelectValue placeholder="Filter by payer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payers</SelectItem>
                  {dashboardData?.payerSummary.map((payer) => (
                    <SelectItem key={payer.id} value={payer.id}>
                      {payer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-4 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-enrollments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-enrollments">
                {dashboardData?.enrollmentStats.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active enrollment tracking
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-completion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-completion-rate">
                {dashboardData ? calculateCompletionRate(dashboardData.enrollmentStats) : 0}%
              </div>
              <Progress 
                value={dashboardData ? calculateCompletionRate(dashboardData.enrollmentStats) : 0} 
                className="mt-2"
                data-testid="progress-completion-rate"
              />
            </CardContent>
          </Card>

          <Card data-testid="card-active-enrollments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-active-enrollments">
                {dashboardData?.enrollmentStats.active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-action">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-action">
                {dashboardData ? 
                  (dashboardData.enrollmentStats.discovery + 
                   dashboardData.enrollmentStats.data_complete + 
                   dashboardData.enrollmentStats.submitted) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full" data-testid="tabs-main">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollments" data-testid="tab-enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="payers" data-testid="tab-payers">Payers</TabsTrigger>
          <TabsTrigger value="locations" data-testid="tab-locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4" data-testid="content-overview">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Distribution */}
            <Card data-testid="card-status-distribution">
              <CardHeader>
                <CardTitle>Enrollment Status Distribution</CardTitle>
                <CardDescription>Current status breakdown of all enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[40px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(dashboardData?.enrollmentStats || {})
                      .filter(([key]) => key !== 'total')
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={statusColors[status as keyof typeof statusColors]}
                              data-testid={`badge-status-${status}`}
                            >
                              {statusIcons[status as keyof typeof statusIcons]}
                              <span className="ml-1 capitalize">
                                {status.replace('_', ' ')}
                              </span>
                            </Badge>
                          </div>
                          <span className="font-medium" data-testid={`count-status-${status}`}>
                            {count as number}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common enrollment management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" data-testid="button-manage-enrollments">
                  <Link to="/payer-enrollment/enrollments">
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Enrollments
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" data-testid="button-manage-payers">
                  <Link to="/payer-enrollment/payers">
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Payers
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" data-testid="button-manage-locations">
                  <Link to="/payer-enrollment/practice-locations">
                    <Building2 className="w-4 h-4 mr-2" />
                    Practice Locations
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" data-testid="button-banking-info">
                  <Link to="/payer-enrollment/banking">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Banking Information
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" data-testid="button-references">
                  <Link to="/payer-enrollment/references">
                    <Users className="w-4 h-4 mr-2" />
                    Professional References
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle>Recent Enrollment Activity</CardTitle>
              <CardDescription>Latest updates and changes to enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboardData?.recentEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent enrollment activity</p>
                  <p className="text-sm">Start by creating your first enrollment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.recentEnrollments.slice(0, 5).map((enrollment, index) => (
                    <div key={enrollment.id} className="flex items-center space-x-4" data-testid={`recent-enrollment-${index}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {statusIcons[enrollment.enrollmentStatus as keyof typeof statusIcons]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Enrollment for {enrollment.physicianName || 'Unknown Physician'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: <Badge 
                            variant="secondary" 
                            className={statusColors[enrollment.enrollmentStatus as keyof typeof statusColors]}
                          >
                            {enrollment.enrollmentStatus.replace('_', ' ')}
                          </Badge> • Updated {new Date(enrollment.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" data-testid="content-enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Management</CardTitle>
              <CardDescription>View and manage all payer enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Enrollment Management</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced enrollment management interface coming next
                </p>
                <Button asChild data-testid="button-goto-enrollments">
                  <Link to="/payer-enrollment/enrollments">
                    View All Enrollments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payers" data-testid="content-payers">
          <Card>
            <CardHeader>
              <CardTitle>Payer Management</CardTitle>
              <CardDescription>Manage insurance payers and their requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Payer Management</h3>
                <p className="text-muted-foreground mb-4">
                  Comprehensive payer management interface
                </p>
                <Button asChild data-testid="button-goto-payers">
                  <Link to="/payer-enrollment/payers">
                    Manage Payers
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" data-testid="content-locations">
          <Card>
            <CardHeader>
              <CardTitle>Practice Location Management</CardTitle>
              <CardDescription>Manage practice locations and their details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Location Management</h3>
                <p className="text-muted-foreground mb-4">
                  Practice location management interface
                </p>
                <Button asChild data-testid="button-goto-locations">
                  <Link to="/payer-enrollment/practice-locations">
                    Manage Locations
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
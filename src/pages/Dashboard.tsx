import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDisplayPreferences } from "@/hooks/use-display-preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
  FileText,
  TrendingUp,
  Plus,
  Search,
  Shield,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";

interface PhysicianStatusSummary {
  total: number;
  statusBreakdown: Record<string, number>;
}

interface ExpirationReport {
  expiringWithinDays: number;
  alreadyExpired: number;
  licenses?: any[];
  certifications?: any[];
  reportGeneratedAt: string;
}

export default function Dashboard() {
  const { formatDateTime } = useDisplayPreferences();
  
  // Fetch physician status summary
  const { data: statusSummary, isLoading: isLoadingStatus, error: statusError } = useQuery<PhysicianStatusSummary>({
    queryKey: ['/analytics/physicians/status-summary'],
  });

  // Fetch license expiration report
  const { data: licenseReport, isLoading: isLoadingLicenses } = useQuery<ExpirationReport>({
    queryKey: ['/analytics/licenses/expiration-report', { days: 30 }],
    queryFn: () => apiRequest('/analytics/licenses/expiration-report?days=30'),
  });

  // Fetch certification expiration report
  const { data: certificationReport, isLoading: isLoadingCertifications } = useQuery<ExpirationReport>({
    queryKey: ['/analytics/certifications/expiration-report', { days: 30 }],
    queryFn: () => apiRequest('/analytics/certifications/expiration-report?days=30'),
  });

  // Calculate stats from real data
  const stats = [
    {
      title: "Total Physicians",
      value: isLoadingStatus ? "..." : statusSummary?.total?.toString() || "0",
      change: "+0%", // Note: Would need historical data to calculate real change
      trend: "up",
      icon: Users,
      description: "Active physician profiles",
      isLoading: isLoadingStatus,
    },
    {
      title: "Active Profiles",
      value: isLoadingStatus ? "..." : (statusSummary?.statusBreakdown?.active?.toString() || "0"),
      change: "+0%",
      trend: "up",
      icon: UserCheck,
      description: "Active physician profiles",
      isLoading: isLoadingStatus,
    },
    {
      title: "Pending Reviews",
      value: isLoadingStatus ? "..." : (
        (statusSummary?.statusBreakdown?.pending || 0) + 
        (statusSummary?.statusBreakdown?.review || 0)
      ).toString(),
      change: "+0%",
      trend: "up",
      icon: Clock,
      description: "Awaiting verification",
      isLoading: isLoadingStatus,
    },
    {
      title: "Expiring Soon",
      value: isLoadingLicenses || isLoadingCertifications ? "..." : (
        (licenseReport?.expiringWithinDays || 0) + 
        (certificationReport?.expiringWithinDays || 0)
      ).toString(),
      change: "+0%",
      trend: "up",
      icon: AlertTriangle,
      description: "Licenses & certifications",
      isLoading: isLoadingLicenses || isLoadingCertifications,
    }
  ];

  // Generate alerts from real data
  const generateAlerts = () => {
    const alerts = [];
    
    if (licenseReport && licenseReport.expiringWithinDays > 0) {
      alerts.push({
        id: 'licenses-expiring',
        type: 'warning' as const,
        message: `${licenseReport.expiringWithinDays} physician license${licenseReport.expiringWithinDays !== 1 ? 's' : ''} expiring within 30 days`,
        priority: 'high' as const,
      });
    }

    if (certificationReport && certificationReport.expiringWithinDays > 0) {
      alerts.push({
        id: 'certifications-expiring',
        type: 'warning' as const,
        message: `${certificationReport.expiringWithinDays} certification${certificationReport.expiringWithinDays !== 1 ? 's' : ''} expiring within 30 days`,
        priority: 'high' as const,
      });
    }

    if (licenseReport && licenseReport.alreadyExpired > 0) {
      alerts.push({
        id: 'licenses-expired',
        type: 'error' as const,
        message: `${licenseReport.alreadyExpired} physician license${licenseReport.alreadyExpired !== 1 ? 's' : ''} have already expired`,
        priority: 'high' as const,
      });
    }

    if (certificationReport && certificationReport.alreadyExpired > 0) {
      alerts.push({
        id: 'certifications-expired',
        type: 'error' as const,
        message: `${certificationReport.alreadyExpired} certification${certificationReport.alreadyExpired !== 1 ? 's' : ''} have already expired`,
        priority: 'high' as const,
      });
    }

    if (statusSummary && statusSummary.statusBreakdown?.pending > 0) {
      alerts.push({
        id: 'pending-profiles',
        type: 'info' as const,
        message: `${statusSummary.statusBreakdown.pending} physician profile${statusSummary.statusBreakdown.pending !== 1 ? 's' : ''} require review`,
        priority: 'medium' as const,
      });
    }

    // If no real alerts, show a placeholder
    if (alerts.length === 0) {
      alerts.push({
        id: 'no-alerts',
        type: 'info' as const,
        message: 'No urgent issues requiring attention',
        priority: 'low' as const,
      });
    }

    return alerts;
  };

  const alerts = generateAlerts();

  // Mock recent activity for now - could be replaced with real activity log in the future
  const recentActivity = [
    {
      id: 1,
      physician: "Recent Activity",
      action: "Activity tracking coming soon",
      time: formatDateTime(new Date()),
      status: "info"
    }
  ];

  if (statusError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Manage your physician credentialing system</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data: {statusError instanceof Error ? statusError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your physician credentialing system</p>
        </div>
        <div className="flex gap-3">
          <Link href="/search">
            <Button variant="outline" className="gap-2" data-testid="button-search">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </Link>
          <Link href="/physicians/new">
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent" data-testid="button-add-physician">
              <Plus className="h-4 w-4" />
              Add Physician
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success">{stat.change}</span>
                <span>from last month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30" data-testid={`activity-${activity.id}`}>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.physician}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <Badge 
                      variant={activity.status === "completed" ? "default" : 
                              activity.status === "pending" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Alerts</CardTitle>
            <CardDescription>Important notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(isLoadingLicenses || isLoadingCertifications || isLoadingStatus) ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex gap-3 p-3 rounded-lg bg-muted/30" data-testid={`alert-${alert.id}`}>
                    <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      alert.priority === "high" ? "text-destructive" : 
                      alert.priority === "medium" ? "text-warning" : "text-muted-foreground"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <Badge 
                        variant={alert.priority === "high" ? "destructive" : 
                                alert.priority === "medium" ? "secondary" : "outline"}
                        className="text-xs mt-1"
                      >
                        {alert.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
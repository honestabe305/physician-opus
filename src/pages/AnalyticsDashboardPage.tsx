import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Download, RefreshCw, Users, Shield, Clock, AlertCircle,
  TrendingUp, TrendingDown, Activity, FileText, Calendar, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ComplianceRate {
  category: string;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
}

interface RenewalTrend {
  period: string;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
}

interface ExpirationForecast {
  period: string;
  licenses: number;
  deaRegistrations: number;
  csrLicenses: number;
  certifications: number;
  total: number;
}

interface ProviderMetrics {
  role: string;
  total: number;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
  avgLicensesPerProvider: number;
  expiringWithin30Days: number;
}

export default function AnalyticsDashboardPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30days");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedProviderRole, setSelectedProviderRole] = useState("all");

  // Fetch compliance rates
  const { data: complianceData, isLoading: complianceLoading, refetch: refetchCompliance } = useQuery({
    queryKey: ['/api/analytics/compliance'],
    refetchInterval: 60000,
  });

  // Fetch renewal trends
  const { data: renewalData, isLoading: renewalLoading } = useQuery({
    queryKey: ['/api/analytics/renewal-trends'],
    refetchInterval: 60000,
  });

  // Fetch expiration forecast
  const { data: expirationData, isLoading: expirationLoading } = useQuery({
    queryKey: ['/api/analytics/expiration-forecast'],
    refetchInterval: 60000,
  });

  // Fetch provider metrics
  const { data: providerData, isLoading: providerLoading } = useQuery({
    queryKey: ['/api/analytics/provider-metrics'],
    refetchInterval: 60000,
  });

  // Fetch license distribution
  const { data: distributionData, isLoading: distributionLoading } = useQuery({
    queryKey: ['/api/analytics/license-distribution'],
    refetchInterval: 60000,
  });

  // Export data
  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Analytics report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics report",
        variant: "destructive",
      });
    }
  }, [toast]);

  const refreshData = useCallback(async () => {
    await refetchCompliance();
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been refreshed",
    });
  }, [refetchCompliance, toast]);

  // Loading state
  if (complianceLoading || renewalLoading || expirationLoading || providerLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  const overallCompliance = (complianceData as any)?.overall || 0;
  const complianceByDepartment = (complianceData as any)?.byDepartment || [];
  const complianceByRole = (complianceData as any)?.byProviderRole || [];
  const renewalTrends: RenewalTrend[] = (renewalData as RenewalTrend[]) || [];
  const expirationForecast: ExpirationForecast[] = (expirationData as ExpirationForecast[]) || [];
  const providerMetrics: ProviderMetrics[] = (providerData as ProviderMetrics[]) || [];
  const licenseByState = (distributionData as any)?.byState || [];
  const licenseByType = (distributionData as any)?.byType || [];

  // Calculate key metrics
  const totalPhysicians = providerMetrics.reduce((sum, p) => sum + p.total, 0);
  const totalCompliant = providerMetrics.reduce((sum, p) => sum + p.compliant, 0);
  const upcomingRenewals = expirationForecast.find(f => f.period === '30 days')?.total || 0;
  const latestRenewalSuccess = renewalTrends[renewalTrends.length - 1]?.successRate || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="analytics-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Compliance tracking and renewal insights
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={refreshData} variant="outline" size="sm" data-testid="refresh-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm" data-testid="export-csv-button">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport('json')} variant="outline" size="sm" data-testid="export-json-button">
            <FileText className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]" data-testid="date-range-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="60days">Last 60 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[160px]" data-testid="department-filter">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {complianceByDepartment.map(dept => (
                  <SelectItem key={dept.category} value={dept.category}>
                    {dept.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProviderRole} onValueChange={setSelectedProviderRole}>
              <SelectTrigger className="w-[140px]" data-testid="provider-role-filter">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="physician">Physicians</SelectItem>
                <SelectItem value="pa">PAs</SelectItem>
                <SelectItem value="np">NPs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Physicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold" data-testid="total-physicians">{totalPhysicians}</p>
                <p className="text-xs text-muted-foreground">Active providers</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold" data-testid="compliance-rate">{overallCompliance.toFixed(1)}%</p>
                <Progress value={overallCompliance} className="mt-2 w-20" />
              </div>
              <Shield className={`h-8 w-8 ${overallCompliance >= 80 ? 'text-green-500' : 'text-orange-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold" data-testid="upcoming-renewals">{upcomingRenewals}</p>
                <p className="text-xs text-muted-foreground">Within 30 days</p>
              </div>
              <Clock className={`h-8 w-8 ${upcomingRenewals > 10 ? 'text-red-500' : 'text-yellow-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Renewal Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold" data-testid="renewal-success">{latestRenewalSuccess.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {latestRenewalSuccess >= 90 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">This month</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance by Department */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance by Department</CardTitle>
                <CardDescription>Compliance rates across different departments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="complianceRate" fill="#3b82f6" name="Compliance %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance by Provider Role */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance by Provider Role</CardTitle>
                <CardDescription>Compliance breakdown by provider type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceByRole}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="compliant" stackId="a" fill="#10b981" name="Compliant" />
                    <Bar dataKey="nonCompliant" stackId="a" fill="#ef4444" name="Non-Compliant" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Renewals Tab */}
        <TabsContent value="renewals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Renewal Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Renewal Trends</CardTitle>
                <CardDescription>Success, failure, and pending renewals over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={renewalTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="successful" stroke="#10b981" name="Successful" />
                    <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
                    <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expiration Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>Expiration Forecast</CardTitle>
                <CardDescription>Upcoming credential expirations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={expirationForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="licenses" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Licenses" />
                    <Area type="monotone" dataKey="deaRegistrations" stackId="1" stroke="#10b981" fill="#10b981" name="DEA" />
                    <Area type="monotone" dataKey="csrLicenses" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="CSR" />
                    <Area type="monotone" dataKey="certifications" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Certifications" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* License Distribution by State */}
            <Card>
              <CardHeader>
                <CardTitle>License Distribution by State</CardTitle>
                <CardDescription>Active licenses across different states</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={licenseByState.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {licenseByState.slice(0, 6).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* License Distribution by Type */}
            <Card>
              <CardHeader>
                <CardTitle>License Distribution by Type</CardTitle>
                <CardDescription>Breakdown by license categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={licenseByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {licenseByType.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {providerMetrics.map((metric) => (
              <Card key={metric.role}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{metric.role === 'pa' ? 'PAs' : metric.role === 'np' ? 'NPs' : 'Physicians'}</span>
                    <Badge variant={metric.complianceRate >= 80 ? 'default' : 'destructive'}>
                      {metric.complianceRate.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-medium">{metric.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Compliant</span>
                      <span className="font-medium text-green-600">{metric.compliant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Non-Compliant</span>
                      <span className="font-medium text-red-600">{metric.nonCompliant}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Licenses</span>
                      <span className="font-medium">{metric.avgLicensesPerProvider.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expiring Soon</span>
                      <span className={`font-medium ${metric.expiringWithin30Days > 0 ? 'text-orange-600' : ''}`}>
                        {metric.expiringWithin30Days}
                      </span>
                    </div>
                  </div>
                  <Progress value={metric.complianceRate} className="mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Provider Compliance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Compliance Overview</CardTitle>
              <CardDescription>Comparison across all provider types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={providerMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="complianceRate" fill="#3b82f6" name="Compliance %" />
                  <Bar dataKey="avgLicensesPerProvider" fill="#10b981" name="Avg Licenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Section for Critical Issues */}
      {upcomingRenewals > 10 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              You have {upcomingRenewals} credentials expiring within the next 30 days. 
              Please initiate renewal processes immediately to avoid compliance issues.
            </p>
            <Button className="mt-3" size="sm" variant="outline" data-testid="view-renewals-button">
              View Upcoming Renewals
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
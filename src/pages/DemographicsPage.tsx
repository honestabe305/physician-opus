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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician } from "../../shared/schema";
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PhysicianStatusSummary {
  total: number;
  statusBreakdown: Record<string, number>;
}

export default function DemographicsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch physicians data
  const { data: physiciansData, isLoading: isLoadingPhysicians, error: physiciansError } = useQuery({
    queryKey: debouncedSearch ? ['/physicians', { search: debouncedSearch }] : ['/physicians'],
    queryFn: () => {
      const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
      return apiRequest(`/physicians${params}`);
    },
  });

  // Fetch status summary
  const { data: statusSummary, isLoading: isLoadingStatus } = useQuery<PhysicianStatusSummary>({
    queryKey: ['/analytics/physicians/status-summary'],
  });

  const physicians = physiciansData?.physicians || [];

  // Calculate demographic statistics
  const demographicStats = useMemo(() => {
    if (!physicians || physicians.length === 0) {
      return {
        total: 0,
        genderBreakdown: { male: 0, female: 0, other: 0, unspecified: 0 },
        ageGroups: {},
        averageAge: 0,
      };
    }

    const genderBreakdown = { male: 0, female: 0, other: 0, unspecified: 0 };
    const ageGroups: Record<string, number> = {
      '< 30': 0,
      '30-39': 0,
      '40-49': 0,
      '50-59': 0,
      '60-69': 0,
      '70+': 0,
    };
    let totalAge = 0;
    let ageCount = 0;

    physicians.forEach((physician: SelectPhysician) => {
      // Gender breakdown
      if (physician.gender === 'male') genderBreakdown.male++;
      else if (physician.gender === 'female') genderBreakdown.female++;
      else if (physician.gender === 'other') genderBreakdown.other++;
      else genderBreakdown.unspecified++;

      // Age calculation
      if (physician.dateOfBirth) {
        const birthDate = new Date(physician.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 30) ageGroups['< 30']++;
        else if (age < 40) ageGroups['30-39']++;
        else if (age < 50) ageGroups['40-49']++;
        else if (age < 60) ageGroups['50-59']++;
        else if (age < 70) ageGroups['60-69']++;
        else ageGroups['70+']++;

        totalAge += age;
        ageCount++;
      }
    });

    return {
      total: physicians.length,
      genderBreakdown,
      ageGroups,
      averageAge: ageCount > 0 ? Math.round(totalAge / ageCount) : 0,
    };
  }, [physicians]);

  // Filter physicians based on search and filters
  const filteredPhysicians = useMemo(() => {
    return physicians.filter((physician: SelectPhysician) => {
      // Apply gender filter
      if (genderFilter !== "all") {
        if (genderFilter === "unspecified" && physician.gender) return false;
        if (genderFilter !== "unspecified" && physician.gender !== genderFilter) return false;
      }

      // Apply status filter
      if (statusFilter !== "all" && physician.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [physicians, genderFilter, statusFilter]);

  // Prepare data for charts
  const genderChartData = [
    { name: 'Male', value: demographicStats.genderBreakdown.male, color: '#3b82f6' },
    { name: 'Female', value: demographicStats.genderBreakdown.female, color: '#ec4899' },
    { name: 'Other', value: demographicStats.genderBreakdown.other, color: '#10b981' },
    { name: 'Unspecified', value: demographicStats.genderBreakdown.unspecified, color: '#6b7280' },
  ].filter(item => item.value > 0);

  const ageChartData = Object.entries(demographicStats.ageGroups)
    .map(([group, count]) => ({ age: group, count }))
    .filter(item => item.count > 0);

  // Stats cards configuration
  const stats = [
    {
      title: "Total Physicians",
      value: isLoadingPhysicians ? "..." : demographicStats.total.toString(),
      change: "+0%",
      icon: Users,
      description: "Registered physicians",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Average Age",
      value: isLoadingPhysicians ? "..." : demographicStats.averageAge.toString(),
      change: "years",
      icon: Calendar,
      description: "Mean physician age",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Active Status",
      value: isLoadingStatus ? "..." : (statusSummary?.statusBreakdown?.active?.toString() || "0"),
      change: `${statusSummary?.total ? Math.round((statusSummary.statusBreakdown?.active || 0) / statusSummary.total * 100) : 0}%`,
      icon: UserCheck,
      description: "Currently active",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Gender Diversity",
      value: genderChartData.length > 1 ? `${genderChartData.length}` : "1",
      change: "categories",
      icon: BarChart3,
      description: "Gender representation",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "review":
      case "under review":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const calculateAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  if (physiciansError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Demographics</h1>
            <p className="text-muted-foreground">Manage physician demographic information</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load demographic data: {physiciansError instanceof Error ? physiciansError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Demographics</h1>
          <p className="text-muted-foreground">Analyze physician demographic information and statistics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`border-border/50 shadow-sm hover:shadow-md transition-shadow ${stat.bgColor}`} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {isLoadingPhysicians ? <Skeleton className="h-8 w-16" /> : stat.value}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{stat.change}</span>
                <span className="text-xs">• {stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Gender Distribution
            </CardTitle>
            <CardDescription asChild>
              <div>
                {isLoadingPhysicians ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  "Breakdown by gender category"
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPhysicians ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : genderChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No gender data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Age Distribution Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Age Distribution
            </CardTitle>
            <CardDescription asChild>
              <div>
                {isLoadingPhysicians ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  "Physicians grouped by age range"
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPhysicians ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : ageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ageChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="age" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No age data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Physicians Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Physician Demographics</CardTitle>
              <CardDescription asChild>
                <div>
                  {isLoadingPhysicians ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    `${filteredPhysicians.length} physician${filteredPhysicians.length !== 1 ? 's' : ''} ${searchTerm || genderFilter !== 'all' || statusFilter !== 'all' ? 'filtered' : 'total'}`
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-32" data-testid="select-gender">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Gender</TableHead>
                  <TableHead className="font-semibold">Age</TableHead>
                  <TableHead className="font-semibold">Date of Birth</TableHead>
                  <TableHead className="font-semibold">NPI</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Practice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPhysicians ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPhysicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || genderFilter !== 'all' || statusFilter !== 'all' 
                        ? 'No physicians found matching your filters.' 
                        : 'No physicians found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPhysicians.map((physician: SelectPhysician) => (
                    <TableRow key={physician.id} className="hover:bg-muted/20" data-testid={`row-physician-${physician.id}`}>
                      <TableCell>
                        <Link 
                          href={`/physicians/${physician.id}`}
                          className="font-medium text-primary hover:underline text-left" 
                          data-testid={`link-physician-${physician.id}`}
                        >
                          {physician.fullLegalName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-sm" data-testid={`text-gender-${physician.id}`}>
                            {physician.gender || 'Unspecified'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-age-${physician.id}`}>
                        {calculateAge(physician.dateOfBirth)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-dob-${physician.id}`}>
                        {physician.dateOfBirth ? new Date(physician.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-npi-${physician.id}`}>
                        {physician.npi || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(physician.status || 'inactive')}
                          data-testid={`badge-status-${physician.id}`}
                        >
                          {physician.status || 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-practice-${physician.id}`}>
                        {physician.practiceName || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
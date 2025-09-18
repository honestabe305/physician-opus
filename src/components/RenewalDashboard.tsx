import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Activity
} from "lucide-react";

interface RenewalStatistics {
  total: number;
  inProgress: number;
  pending: number;
  completed: number;
  expired: number;
  upcomingIn30Days: number;
  upcomingIn60Days: number;
  upcomingIn90Days: number;
}

interface RenewalDashboardProps {
  statistics: RenewalStatistics;
  loading?: boolean;
}

export function RenewalDashboard({ statistics, loading = false }: RenewalDashboardProps) {
  const calculatePercentage = (value: number) => {
    return statistics.total > 0 ? Math.round((value / statistics.total) * 100) : 0;
  };

  const cards = [
    {
      title: "Total Renewals",
      value: statistics.total,
      icon: FileText,
      description: "Active renewal workflows",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "In Progress",
      value: statistics.inProgress,
      icon: Clock,
      description: `${calculatePercentage(statistics.inProgress)}% of total`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Under Review",
      value: statistics.pending,
      icon: Activity,
      description: "Awaiting approval",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Approved",
      value: statistics.completed,
      icon: CheckCircle,
      description: `${calculatePercentage(statistics.completed)}% success rate`,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Expired",
      value: statistics.expired,
      icon: XCircle,
      description: "Require immediate action",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Critical",
      value: statistics.upcomingIn30Days,
      icon: AlertTriangle,
      description: "Due within 30 days",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="dashboard-loading">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="renewal-dashboard">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} data-testid={`card-metric-${index}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Renewals Timeline */}
      <Card data-testid="card-upcoming-renewals">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>
                License and registration renewals by timeframe
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                <span className="text-sm font-medium">Next 30 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">
                  {statistics.upcomingIn30Days}
                </span>
                <span className="text-sm text-muted-foreground">renewals</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-2 w-2 p-0 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium">31-60 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-600">
                  {statistics.upcomingIn60Days - statistics.upcomingIn30Days}
                </span>
                <span className="text-sm text-muted-foreground">renewals</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-2 w-2 p-0 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">61-90 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {statistics.upcomingIn90Days - statistics.upcomingIn60Days}
                </span>
                <span className="text-sm text-muted-foreground">renewals</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card data-testid="card-success-rate">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Renewal Success Rate</CardTitle>
              <CardDescription>
                Percentage of successfully completed renewals
              </CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {calculatePercentage(statistics.completed)}%
              </span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Success Rate
              </Badge>
            </div>
            <Progress 
              value={calculatePercentage(statistics.completed)} 
              className="h-3"
            />
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <p className="font-medium">{statistics.completed}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{statistics.inProgress + statistics.pending}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{statistics.expired}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
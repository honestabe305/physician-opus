import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
  FileText,
  TrendingUp,
  Plus,
  Search,
} from "lucide-react";

const stats = [
  {
    title: "Total Physicians",
    value: "1,247",
    change: "+12%",
    trend: "up",
    icon: Users,
    description: "Active physician profiles"
  },
  {
    title: "Verified Profiles",
    value: "1,186",
    change: "+8%",
    trend: "up", 
    icon: UserCheck,
    description: "Completed credentialing"
  },
  {
    title: "Pending Reviews",
    value: "61",
    change: "+15%",
    trend: "up",
    icon: Clock,
    description: "Awaiting verification"
  },
  {
    title: "Documents",
    value: "15,892",
    change: "+24%",
    trend: "up",
    icon: FileText,
    description: "Total uploaded files"
  }
];

const recentActivity = [
  {
    id: 1,
    physician: "Dr. Sarah Johnson",
    action: "Profile updated",
    time: "2 hours ago",
    status: "completed"
  },
  {
    id: 2,
    physician: "Dr. Michael Chen",
    action: "DEA certificate uploaded",
    time: "4 hours ago", 
    status: "pending"
  },
  {
    id: 3,
    physician: "Dr. Emily Rodriguez",
    action: "License renewal submitted",
    time: "6 hours ago",
    status: "completed"
  },
  {
    id: 4,
    physician: "Dr. James Wilson",
    action: "New application",
    time: "1 day ago",
    status: "review"
  }
];

const alerts = [
  {
    id: 1,
    type: "warning",
    message: "5 physician licenses expiring within 30 days",
    priority: "high"
  },
  {
    id: 2,
    type: "info",
    message: "Monthly credentialing report ready for review",
    priority: "medium"
  },
  {
    id: 3,
    type: "warning",
    message: "3 incomplete physician profiles require attention",
    priority: "high"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your physician credentialing system</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
            <Plus className="h-4 w-4" />
            Add Physician
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
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
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
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

        {/* Alerts */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Alerts</CardTitle>
            <CardDescription>Important notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                    alert.priority === "high" ? "text-destructive" : "text-warning"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <Badge 
                      variant={alert.priority === "high" ? "destructive" : "secondary"}
                      className="text-xs mt-1"
                    >
                      {alert.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
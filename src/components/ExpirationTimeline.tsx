import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, FileText, MapPin, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, differenceInDays, addDays } from "date-fns";

interface Notification {
  id: string;
  physicianId: string;
  type: 'license' | 'dea' | 'csr';
  entityId: string;
  notificationDate: string;
  daysBeforeExpiry: number;
  severity: 'info' | 'warning' | 'critical';
  sentStatus: 'pending' | 'sent' | 'failed' | 'read';
  providerName: string;
  licenseType: string;
  state: string;
  expirationDate: string;
}

interface TimelineEvent {
  date: Date;
  type: 'license' | 'dea' | 'csr';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  daysFromNow: number;
  notification: Notification;
}

export function ExpirationTimeline() {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/upcoming', { days: 120 }],
    queryFn: () => apiRequest('/api/notifications/upcoming?days=120'),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Convert notifications to timeline events
  const timelineEvents: TimelineEvent[] = notifications
    .map(notification => ({
      date: new Date(notification.expirationDate),
      type: notification.type,
      severity: notification.severity,
      title: `${notification.licenseType} - ${notification.state}`,
      description: notification.providerName,
      daysFromNow: differenceInDays(new Date(notification.expirationDate), new Date()),
      notification
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10); // Show only the next 10 expirations

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'license':
        return <FileText className="h-4 w-4" />;
      case 'dea':
        return <AlertCircle className="h-4 w-4" />;
      case 'csr':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'license':
        return 'bg-blue-500';
      case 'dea':
        return 'bg-purple-500';
      case 'csr':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string, daysFromNow: number) => {
    if (daysFromNow <= 7) return 'border-red-500 bg-red-50';
    if (daysFromNow <= 30) return 'border-yellow-500 bg-yellow-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getProgressColor = (daysFromNow: number) => {
    if (daysFromNow <= 7) return 'bg-red-500';
    if (daysFromNow <= 30) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const calculateProgress = (daysFromNow: number) => {
    const maxDays = 120;
    return Math.max(0, Math.min(100, ((maxDays - daysFromNow) / maxDays) * 100));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Expiration Timeline
          </CardTitle>
          <CardDescription>Loading timeline...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Expiration Timeline
        </CardTitle>
        <CardDescription>
          Upcoming credential expirations in chronological order
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming expirations</p>
            <p className="text-sm mt-1">All credentials are current</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {/* Timeline events */}
            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={event.notification.id} className="relative flex items-start gap-4" data-testid={`timeline-event-${index}`}>
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-4 h-4 rounded-full border-4 border-background ${getTypeColor(event.type)}`}></div>
                  
                  {/* Event content */}
                  <div className={`flex-1 ml-10 p-4 rounded-lg border-2 ${getSeverityColor(event.severity, event.daysFromNow)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(event.type)}
                        <span className="font-medium">{event.title}</span>
                        <Badge variant={event.type === 'dea' ? 'secondary' : event.type === 'csr' ? 'outline' : 'default'}>
                          {event.type.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge variant={event.daysFromNow <= 7 ? 'destructive' : event.daysFromNow <= 30 ? 'secondary' : 'secondary'}>
                        {event.daysFromNow} days
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Expires: {format(event.date, 'PPP')}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Time remaining</span>
                        <span>{100 - calculateProgress(event.daysFromNow)}%</span>
                      </div>
                      <Progress 
                        value={100 - calculateProgress(event.daysFromNow)} 
                        className="h-2"
                      />
                    </div>
                    
                    {/* Additional info for critical items */}
                    {event.daysFromNow <= 7 && (
                      <div className="mt-3 p-2 bg-red-100 rounded-md">
                        <p className="text-xs text-red-800 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Urgent: Immediate renewal action required
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* End of timeline indicator */}
              {timelineEvents.length > 0 && (
                <div className="relative flex items-center gap-4">
                  <div className="absolute left-4 w-4 h-4 rounded-full border-4 border-background bg-gray-400"></div>
                  <div className="flex-1 ml-10 text-sm text-muted-foreground">
                    {notifications.length > 10 && `${notifications.length - 10} more expirations...`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
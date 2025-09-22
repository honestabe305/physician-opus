import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, AlertTriangle, Info, Bell, Calendar, MapPin, FileText } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, differenceInDays } from "date-fns";

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

export function NotificationPanel() {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/upcoming', { days: 90 }],
    queryFn: () => apiRequest('/api/notifications/upcoming?days=90'),
    refetchInterval: 60000,
  });

  const criticalNotifications = notifications.filter(n => n.severity === 'critical');
  const warningNotifications = notifications.filter(n => n.severity === 'warning');
  const infoNotifications = notifications.filter(n => n.severity === 'info');

  const markAsRead = async (notificationId: string) => {
    await apiRequest(`/api/notifications/${notificationId}/mark-read`, {
      method: 'PUT',
    });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/upcoming'] });
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const getNotificationHref = (notification: Notification): string => {
    const { physicianId, type, entityId } = notification;
    switch (type) {
      case 'license':
        return `/physicians/${physicianId}?tab=licenses&highlight=${entityId}`;
      case 'dea':
        return `/physicians/${physicianId}?tab=dea&highlight=${entityId}`;
      case 'csr':
        return `/physicians/${physicianId}?tab=csr&highlight=${entityId}`;
      default:
        return `/physicians/${physicianId}`;
    }
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const daysUntilExpiry = differenceInDays(new Date(notification.expirationDate), new Date());
    const isUnread = notification.sentStatus !== 'read';

    const handleCardClick = () => {
      if (isUnread) {
        markAsRead(notification.id);
      }
    };

    return (
      <Link href={getNotificationHref(notification)} onClick={handleCardClick}>
        <Alert 
          variant={getAlertVariant(notification.severity)} 
          className={`mb-3 cursor-pointer hover:bg-muted/30 transition-colors ${isUnread ? 'border-2' : ''}`}
          data-testid={`notification-card-${notification.id}`}
        >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getIcon(notification.severity)}
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                {notification.providerName}
                {isUnread && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{notification.licenseType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{notification.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Expires on {format(new Date(notification.expirationDate), 'PPP')}</span>
                    <Badge variant={notification.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {daysUntilExpiry} days remaining
                    </Badge>
                  </div>
                </div>
              </AlertDescription>
            </div>
          </div>
          {isUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notification.id)}
              data-testid={`button-mark-read-${notification.id}`}
            >
              Mark as read
            </Button>
          )}
        </div>
        </Alert>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            License Expiration Alerts
          </CardTitle>
          <CardDescription>Loading notifications...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          License Expiration Alerts
        </CardTitle>
        <CardDescription>
          Monitor upcoming license, DEA, and CSR expirations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming expirations</p>
            <p className="text-sm mt-1">All credentials are up to date</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" data-testid="tab-all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="critical" data-testid="tab-critical">
                Critical ({criticalNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="warning" data-testid="tab-warning">
                Warning ({warningNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="info" data-testid="tab-info">
                Info ({infoNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[400px] w-full pr-4">
                {notifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="critical">
              <ScrollArea className="h-[400px] w-full pr-4">
                {criticalNotifications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No critical alerts</p>
                ) : (
                  criticalNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="warning">
              <ScrollArea className="h-[400px] w-full pr-4">
                {warningNotifications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No warning alerts</p>
                ) : (
                  warningNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="info">
              <ScrollArea className="h-[400px] w-full pr-4">
                {infoNotifications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No informational alerts</p>
                ) : (
                  infoNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
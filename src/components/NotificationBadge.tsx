import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

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

export function NotificationBadge() {
  // Fetch upcoming notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/upcoming', { days: 30 }],
    queryFn: () => apiRequest('/api/notifications/upcoming?days=30'),
    refetchInterval: 60000, // Refresh every minute
  });

  // Filter unread notifications
  const unreadNotifications = notifications.filter(n => n.sentStatus !== 'read');
  const criticalCount = unreadNotifications.filter(n => n.severity === 'critical').length;
  const warningCount = unreadNotifications.filter(n => n.severity === 'warning').length;
  const totalCount = unreadNotifications.length;

  const markAsRead = async (notificationId: string) => {
    await apiRequest(`/api/notifications/${notificationId}/mark-read`, {
      method: 'PUT',
    });
    
    // Invalidate the notifications query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/upcoming'] });
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityBadgeColor = (severity: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatNotificationText = (notification: Notification) => {
    const daysText = notification.daysBeforeExpiry === 1 ? 'tomorrow' : 
                     `in ${notification.daysBeforeExpiry} days`;
    return `${notification.licenseType} expires ${daysText}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
              {totalCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Notifications</p>
            <div className="flex gap-2 mt-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} Critical
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {warningCount} Warning
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : unreadNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <>
              {unreadNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                  onClick={(e) => {
                    e.preventDefault();
                    markAsRead(notification.id);
                  }}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start gap-2 w-full">
                    {getIcon(notification.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {notification.providerName}
                        </p>
                        <Badge variant={getSeverityBadgeColor(notification.severity)} className="text-xs">
                          {notification.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatNotificationText(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.state} • Expires {new Date(notification.expirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full cursor-pointer">
            <a className="w-full text-center text-sm" data-testid="link-view-all-notifications">
              View all notifications
            </a>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
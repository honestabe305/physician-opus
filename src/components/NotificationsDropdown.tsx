import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Calendar,
  FileText,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from "lucide-react";
import { Link } from "wouter";

interface Notification {
  id: string;
  type: 'license_expiring' | 'document_required' | 'profile_incomplete' | 'system_alert' | 'approval_needed';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  backendData?: any;
}

// Mock notifications data - in a real app, this would come from an API
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'license_expiring',
    title: 'License Expiring Soon',
    message: 'Dr. Sarah Johnson\'s medical license expires in 30 days',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'document_required',
    title: 'Document Upload Required',
    message: 'Missing malpractice insurance certificate for Dr. Michael Chen',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'profile_incomplete',
    title: 'Profile Incomplete',
    message: 'Dr. Emily Rodriguez profile is 85% complete',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    priority: 'low'
  },
  {
    id: '4',
    type: 'approval_needed',
    title: 'Approval Required',
    message: 'New physician registration pending your review',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    priority: 'urgent'
  },
  {
    id: '5',
    type: 'system_alert',
    title: 'System Maintenance',
    message: 'Scheduled maintenance completed successfully',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    priority: 'low'
  }
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'license_expiring':
      return <Calendar className="h-4 w-4 text-orange-500" />;
    case 'document_required':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'profile_incomplete':
      return <UserCheck className="h-4 w-4 text-yellow-500" />;
    case 'system_alert':
      return <AlertTriangle className="h-4 w-4 text-purple-500" />;
    case 'approval_needed':
      return <Clock className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const formatTimeAgo = (timestamp: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

interface NotificationsDropdownProps {
  hasEnabledNotifications: () => boolean;
  getEnabledCount: () => number;
}

export function NotificationsDropdown({ hasEnabledNotifications, getEnabledCount }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch real notifications from backend
  const { data: backendNotifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/notifications/upcoming', { days: 30 }],
    queryFn: () => apiRequest('/api/notifications/upcoming?days=30'),
    refetchInterval: 60000,
  });

  // Convert backend notifications to frontend format
  const notifications: Notification[] = backendNotifications.map(notification => ({
    id: notification.id,
    type: notification.type === 'license' ? 'license_expiring' : 
          notification.type === 'dea' ? 'license_expiring' :
          notification.type === 'csr' ? 'license_expiring' :
          notification.type === 'document' ? 'document_required' :
          notification.type === 'profile' ? 'profile_incomplete' :
          notification.type === 'approval' ? 'approval_needed' : 'system_alert',
    title: notification.type === 'license' ? 'License Expiring Soon' :
           notification.type === 'dea' ? 'DEA Registration Expiring' :
           notification.type === 'csr' ? 'CSR License Expiring' :
           notification.type === 'document' ? 'Document Upload Required' :
           notification.type === 'profile' ? 'Profile Incomplete' :
           notification.type === 'approval' ? 'Approval Required' : 'System Alert',
    message: notification.message || `${notification.providerName || 'Physician'} - ${notification.licenseType || 'Issue'} requires attention`,
    timestamp: new Date(notification.notificationDate || notification.createdAt || Date.now()),
    read: notification.sentStatus === 'read',
    priority: notification.severity === 'critical' ? 'urgent' :
              notification.severity === 'warning' ? 'high' :
              notification.severity === 'info' ? 'medium' : 'low',
    // Store backend data for navigation
    backendData: notification
  }));

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/mark-read`, {
        method: 'PUT',
      });
      // The query will be refetched automatically
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      // The query will be refetched automatically
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 relative" 
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center" 
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <DropdownMenuLabel className="text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-1">
              {notifications.map((notification) => {
                // Generate specific navigation URL based on backend data
                const getNotificationLink = (notification: Notification): string => {
                  if (!notification.backendData) {
                    // Fallback for generic notifications
                    switch (notification.type) {
                      case 'license_expiring':
                        return '/licensure';
                      case 'document_required':
                        return '/documents';
                      case 'profile_incomplete':
                        return '/physicians';
                      case 'approval_needed':
                        return '/physicians?status=pending';
                      case 'system_alert':
                        return '/settings';
                      default:
                        return '#';
                    }
                  }
                  
                  const { physicianId, type, entityId } = notification.backendData;
                  if (physicianId) {
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
                  }
                  
                  return '/physicians';
                };
                
                const notificationLink = getNotificationLink(notification);
                
                const handleClick = () => {
                  markAsRead(notification.id);
                  setIsOpen(false);
                };
                
                const NotificationContent = (
                  <div
                    className={`p-3 hover:bg-muted/50 cursor-pointer border-l-2 ${
                      notification.read 
                        ? 'border-l-transparent' 
                        : `border-l-2 ${getPriorityColor(notification.priority)}`
                    } ${notification.read ? 'opacity-60' : ''}`}
                    onClick={handleClick}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-xs text-primary font-medium">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
                
                return notificationLink !== '#' ? (
                  <Link key={notification.id} href={notificationLink}>
                    {NotificationContent}
                  </Link>
                ) : (
                  <div key={notification.id}>
                    {NotificationContent}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationsDropdown;
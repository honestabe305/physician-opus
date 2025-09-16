import { Link, useLocation } from "wouter";
import {
  Users,
  UserPlus,
  FileText,
  Search,
  BarChart3,
  Settings,
  Shield,
  Clock,
  Building2,
  GraduationCap,
  LogOut
} from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: BarChart3 },
      { title: "All Physicians", url: "/physicians", icon: Users },
      { title: "Add Physician", url: "/physicians/new", icon: UserPlus },
      { title: "Search", url: "/search", icon: Search },
    ]
  },
  {
    title: "Data Management",
    items: [
      { title: "Demographics", url: "/demographics", icon: Users },
      { title: "Contact Info", url: "/contact", icon: FileText },
      { title: "Practice Info", url: "/practice", icon: Building2 },
      { title: "Licensure", url: "/licensure", icon: Shield },
      { title: "Education", url: "/education", icon: GraduationCap },
      { title: "Work History", url: "/work-history", icon: Clock },
    ]
  },
  {
    title: "System",
    items: [
      { title: "Documents", url: "/documents", icon: FileText },
      { title: "Settings", url: "/settings", icon: Settings },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [location] = useLocation();
  const currentPath = location;
  const collapsed = state === "collapsed";
  const { profile, getInitials, getDisplayName, getRoleColor } = useUserProfile();

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border flex flex-col">
        {/* User Profile Section */}
        <div className="p-4 border-b border-border">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar className={collapsed ? "h-10 w-10" : "h-12 w-12"}>
              <AvatarImage src={profile.profilePhoto} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="sidebar-username">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="sidebar-email">
                  {profile.email || "No email set"}
                </p>
                {profile.role && (
                  <Badge 
                    variant="outline" 
                    className="mt-1 text-xs"
                    data-testid="sidebar-role-badge"
                  >
                    {profile.role}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {!collapsed && profile.department && (
            <div className="mt-3 text-xs text-muted-foreground">
              <Building2 className="inline h-3 w-3 mr-1" />
              {profile.department}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive(item.url)
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-foreground/90 hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
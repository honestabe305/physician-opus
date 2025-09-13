import { NavLink, useLocation } from "react-router-dom";
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
  GraduationCap
} from "lucide-react";

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
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
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
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-foreground/90 hover:text-foreground hover:bg-muted"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, User, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayName, getInitials, getUserRole, getUserEmail } from "@/lib/user-display-utils";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const [, setLocation] = useLocation();
  

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MD</span>
                </div>
                <h1 className="text-xl font-semibold text-foreground">PhysicianCRM</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-theme-toggle">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setTheme("light")}
                    data-testid="theme-option-light"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTheme("dark")}
                    data-testid="theme-option-dark"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTheme("system")}
                    data-testid="theme-option-system"
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.profilePhoto} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user, profile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium text-foreground" data-testid="header-username">
                        {getDisplayName(user, profile)}
                      </p>
                      {getUserRole(user, profile) && (
                        <p className="text-xs text-muted-foreground" data-testid="header-role">
                          {getUserRole(user, profile)}
                        </p>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{getDisplayName(user, profile)}</p>
                    <p className="text-xs text-muted-foreground">{getUserEmail(user, profile)}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer" 
                    data-testid="menu-profile"
                    onClick={() => setLocation("/settings")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    data-testid="menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
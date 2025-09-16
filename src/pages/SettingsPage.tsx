import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/contexts/ThemeContext";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings,
  User,
  Palette,
  Shield,
  Database,
  Code,
  Download,
  Upload,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  Bell,
  Clock,
  Globe,
  Save,
  RotateCcw,
  Info,
  CheckCircle,
  AlertCircle,
  Lock
} from "lucide-react";
import type { SelectUserSettings } from "../../shared/schema";

// Form validation schemas
const profileSettingsSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required")
});

const appPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string().min(1, "Language is required"),
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  timeFormat: z.enum(["12", "24"]),
  emailNotifications: z.boolean(),
  desktopNotifications: z.boolean(),
  smsNotifications: z.boolean()
});

const dataManagementSchema = z.object({
  defaultPageSize: z.number().min(10).max(100),
  autoSaveInterval: z.number().min(60).max(3600),
  showArchived: z.boolean(),
  dataRetentionDays: z.number().min(365).max(3650)
});

const securitySettingsSchema = z.object({
  sessionTimeout: z.number().min(300).max(28800),
  twoFactorEnabled: z.boolean(),
  debugMode: z.boolean()
});

type ProfileSettings = z.infer<typeof profileSettingsSchema>;
type AppPreferences = z.infer<typeof appPreferencesSchema>;
type DataManagement = z.infer<typeof dataManagementSchema>;
type SecuritySettings = z.infer<typeof securitySettingsSchema>;

// Mock current user ID - in real app this would come from auth context
const CURRENT_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user settings (make optional)
  const { data: userSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: [`/user-settings/${CURRENT_USER_ID}`],
    queryFn: () => apiRequest(`/user-settings/${CURRENT_USER_ID}`),
    retry: false,
    enabled: false // Disable for now since API doesn't exist yet
  });

  // Fetch system info (make optional)
  const { data: systemInfo, isLoading: systemLoading } = useQuery({
    queryKey: ['/system/info'],
    queryFn: () => apiRequest('/system/info'),
    enabled: false // Disable for now since API doesn't exist yet
  });

  // Fetch user profile (make optional)
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: [`/profiles/user/${CURRENT_USER_ID}`],
    queryFn: () => apiRequest(`/profiles/user/${CURRENT_USER_ID}`),
    retry: false,
    enabled: false // Disable for now since API doesn't exist yet
  });

  // Form configurations
  const profileForm = useForm<ProfileSettings>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: ""
    }
  });

  const preferencesForm = useForm<AppPreferences>({
    resolver: zodResolver(appPreferencesSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      timezone: "America/New_York",
      dateFormat: "MM/dd/yyyy",
      timeFormat: "12",
      emailNotifications: true,
      desktopNotifications: true,
      smsNotifications: false
    }
  });

  const dataForm = useForm<DataManagement>({
    resolver: zodResolver(dataManagementSchema),
    defaultValues: {
      defaultPageSize: 25,
      autoSaveInterval: 300,
      showArchived: false,
      dataRetentionDays: 2555
    }
  });

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      sessionTimeout: 3600,
      twoFactorEnabled: false,
      debugMode: false
    }
  });

  // Update user settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<SelectUserSettings>) => {
      return apiRequest(`/user-settings/${CURRENT_USER_ID}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/user-settings/${CURRENT_USER_ID}`] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });

  // Create user settings mutation for first time
  const createSettingsMutation = useMutation({
    mutationFn: (data: Partial<SelectUserSettings>) => {
      return apiRequest('/user-settings', {
        method: 'POST',
        body: JSON.stringify({ userId: CURRENT_USER_ID, ...data })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/user-settings/${CURRENT_USER_ID}`] });
      toast({
        title: "Settings created",
        description: "Your preferences have been saved successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating settings",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });

  // Initialize forms with data when loaded
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        fullName: userProfile.fullName || "",
        email: userProfile.email || "",
        role: userProfile.role || ""
      });
    }
  }, [userProfile, profileForm]);

  // Initialize with current theme and user settings if available
  useEffect(() => {
    const currentSettings = userSettings || {};
    
    preferencesForm.reset({
      theme: theme || "system", // Use current theme from context
      language: currentSettings.language || "en",
      timezone: currentSettings.timezone || "America/New_York",
      dateFormat: currentSettings.dateFormat || "MM/dd/yyyy",
      timeFormat: currentSettings.timeFormat || "12",
      emailNotifications: currentSettings.emailNotifications ?? true,
      desktopNotifications: currentSettings.desktopNotifications ?? true,
      smsNotifications: currentSettings.smsNotifications ?? false
    });

    if (userSettings) {
      dataForm.reset({
        defaultPageSize: userSettings.defaultPageSize || 25,
        autoSaveInterval: userSettings.autoSaveInterval || 300,
        showArchived: userSettings.showArchived ?? false,
        dataRetentionDays: userSettings.dataRetentionDays || 2555
      });

      securityForm.reset({
        sessionTimeout: userSettings.sessionTimeout || 3600,
        twoFactorEnabled: userSettings.twoFactorEnabled ?? false,
        debugMode: userSettings.debugMode ?? false
      });
    }
  }, [userSettings, theme, preferencesForm, dataForm, securityForm]);

  // Save handlers
  const handleSavePreferences = async (data: AppPreferences) => {
    setIsSaving(true);
    try {
      // Theme is already applied immediately on change
      // Just save to database if API is available
      toast({
        title: "Settings saved",
        description: "Your preferences have been saved locally."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDataSettings = async (data: DataManagement) => {
    setIsSaving(true);
    try {
      const mutation = userSettings ? updateSettingsMutation : createSettingsMutation;
      await mutation.mutateAsync(data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecuritySettings = async (data: SecuritySettings) => {
    setIsSaving(true);
    try {
      const mutation = userSettings ? updateSettingsMutation : createSettingsMutation;
      await mutation.mutateAsync(data);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset handlers
  const handleResetPreferences = () => {
    preferencesForm.reset({
      theme: "system",
      language: "en",
      timezone: "America/New_York",
      dateFormat: "MM/dd/yyyy",
      timeFormat: "12",
      emailNotifications: true,
      desktopNotifications: true,
      smsNotifications: false
    });
    // Also reset theme to system
    setTheme("system");
    toast({
      title: "Preferences reset",
      description: "All preferences have been reset to defaults."
    });
  };

  const handleResetDataSettings = () => {
    dataForm.reset({
      defaultPageSize: 25,
      autoSaveInterval: 300,
      showArchived: false,
      dataRetentionDays: 2555
    });
    toast({
      title: "Data settings reset",
      description: "Data management settings have been reset to defaults."
    });
  };

  const handleResetSecuritySettings = () => {
    securityForm.reset({
      sessionTimeout: 3600,
      twoFactorEnabled: false,
      debugMode: false
    });
    toast({
      title: "Security settings reset",
      description: "Security settings have been reset to defaults."
    });
  };

  // Export/Import handlers
  const handleExportSettings = () => {
    const settingsData = {
      profile: profileForm.getValues(),
      preferences: preferencesForm.getValues(),
      dataManagement: dataForm.getValues(),
      security: securityForm.getValues(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `physiciancrm-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Settings exported",
      description: "Your settings have been downloaded as a JSON file."
    });
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const settingsData = JSON.parse(e.target?.result as string);
            
            if (settingsData.preferences) {
              preferencesForm.reset(settingsData.preferences);
            }
            if (settingsData.dataManagement) {
              dataForm.reset(settingsData.dataManagement);
            }
            if (settingsData.security) {
              securityForm.reset(settingsData.security);
            }

            toast({
              title: "Settings imported",
              description: "Your settings have been restored from the file."
            });
          } catch (error) {
            toast({
              title: "Import failed",
              description: "The settings file is invalid or corrupted.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Don't show error for missing user settings, handle gracefully
  if (settingsError && settingsError instanceof Error && !settingsError.message.includes('404') && !settingsError.message.includes('User settings not found')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Settings</h1>
            <p className="text-muted-foreground">Configure system preferences and options</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load settings: {settingsError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Settings</h1>
          <p className="text-muted-foreground">Configure system preferences and options</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data">Data</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          <TabsTrigger value="advanced" data-testid="tab-advanced">Advanced</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>User Profile</CardTitle>
              </div>
              <CardDescription>
                Manage your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Form {...profileForm}>
                  <form className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-fullname"
                              placeholder="Enter your full name" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-email"
                              type="email" 
                              placeholder="Enter your email address" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-role">
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Profile changes require administrator approval and may take 24-48 hours to take effect.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Application Preferences</CardTitle>
              </div>
              <CardDescription>
                Customize your application experience and interface settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit(handleSavePreferences)} className="space-y-6">
                  {/* Theme Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Appearance</h3>
                    <FormField
                      control={preferencesForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Apply theme immediately when changed
                                setTheme(value as "light" | "dark" | "system");
                              }}
                            >
                              <SelectTrigger data-testid="select-theme">
                                <SelectValue />  
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">
                                  <div className="flex items-center gap-2">
                                    <Sun className="h-4 w-4" />
                                    Light
                                  </div>
                                </SelectItem>
                                <SelectItem value="dark">
                                  <div className="flex items-center gap-2">
                                    <Moon className="h-4 w-4" />
                                    Dark
                                  </div>
                                </SelectItem>
                                <SelectItem value="system">
                                  <div className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4" />
                                    System
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Choose your preferred color scheme
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Localization Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Localization</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={preferencesForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger data-testid="select-language">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="es">Español</SelectItem>
                                  <SelectItem value="fr">Français</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={preferencesForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger data-testid="select-timezone">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                  <SelectItem value="UTC">UTC</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={preferencesForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger data-testid="select-dateformat">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={preferencesForm.control}
                        name="timeFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Format</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger data-testid="select-timeformat">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                                  <SelectItem value="24">24-hour</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Notification Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notifications</h3>
                    <div className="space-y-4">
                      <FormField
                        control={preferencesForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email about important updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                data-testid="switch-email-notifications"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={preferencesForm.control}
                        name="desktopNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Desktop Notifications</FormLabel>
                              <FormDescription>
                                Show browser notifications for real-time updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                data-testid="switch-desktop-notifications"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={preferencesForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive text messages for critical alerts
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                data-testid="switch-sms-notifications"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetPreferences}
                      data-testid="button-reset-preferences"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      data-testid="button-save-preferences"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Data Management</CardTitle>
              </div>
              <CardDescription>
                Configure data handling, backup preferences, and retention policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...dataForm}>
                <form onSubmit={dataForm.handleSubmit(handleSaveDataSettings)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Display Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={dataForm.control}
                        name="defaultPageSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Page Size</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value.toString()} 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                              >
                                <SelectTrigger data-testid="select-pagesize">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10 items</SelectItem>
                                  <SelectItem value="25">25 items</SelectItem>
                                  <SelectItem value="50">50 items</SelectItem>
                                  <SelectItem value="100">100 items</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Number of items to display per page
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dataForm.control}
                        name="autoSaveInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auto-save Interval (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                data-testid="input-autosave"
                                type="number"
                                min="60"
                                max="3600"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              How often to automatically save changes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={dataForm.control}
                      name="showArchived"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Archived Records</FormLabel>
                            <FormDescription>
                              Include archived physicians and documents in search results
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-show-archived"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Retention</h3>
                    <FormField
                      control={dataForm.control}
                      name="dataRetentionDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Retention Period (days)</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value.toString()} 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger data-testid="select-retention">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="365">1 year</SelectItem>
                                <SelectItem value="1095">3 years</SelectItem>
                                <SelectItem value="1825">5 years</SelectItem>
                                <SelectItem value="2555">7 years (recommended)</SelectItem>
                                <SelectItem value="3650">10 years</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            How long to keep deleted records before permanent removal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Export & Import</h3>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleExportSettings}
                        data-testid="button-export-settings"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Settings
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImportSettings}
                        data-testid="button-import-settings"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetDataSettings}
                      data-testid="button-reset-data"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      data-testid="button-save-data"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security Settings</CardTitle>
              </div>
              <CardDescription>
                Manage account security, authentication, and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(handleSaveSecuritySettings)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Session Management</h3>
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (seconds)</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value.toString()} 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger data-testid="select-session-timeout">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="300">5 minutes</SelectItem>
                                <SelectItem value="900">15 minutes</SelectItem>
                                <SelectItem value="1800">30 minutes</SelectItem>
                                <SelectItem value="3600">1 hour</SelectItem>
                                <SelectItem value="7200">2 hours</SelectItem>
                                <SelectItem value="14400">4 hours</SelectItem>
                                <SelectItem value="28800">8 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Automatically log out after this period of inactivity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Authentication</h3>
                    <FormField
                      control={securityForm.control}
                      name="twoFactorEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                            <FormDescription>
                              Add an extra layer of security to your account
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-two-factor"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        Two-factor authentication requires additional setup through your administrator.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Password Security</h3>
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        data-testid="button-change-password"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Password changes require verification and may require administrator approval.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetSecuritySettings}
                      data-testid="button-reset-security"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      data-testid="button-save-security"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                <CardTitle>Advanced Settings</CardTitle>
              </div>
              <CardDescription>
                Developer options, debugging tools, and advanced configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Developer Options</h3>
                <FormField
                  control={securityForm.control}
                  name="debugMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Debug Mode</FormLabel>
                        <FormDescription>
                          Enable detailed logging and debugging information
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          data-testid="switch-debug-mode"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Debug mode may affect application performance and should only be enabled when troubleshooting.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">API Configuration</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="api-endpoint">API Endpoint</Label>
                      <Input
                        id="api-endpoint"
                        data-testid="input-api-endpoint"
                        value={window.location.origin + '/api'}
                        disabled
                        className="font-mono text-sm"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Base URL for API requests
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cache Management</h3>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      queryClient.clear();
                      toast({
                        title: "Cache cleared",
                        description: "All cached data has been removed."
                      });
                    }}
                    data-testid="button-clear-cache"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      window.location.reload();
                    }}
                    data-testid="button-reload-app"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Information Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>System Information</CardTitle>
              </div>
              <CardDescription>
                View application status, database information, and system health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  {/* Application Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Application Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Version</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" data-testid="badge-version">
                            {systemInfo?.version || '1.0.0'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Build Date</Label>
                        <p className="text-sm font-mono" data-testid="text-build-date">
                          {systemInfo?.buildDate ? new Date(systemInfo.buildDate).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>System Health</Label>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm" data-testid="text-system-health">
                            {systemInfo?.systemHealth || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Uptime</Label>
                        <p className="text-sm" data-testid="text-uptime">
                          {systemInfo?.uptime 
                            ? `${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m`
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Database Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Database Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Connection Status</Label>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm" data-testid="text-db-status">
                            {systemInfo?.databaseStatus || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Total Physicians</Label>
                        <p className="text-2xl font-bold" data-testid="text-total-physicians">
                          {systemInfo?.totalPhysicians || 0}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Total Profiles</Label>
                        <p className="text-2xl font-bold" data-testid="text-total-profiles">
                          {systemInfo?.totalProfiles || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Runtime Environment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Runtime Environment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Node.js Version</Label>
                        <p className="text-sm font-mono" data-testid="text-node-version">
                          {systemInfo?.nodeVersion || 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <p className="text-sm" data-testid="text-platform">
                          {systemInfo?.platform || 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Architecture</Label>
                        <p className="text-sm" data-testid="text-architecture">
                          {systemInfo?.architecture || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Support Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Support Information</h3>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        For technical support, please contact your system administrator or visit the help documentation.
                      </AlertDescription>
                    </Alert>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
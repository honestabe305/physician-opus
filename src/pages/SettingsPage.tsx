import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/contexts/ThemeContext";
import { useDisplayPreferences } from "@/hooks/use-display-preferences";
import { useNotificationPreferences, COMMON_MEDICAL_STATES } from "@/hooks/use-notification-preferences";
import { useSecurityPreferences } from "@/hooks/use-security-preferences";
import { useUserProfile } from "@/hooks/use-user-profile";
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
  Lock,
  Calendar as CalendarIcon,
  Eye,
  Layout,
  BellRing,
  Mail,
  Smartphone,
  FileWarning,
  MapPin,
  CalendarCheck,
  TestTube,
  CalendarDays,
  AlertTriangle,
  Activity,
  Trash2,
  KeyRound,
  Timer,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  LogOut,
  Laptop,
  MapPinned,
  XCircle,
  Camera,
  Building,
  Phone,
  Briefcase,
  BadgeCheck,
  Contact
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { SelectUserSettings } from "../../shared/schema";
import type { UserProfile } from "@/hooks/use-user-profile";

// Form validation schemas
const userProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().optional(),
  department: z.enum(["Administration", "Medical", "HR", "IT", "Compliance", ""]),
  employeeId: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  extension: z.string().optional(),
  mobile: z.string().optional(),
  preferredContact: z.enum(["Email", "Phone", "Mobile"]),
  role: z.enum(["Administrator", "Manager", "Staff", "Viewer", ""]),
  hireDate: z.string().optional(),
  officeLocation: z.string().optional(),
  supervisor: z.string().optional(),
  licenseNumber: z.string().optional(),
  bio: z.string().optional(),
  signature: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional()
});

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

type UserProfileFormData = z.infer<typeof userProfileSchema>;
type ProfileSettings = z.infer<typeof profileSettingsSchema>;
type AppPreferences = z.infer<typeof appPreferencesSchema>;
type DataManagement = z.infer<typeof dataManagementSchema>;
type SecuritySettings = z.infer<typeof securitySettingsSchema>;

// Mock current user ID - in real app this would come from auth context
const CURRENT_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { 
    preferences: displayPreferences, 
    updatePreference, 
    updatePreferences, 
    resetPreferences: resetDisplayPreferences 
  } = useDisplayPreferences();
  const {
    preferences: notificationPreferences,
    updateCredentialExpiration,
    updateLicenseRenewal,
    updateDocumentUpload,
    updateDigest,
    resetPreferences: resetNotificationPreferences,
    getEnabledCount,
    getEnabledMethods
  } = useNotificationPreferences();
  const {
    preferences: securityPreferences,
    updatePreference: updateSecurityPreference,
    updatePreferences: updateSecurityPreferences,
    resetPreferences: resetSecurityPreferences,
    clearActivityLog,
    sessionWarningActive,
    timeUntilTimeout,
    generateBackupCodes,
    getPasswordRequirements
  } = useSecurityPreferences();
  const {
    profile: userProfile,
    updateProfile,
    resetProfile,
    getInitials,
    getCompletionPercentage,
    formatPhone
  } = useUserProfile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("user-profile");
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
  const { data: fetchedUserProfile, isLoading: profileLoading } = useQuery({
    queryKey: [`/profiles/user/${CURRENT_USER_ID}`],
    queryFn: () => apiRequest(`/profiles/user/${CURRENT_USER_ID}`),
    retry: false,
    enabled: false // Disable for now since API doesn't exist yet
  });

  // Form configurations
  const userProfileForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: fetchedUserProfile as UserProfileFormData
  });

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

  // Initialize user profile form with current data
  useEffect(() => {
    userProfileForm.reset(userProfile as UserProfileFormData);
  }, [userProfile]);

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
  const handleSaveUserProfile = async (data: UserProfileFormData) => {
    setIsSaving(true);
    try {
      // Format phone numbers before saving
      const formattedData = {
        ...data,
        phone: data.phone ? formatPhone(data.phone) : data.phone,
        mobile: data.mobile ? formatPhone(data.mobile) : data.mobile,
        emergencyContactPhone: data.emergencyContactPhone ? formatPhone(data.emergencyContactPhone) : data.emergencyContactPhone
      };
      updateProfile(formattedData);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully."
      });
    } finally {
      setIsSaving(false);
    }
  };

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
  const handleResetUserProfile = () => {
    resetProfile();
    userProfileForm.reset(userProfile as UserProfileFormData);
    toast({
      title: "Profile reset",
      description: "Your profile has been reset to default values."
    });
  };

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
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="user-profile" data-testid="tab-user-profile">Profile</TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">Account</TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display" data-testid="tab-display">Display</TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data">Data</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          <TabsTrigger value="advanced" data-testid="tab-advanced">Advanced</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
        </TabsList>

        {/* User Profile Tab */}
        <TabsContent value="user-profile" className="space-y-6">
          <div className="grid gap-6">
            {/* Profile Completion Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle>User Profile</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Profile Completion: {getCompletionPercentage()}%
                    </div>
                    <Progress value={getCompletionPercentage()} className="w-24" />
                  </div>
                </div>
                <CardDescription>
                  Manage your personal and professional information
                </CardDescription>
              </CardHeader>
            </Card>

            <Form {...userProfileForm}>
              <form onSubmit={userProfileForm.handleSubmit(handleSaveUserProfile)} className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Contact className="h-4 w-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile.profilePhoto} />
                        <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button type="button" variant="outline" size="sm" disabled>
                          <Camera className="h-4 w-4 mr-2" />
                          Upload Photo
                        </Button>
                        <p className="text-xs text-muted-foreground">Profile photo upload coming soon</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userProfileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John Doe" data-testid="input-fullname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userProfileForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title/Position</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Senior Administrator" data-testid="input-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userProfileForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Administration">Administration</SelectItem>
                                <SelectItem value="Medical">Medical</SelectItem>
                                <SelectItem value="HR">Human Resources</SelectItem>
                                <SelectItem value="IT">Information Technology</SelectItem>
                                <SelectItem value="Compliance">Compliance</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userProfileForm.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="EMP-2024-001" data-testid="input-employeeid" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userProfileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="john.doe@example.com" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userProfileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(555) 123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userProfileForm.control}
                        name="extension"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extension</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="1234" data-testid="input-extension" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userProfileForm.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(555) 987-6543" data-testid="input-mobile" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={userProfileForm.control}
                      name="preferredContact"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Preferred Contact Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-6"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Email" data-testid="radio-email" />
                                </FormControl>
                                <FormLabel className="font-normal">Email</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Phone" data-testid="radio-phone" />
                                </FormControl>
                                <FormLabel className="font-normal">Phone</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Mobile" data-testid="radio-mobile" />
                                </FormControl>
                                <FormLabel className="font-normal">Mobile</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Professional Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Professional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userProfileForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Administrator">Administrator</SelectItem>
                                <SelectItem value="Manager">Manager</SelectItem>
                                <SelectItem value="Staff">Staff</SelectItem>
                                <SelectItem value="Viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userProfileForm.control}
                        name="hireDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hire Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-hiredate" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userProfileForm.control}
                        name="officeLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Office Location</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Building A, Room 301" data-testid="input-office" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userProfileForm.control}
                        name="supervisor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supervisor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Jane Smith" data-testid="input-supervisor" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={userProfileForm.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number (Medical Staff)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="MD-123456" data-testid="input-license" />
                          </FormControl>
                          <FormDescription>
                            For medical professionals only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Additional Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" />
                      Additional Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={userProfileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio / About</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Tell us about yourself..." 
                              className="min-h-[100px]"
                              data-testid="textarea-bio"
                            />
                          </FormControl>
                          <FormDescription>
                            A brief description about yourself and your role
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userProfileForm.control}
                      name="signature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Signature</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Your Name&#10;Title&#10;Department" 
                              className="min-h-[80px] font-mono text-sm"
                              data-testid="textarea-signature"
                            />
                          </FormControl>
                          <FormDescription>
                            This signature will be used in reports and communications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Emergency Contact</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userProfileForm.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Emergency contact name" data-testid="input-emergency-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userProfileForm.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="(555) 111-2222" data-testid="input-emergency-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetUserProfile}
                    disabled={isSaving}
                    data-testid="button-reset-profile"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button type="submit" disabled={isSaving} data-testid="button-save-profile">
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Account Settings Tab (renamed from Profile) */}
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

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>
                Configure how and when you receive notifications about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Credential Expiration Alerts */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Credential Expiration Alerts
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Credential Expiration Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when physician credentials are approaching expiration
                      </p>
                    </div>
                    <Switch
                      data-testid="switch-credential-expiration"
                      checked={notificationPreferences.credentialExpiration.enabled}
                      onCheckedChange={(checked) => 
                        updateCredentialExpiration({ enabled: checked })
                      }
                    />
                  </div>
                  
                  {notificationPreferences.credentialExpiration.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Warning Period</Label>
                        <Select
                          value={String(notificationPreferences.credentialExpiration.warningPeriod)}
                          onValueChange={(value) => 
                            updateCredentialExpiration({ warningPeriod: Number(value) as 15 | 30 | 60 | 90 })
                          }
                        >
                          <SelectTrigger data-testid="select-warning-period">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 days before expiration</SelectItem>
                            <SelectItem value="30">30 days before expiration</SelectItem>
                            <SelectItem value="60">60 days before expiration</SelectItem>
                            <SelectItem value="90">90 days before expiration</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          How far in advance to start sending expiration warnings
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Notification Methods</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <input
                              type="checkbox"
                              id="method-email"
                              data-testid="checkbox-method-email"
                              checked={notificationPreferences.credentialExpiration.methods.email}
                              onChange={(e) => 
                                updateCredentialExpiration({ 
                                  methods: { ...notificationPreferences.credentialExpiration.methods, email: e.target.checked }
                                })
                              }
                              className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="method-email" className="font-normal cursor-pointer">
                              Email Notifications
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <input
                              type="checkbox"
                              id="method-inapp"
                              data-testid="checkbox-method-inapp"
                              checked={notificationPreferences.credentialExpiration.methods.inApp}
                              onChange={(e) => 
                                updateCredentialExpiration({ 
                                  methods: { ...notificationPreferences.credentialExpiration.methods, inApp: e.target.checked }
                                })
                              }
                              className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="method-inapp" className="font-normal cursor-pointer">
                              In-App Notifications
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <input
                              type="checkbox"
                              id="method-sms"
                              data-testid="checkbox-method-sms"
                              checked={notificationPreferences.credentialExpiration.methods.sms}
                              onChange={(e) => 
                                updateCredentialExpiration({ 
                                  methods: { ...notificationPreferences.credentialExpiration.methods, sms: e.target.checked }
                                })
                              }
                              className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="method-sms" className="font-normal cursor-pointer">
                              SMS Notifications
                            </Label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* License Renewal Reminders */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  License Renewal Reminders
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable License Renewal Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders about upcoming license renewals by state
                      </p>
                    </div>
                    <Switch
                      data-testid="switch-license-renewal"
                      checked={notificationPreferences.licenseRenewal.enabled}
                      onCheckedChange={(checked) => 
                        updateLicenseRenewal({ enabled: checked })
                      }
                    />
                  </div>
                  
                  {notificationPreferences.licenseRenewal.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Monitored States</Label>
                        <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {COMMON_MEDICAL_STATES.map((state) => (
                              <div key={state.code} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`state-${state.code}`}
                                  data-testid={`checkbox-state-${state.code}`}
                                  checked={notificationPreferences.licenseRenewal.monitoredStates.includes(state.code)}
                                  onChange={(e) => {
                                    const states = e.target.checked
                                      ? [...notificationPreferences.licenseRenewal.monitoredStates, state.code]
                                      : notificationPreferences.licenseRenewal.monitoredStates.filter(s => s !== state.code);
                                    updateLicenseRenewal({ monitoredStates: states });
                                  }}
                                  className="h-4 w-4 rounded border-input"
                                />
                                <Label htmlFor={`state-${state.code}`} className="font-normal cursor-pointer text-sm">
                                  {state.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Select states where you want to monitor license renewals
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Reminder Frequency</Label>
                        <Select
                          value={notificationPreferences.licenseRenewal.frequency}
                          onValueChange={(value) => 
                            updateLicenseRenewal({ frequency: value as 'weekly' | 'biweekly' | 'monthly' })
                          }
                        >
                          <SelectTrigger data-testid="select-reminder-frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          How often to send license renewal reminder summaries
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Document Upload Reminders */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileWarning className="h-4 w-4" />
                  Document Upload Reminders
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Document Upload Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminders when documents are requested but not uploaded
                      </p>
                    </div>
                    <Switch
                      data-testid="switch-document-upload"
                      checked={notificationPreferences.documentUpload.enabled}
                      onCheckedChange={(checked) => 
                        updateDocumentUpload({ enabled: checked })
                      }
                    />
                  </div>
                  
                  {notificationPreferences.documentUpload.enabled && (
                    <div className="space-y-2">
                      <Label>Days After Request</Label>
                      <Select
                        value={String(notificationPreferences.documentUpload.daysAfterRequest)}
                        onValueChange={(value) => 
                          updateDocumentUpload({ daysAfterRequest: Number(value) as 1 | 3 | 7 | 14 })
                        }
                      >
                        <SelectTrigger data-testid="select-days-after-request">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day after request</SelectItem>
                          <SelectItem value="3">3 days after request</SelectItem>
                          <SelectItem value="7">7 days after request</SelectItem>
                          <SelectItem value="14">14 days after request</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        When to send the first reminder after a document is requested
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Daily/Weekly Digest */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Daily/Weekly Digest
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Digest Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a summary of all notifications in a single email
                      </p>
                    </div>
                    <Switch
                      data-testid="switch-digest"
                      checked={notificationPreferences.digest.enabled}
                      onCheckedChange={(checked) => 
                        updateDigest({ enabled: checked })
                      }
                    />
                  </div>
                  
                  {notificationPreferences.digest.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="freq-daily"
                              name="digest-frequency"
                              value="daily"
                              data-testid="radio-freq-daily"
                              checked={notificationPreferences.digest.frequency === 'daily'}
                              onChange={() => updateDigest({ frequency: 'daily', weekDay: undefined })}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="freq-daily" className="font-normal cursor-pointer">
                              Daily
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="freq-weekly"
                              name="digest-frequency"
                              value="weekly"
                              data-testid="radio-freq-weekly"
                              checked={notificationPreferences.digest.frequency === 'weekly'}
                              onChange={() => updateDigest({ frequency: 'weekly', weekDay: 'monday' })}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="freq-weekly" className="font-normal cursor-pointer">
                              Weekly
                            </Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Send Time</Label>
                          <Input
                            type="time"
                            data-testid="input-send-time"
                            value={notificationPreferences.digest.sendTime}
                            onChange={(e) => updateDigest({ sendTime: e.target.value })}
                          />
                          <p className="text-sm text-muted-foreground">
                            What time to send the digest email
                          </p>
                        </div>
                        
                        {notificationPreferences.digest.frequency === 'weekly' && (
                          <div className="space-y-2">
                            <Label>Day of Week</Label>
                            <Select
                              value={notificationPreferences.digest.weekDay || 'monday'}
                              onValueChange={(value) => 
                                updateDigest({ 
                                  weekDay: value as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' 
                                })
                              }
                            >
                              <SelectTrigger data-testid="select-week-day">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monday">Monday</SelectItem>
                                <SelectItem value="tuesday">Tuesday</SelectItem>
                                <SelectItem value="wednesday">Wednesday</SelectItem>
                                <SelectItem value="thursday">Thursday</SelectItem>
                                <SelectItem value="friday">Friday</SelectItem>
                                <SelectItem value="saturday">Saturday</SelectItem>
                                <SelectItem value="sunday">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                              Which day to send the weekly digest
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Test Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Notifications
                </h3>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Send a test notification to verify your settings are working correctly
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const enabledMethods = getEnabledMethods();
                      if (enabledMethods.length === 0) {
                        toast({
                          title: "No notification methods enabled",
                          description: "Please enable at least one notification method to test",
                          variant: "destructive"
                        });
                      } else {
                        toast({
                          title: "Test notification sent!",
                          description: `Test notification sent via: ${enabledMethods.join(', ')}. This is a sample of what you'll receive for real notifications.`
                        });
                      }
                    }}
                    data-testid="button-test-notifications"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </Button>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetNotificationPreferences();
                    toast({
                      title: "Notification settings reset",
                      description: "All notification preferences have been reset to defaults."
                    });
                  }}
                  data-testid="button-reset-notifications"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {getEnabledCount()} notification types enabled
                  </Badge>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Notification settings saved",
                        description: "Your notification preferences have been saved."
                      });
                    }}
                    data-testid="button-save-notifications"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Preferences Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <CardTitle>Display Preferences</CardTitle>
              </div>
              <CardDescription>
                Customize how data is displayed throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date & Time Format Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date & Time Format
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select 
                      value={displayPreferences.dateFormat}
                      onValueChange={(value) => updatePreference('dateFormat', value as any)}
                    >
                      <SelectTrigger id="date-format" data-testid="select-date-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">
                          MM/DD/YYYY <span className="text-muted-foreground ml-2">({new Date().toLocaleDateString('en-US')})</span>
                        </SelectItem>
                        <SelectItem value="DD/MM/YYYY">
                          DD/MM/YYYY <span className="text-muted-foreground ml-2">({new Date().toLocaleDateString('en-GB')})</span>
                        </SelectItem>
                        <SelectItem value="YYYY-MM-DD">
                          YYYY-MM-DD <span className="text-muted-foreground ml-2">({new Date().toISOString().split('T')[0]})</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Format for displaying dates
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time-format">Time Format</Label>
                    <Select 
                      value={displayPreferences.timeFormat}
                      onValueChange={(value) => updatePreference('timeFormat', value as any)}
                    >
                      <SelectTrigger id="time-format" data-testid="select-time-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">
                          12-hour <span className="text-muted-foreground ml-2">(2:30 PM)</span>
                        </SelectItem>
                        <SelectItem value="24">
                          24-hour <span className="text-muted-foreground ml-2">(14:30)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Format for displaying time
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Time Zone</Label>
                    <Select 
                      value={displayPreferences.timeZone}
                      onValueChange={(value) => updatePreference('timeZone', value as any)}
                    >
                      <SelectTrigger id="timezone" data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Your local time zone for displaying dates and times
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Table Display Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Table Display
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="items-per-page">Items Per Page</Label>
                    <Select 
                      value={displayPreferences.itemsPerPage.toString()}
                      onValueChange={(value) => updatePreference('itemsPerPage', parseInt(value))}
                    >
                      <SelectTrigger id="items-per-page" data-testid="select-items-per-page">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 items</SelectItem>
                        <SelectItem value="25">25 items</SelectItem>
                        <SelectItem value="50">50 items</SelectItem>
                        <SelectItem value="100">100 items</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Default number of items to display in tables
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="table-view-mode">Table View Mode</Label>
                    <Select 
                      value={displayPreferences.tableViewMode}
                      onValueChange={(value) => updatePreference('tableViewMode', value as any)}
                    >
                      <SelectTrigger id="table-view-mode" data-testid="select-table-view-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">
                          Compact <span className="text-muted-foreground ml-2">(More rows, less spacing)</span>
                        </SelectItem>
                        <SelectItem value="comfortable">
                          Comfortable <span className="text-muted-foreground ml-2">(Standard spacing)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Density of table rows and spacing
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Preview Section */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Preview</h3>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2 mt-2">
                      <p>Your current display preferences:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Date format: <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, displayPreferences.dateFormat.includes('-') ? '-' : '/')}</strong></li>
                        <li>Time format: <strong>{displayPreferences.timeFormat === '12' ? '2:30 PM' : '14:30'}</strong></li>
                        <li>Time zone: <strong>{displayPreferences.timeZone}</strong></li>
                        <li>Items per page: <strong>{displayPreferences.itemsPerPage}</strong></li>
                        <li>Table view: <strong>{displayPreferences.tableViewMode}</strong></li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetDisplayPreferences();
                    toast({
                      title: "Display preferences reset",
                      description: "All display preferences have been reset to defaults."
                    });
                  }}
                  data-testid="button-reset-display"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Settings are saved automatically
                </div>
              </div>
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

        {/* Security Settings Tab - Enhanced */}
        <TabsContent value="security" className="space-y-6">
          {/* Session Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <CardTitle>Session Management</CardTitle>
              </div>
              <CardDescription>
                Configure session timeout and auto-lock settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout</Label>
                    <Select 
                      value={securityPreferences.sessionTimeout.toString()}
                      onValueChange={(value) => updateSecurityPreference('sessionTimeout', parseInt(value))}
                    >
                      <SelectTrigger id="session-timeout" data-testid="select-session-timeout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after this period of inactivity
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warning-time">Warning Time</Label>
                    <Select 
                      value={securityPreferences.warningTime.toString()}
                      onValueChange={(value) => updateSecurityPreference('warningTime', parseInt(value))}
                      disabled={!securityPreferences.showWarningBeforeTimeout}
                    >
                      <SelectTrigger id="warning-time" data-testid="select-warning-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="2">2 minutes</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Show warning this many minutes before timeout
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="text-base font-medium">Remember Me</div>
                      <div className="text-sm text-muted-foreground">
                        Stay logged in for 30 days on this device
                      </div>
                    </div>
                    <Switch
                      data-testid="switch-remember-me"
                      checked={securityPreferences.rememberMe}
                      onCheckedChange={(checked) => updateSecurityPreference('rememberMe', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="text-base font-medium">Auto-Lock</div>
                      <div className="text-sm text-muted-foreground">
                        Lock screen instead of logging out on timeout
                      </div>
                    </div>
                    <Switch
                      data-testid="switch-auto-lock"
                      checked={securityPreferences.autoLock}
                      onCheckedChange={(checked) => updateSecurityPreference('autoLock', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="text-base font-medium">Show Warning Before Timeout</div>
                      <div className="text-sm text-muted-foreground">
                        Display a warning before session expires
                      </div>
                    </div>
                    <Switch
                      data-testid="switch-show-warning"
                      checked={securityPreferences.showWarningBeforeTimeout}
                      onCheckedChange={(checked) => updateSecurityPreference('showWarningBeforeTimeout', checked)}
                    />
                  </div>
                </div>

                {sessionWarningActive && timeUntilTimeout && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Your session will expire in {Math.ceil(timeUntilTimeout / 60000)} minute(s)</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          updateSecurityPreference('lastActivityTime', Date.now());
                        }}
                      >
                        Stay Logged In
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Monitoring */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>Activity Monitoring</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearActivityLog}
                  data-testid="button-clear-activity"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Log
                </Button>
              </div>
              <CardDescription>
                Track and monitor account activity and login history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Enable Activity Logging</div>
                  <div className="text-sm text-muted-foreground">
                    Track login attempts and account activity
                  </div>
                </div>
                <Switch
                  data-testid="switch-activity-logging"
                  checked={securityPreferences.enableActivityLogging}
                  onCheckedChange={(checked) => updateSecurityPreference('enableActivityLogging', checked)}
                />
              </div>

              {securityPreferences.enableActivityLogging && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Activity</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {securityPreferences.activityLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity to display
                      </p>
                    ) : (
                      securityPreferences.activityLog.map((activity) => (
                        <div 
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                          data-testid={`activity-log-${activity.id}`}
                        >
                          <div className="mt-1">
                            {activity.type === 'login' && (
                              <LogIn className={`h-4 w-4 ${activity.success ? 'text-green-600' : 'text-red-600'}`} />
                            )}
                            {activity.type === 'logout' && (
                              <LogOut className="h-4 w-4 text-blue-600" />
                            )}
                            {activity.type === 'password_change' && (
                              <KeyRound className="h-4 w-4 text-purple-600" />
                            )}
                            {activity.type === 'settings_change' && (
                              <Settings className="h-4 w-4 text-orange-600" />
                            )}
                            {activity.type === 'access_attempt' && (
                              <ShieldAlert className={`h-4 w-4 ${activity.success ? 'text-green-600' : 'text-red-600'}`} />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {activity.type === 'login' && (activity.success ? 'Successful Login' : 'Failed Login')}
                                {activity.type === 'logout' && 'Logged Out'}
                                {activity.type === 'password_change' && 'Password Changed'}
                                {activity.type === 'settings_change' && 'Settings Updated'}
                                {activity.type === 'access_attempt' && (activity.success ? 'Access Granted' : 'Access Denied')}
                              </span>
                              {!activity.success && (
                                <Badge variant="destructive" className="text-xs">Failed</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(activity.timestamp).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPinned className="h-3 w-3" />
                                {activity.ipAddress}
                              </div>
                              {activity.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {activity.location}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Laptop className="h-3 w-3" />
                              {activity.device}
                            </div>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <CardTitle>Two-Factor Authentication</CardTitle>
              </div>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Enable 2FA</div>
                  <div className="text-sm text-muted-foreground">
                    Require a second form of authentication
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Coming Soon</Badge>
                  <Switch
                    data-testid="switch-two-factor"
                    checked={securityPreferences.twoFactorEnabled}
                    onCheckedChange={(checked) => updateSecurityPreference('twoFactorEnabled', checked)}
                    disabled
                  />
                </div>
              </div>

              {securityPreferences.twoFactorEnabled && (
                <>
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled. You'll need to enter a verification code from your authenticator app when logging in.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Backup Codes</h4>
                        <p className="text-sm text-muted-foreground">
                          Generate backup codes in case you lose access to your authenticator
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const codes = generateBackupCodes();
                          toast({
                            title: "Backup codes generated",
                            description: `${codes.length} backup codes have been generated. Store them securely.`
                          });
                        }}
                        disabled={!securityPreferences.twoFactorEnabled}
                        data-testid="button-generate-backup-codes"
                      >
                        Generate Codes
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security Preferences</CardTitle>
              </div>
              <CardDescription>
                Configure additional security settings and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="text-base font-medium">Require Password for Sensitive Actions</div>
                    <div className="text-sm text-muted-foreground">
                      Re-authenticate before performing critical operations
                    </div>
                  </div>
                  <Switch
                    data-testid="switch-require-password"
                    checked={securityPreferences.requirePasswordForSensitiveActions}
                    onCheckedChange={(checked) => updateSecurityPreference('requirePasswordForSensitiveActions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="text-base font-medium">Show Security Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Display notifications for security-related events
                    </div>
                  </div>
                  <Switch
                    data-testid="switch-security-alerts"
                    checked={securityPreferences.showSecurityAlerts}
                    onCheckedChange={(checked) => updateSecurityPreference('showSecurityAlerts', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-complexity">Password Complexity Level</Label>
                  <Select 
                    value={securityPreferences.passwordComplexityLevel}
                    onValueChange={(value: 'basic' | 'moderate' | 'strong') => 
                      updateSecurityPreference('passwordComplexityLevel', value)
                    }
                  >
                    <SelectTrigger id="password-complexity" data-testid="select-password-complexity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                      <SelectItem value="moderate">Moderate (10+ chars, mixed case, numbers)</SelectItem>
                      <SelectItem value="strong">Strong (12+ chars, mixed case, numbers, symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <h4 className="text-sm font-medium mb-2">Current Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {getPasswordRequirements().map((req, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="failed-attempts">Lock After Failed Attempts</Label>
                  <Select 
                    value={securityPreferences.sessionLockAfterFailedAttempts.toString()}
                    onValueChange={(value) => updateSecurityPreference('sessionLockAfterFailedAttempts', parseInt(value))}
                  >
                    <SelectTrigger id="failed-attempts" data-testid="select-failed-attempts">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                      <SelectItem value="0">Never lock</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Lock account after this many failed login attempts
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Password requirements apply to all new passwords and password changes across the system.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetSecurityPreferences();
                    toast({
                      title: "Security settings reset",
                      description: "All security preferences have been reset to defaults."
                    });
                  }}
                  data-testid="button-reset-security"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Security settings saved",
                      description: "Your security preferences have been updated."
                    });
                  }}
                  data-testid="button-save-security"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
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
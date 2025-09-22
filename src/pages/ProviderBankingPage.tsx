import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  CreditCard, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Shield,
  Lock,
  User,
  Calendar
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { insertProviderBankingSchema, type InsertProviderBanking } from "../../shared/schema";

// Extended schema with additional fields for the UI
const providerBankingFormSchema = insertProviderBankingSchema.extend({
  // These might be additional fields not in the base schema
  accountHolderName: z.string().min(1, "Account holder name is required").optional(),
  isVerified: z.boolean().default(false).optional(),
  isPrimary: z.boolean().default(false).optional(),
  notes: z.string().optional(),
});

type ProviderBankingFormData = z.infer<typeof providerBankingFormSchema>;

interface ProviderBanking {
  id: string;
  physicianId: string;
  physicianName?: string;
  bankName: string;
  accountType: string;
  accountNumber: string; // Will be redacted by default
  routingNumber: string; // Will be redacted by default
  accountHolderName: string;
  isVerified: boolean;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  lastAccessedBy?: string;
}

interface Physician {
  id: string;
  fullLegalName: string;
}

interface AuditEntry {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

const accountTypeLabels = {
  checking: "Checking",
  savings: "Savings",
  business_checking: "Business Checking",
  business_savings: "Business Savings"
};

export default function ProviderBankingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBanking, setSelectedBanking] = useState<ProviderBanking | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [showDecrypted, setShowDecrypted] = useState<Record<string, boolean>>({});
  const [ephemeralDecryptedData, setEphemeralDecryptedData] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  // Fetch provider banking records (redacted by default)
  const { data: bankingRecords, isLoading, error, refetch } = useQuery<ProviderBanking[]>({
    queryKey: ['/api', 'provider-banking'],
  });

  // Fetch physicians for dropdown
  const { data: physicians } = useQuery<Physician[]>({
    queryKey: ['/api/physicians'],
    queryFn: async () => {
      const response = await apiRequest('/api/physicians');
      return response || [];
    }
  });

  // Fetch audit trail
  const { data: auditTrail } = useQuery<AuditEntry[]>({
    queryKey: ['/api/provider-banking/audit-trail', selectedBanking?.id],
    queryFn: async () => {
      if (!selectedBanking?.id || !isAdmin) return [];
      const response = await apiRequest(`/api/provider-banking/${selectedBanking.id}/audit-trail`);
      return response || [];
    },
    enabled: !!selectedBanking?.id && isAdmin && isAuditDialogOpen
  });

  // Create form
  const createForm = useForm<ProviderBankingFormData>({
    resolver: zodResolver(providerBankingFormSchema),
    defaultValues: {
      physicianId: "",
      bankName: "",
      accountType: "checking",
      accountNumber: "",
      routingNumber: "",
      accountHolderName: "",
      isVerified: false,
      isPrimary: false,
      isActive: true,
      notes: "",
    }
  });

  // Edit form
  const editForm = useForm<ProviderBankingFormData>({
    resolver: zodResolver(providerBankingFormSchema),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProviderBankingFormData) => {
      return await apiRequest('/api/provider-banking', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Fix cache invalidation to use proper segment array keys
      queryClient.invalidateQueries({ queryKey: ['/api', 'provider-banking'] });
      setIsCreateDialogOpen(false);
      clearEphemeralData(); // Clear sensitive data
      createForm.reset();
      toast({
        title: "Success",
        description: "Banking information created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create banking information",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProviderBankingFormData }) => {
      return await apiRequest(`/api/provider-banking/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Fix cache invalidation to use proper segment array keys
      queryClient.invalidateQueries({ queryKey: ['/api', 'provider-banking'] });
      setIsEditDialogOpen(false);
      setSelectedBanking(null);
      clearEphemeralData(); // Clear sensitive data
      editForm.reset();
      toast({
        title: "Success",
        description: "Banking information updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update banking information",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/provider-banking/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Fix cache invalidation to use proper segment array keys
      queryClient.invalidateQueries({ queryKey: ['/api', 'provider-banking'] });
      clearEphemeralData(); // Clear sensitive data
      toast({
        title: "Success",
        description: "Banking information deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete banking information",
        variant: "destructive",
      });
    }
  });

  // Decrypt banking data (admin only) - SECURITY: Store in ephemeral state, never cache
  const decryptBankingData = async (id: string) => {
    try {
      const response = await apiRequest(`/api/provider-banking/${id}/decrypted`);
      
      // SECURITY: Store decrypted data in ephemeral component state only
      setEphemeralDecryptedData(prev => ({ ...prev, [id]: response }));
      setShowDecrypted(prev => ({ ...prev, [id]: true }));

      toast({
        title: "Sensitive Data Accessed",
        description: "Banking data has been decrypted. This action has been logged.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decrypt banking data",
        variant: "destructive",
      });
    }
  };

  // Filter banking records based on search
  const filteredBankingRecords = bankingRecords?.filter(record =>
    record.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.accountHolderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.physicianName && record.physicianName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleEdit = (banking: ProviderBanking) => {

    setSelectedBanking(banking);
    editForm.reset({
      physicianId: banking.physicianId,
      bankName: banking.bankName,
      accountType: banking.accountType as any,
      accountNumber: banking.accountNumber,
      routingNumber: banking.routingNumber,
      accountHolderName: banking.accountHolderName,
      isVerified: banking.isVerified,
      isPrimary: banking.isPrimary,
      isActive: banking.isActive,
      notes: banking.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (banking: ProviderBanking) => {
    setSelectedBanking(banking);
    setIsViewDialogOpen(true);
  };

  const handleViewAudit = (banking: ProviderBanking) => {
    setSelectedBanking(banking);
    setIsAuditDialogOpen(true);
  };

  const handleDelete = (banking: ProviderBanking) => {
    deleteMutation.mutate(banking.id);
  };

  // SECURITY: Immediate redaction when dialog closes
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clear ephemeral decrypted data when closing dialogs
        setEphemeralDecryptedData({});
        setShowDecrypted({});
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Clear ephemeral data when dialogs close
  const clearEphemeralData = () => {
    setEphemeralDecryptedData({});
    setShowDecrypted({});
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  const maskRoutingNumber = (routingNumber: string) => {
    if (routingNumber.length <= 4) return routingNumber;
    return `*****${routingNumber.slice(-4)}`;
  };

  // Get display value for sensitive fields
  const getDisplayValue = (bankingId: string, field: 'accountNumber' | 'routingNumber', originalValue: string) => {
    if (showDecrypted[bankingId] && ephemeralDecryptedData[bankingId]) {
      return ephemeralDecryptedData[bankingId][field] || originalValue;
    }
    return field === 'accountNumber' ? maskAccountNumber(originalValue) : maskRoutingNumber(originalValue);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load banking information</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the banking data.
          </p>
          <Button onClick={() => refetch()} data-testid="button-retry">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="provider-banking-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Provider Banking Information
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Secure management of provider banking and payment information
          </p>
          {!isAdmin && (
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-600">
                Limited access - sensitive data is redacted. Contact administrator for full access.
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-banking">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Banking Info
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card data-testid="card-search">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by bank name, account holder, or physician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Banking Records List */}
      <Card data-testid="card-banking-list">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Banking Records ({filteredBankingRecords.length})
          </CardTitle>
          <CardDescription>
            Secure banking information with encryption and audit logging
            {isAdmin && " • Full administrative access enabled"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredBankingRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No banking records found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search criteria" : isAdmin ? "Start by adding banking information" : "No banking information available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBankingRecords.map((banking, index) => (
                <div key={banking.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`banking-card-${index}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium" data-testid={`banking-bank-${index}`}>
                        {banking.bankName}
                      </h3>
                      <Badge 
                        variant={banking.isActive ? "default" : "secondary"}
                        data-testid={`banking-status-${index}`}
                      >
                        {banking.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {banking.isPrimary && (
                        <Badge variant="outline" className="text-xs">
                          Primary
                        </Badge>
                      )}
                      {banking.isVerified && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Account Holder:</span> {banking.accountHolderName}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Type:</span> {accountTypeLabels[banking.accountType as keyof typeof accountTypeLabels]}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <span className="text-muted-foreground">Account:</span> {
                            getDisplayValue(banking.id, 'accountNumber', banking.accountNumber)
                          }
                        </span>
                        <span>
                          <span className="text-muted-foreground">Routing:</span> {
                            getDisplayValue(banking.id, 'routingNumber', banking.routingNumber)
                          }
                        </span>
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => showDecrypted[banking.id] ? clearEphemeralData() : decryptBankingData(banking.id)}
                            className="text-xs h-6 px-2"
                            data-testid={`button-decrypt-${index}`}
                          >
                            {showDecrypted[banking.id] ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Show Full
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {banking.physicianName && (
                        <p className="text-sm">
                          <User className="w-3 h-3 inline mr-1" />
                          <span className="text-muted-foreground">Physician:</span> {banking.physicianName}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`banking-menu-${index}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(banking)} data-testid={`button-view-${index}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => handleEdit(banking)} data-testid={`button-edit-${index}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewAudit(banking)} data-testid={`button-audit-${index}`}>
                            <Shield className="w-4 h-4 mr-2" />
                            View Audit Trail
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} data-testid={`button-delete-${index}`}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete banking information for "{banking.accountHolderName}" at {banking.bankName}. 
                                  This action cannot be undone and will be logged for security purposes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(banking)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {isAdmin && (
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) clearEphemeralData();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-banking">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Add Banking Information
              </DialogTitle>
              <DialogDescription>
                Create secure banking information. All data will be encrypted and audit logged.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="physicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physician</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-physician">
                            <SelectValue placeholder="Select physician" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {physicians?.map((physician) => (
                            <SelectItem key={physician.id} value={physician.id}>
                              {physician.fullLegalName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank of America, Chase, etc." {...field} data-testid="input-create-bank-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-account-type">
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(accountTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name as it appears on the account" {...field} data-testid="input-create-account-holder" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••••••" 
                            {...field} 
                            data-testid="input-create-account-number"
                          />
                        </FormControl>
                        <FormDescription>Will be encrypted when stored</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="routingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routing Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123456789" 
                            maxLength={9}
                            {...field} 
                            data-testid="input-create-routing-number"
                          />
                        </FormControl>
                        <FormDescription>9-digit routing number</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <FormField
                    control={createForm.control}
                    name="isVerified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-create-verified"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Verified</FormLabel>
                          <FormDescription>
                            Account has been verified
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="isPrimary"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-create-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Primary Account</FormLabel>
                          <FormDescription>
                            Mark as primary payment account
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-create-active"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Account is currently active
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-create-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-create-submit"
                  >
                    {createMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    <Lock className="w-4 h-4 mr-2" />
                    Create Secure Record
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Audit Trail Dialog */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-audit-trail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Audit Trail
            </DialogTitle>
            <DialogDescription>
              Security audit log for banking record access and modifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {auditTrail && auditTrail.length > 0 ? (
              <div className="space-y-2">
                {auditTrail.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`audit-entry-${index}`}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {entry.action} by {entry.userName || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.ipAddress && (
                        <p className="text-xs text-muted-foreground">
                          IP: {entry.ipAddress}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {entry.action}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No audit trail entries found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog (simplified version showing redacted data) */}
      {/* ... */}
    </div>
  );
}
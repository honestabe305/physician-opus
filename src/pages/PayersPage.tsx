import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { insertPayerSchema, type InsertPayer } from "../../shared/schema";

type PayerFormData = InsertPayer;

interface Payer {
  id: string;
  name: string;
  linesOfBusiness: string[];
  reCredentialingCadence: number;
  requiredFields?: any;
  contactInfo?: any;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const lineOfBusinessLabels = {
  hmo: "HMO",
  ppo: "PPO", 
  epo: "EPO",
  pos: "POS",
  medicare_advantage: "Medicare Advantage",
  medicaid: "Medicaid",
  commercial: "Commercial",
  workers_comp: "Workers' Compensation",
  tricare: "TRICARE"
};

export default function PayersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayer, setSelectedPayer] = useState<Payer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch payers
  const { data: payersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api', 'payers'],
  });
  
  const payers = payersResponse?.data || [];

  // Create form
  const createForm = useForm<PayerFormData>({
    resolver: zodResolver(insertPayerSchema),
    defaultValues: {
      name: "",
      linesOfBusiness: [],
      reCredentialingCadence: 36,
      requiredFields: {
        demographics: true,
        education: true,
        training: true,
        workHistory: true,
        references: true,
        malpractice: true,
        dea: false,
        csr: false,
      },
      contactInfo: {
        phone: "",
        email: "",
        website: "",
      },
      notes: "",
      isActive: true
    }
  });

  // Edit form
  const editForm = useForm<PayerFormData>({
    resolver: zodResolver(insertPayerSchema),
    defaultValues: {
      name: "",
      linesOfBusiness: [],
      reCredentialingCadence: 36,
      requiredFields: {
        demographics: true,
        education: true,
        training: true,
        workHistory: true,
        references: true,
        malpractice: true,
        dea: false,
        csr: false,
      },
      contactInfo: {
        phone: "",
        email: "",
        website: "",
      },
      notes: "",
      isActive: true
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: PayerFormData) => {
      return await apiRequest('/api/payers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payers'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Payer created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payer",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PayerFormData }) => {
      return await apiRequest(`/api/payers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payers'] });
      setIsEditDialogOpen(false);
      setSelectedPayer(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Payer updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payer",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/payers/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payers'] });
      toast({
        title: "Success",
        description: "Payer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payer",
        variant: "destructive",
      });
    }
  });

  // Filter payers based on search
  const filteredPayers = payers?.filter(payer =>
    payer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payer.linesOfBusiness.some(lob => 
      lineOfBusinessLabels[lob as keyof typeof lineOfBusinessLabels]
        .toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleEdit = (payer: Payer) => {
    setSelectedPayer(payer);
    editForm.reset({
      name: payer.name,
      linesOfBusiness: payer.linesOfBusiness as any,
      reCredentialingCadence: payer.reCredentialingCadence,
      requiredFields: payer.requiredFields || {
        demographics: true,
        education: true,
        training: true,
        workHistory: true,
        references: true,
        malpractice: true,
        dea: false,
        csr: false,
      },
      contactInfo: payer.contactInfo || {
        phone: "",
        email: "",
        website: "",
      },
      notes: payer.notes || "",
      isActive: payer.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (payer: Payer) => {
    setSelectedPayer(payer);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (payer: Payer) => {
    deleteMutation.mutate(payer.id);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load payers</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the payers data.
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
    <div className="p-6 space-y-6" data-testid="payers-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Payers Management
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Manage insurance payers and their enrollment requirements
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-payer">
                <Plus className="w-4 h-4 mr-2" />
                Add Payer
              </Button>
            </DialogTrigger>
          </Dialog>
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
              placeholder="Search payers by name or line of business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payers List */}
      <Card data-testid="card-payers-list">
        <CardHeader>
          <CardTitle>Payers ({filteredPayers.length})</CardTitle>
          <CardDescription>
            Manage insurance payers and their credentialing requirements
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
          ) : filteredPayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payers found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search criteria" : "Start by adding your first payer"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayers.map((payer, index) => (
                <div key={payer.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`payer-card-${index}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium" data-testid={`payer-name-${index}`}>
                        {payer.name}
                      </h3>
                      <Badge 
                        variant={payer.isActive ? "default" : "secondary"}
                        data-testid={`payer-status-${index}`}
                      >
                        {payer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {payer.linesOfBusiness.map((lob) => (
                        <Badge key={lob} variant="outline" className="text-xs">
                          {lineOfBusinessLabels[lob as keyof typeof lineOfBusinessLabels]}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Re-credentialing: {payer.reCredentialingCadence} months
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`payer-menu-${index}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(payer)} data-testid={`button-view-${index}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(payer)} data-testid={`button-edit-${index}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
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
                              This will permanently delete "{payer.name}" and cannot be undone.
                              This action may fail if there are existing enrollments for this payer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(payer)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-payer">
          <DialogHeader>
            <DialogTitle>Add New Payer</DialogTitle>
            <DialogDescription>
              Create a new insurance payer with their credentialing requirements
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Aetna, Blue Cross Blue Shield" {...field} data-testid="input-create-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="linesOfBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lines of Business</FormLabel>
                    <FormDescription>Select all applicable lines of business</FormDescription>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(lineOfBusinessLabels).map(([value, label]) => (
                        <FormItem key={value} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(value as any)}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...(field.value || []), value]
                                  : field.value?.filter((item) => item !== value) || [];
                                field.onChange(updatedValue);
                              }}
                              data-testid={`checkbox-create-lob-${value}`}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{label}</FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="reCredentialingCadence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Re-credentialing Cadence (months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="120" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 36)}
                        data-testid="input-create-cadence"
                      />
                    </FormControl>
                    <FormDescription>How often re-credentialing is required</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="contactInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} data-testid="input-create-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="contactInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="provider@payer.com" {...field} data-testid="input-create-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="contactInfo.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.payer.com" {...field} data-testid="input-create-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes about this payer..." {...field} data-testid="textarea-create-notes" />
                    </FormControl>
                    <FormMessage />
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
                        Whether this payer is currently active for new enrollments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

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
                  Create Payer
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-payer">
          <DialogHeader>
            <DialogTitle>Edit Payer</DialogTitle>
            <DialogDescription>
              Update payer information and requirements
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => 
              selectedPayer && updateMutation.mutate({ id: selectedPayer.id, data })
            )} className="space-y-4">
              {/* Similar form fields as create, but with edit form control */}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Aetna, Blue Cross Blue Shield" {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ... other form fields similar to create form ... */}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-edit-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-edit-submit"
                >
                  {updateMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Update Payer
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-view-payer">
          <DialogHeader>
            <DialogTitle>Payer Details</DialogTitle>
            <DialogDescription>
              View detailed information about this payer
            </DialogDescription>
          </DialogHeader>
          {selectedPayer && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium" data-testid="view-payer-name">{selectedPayer.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selectedPayer.isActive ? "default" : "secondary"} className="ml-2">
                      {selectedPayer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Re-credentialing Cadence:</span>
                    <p className="font-medium">{selectedPayer.reCredentialingCadence} months</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Lines of Business</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPayer.linesOfBusiness.map((lob) => (
                    <Badge key={lob} variant="outline">
                      {lineOfBusinessLabels[lob as keyof typeof lineOfBusinessLabels]}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedPayer.contactInfo && (
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {selectedPayer.contactInfo.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2">{selectedPayer.contactInfo.phone}</span>
                      </div>
                    )}
                    {selectedPayer.contactInfo.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{selectedPayer.contactInfo.email}</span>
                      </div>
                    )}
                    {selectedPayer.contactInfo.website && (
                      <div>
                        <span className="text-muted-foreground">Website:</span>
                        <a 
                          href={selectedPayer.contactInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-primary hover:underline"
                        >
                          {selectedPayer.contactInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPayer.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedPayer.notes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Created: {new Date(selectedPayer.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedPayer.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
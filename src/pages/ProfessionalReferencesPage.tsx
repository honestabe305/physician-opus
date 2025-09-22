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
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  User,
  Award,
  Calendar
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Professional Reference form schema
const professionalReferenceSchema = z.object({
  physicianId: z.string().min(1, "Physician is required"),
  referenceName: z.string().min(1, "Reference name is required"),
  referenceTitle: z.string().min(1, "Reference title is required"),
  organization: z.string().min(1, "Organization is required"),
  relationshipType: z.enum(['supervisor', 'colleague', 'peer', 'mentor', 'department_head', 'administrator', 'other']),
  relationshipDuration: z.string().min(1, "Relationship duration is required"),
  contactInfo: z.object({
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Valid email is required"),
    address: z.string().optional(),
  }),
  canContactDuringBusiness: z.boolean().default(true),
  canContactAfterHours: z.boolean().default(false),
  preferredContactMethod: z.enum(['phone', 'email', 'either']).default('either'),
  specialtyKnowledge: z.array(z.string()).optional(),
  verificationStatus: z.enum(['pending', 'verified', 'failed', 'expired']).default('pending'),
  lastContactDate: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProfessionalReferenceFormData = z.infer<typeof professionalReferenceSchema>;

interface ProfessionalReference {
  id: string;
  physicianId: string;
  physicianName?: string;
  referenceName: string;
  referenceTitle: string;
  organization: string;
  relationshipType: string;
  relationshipDuration: string;
  contactInfo: {
    phone: string;
    email: string;
    address?: string;
  };
  canContactDuringBusiness: boolean;
  canContactAfterHours: boolean;
  preferredContactMethod: string;
  specialtyKnowledge?: string[];
  verificationStatus: string;
  lastContactDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Physician {
  id: string;
  fullLegalName: string;
}

const relationshipTypeLabels = {
  supervisor: "Supervisor",
  colleague: "Colleague",
  peer: "Peer",
  mentor: "Mentor",
  department_head: "Department Head",
  administrator: "Administrator",
  other: "Other"
};

const verificationStatusLabels = {
  pending: "Pending",
  verified: "Verified",
  failed: "Failed",
  expired: "Expired"
};

const contactMethodLabels = {
  phone: "Phone",
  email: "Email",
  either: "Either"
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  verified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

export default function ProfessionalReferencesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReference, setSelectedReference] = useState<ProfessionalReference | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch professional references
  const { data: references, isLoading, error, refetch } = useQuery<ProfessionalReference[]>({
    queryKey: ['/api/professional-references'],
    queryFn: async () => {
      const response = await apiRequest('/api/professional-references');
      return response || [];
    }
  });

  // Fetch physicians for dropdown
  const { data: physicians } = useQuery<Physician[]>({
    queryKey: ['/api/physicians'],
    queryFn: async () => {
      const response = await apiRequest('/api/physicians');
      return response || [];
    }
  });

  // Create form
  const createForm = useForm<ProfessionalReferenceFormData>({
    resolver: zodResolver(professionalReferenceSchema),
    defaultValues: {
      physicianId: "",
      referenceName: "",
      referenceTitle: "",
      organization: "",
      relationshipType: "colleague",
      relationshipDuration: "",
      contactInfo: {
        phone: "",
        email: "",
        address: "",
      },
      canContactDuringBusiness: true,
      canContactAfterHours: false,
      preferredContactMethod: "either",
      specialtyKnowledge: [],
      verificationStatus: "pending",
      lastContactDate: "",
      notes: "",
      isActive: true,
    }
  });

  // Edit form
  const editForm = useForm<ProfessionalReferenceFormData>({
    resolver: zodResolver(professionalReferenceSchema),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProfessionalReferenceFormData) => {
      return await apiRequest('/api/professional-references', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-references'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Professional reference created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create professional reference",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProfessionalReferenceFormData }) => {
      return await apiRequest(`/api/professional-references/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-references'] });
      setIsEditDialogOpen(false);
      setSelectedReference(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Professional reference updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update professional reference",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/professional-references/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-references'] });
      toast({
        title: "Success",
        description: "Professional reference deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete professional reference",
        variant: "destructive",
      });
    }
  });

  // Filter references based on search
  const filteredReferences = references?.filter(reference =>
    reference.referenceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reference.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reference.referenceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reference.physicianName && reference.physicianName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleEdit = (reference: ProfessionalReference) => {
    setSelectedReference(reference);
    editForm.reset({
      physicianId: reference.physicianId,
      referenceName: reference.referenceName,
      referenceTitle: reference.referenceTitle,
      organization: reference.organization,
      relationshipType: reference.relationshipType as any,
      relationshipDuration: reference.relationshipDuration,
      contactInfo: reference.contactInfo,
      canContactDuringBusiness: reference.canContactDuringBusiness,
      canContactAfterHours: reference.canContactAfterHours,
      preferredContactMethod: reference.preferredContactMethod as any,
      specialtyKnowledge: reference.specialtyKnowledge || [],
      verificationStatus: reference.verificationStatus as any,
      lastContactDate: reference.lastContactDate || "",
      notes: reference.notes || "",
      isActive: reference.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (reference: ProfessionalReference) => {
    setSelectedReference(reference);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (reference: ProfessionalReference) => {
    deleteMutation.mutate(reference.id);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load professional references</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the professional references data.
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
    <div className="p-6 space-y-6" data-testid="professional-references-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Professional References
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Manage professional references for credentialing and verification
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-reference">
                <Plus className="w-4 h-4 mr-2" />
                Add Reference
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
              placeholder="Search by reference name, organization, title, or physician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* References List */}
      <Card data-testid="card-references-list">
        <CardHeader>
          <CardTitle>Professional References ({filteredReferences.length})</CardTitle>
          <CardDescription>
            Manage professional references for credentialing verification
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
          ) : filteredReferences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No professional references found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search criteria" : "Start by adding your first professional reference"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReferences.map((reference, index) => (
                <div key={reference.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`reference-card-${index}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium" data-testid={`reference-name-${index}`}>
                        {reference.referenceName}
                      </h3>
                      <Badge 
                        variant={reference.isActive ? "default" : "secondary"}
                        data-testid={`reference-status-${index}`}
                      >
                        {reference.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={statusColors[reference.verificationStatus as keyof typeof statusColors]}
                        data-testid={`reference-verification-${index}`}
                      >
                        {verificationStatusLabels[reference.verificationStatus as keyof typeof verificationStatusLabels]}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <Award className="w-3 h-3 inline mr-1" />
                        <span className="font-medium">{reference.referenceTitle}</span> at {reference.organization}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Relationship:</span> {relationshipTypeLabels[reference.relationshipType as keyof typeof relationshipTypeLabels]} • {reference.relationshipDuration}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {reference.contactInfo.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {reference.contactInfo.email}
                        </span>
                        <span className="text-xs">
                          Preferred: {contactMethodLabels[reference.preferredContactMethod as keyof typeof contactMethodLabels]}
                        </span>
                      </div>
                      {reference.physicianName && (
                        <p className="text-sm">
                          <Users className="w-3 h-3 inline mr-1" />
                          <span className="text-muted-foreground">For:</span> {reference.physicianName}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`reference-menu-${index}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(reference)} data-testid={`button-view-${index}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(reference)} data-testid={`button-edit-${index}`}>
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
                              This will permanently delete the professional reference for "{reference.referenceName}" and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(reference)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-reference">
          <DialogHeader>
            <DialogTitle>Add Professional Reference</DialogTitle>
            <DialogDescription>
              Create a new professional reference for credentialing verification
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
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

              {/* Reference Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Reference Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="referenceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. John Smith" {...field} data-testid="input-create-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="referenceTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Chief of Medicine, Department Head" {...field} data-testid="input-create-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Memorial Hospital, ABC Medical Group" {...field} data-testid="input-create-organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="relationshipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-relationship">
                              <SelectValue placeholder="Select relationship type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(relationshipTypeLabels).map(([value, label]) => (
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

                  <FormField
                    control={createForm.control}
                    name="relationshipDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="3 years, 2018-2021" {...field} data-testid="input-create-duration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="contactInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.smith@hospital.com" {...field} data-testid="input-create-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="contactInfo.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Complete mailing address..." {...field} data-testid="textarea-create-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Contact Preferences</h4>
                <FormField
                  control={createForm.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Contact Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-create-contact-method">
                            <SelectValue placeholder="Select preferred method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(contactMethodLabels).map(([value, label]) => (
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

                <div className="flex items-center space-x-6">
                  <FormField
                    control={createForm.control}
                    name="canContactDuringBusiness"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-create-business-hours"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Can Contact During Business Hours</FormLabel>
                          <FormDescription>
                            Reference is available during normal business hours
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="canContactAfterHours"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-create-after-hours"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Can Contact After Hours</FormLabel>
                          <FormDescription>
                            Reference is available after business hours
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes about this reference..." {...field} data-testid="textarea-create-notes" />
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
                        Reference is currently active and available for verification
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
                  Create Reference
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-view-reference">
          <DialogHeader>
            <DialogTitle>Professional Reference Details</DialogTitle>
            <DialogDescription>
              View detailed information about this professional reference
            </DialogDescription>
          </DialogHeader>
          {selectedReference && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium" data-testid="view-reference-name">{selectedReference.referenceName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Title:</span>
                    <p className="font-medium">{selectedReference.referenceTitle}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Organization:</span>
                    <p className="font-medium">{selectedReference.organization}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Verification Status:</span>
                    <Badge 
                      variant="secondary" 
                      className={statusColors[selectedReference.verificationStatus as keyof typeof statusColors]}
                    >
                      {verificationStatusLabels[selectedReference.verificationStatus as keyof typeof verificationStatusLabels]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Relationship Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{relationshipTypeLabels[selectedReference.relationshipType as keyof typeof relationshipTypeLabels]}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{selectedReference.relationshipDuration}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2">{selectedReference.contactInfo.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2">{selectedReference.contactInfo.email}</span>
                  </div>
                  {selectedReference.contactInfo.address && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <span className="ml-2">{selectedReference.contactInfo.address}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Preferred Contact:</span>
                    <span className="ml-2">{contactMethodLabels[selectedReference.preferredContactMethod as keyof typeof contactMethodLabels]}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Availability</h4>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedReference.canContactDuringBusiness ? "default" : "secondary"}>
                      Business Hours: {selectedReference.canContactDuringBusiness ? "Available" : "Not Available"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedReference.canContactAfterHours ? "default" : "secondary"}>
                      After Hours: {selectedReference.canContactAfterHours ? "Available" : "Not Available"}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedReference.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedReference.notes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Created: {new Date(selectedReference.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedReference.updatedAt).toLocaleString()}</p>
                {selectedReference.lastContactDate && (
                  <p>Last Contact: {new Date(selectedReference.lastContactDate).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog would be similar to create, but with pre-populated data */}
      {/* ... */}
    </div>
  );
}
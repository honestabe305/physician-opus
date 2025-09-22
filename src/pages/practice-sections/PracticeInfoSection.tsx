import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  Building2,
  Phone,
  MapPin,
  Users,
  Plus,
  Save,
  Loader2,
} from "lucide-react";
import type { SelectPhysician, SelectPractice, InsertPractice } from "../../../shared/schema";
import { insertPracticeSchema } from "../../../shared/schema";
import { z } from "zod";

// Practice Management Card Component
interface PracticeManagementCardProps {
  practice: {
    id: string;
    name: string;
    primaryAddress?: string;
    phone?: string;
    specialty?: string;
    physicianCount: number;
    locations: string[];
  };
}

function PracticeManagementCard({ practice }: PracticeManagementCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-practice-${practice.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{practice.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {practice.specialty || 'General Practice'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {practice.physicianCount} physicians
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {practice.primaryAddress && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{practice.primaryAddress}</span>
          </div>
        )}
        
        {practice.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{practice.phone}</span>
          </div>
        )}
        
        {practice.locations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Geographic Coverage:</div>
            <div className="flex flex-wrap gap-1">
              {practice.locations.map((location, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-2 text-xs text-muted-foreground">
          Practice management details
        </div>
      </CardContent>
    </Card>
  );
}

// Form schema for practice creation
const practiceFormSchema = z.object({
  name: z.string().min(1, "Practice name is required"),
  primaryAddress: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  npi: z.string().optional(),
  practiceType: z.string().optional(),
  specialty: z.string().optional(),
});

type PracticeFormData = z.infer<typeof practiceFormSchema>;

interface PracticeInfoSectionProps {
  practices: any[];
  searchTerm: string;
  onRefresh: () => void;
}

export function PracticeInfoSection({ practices, searchTerm, onRefresh }: PracticeInfoSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch physicians data for practice assignments
  const { data: physiciansData, isLoading: physiciansLoading } = useQuery({
    queryKey: ['/physicians'],
  });

  const physicians = physiciansData?.physicians || [];

  // Practice creation form
  const form = useForm<PracticeFormData>({
    resolver: zodResolver(practiceFormSchema),
    defaultValues: {
      name: "",
      primaryAddress: "",
      phone: "",
      fax: "",
      contactPerson: "",
      email: "",
      website: "",
      npi: "",
      practiceType: "",
      specialty: "",
    },
  });

  // Practice creation mutation
  const createPracticeMutation = useMutation({
    mutationFn: async (data: PracticeFormData) => {
      return apiRequest('/practices', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          isActive: true,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Practice created successfully!",
      });
      onRefresh();
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create practice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PracticeFormData) => {
    createPracticeMutation.mutate(data);
  };

  // Calculate practice statistics with physician counts
  const practiceMetrics = useMemo(() => {
    const practicePhysicianCounts = new Map();
    const practiceLocations = new Map();
    
    physicians.forEach((physician: SelectPhysician) => {
      if (physician.practiceId) {
        const count = practicePhysicianCounts.get(physician.practiceId) || 0;
        practicePhysicianCounts.set(physician.practiceId, count + 1);
        
        // Extract state/location from homeAddress for geographical distribution
        if (physician.homeAddress) {
          const locations = practiceLocations.get(physician.practiceId) || new Set();
          // Simple state extraction - assume last part after comma is state
          const parts = physician.homeAddress.split(',');
          if (parts.length > 1) {
            const state = parts[parts.length - 1].trim();
            locations.add(state);
            practiceLocations.set(physician.practiceId, locations);
          }
        }
      }
    });
    
    return { practicePhysicianCounts, practiceLocations };
  }, [physicians]);

  // Enhanced practice data with physician counts and locations
  const enrichedPractices = useMemo(() => {
    return practices.map(practice => ({
      ...practice,
      physicianCount: practiceMetrics.practicePhysicianCounts.get(practice.id) || 0,
      locations: Array.from(practiceMetrics.practiceLocations.get(practice.id) || []),
    }));
  }, [practices, practiceMetrics]);

  // Filter practices based on search
  const filteredPractices = useMemo(() => {
    if (!searchTerm) return enrichedPractices;
    
    return enrichedPractices.filter(practice => 
      practice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      practice.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      practice.primaryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [enrichedPractices, searchTerm]);


  return (
    <div className="space-y-6">
      {/* Header and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Practice Information</h2>
          <p className="text-sm text-muted-foreground">
            Manage practice details and physician assignments
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-practice">
              <Plus className="h-4 w-4 mr-2" />
              Create Practice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Practice</DialogTitle>
              <DialogDescription>
                Add a new practice to manage physicians and credentials.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Practice Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Medical Group" {...field} data-testid="input-practice-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="practiceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-practice-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solo">Solo Practice</SelectItem>
                            <SelectItem value="group">Group Practice</SelectItem>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="clinic">Clinic</SelectItem>
                            <SelectItem value="urgent_care">Urgent Care</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Specialty</FormLabel>
                        <FormControl>
                          <Input placeholder="Family Medicine" {...field} data-testid="input-practice-specialty" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="primaryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, City, State 12345" {...field} data-testid="input-practice-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} data-testid="input-practice-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fax</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4568" {...field} data-testid="input-practice-fax" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="info@abcmedical.com" {...field} data-testid="input-practice-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.abcmedical.com" {...field} data-testid="input-practice-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="npi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NPI Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} data-testid="input-practice-npi" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith, Practice Manager" {...field} data-testid="input-practice-contact" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPracticeMutation.isPending}
                    data-testid="button-submit-practice"
                  >
                    {createPracticeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Practice
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Practices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPractices.map((practice) => (
          <PracticeManagementCard
            key={practice.id}
            practice={practice}
          />
        ))}
      </div>

      {filteredPractices.length === 0 && !physiciansLoading && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
            {searchTerm ? 'No practices found' : 'No practices yet'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm 
              ? 'Try adjusting your search criteria' 
              : 'Get started by creating your first practice'
            }
          </p>
        </div>
      )}
      
      {/* Placeholder physician management dialog removed */}
    </div>
  );
}
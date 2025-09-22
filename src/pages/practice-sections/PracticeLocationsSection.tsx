import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  MapPin, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  AlertCircle,
  Building2,
  Phone,
  Globe
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Practice Location form schema
const practiceLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  practiceId: z.string().min(1, "Practice is required"),
  placeType: z.enum(['clinic', 'hospital', 'telemed_hub', 'urgent_care', 'specialty_center']),
  address: z.object({
    street1: z.string().min(1, "Street address is required"),
    street2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().length(2, "State must be 2 characters"),
    zipCode: z.string().min(5, "ZIP code must be at least 5 characters"),
    country: z.string().default("US"),
  }),
  contactInfo: z.object({
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
  }).optional(),
  npi: z.string().optional(),
  taxId: z.string().optional(),
  operatingHours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PracticeLocationData = z.infer<typeof practiceLocationSchema>;

interface PracticeLocationsSectionProps {
  practices: any[];
  searchTerm: string;
  onRefresh: () => void;
}

export function PracticeLocationsSection({ practices, searchTerm, onRefresh }: PracticeLocationsSectionProps) {
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [selectedPracticeFilter, setSelectedPracticeFilter] = useState("all");
  const [placeTypeFilter, setPlaceTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const { toast } = useToast();

  // Fetch practice locations
  const { data: locationsData, isLoading: locationsLoading, error: locationsError } = useQuery({
    queryKey: ['/practice-locations'],
  });

  const locations = locationsData?.data || [];

  // Create form
  const createForm = useForm<PracticeLocationData>({
    resolver: zodResolver(practiceLocationSchema),
    defaultValues: {
      name: "",
      practiceId: "",
      placeType: "clinic",
      address: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
      },
      contactInfo: {
        phone: "",
        fax: "",
        email: "",
        website: "",
      },
      npi: "",
      taxId: "",
      operatingHours: {
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: "",
      },
      notes: "",
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<PracticeLocationData>({
    resolver: zodResolver(practiceLocationSchema),
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: PracticeLocationData) => {
      return apiRequest('/practice-locations', {
        method: 'POST',
        body: JSON.stringify({
          practiceId: data.practiceId,
          locationName: data.name,
          streetAddress1: data.address.street1,
          streetAddress2: data.address.street2 || null,
          city: data.address.city,
          state: data.address.state.toUpperCase(),
          zipCode: data.address.zipCode,
          county: null,
          phone: data.contactInfo?.phone || null,
          fax: data.contactInfo?.fax || null,
          email: data.contactInfo?.email || null,
          hoursOfOperation: data.operatingHours || null,
          placeType: data.placeType,
          notes: data.notes || null,
          isActive: data.isActive,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Practice location created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/practice-locations'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create location",
        variant: "destructive",
      });
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      return apiRequest(`/practice-locations/${locationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Practice location deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/practice-locations'] });
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter((location: any) => {
      const matchesSearch = 
        location.locationName?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
        location.city?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
        location.state?.toLowerCase().includes(locationSearchTerm.toLowerCase());
      
      const matchesPractice = selectedPracticeFilter === "all" || location.practiceId === selectedPracticeFilter;
      const matchesPlaceType = placeTypeFilter === "all" || location.placeType === placeTypeFilter;
      
      return matchesSearch && matchesPractice && matchesPlaceType;
    });
  }, [locations, locationSearchTerm, selectedPracticeFilter, placeTypeFilter]);

  const onCreateSubmit = (data: PracticeLocationData) => {
    createLocationMutation.mutate(data);
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    // Populate edit form with location data
    editForm.reset({
      name: location.locationName,
      practiceId: location.practiceId,
      placeType: location.placeType,
      address: {
        street1: location.streetAddress1,
        street2: location.streetAddress2 || "",
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        country: "US",
      },
      contactInfo: {
        phone: location.phone || "",
        fax: location.fax || "",
        email: location.email || "",
        website: "",
      },
      notes: location.notes || "",
      isActive: location.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (locationId: string) => {
    deleteLocationMutation.mutate(locationId);
  };

  const getPracticeNameById = (practiceId: string) => {
    const practice = practices.find(p => p.id === practiceId);
    return practice?.name || 'Unknown Practice';
  };

  const getPlaceTypeLabel = (placeType: string) => {
    const labels: { [key: string]: string } = {
      'clinic': 'Clinic',
      'hospital': 'Hospital',
      'telemed_hub': 'Telemedicine Hub',
      'urgent_care': 'Urgent Care',
      'specialty_center': 'Specialty Center'
    };
    return labels[placeType] || placeType;
  };

  if (locationsError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Practice Locations</h2>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Failed to load practice locations: {locationsError instanceof Error ? locationsError.message : 'Unknown error'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Practice Locations</h2>
          <p className="text-sm text-muted-foreground">
            Manage physical locations for your practices
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-location">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Practice Location</DialogTitle>
              <DialogDescription>
                Create a new location for one of your practices.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Main Office" {...field} data-testid="input-location-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="practiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-location-practice">
                              <SelectValue placeholder="Select practice" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {practices.map((practice) => (
                              <SelectItem key={practice.id} value={practice.id}>
                                {practice.name}
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
                  name="placeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-location-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clinic">Clinic</SelectItem>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="telemed_hub">Telemedicine Hub</SelectItem>
                          <SelectItem value="urgent_care">Urgent Care</SelectItem>
                          <SelectItem value="specialty_center">Specialty Center</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="font-medium">Address Information</h4>
                  <FormField
                    control={createForm.control}
                    name="address.street1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} data-testid="input-location-street1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="address.street2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Suite 100" {...field} data-testid="input-location-street2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={createForm.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} data-testid="input-location-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" maxLength={2} {...field} data-testid="input-location-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="address.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} data-testid="input-location-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="contactInfo.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} data-testid="input-location-phone" />
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
                            <Input placeholder="location@practice.com" {...field} data-testid="input-location-email" />
                          </FormControl>
                          <FormMessage />
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
                        <Textarea placeholder="Additional information about this location..." {...field} data-testid="input-location-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createLocationMutation.isPending}
                    data-testid="button-submit-location"
                  >
                    {createLocationMutation.isPending ? "Creating..." : "Create Location"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search locations..."
            value={locationSearchTerm}
            onChange={(e) => setLocationSearchTerm(e.target.value)}
            className="w-full"
            data-testid="input-search-locations"
          />
        </div>
        <Select value={selectedPracticeFilter} onValueChange={setSelectedPracticeFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-practice">
            <SelectValue placeholder="Filter by practice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Practices</SelectItem>
            {practices.map((practice) => (
              <SelectItem key={practice.id} value={practice.id}>
                {practice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={placeTypeFilter} onValueChange={setPlaceTypeFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="clinic">Clinic</SelectItem>
            <SelectItem value="hospital">Hospital</SelectItem>
            <SelectItem value="telemed_hub">Telemedicine Hub</SelectItem>
            <SelectItem value="urgent_care">Urgent Care</SelectItem>
            <SelectItem value="specialty_center">Specialty Center</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Locations Grid */}
      {locationsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location: any) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow" data-testid={`card-location-${location.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{location.locationName}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {getPracticeNameById(location.practiceId)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={location.isActive ? "default" : "secondary"}>
                      {getPlaceTypeLabel(location.placeType)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-location-menu-${location.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(location)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the practice location "{location.locationName}". 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(location.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <div>{location.streetAddress1}</div>
                    {location.streetAddress2 && <div>{location.streetAddress2}</div>}
                    <div>{location.city}, {location.state} {location.zipCode}</div>
                  </div>
                </div>
                
                {location.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{location.phone}</span>
                  </div>
                )}
                
                {location.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{location.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredLocations.length === 0 && !locationsLoading && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
            {locationSearchTerm || selectedPracticeFilter !== "all" || placeTypeFilter !== "all" 
              ? 'No locations found' 
              : 'No practice locations yet'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {locationSearchTerm || selectedPracticeFilter !== "all" || placeTypeFilter !== "all"
              ? 'Try adjusting your search criteria or filters' 
              : 'Get started by adding your first practice location'
            }
          </p>
        </div>
      )}
    </div>
  );
}
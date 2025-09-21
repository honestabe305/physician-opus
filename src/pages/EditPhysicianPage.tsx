
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Save,
  ArrowLeft,
  Home,
  Users,
  AlertCircle,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SelectPhysician, SelectPractice } from "../../shared/schema";

// Form validation schema
const editPhysicianSchema = z.object({
  fullLegalName: z.string().min(2, "Full name must be at least 2 characters"),
  npi: z.string().min(10, "NPI must be at least 10 characters").max(10, "NPI must be exactly 10 characters"),
  emailAddress: z.string().email("Invalid email address").or(z.literal("")),
  phoneNumbers: z.string().optional(),
  mailingAddress: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say", "not_specified", ""]).optional(),
  practiceId: z.string().optional(),
  createNewPractice: z.boolean().optional(),
  newPracticeName: z.string().optional(),
  status: z.enum(["active", "pending", "review", "inactive"]).optional(),
});

type EditPhysicianForm = z.infer<typeof editPhysicianSchema>;

export default function EditPhysicianPage() {
  const params = useParams() as { id?: string };
  const id = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Debug logging
  console.log('EditPhysicianPage - ID from params:', id, typeof id);
  
  // Early return if no ID is provided
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.error('EditPhysicianPage - No valid ID provided');
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/physicians')}
            className="gap-2"
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Physicians
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-red-600">
            Invalid Physician ID
          </h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No valid physician ID provided. Please select a physician from the list.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch physician data
  const { data: physician, isLoading, error } = useQuery<SelectPhysician>({
    queryKey: ['/physicians', id],
    queryFn: () => apiRequest(`/physicians/${id}`),
    enabled: !!id && typeof id === 'string' && id.trim() !== '',
    retry: (failureCount, error) => {
      // Don't retry on 404 (physician not found) or 401 (authentication required)
      if (error instanceof Error && (
        error.message.includes('404') || 
        error.message.includes('Authentication required') ||
        error.message.includes('401')
      )) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch practices for selection
  const { data: practices = [] } = useQuery<SelectPractice[]>({
    queryKey: ['/practices'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Form setup
  const form = useForm<EditPhysicianForm>({
    resolver: zodResolver(editPhysicianSchema),
    defaultValues: {
      fullLegalName: "",
      npi: "",
      emailAddress: "",
      phoneNumbers: "",
      mailingAddress: "",
      dateOfBirth: "",
      gender: "not_specified",
      practiceId: "",
      createNewPractice: false,
      newPracticeName: "",
      status: "active",
    },
  });

  // Update form when physician data loads
  useEffect(() => {
    if (physician && typeof physician === 'object') {
      try {
        const formData: EditPhysicianForm = {
          fullLegalName: physician.fullLegalName || "",
          npi: physician.npi || "",
          emailAddress: physician.emailAddress || "",
          phoneNumbers: Array.isArray(physician.phoneNumbers) ? physician.phoneNumbers.join(", ") : "",
          mailingAddress: physician.mailingAddress || "",
          dateOfBirth: physician.dateOfBirth || "",
          gender: (physician.gender as "male" | "female" | "other" | "prefer_not_to_say" | "not_specified" | "") || "not_specified",
          practiceId: physician.practiceId || "",
          createNewPractice: false,
          newPracticeName: "",
          status: (physician.status as "active" | "pending" | "review" | "inactive") || "active",
        };
        
        console.log('EditPhysicianPage - Resetting form with data:', formData);
        form.reset(formData);
      } catch (error) {
        console.error('EditPhysicianPage - Error resetting form:', error);
        toast({
          title: "Error",
          description: "Failed to load physician data into form",
          variant: "destructive",
        });
      }
    }
  }, [physician, form, toast]);

  // Update mutation
  const updatePhysicianMutation = useMutation({
    mutationFn: async (data: EditPhysicianForm) => {
      let practiceId = data.practiceId;

      // Handle new practice creation
      if (data.createNewPractice && data.newPracticeName) {
        const newPractice = await apiRequest('/practices', {
          method: 'POST',
          body: JSON.stringify({
            name: data.newPracticeName,
            isActive: true
          }),
        });
        practiceId = newPractice.id;
      }

      // Transform form data to match API expectations
      const updateData = {
        ...data,
        phoneNumbers: data.phoneNumbers ? data.phoneNumbers.split(",").map(p => p.trim()).filter(p => p) : [],
        dateOfBirth: data.dateOfBirth || null,
        emailAddress: data.emailAddress || null,
        mailingAddress: data.mailingAddress || null,
        gender: (data.gender && data.gender !== "not_specified") ? data.gender : null,
        practiceId: practiceId, // Use the computed practice ID
        // Remove form-only fields
        createNewPractice: undefined,
        newPracticeName: undefined,
      };

      return apiRequest(`/physicians/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/physicians', id] });
      queryClient.invalidateQueries({ queryKey: ['/physicians'] });
      queryClient.invalidateQueries({ queryKey: ['/practices'] });
      toast({
        title: "Success",
        description: "Physician profile updated successfully.",
      });
      setLocation(`/physicians/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update physician profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditPhysicianForm) => {
    updatePhysicianMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(`/physicians/${id}`);
  };

  if (error) {
    const isNotFound = error instanceof Error && (
      error.message.includes('404') || 
      error.message.includes('not found')
    );
    const isAuthRequired = error instanceof Error && (
      error.message.includes('Authentication required') || 
      error.message.includes('401')
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/physicians')}
            className="gap-2"
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Physicians
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-red-600">
            {isNotFound ? 'Physician Not Found' : 'Access Error'}
          </h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isNotFound ? (
              <>
                The physician with ID "{id}" could not be found. 
                It may have been deleted or the URL is incorrect.
              </>
            ) : isAuthRequired ? (
              <>
                You need to be logged in to edit physician profiles. 
                Please log in and try again.
              </>
            ) : (
              <>
                Failed to load physician: {error.message}
              </>
            )}
          </AlertDescription>
        </Alert>

        {isNotFound && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Available Physicians:</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              You can view and edit other physician profiles from the main physicians list.
            </p>
            <Button
              className="mt-3"
              onClick={() => setLocation('/physicians')}
              data-testid="button-view-all-physicians"
            >
              View All Physicians
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isLoading || !physician) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/physicians" data-testid="breadcrumb-physicians">
                <Users className="h-4 w-4 mr-1" />
                All Physicians
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/physicians/${id}`} data-testid="breadcrumb-profile">
                Dr. {physician?.fullLegalName || 'Unknown'}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Edit Physician Profile
          </h1>
          <p className="text-muted-foreground">
            Update information for Dr. {physician?.fullLegalName || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Basic Information</CardTitle>
              </div>
              <CardDescription>
                Personal and professional details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullLegalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Legal Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter full legal name" data-testid="input-full-legal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="npi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NPI *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter 10-digit NPI" maxLength={10} data-testid="input-npi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-date-of-birth" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_specified">Not specified</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value || "active"} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="review">Under Review</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle>Contact Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email address" data-testid="input-email-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Numbers</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone numbers (comma-separated)" data-testid="input-phone-numbers" />
                      </FormControl>
                      <FormDescription>
                        Separate multiple phone numbers with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="mailingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mailing Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter mailing address" rows={3} data-testid="textarea-mailing-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Practice Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Practice Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="practiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Practice *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-practice">
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

              <FormField
                control={form.control}
                name="createNewPractice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="checkbox-create-new-practice"
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Create new practice
                    </FormLabel>
                  </FormItem>
                )}
              />

              {form.watch('createNewPractice') && (
                <FormField
                  control={form.control}
                  name="newPracticeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Practice Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter new practice name"
                          data-testid="input-new-practice-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updatePhysicianMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatePhysicianMutation.isPending}
              className="gap-2"
              data-testid="button-save-changes"
            >
              <Save className="h-4 w-4" />
              {updatePhysicianMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

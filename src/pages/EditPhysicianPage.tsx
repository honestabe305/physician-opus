
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
import type { SelectPhysician } from "../../shared/schema";

// Form validation schema
const editPhysicianSchema = z.object({
  fullLegalName: z.string().min(2, "Full name must be at least 2 characters"),
  npi: z.string().min(10, "NPI must be at least 10 characters").max(10, "NPI must be exactly 10 characters"),
  emailAddress: z.string().email("Invalid email address").optional().or(z.literal("")),
  phoneNumbers: z.string().optional(),
  mailingAddress: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say", ""]).optional(),
  practiceName: z.string().optional(),
  officePhone: z.string().optional(),
  primaryPracticeAddress: z.string().optional(),
  groupNpi: z.string().optional(),
  status: z.enum(["active", "pending", "review", "inactive"]).optional(),
});

type EditPhysicianForm = z.infer<typeof editPhysicianSchema>;

export default function EditPhysicianPage() {
  const { id } = useParams() as { id: string };
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch physician data
  const { data: physician, isLoading, error } = useQuery<SelectPhysician>({
    queryKey: ['/physicians', id],
    queryFn: () => apiRequest(`/physicians/${id}`),
    enabled: !!id,
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
      gender: "",
      practiceName: "",
      officePhone: "",
      primaryPracticeAddress: "",
      groupNpi: "",
      status: "active",
    },
  });

  // Update form when physician data loads
  useEffect(() => {
    if (physician) {
      form.reset({
        fullLegalName: physician.fullLegalName || "",
        npi: physician.npi || "",
        emailAddress: physician.emailAddress || "",
        phoneNumbers: physician.phoneNumbers?.join(", ") || "",
        mailingAddress: physician.mailingAddress || "",
        dateOfBirth: physician.dateOfBirth || "",
        gender: (physician.gender as "male" | "female" | "other" | "prefer_not_to_say" | "") || "",
        practiceName: physician.practiceName || "",
        officePhone: physician.officePhone || "",
        primaryPracticeAddress: physician.primaryPracticeAddress || "",
        groupNpi: physician.groupNpi || "",
        status: (physician.status as "active" | "pending" | "review" | "inactive") || "active",
      });
    }
  }, [physician, form]);

  // Update mutation
  const updatePhysicianMutation = useMutation({
    mutationFn: (data: EditPhysicianForm) => {
      const updateData = {
        ...data,
        phoneNumbers: data.phoneNumbers ? data.phoneNumbers.split(",").map(p => p.trim()).filter(p => p) : [],
        dateOfBirth: data.dateOfBirth || null,
        emailAddress: data.emailAddress || null,
        mailingAddress: data.mailingAddress || null,
        gender: data.gender || null,
        practiceName: data.practiceName || null,
        officePhone: data.officePhone || null,
        primaryPracticeAddress: data.primaryPracticeAddress || null,
        groupNpi: data.groupNpi || null,
      };

      return apiRequest(`/physicians/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/physicians', id] });
      queryClient.invalidateQueries({ queryKey: ['/physicians'] });
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
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load physician: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
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
                Dr. {physician.fullLegalName}
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
            Update information for Dr. {physician.fullLegalName}
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
                        <Input {...field} placeholder="Enter full legal name" />
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
                        <Input {...field} placeholder="Enter 10-digit NPI" maxLength={10} />
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
                        <Input {...field} type="date" />
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Not specified</SelectItem>
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
                        <SelectTrigger>
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
                        <Input {...field} type="email" placeholder="Enter email address" />
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
                        <Input {...field} placeholder="Enter phone numbers (comma-separated)" />
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
                      <Textarea {...field} placeholder="Enter mailing address" rows={3} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="practiceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter practice name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="officePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter office phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="primaryPracticeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Practice Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter primary practice address" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="groupNpi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group NPI</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter group NPI (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updatePhysicianMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatePhysicianMutation.isPending}
              className="gap-2"
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

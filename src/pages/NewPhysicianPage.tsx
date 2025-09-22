import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  User,
  Phone,
  Building2,
  GraduationCap,
  Shield,
  Upload,
  FileText,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertPhysicianSchema, type InsertPhysician, type SelectPractice, type SelectPhysician } from "../../shared/schema";
import { z } from "zod";

// Create a form schema based on the shared physician insert schema but with string fields for arrays
const physicianFormSchema = insertPhysicianSchema.extend({
  // Override array fields to be strings in the form (will convert to arrays for API)
  phoneNumbers: z.string().optional(),
  // Practice selection - either select existing or create new
  practiceId: z.string().optional(),
  createNewPractice: z.boolean().optional(),
  newPracticeName: z.string().optional(),
});

type PhysicianFormData = z.infer<typeof physicianFormSchema>;

export default function NewPhysicianPage() {
  const [, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("demographics");
  const { toast } = useToast();

  // Fetch practices for dropdown
  const { data: practices = [] } = useQuery({
    queryKey: ['/practices'],
    select: (res) => 
      Array.isArray(res) ? res : 
      Array.isArray(res?.practices) ? res.practices : 
      Array.isArray(res?.data?.practices) ? res.data.practices : 
      Array.isArray(res?.items) ? res.items : 
      []
  });

  // Fetch physicians to calculate practice assignments
  const { data: physiciansData } = useQuery({
    queryKey: ['/physicians'],
    queryFn: () => apiRequest('/physicians'),
  });
  const physicians = physiciansData?.physicians || [];

  // Create enhanced practice list with physician counts and locations
  const enrichedPractices = useMemo(() => {
    const practicePhysicianCounts = new Map();
    const practiceLocations = new Map();
    
    physicians.forEach((physician: SelectPhysician) => {
      if (physician.practiceId) {
        const count = practicePhysicianCounts.get(physician.practiceId) || 0;
        practicePhysicianCounts.set(physician.practiceId, count + 1);
        
        // Extract location info from homeAddress
        if (physician.homeAddress) {
          const locations = practiceLocations.get(physician.practiceId) || new Set();
          const parts = physician.homeAddress.split(',');
          if (parts.length > 1) {
            const state = parts[parts.length - 1].trim();
            locations.add(state);
            practiceLocations.set(physician.practiceId, locations);
          }
        }
      }
    });
    
    // Additional safety: ensure practices is always an array
    const safePractices = Array.isArray(practices) ? practices : [];
    return safePractices.map(practice => ({
      ...practice,
      physicianCount: practicePhysicianCounts.get(practice.id) || 0,
      locations: Array.from(practiceLocations.get(practice.id) || []),
    }));
  }, [practices, physicians]);

  const form = useForm<PhysicianFormData>({
    resolver: zodResolver(physicianFormSchema),
    defaultValues: {
      fullLegalName: "",
      emailAddress: "",
      npi: "",
      dateOfBirth: "",
      gender: undefined,
      clinicianType: undefined,
      ssn: "",
      tin: "",
      deaNumber: "",
      caqhId: "",
      homeAddress: "",
      mailingAddress: "",
      phoneNumbers: "",
      practiceId: undefined,
      createNewPractice: false,
      newPracticeName: "",
      status: "active",
    },
  });

  const createPhysicianMutation = useMutation({
    mutationFn: async (data: PhysicianFormData) => {
      let practiceId = data.practiceId;
      
      // Create new practice if requested
      if (data.createNewPractice && data.newPracticeName) {
        const newPractice = await apiRequest('/practices', {
          method: 'POST',
          body: JSON.stringify({
            name: data.newPracticeName,
            isActive: true,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        practiceId = newPractice.id;
      }
      
      // Transform form data to match API expectations
      const apiData = {
        ...data,
        phoneNumbers: data.phoneNumbers ? [data.phoneNumbers] : undefined,
        practiceId: practiceId, // Explicitly set the computed practice ID
        // Remove form-only fields
        createNewPractice: undefined,
        newPracticeName: undefined,
      };
      
      return apiRequest('/physicians', {
        method: 'POST',
        body: JSON.stringify(apiData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Clinician profile created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/physicians'] });
      setLocation('/physicians');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create clinician profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PhysicianFormData) => {
    createPhysicianMutation.mutate(data);
  };

  const tabSections = [
    { id: "demographics", label: "Demographics", icon: User },
    { id: "contact", label: "Contact Info", icon: Phone },
    { id: "practice", label: "Practice Info", icon: Building2 },
    { id: "licensure", label: "Licensure", icon: Shield },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  // Helper function to calculate completion percentage for each tab
  const getTabCompletion = (tabId: string) => {
    const values = form.getValues();
    switch (tabId) {
      case "demographics":
        const demoFields = [values.fullLegalName, values.npi, values.dateOfBirth, values.gender, values.ssn];
        return Math.round((demoFields.filter(Boolean).length / demoFields.length) * 100);
      case "contact":
        const contactFields = [values.emailAddress, values.phoneNumbers, values.homeAddress];
        return Math.round((contactFields.filter(Boolean).length / contactFields.length) * 100);
      case "practice":
        const practiceFields = [values.practiceName, values.primaryPracticeAddress, values.officePhone];
        return Math.round((practiceFields.filter(Boolean).length / practiceFields.length) * 100);
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation('/physicians')}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Clinician</h1>
          <p className="text-muted-foreground">Enter clinician information and credentials</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Progress Sidebar */}
            <Card className="lg:col-span-1 border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
                <CardDescription>Complete all sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tabSections.map((section) => {
                    const completion = getTabCompletion(section.id);
                    return (
                      <div
                        key={section.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          currentTab === section.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setCurrentTab(section.id)}
                        data-testid={`tab-${section.id}`}
                      >
                        <section.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{section.label}</span>
                        <Badge
                          variant={completion > 0 ? "default" : "outline"}
                          className="ml-auto text-xs"
                        >
                          {completion}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Form Content */}
            <div className="lg:col-span-3">
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-6">
                  {tabSections.map((section) => (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="text-xs"
                      data-testid={`trigger-${section.id}`}
                    >
                      <section.icon className="h-3 w-3 mr-1" />
                      {section.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Demographics Tab */}
                <TabsContent value="demographics">
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Clinician Demographics
                      </CardTitle>
                      <CardDescription>
                        Basic personal information and identifiers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fullLegalName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Legal Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter full legal name" 
                                  data-testid="input-full-name"
                                  {...field} 
                                />
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
                              <FormLabel>National Provider Identifier (NPI) *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="10-digit NPI number" 
                                  data-testid="input-npi"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  data-testid="input-dob"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Sensitive information - secured</FormDescription>
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
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-gender">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicianType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Clinician Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-clinician-type">
                                    <SelectValue placeholder="Select clinician type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="md">Physician (MD)</SelectItem>
                                  <SelectItem value="do">Physician (DO)</SelectItem>
                                  <SelectItem value="pa">Physician Assistant (PA)</SelectItem>
                                  <SelectItem value="np">Nurse Practitioner (NP)</SelectItem>
                                  <SelectItem value="cnm">Certified Nurse Midwife (CNM)</SelectItem>
                                  <SelectItem value="crna">Certified Registered Nurse Anesthetist (CRNA)</SelectItem>
                                  <SelectItem value="cns">Clinical Nurse Specialist (CNS)</SelectItem>
                                  <SelectItem value="rn">Registered Nurse (RN)</SelectItem>
                                  <SelectItem value="lpn">Licensed Practical Nurse (LPN)</SelectItem>
                                  <SelectItem value="lvn">Licensed Vocational Nurse (LVN)</SelectItem>
                                  <SelectItem value="cna">Certified Nursing Assistant (CNA)</SelectItem>
                                  <SelectItem value="na">Nursing Assistant (NA)</SelectItem>
                                  <SelectItem value="ma">Medical Assistant (MA)</SelectItem>
                                  <SelectItem value="admin_staff">Administrative Staff</SelectItem>
                                  <SelectItem value="receptionist">Receptionist</SelectItem>
                                  <SelectItem value="billing_specialist">Billing Specialist</SelectItem>
                                  <SelectItem value="medical_technician">Medical Technician</SelectItem>
                                  <SelectItem value="lab_technician">Lab Technician</SelectItem>
                                  <SelectItem value="radiology_tech">Radiology Technician</SelectItem>
                                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                  <SelectItem value="dentist">Dentist</SelectItem>
                                  <SelectItem value="optometrist">Optometrist</SelectItem>
                                  <SelectItem value="podiatrist">Podiatrist</SelectItem>
                                  <SelectItem value="chiropractor">Chiropractor</SelectItem>
                                  <SelectItem value="physical_therapist">Physical Therapist</SelectItem>
                                  <SelectItem value="occupational_therapist">Occupational Therapist</SelectItem>
                                  <SelectItem value="speech_language_pathologist">Speech-Language Pathologist</SelectItem>
                                  <SelectItem value="respiratory_therapist">Respiratory Therapist</SelectItem>
                                  <SelectItem value="paramedic">Paramedic</SelectItem>
                                  <SelectItem value="emt">Emergency Medical Technician (EMT)</SelectItem>
                                  <SelectItem value="radiation_therapist">Radiation Therapist</SelectItem>
                                  <SelectItem value="sonographer">Sonographer</SelectItem>
                                  <SelectItem value="dietitian">Dietitian</SelectItem>
                                  <SelectItem value="social_worker">Social Worker</SelectItem>
                                  <SelectItem value="case_manager">Case Manager</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ssn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Social Security Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="XXX-XX-XXXX" 
                                  type="password"
                                  data-testid="input-ssn"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Sensitive information - secured</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Identification Number (TIN) *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="XX-XXXXXXX"
                                  data-testid="input-tin"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Sensitive information - secured</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="deaNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DEA Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="DEA number (if applicable)"
                                  data-testid="input-dea"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="caqhId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CAQH ID</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="CAQH ID (if available)"
                                  data-testid="input-caqh"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact">
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Contact Information
                      </CardTitle>
                      <CardDescription>
                        Personal contact details and emergency contacts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="emailAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="clinician@example.com"
                                  data-testid="input-email"
                                  {...field} 
                                />
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
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="(555) 123-4567"
                                  data-testid="input-phone"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="homeAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Home Address *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter complete home address"
                                  data-testid="input-home-address"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Sensitive information - secured</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="mailingAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mailing Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter mailing address (if different)"
                                  data-testid="input-mailing-address"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Practice Tab */}
                <TabsContent value="practice">
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Practice Information
                      </CardTitle>
                      <CardDescription>
                        Practice details and facility information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="practiceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Practice *</FormLabel>
                              <FormDescription>
                                Choose an existing practice to assign this physician to, or create a new one below.
                              </FormDescription>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-practice">
                                    <SelectValue placeholder="Select practice" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-60">
                                  {enrichedPractices.map((practice) => (
                                    <SelectItem key={practice.id} value={practice.id}>
                                      <div className="flex flex-col gap-1 py-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{practice.name}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {practice.physicianCount} physicians
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {practice.specialty && (
                                            <span>{practice.specialty} • </span>
                                          )}
                                          {practice.primaryAddress ? (
                                            practice.primaryAddress.length > 40 
                                              ? `${practice.primaryAddress.substring(0, 40)}...`
                                              : practice.primaryAddress
                                          ) : 'No address specified'}
                                        </div>
                                        {practice.locations.length > 0 && (
                                          <div className="flex gap-1 mt-1">
                                            {practice.locations.slice(0, 3).map((location, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                                                {location}
                                              </Badge>
                                            ))}
                                            {practice.locations.length > 3 && (
                                              <span className="text-xs text-muted-foreground">+{practice.locations.length - 3} more</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
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

                        <FormField
                          control={form.control}
                          name="groupNpi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group NPI</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Group NPI (if applicable)"
                                  data-testid="input-group-npi"
                                  {...field} 
                                />
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
                              <FormLabel>Office Phone *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="(555) 123-4567"
                                  data-testid="input-office-phone"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="officeFax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Office Fax</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="(555) 123-4567"
                                  data-testid="input-office-fax"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="officeContactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Office Contact Person</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Primary contact name"
                                  data-testid="input-contact-person"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="groupTaxId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group Tax ID</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Group tax identification"
                                  data-testid="input-group-tax-id"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Sensitive information - secured</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="primaryPracticeAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Practice Address *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter complete practice address"
                                  data-testid="input-primary-address"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="secondaryPracticeAddresses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Practice Addresses</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional practice locations (if any)"
                                  data-testid="input-secondary-address"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Licensure Tab - Placeholder for future implementation */}
                <TabsContent value="licensure">
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Licensure Information
                      </CardTitle>
                      <CardDescription>
                        Medical licenses and certifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Licensure information will be added after the initial clinician profile is created.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Education Tab - Placeholder for future implementation */}
                <TabsContent value="education">
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Education Information
                      </CardTitle>
                      <CardDescription>
                        Medical education and training history
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Education information will be added after the initial clinician profile is created.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab - Placeholder for future implementation */}
                <TabsContent value="documents">
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Document Uploads
                      </CardTitle>
                      <CardDescription>
                        Upload required documents and certificates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Document uploads will be available after the initial clinician profile is created.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save Actions */}
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  data-testid="button-save-draft"
                >
                  Save as Draft
                </Button>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const currentIndex = tabSections.findIndex(tab => tab.id === currentTab);
                      if (currentIndex > 0) {
                        setCurrentTab(tabSections[currentIndex - 1].id);
                      }
                    }}
                    disabled={tabSections.findIndex(tab => tab.id === currentTab) === 0}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>
                  {currentTab === "practice" ? (
                    <Button 
                      type="submit" 
                      className="gap-2 bg-gradient-to-r from-primary to-accent"
                      disabled={createPhysicianMutation.isPending}
                      data-testid="button-create-physician"
                    >
                      {createPhysicianMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Create Clinician
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      className="gap-2 bg-gradient-to-r from-primary to-accent"
                      onClick={() => {
                        const currentIndex = tabSections.findIndex(tab => tab.id === currentTab);
                        if (currentIndex < tabSections.length - 1) {
                          setCurrentTab(tabSections[currentIndex + 1].id);
                        }
                      }}
                      data-testid="button-next"
                    >
                      <Save className="h-4 w-4" />
                      Save & Continue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
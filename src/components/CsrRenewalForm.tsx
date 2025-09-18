import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileKey, Calendar as CalendarIcon, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type SelectCsrLicense } from "../../shared/schema";

const csrRenewalSchema = z.object({
  licenseNumber: z.string().min(1, "CSR license number is required"),
  state: z.string().min(2, "State is required"),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  expireDate: z.date({
    required_error: "Expiration date is required",
  }),
  renewalCycle: z.enum(['annual', 'biennial'], {
    required_error: "Renewal cycle is required",
  }),
  furnishingNumber: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  renewalNotes: z.string().optional(),
});

type CsrRenewalFormData = z.infer<typeof csrRenewalSchema>;

interface CsrRenewalFormProps {
  license?: SelectCsrLicense;
  physicianId: string;
  physicianName?: string;
  providerRole?: 'physician' | 'pa' | 'np';
  onSubmit: (data: CsrRenewalFormData) => Promise<void>;
  onCancel: () => void;
}

export function CsrRenewalForm({
  license,
  physicianId,
  physicianName,
  providerRole,
  onSubmit,
  onCancel
}: CsrRenewalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedState, setSelectedState] = useState(license?.state || "");

  const form = useForm<CsrRenewalFormData>({
    resolver: zodResolver(csrRenewalSchema),
    defaultValues: {
      licenseNumber: license?.csrNumber || "",
      state: license?.state || "",
      issueDate: license?.issueDate ? new Date(license.issueDate) : undefined,
      expireDate: license?.expireDate ? new Date(license.expireDate) : undefined,
      renewalCycle: license?.renewalCycle || 'annual',
      furnishingNumber: "",
      requirements: [],
      renewalNotes: "",
    },
  });

  const handleSubmit = async (data: CsrRenewalFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  // State-specific requirements (simplified example)
  const stateRequirements: Record<string, string[]> = {
    'CA': [
      'Valid medical license in California',
      'Completion of controlled substance training',
      'Background check clearance',
      'Annual renewal with 2 hours of CME on pain management'
    ],
    'NY': [
      'Valid New York medical license',
      '3-hour controlled substance training',
      'Registration with I-STOP system',
      'Annual renewal'
    ],
    'TX': [
      'Valid Texas medical license',
      'DPS registration',
      'Biennial renewal',
      'CME requirements on prescribing practices'
    ],
    'FL': [
      'Valid Florida medical license',
      '2-hour controlled substance prescribing course',
      'Annual renewal',
      'PDMP registration required'
    ],
  };

  const getStateBoardUrl = (state: string) => {
    const urls: Record<string, string> = {
      'CA': 'https://www.pharmacy.ca.gov/',
      'NY': 'https://www.op.nysed.gov/professions/pharmacy',
      'TX': 'https://www.pharmacy.texas.gov/',
      'FL': 'https://floridaspharmacy.gov/',
      'IL': 'https://www.idfpr.com/profs/pharm.asp',
      'PA': 'https://www.dos.pa.gov/ProfessionalLicensing/BoardsCommissions/Pharmacy/',
      'OH': 'https://www.pharmacy.ohio.gov/',
      'GA': 'https://gbp.georgia.gov/',
      'NC': 'https://ncbop.org/',
      'MI': 'https://www.michigan.gov/lara/bureau-list/bpl/occ/prof/pharmacy'
    };
    return urls[state.toUpperCase()] || '#';
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    form.setValue('state', state);
    
    // Set renewal cycle based on common state patterns
    const annualStates = ['CA', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
    const renewalCycle = annualStates.includes(state) ? 'annual' : 'biennial';
    form.setValue('renewalCycle', renewalCycle);
    
    // Set state-specific requirements
    form.setValue('requirements', stateRequirements[state] || []);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileKey className="h-5 w-5" />
          {license ? 'Renew' : 'New'} CSR License
        </CardTitle>
        {physicianName && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Physician: {physicianName}
            </p>
            {providerRole && (
              <Badge variant="outline" className="text-xs">
                {providerRole.toUpperCase()}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">License Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={handleStateChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-csr-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {states.map(state => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedState && (
                        <a
                          href={getStateBoardUrl(selectedState)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          Visit {selectedState} Board Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSR License Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter license number"
                          {...field}
                          data-testid="input-csr-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {providerRole === 'np' && (
                  <FormField
                    control={form.control}
                    name="furnishingNumber"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Furnishing Number (NP)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter furnishing number if applicable"
                            {...field}
                            data-testid="input-furnishing-number"
                          />
                        </FormControl>
                        <FormDescription>
                          Required for Nurse Practitioners in certain states
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-csr-issue-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-csr-expire-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="renewalCycle"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Renewal Cycle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-renewal-cycle">
                            <SelectValue placeholder="Select renewal cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-3 w-3" />
                              Annual (Every Year)
                            </div>
                          </SelectItem>
                          <SelectItem value="biennial">
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-3 w-3" />
                              Biennial (Every 2 Years)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Renewal cycle varies by state
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* State Requirements */}
            {selectedState && stateRequirements[selectedState] && (
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  {selectedState} State Requirements
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {stateRequirements[selectedState].map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="renewalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renewal Notes (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter any additional notes about this renewal..."
                      {...field}
                      data-testid="textarea-csr-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider Role Specific Warning */}
            {providerRole && providerRole !== 'physician' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {providerRole === 'pa' ? 'Physician Assistant' : 'Nurse Practitioner'} Requirements
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      {providerRole === 'pa' 
                        ? 'PAs may need supervision agreements in certain states for CSR privileges.'
                        : 'NPs may need collaboration agreements or furnishing numbers depending on state requirements.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit-csr"
            >
              {isSubmitting ? "Submitting..." : license ? "Renew License" : "Add License"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
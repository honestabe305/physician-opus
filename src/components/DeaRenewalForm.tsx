import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
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
import { Shield, Calendar as CalendarIcon, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type SelectDeaRegistration } from "../../shared/schema";

const deaRenewalSchema = z.object({
  registrationNumber: z.string().min(1, "DEA registration number is required"),
  state: z.string().min(2, "State is required"),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  expireDate: z.date({
    required_error: "Expiration date is required",
  }),
  mateTrainingCompleted: z.boolean(),
  mateCompletionDate: z.date().optional(),
  mateAttestationFile: z.any().optional(),
  renewalNotes: z.string().optional(),
});

type DeaRenewalFormData = z.infer<typeof deaRenewalSchema>;

interface DeaRenewalFormProps {
  registration?: SelectDeaRegistration;
  physicianId: string;
  physicianName?: string;
  onSubmit: (data: DeaRenewalFormData) => Promise<void>;
  onCancel: () => void;
}

export function DeaRenewalForm({
  registration,
  physicianId,
  physicianName,
  onSubmit,
  onCancel
}: DeaRenewalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<DeaRenewalFormData>({
    resolver: zodResolver(deaRenewalSchema),
    defaultValues: {
      registrationNumber: registration?.deaNumber || "",
      state: registration?.state || "",
      issueDate: registration?.issueDate ? new Date(registration.issueDate) : undefined,
      expireDate: registration?.expireDate ? new Date(registration.expireDate) : undefined,
      mateTrainingCompleted: registration?.mateAttested || false,
      mateCompletionDate: undefined,
      renewalNotes: "",
    },
  });

  const handleSubmit = async (data: DeaRenewalFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      form.setValue('mateAttestationFile', file);
    }
  };

  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {registration ? 'Renew' : 'New'} DEA Registration
        </CardTitle>
        {physicianName && (
          <p className="text-sm text-muted-foreground">
            Physician: {physicianName}
          </p>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Registration Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DEA Registration Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., BM1234567"
                          {...field}
                          data-testid="input-dea-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-dea-state">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              data-testid="button-dea-issue-date"
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
                              data-testid="button-dea-expire-date"
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
                      <FormDescription>
                        DEA registrations are typically valid for 3 years
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* MATE Training Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3">MATE Act Training Compliance</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="mateTrainingCompleted"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-mate-completed"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          MATE Act training completed
                        </FormLabel>
                        <FormDescription>
                          Required for DEA registrations issued or renewed after June 27, 2023
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('mateTrainingCompleted') && (
                  <>
                    <FormField
                      control={form.control}
                      name="mateCompletionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MATE Training Completion Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  data-testid="button-mate-completion-date"
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
                                  date > new Date() || date < new Date("2023-06-27")
                                }
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>MATE Training Certificate</FormLabel>
                      <div className="mt-2">
                        <label
                          htmlFor="mate-upload"
                          className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
                        >
                          <input
                            id="mate-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                            data-testid="input-mate-upload"
                          />
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Click to upload certificate
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, JPG, or PNG (max 10MB)
                            </p>
                          </div>
                        </label>
                        {uploadedFile && (
                          <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{uploadedFile.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

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
                      data-testid="textarea-renewal-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning for missing MATE training */}
            {!form.watch('mateTrainingCompleted') && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">MATE Act Training Required</p>
                    <p className="text-muted-foreground mt-1">
                      As of June 27, 2023, all DEA registrants must complete 8 hours of training on treating patients with opioid or substance use disorders.
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
              data-testid="button-submit-dea"
            >
              {isSubmitting ? "Submitting..." : registration ? "Renew Registration" : "Add Registration"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BookOpen, 
  Search, 
  Users, 
  Building2, 
  Shield, 
  BarChart3, 
  Bell, 
  Wrench,
  HelpCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  UserPlus,
  RefreshCcw,
  Upload,
  TrendingUp,
  Mail,
  Clock,
  GraduationCap,
  MapPin,
  Phone,
  Calendar,
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageCircle
} from "lucide-react";

const HelpDocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [helpfulFeedback, setHelpfulFeedback] = useState<boolean | null>(null);

  // Filter documentation sections based on search
  const filterContent = (content: string) => {
    return content.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const documentationSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: BookOpen,
      content: {
        overview: "Welcome to the Clinician Credentialing Management System. This platform helps healthcare organizations manage physician credentials, track licenses, monitor expirations, and ensure compliance.",
        sections: [
          {
            title: "Platform Overview",
            icon: Info,
            content: [
              "This system centralizes all clinician credential management in one secure platform.",
              "Track licenses, DEA registrations, CSR certifications, and other credentials.",
              "Receive automatic alerts for upcoming expirations.",
              "Generate compliance reports and analytics.",
              "Manage documents and renewal workflows efficiently."
            ]
          },
          {
            title: "Initial Setup and Configuration",
            icon: CheckCircle,
            steps: [
              "Step 1: Log in with your administrator credentials",
              "Step 2: Navigate to Settings to configure your organization details",
              "Step 3: Set up notification preferences for expiration alerts",
              "Step 4: Configure user roles and permissions",
              "Step 5: Add your first physician profile",
              "Step 6: Upload relevant credentialing documents"
            ]
          },
          {
            title: "User Roles and Permissions",
            icon: Users,
            content: [
              "Admin: Full system access, can manage all physicians and settings",
              "Manager: Can add/edit physicians, view reports, manage documents",
              "User: Can view physician information and documents, limited editing",
              "Viewer: Read-only access to physician profiles and reports"
            ]
          }
        ]
      }
    },
    {
      id: "managing-physicians",
      title: "Managing Physicians",
      icon: Users,
      content: {
        overview: "Learn how to add, edit, and manage physician profiles effectively.",
        sections: [
          {
            title: "Adding New Physicians",
            icon: UserPlus,
            steps: [
              "Step 1: Click 'Add Clinician' in the sidebar navigation",
              "Step 2: Fill in basic information (Name, Email, Phone, NPI)",
              "Step 3: Add demographic details (Date of Birth, Gender, SSN if required)",
              "Step 4: Enter practice affiliations and specialties",
              "Step 5: Add license information for each state",
              "Step 6: Enter DEA and CSR registration details",
              "Step 7: Upload supporting documents",
              "Step 8: Review and save the physician profile"
            ]
          },
          {
            title: "Editing Physician Information",
            icon: FileText,
            steps: [
              "Step 1: Navigate to 'All Clinicians' from the sidebar",
              "Step 2: Search or browse to find the physician",
              "Step 3: Click on the physician's name to view their profile",
              "Step 4: Click the 'Edit' button on the profile page",
              "Step 5: Update the necessary information",
              "Step 6: Save changes and verify updates"
            ]
          },
          {
            title: "Managing Demographics",
            icon: Users,
            content: [
              "Access the Demographics section to update personal information",
              "Maintain accurate birth dates for age-related compliance",
              "Update SSN and other identification numbers as needed",
              "Track employment status and availability",
              "Document language proficiencies for patient care"
            ]
          },
          {
            title: "Contact Information Management",
            icon: Phone,
            content: [
              "Maintain primary and secondary phone numbers",
              "Update email addresses for notifications",
              "Keep mailing addresses current for license renewals",
              "Add emergency contact information",
              "Specify preferred communication methods"
            ]
          }
        ]
      }
    },
    {
      id: "practice-management",
      title: "Practice Management",
      icon: Building2,
      content: {
        overview: "Manage practice affiliations, locations, and physician assignments.",
        sections: [
          {
            title: "Creating and Editing Practices",
            icon: Building2,
            steps: [
              "Step 1: Navigate to 'Practice Info' from the sidebar",
              "Step 2: Click 'Add New Practice' button",
              "Step 3: Enter practice name and type",
              "Step 4: Add practice address and contact details",
              "Step 5: Specify practice specialties and services",
              "Step 6: Set practice hours and availability",
              "Step 7: Save the practice information"
            ]
          },
          {
            title: "Assigning Physicians to Practices",
            icon: Users,
            steps: [
              "Step 1: Go to the practice detail page",
              "Step 2: Click 'Assign Physicians' button",
              "Step 3: Search for physicians to add",
              "Step 4: Select physicians from the list",
              "Step 5: Specify their role at the practice",
              "Step 6: Set start and end dates if applicable",
              "Step 7: Save assignments"
            ]
          },
          {
            title: "Bulk Operations",
            icon: CheckCircle,
            content: [
              "Select multiple physicians using checkboxes",
              "Use 'Bulk Actions' dropdown for mass updates",
              "Assign multiple physicians to a practice at once",
              "Update practice affiliations in bulk",
              "Export selected physician data to CSV"
            ]
          },
          {
            title: "Geographic Filtering",
            icon: MapPin,
            content: [
              "Use the map view to see practice locations",
              "Filter practices by state or region",
              "Search by zip code or city",
              "View physicians by geographic coverage",
              "Identify gaps in geographic coverage"
            ]
          }
        ]
      }
    },
    {
      id: "license-management",
      title: "License & Credential Management",
      icon: Shield,
      content: {
        overview: "Track and manage all professional licenses and credentials.",
        sections: [
          {
            title: "Adding Licenses",
            icon: Shield,
            steps: [
              "Step 1: Navigate to physician's Licensure tab",
              "Step 2: Click 'Add License' button",
              "Step 3: Select license type (Medical, DEA, CSR)",
              "Step 4: Enter license number",
              "Step 5: Select issuing state or authority",
              "Step 6: Enter issue and expiration dates",
              "Step 7: Upload license document",
              "Step 8: Set renewal reminder preferences"
            ]
          },
          {
            title: "DEA Registration Management",
            icon: Shield,
            content: [
              "Track DEA registration numbers by state",
              "Monitor expiration dates (typically 3-year cycles)",
              "Set alerts 90 days before expiration",
              "Document DEA schedules authorized",
              "Link to practice locations for each DEA"
            ]
          },
          {
            title: "CSR License Tracking",
            icon: Shield,
            content: [
              "Monitor Controlled Substance Registration per state",
              "Track state-specific requirements",
              "Coordinate CSR renewals with DEA renewals",
              "Document authorized prescription privileges",
              "Maintain compliance with state regulations"
            ]
          },
          {
            title: "Tracking Expiration Dates",
            icon: Clock,
            steps: [
              "Step 1: View 'License Expiration Dashboard'",
              "Step 2: Filter by time range (30, 60, 90 days)",
              "Step 3: Sort by physician or license type",
              "Step 4: Export expiration reports",
              "Step 5: Set custom alert thresholds",
              "Step 6: Configure notification recipients"
            ]
          },
          {
            title: "Renewal Workflows",
            icon: RefreshCcw,
            content: [
              "Automated renewal reminders at set intervals",
              "Track renewal application status",
              "Document submission and approval dates",
              "Upload renewed license documents",
              "Update system with new expiration dates"
            ]
          },
          {
            title: "Document Management",
            icon: FileText,
            content: [
              "Upload licenses in PDF, JPG, or PNG format",
              "Organize documents by type and date",
              "Set document expiration dates",
              "Version control for updated documents",
              "Secure storage with encryption"
            ]
          }
        ]
      }
    },
    {
      id: "dashboard-analytics",
      title: "Dashboard & Analytics",
      icon: BarChart3,
      content: {
        overview: "Understand metrics, generate reports, and gain insights from your data.",
        sections: [
          {
            title: "Understanding Dashboard Metrics",
            icon: BarChart3,
            content: [
              "Total Active Physicians: Current count of credentialed providers",
              "Licenses Expiring Soon: Count within 30/60/90 day windows",
              "Compliance Rate: Percentage of up-to-date credentials",
              "Renewal Success Rate: Completed renewals vs. expired",
              "Document Upload Rate: Percentage with complete documentation"
            ]
          },
          {
            title: "License Expiration Alerts",
            icon: AlertCircle,
            content: [
              "Color-coded alerts: Red (expired), Yellow (30 days), Green (current)",
              "Dashboard widget shows upcoming expirations",
              "Click alerts to view affected physicians",
              "Export expiration lists for action planning",
              "Set custom alert thresholds by license type"
            ]
          },
          {
            title: "Using Analytics Tools",
            icon: TrendingUp,
            steps: [
              "Step 1: Navigate to 'Analytics' from the sidebar",
              "Step 2: Select date range for analysis",
              "Step 3: Choose metrics to display",
              "Step 4: Apply filters (state, specialty, practice)",
              "Step 5: Generate visual charts and graphs",
              "Step 6: Export reports in PDF or Excel format"
            ]
          },
          {
            title: "Interpreting Reports",
            icon: FileText,
            content: [
              "Compliance Reports: Show credential status by physician",
              "Expiration Forecasts: Project future renewal needs",
              "Geographic Coverage: Map of licensed states",
              "Trend Analysis: Historical compliance patterns",
              "Audit Reports: Complete credential verification records"
            ]
          }
        ]
      }
    },
    {
      id: "notifications",
      title: "Notification System",
      icon: Bell,
      content: {
        overview: "Configure and manage alerts for credential expirations and updates.",
        sections: [
          {
            title: "Setting Up Notifications",
            icon: Bell,
            steps: [
              "Step 1: Go to Settings → Notifications",
              "Step 2: Enable notification types (email, in-app)",
              "Step 3: Set notification frequency (daily, weekly)",
              "Step 4: Choose alert timing (30, 60, 90 days)",
              "Step 5: Add recipient email addresses",
              "Step 6: Test notification delivery"
            ]
          },
          {
            title: "Managing Alert Preferences",
            icon: CheckCircle,
            content: [
              "License Expiration Alerts: Set days before expiration",
              "Document Upload Reminders: Missing document notifications",
              "Renewal Status Updates: Application progress alerts",
              "Compliance Warnings: Out-of-compliance notifications",
              "System Updates: Platform maintenance and features"
            ]
          },
          {
            title: "Understanding Expiration Alerts",
            icon: Clock,
            content: [
              "90-day alert: Initial reminder to begin renewal",
              "60-day alert: Follow-up with renewal instructions",
              "30-day alert: Urgent action required",
              "7-day alert: Critical expiration warning",
              "Expired notification: Immediate action needed"
            ]
          },
          {
            title: "Email Configuration",
            icon: Mail,
            content: [
              "Add multiple recipient emails per alert type",
              "Customize email templates with organization branding",
              "Set up digest emails for multiple alerts",
              "Configure reply-to addresses",
              "Enable read receipts for critical alerts"
            ]
          }
        ]
      }
    },
    {
      id: "common-tasks",
      title: "Common Tasks (Step-by-Step)",
      icon: CheckCircle,
      content: {
        overview: "Detailed walkthroughs for frequently performed tasks.",
        sections: [
          {
            title: "How to Add a New Physician",
            icon: UserPlus,
            steps: [
              "Step 1: Click 'Add Clinician' in the sidebar",
              "Step 2: Enter physician's full name (First, Middle, Last)",
              "Step 3: Add NPI number (10-digit identifier)",
              "Step 4: Enter email address for notifications",
              "Step 5: Add primary phone number",
              "Step 6: Select primary specialty from dropdown",
              "Step 7: Enter demographic information",
              "Step 8: Add at least one state license",
              "Step 9: Upload supporting documents",
              "Step 10: Review and click 'Save Physician'"
            ]
          },
          {
            title: "How to Renew an Expiring License",
            icon: RefreshCcw,
            steps: [
              "Step 1: Go to 'Renewal Workflows' page",
              "Step 2: Find the expiring license in the list",
              "Step 3: Click 'Start Renewal' button",
              "Step 4: Verify current license information",
              "Step 5: Update any changed details",
              "Step 6: Submit renewal to state board (external)",
              "Step 7: Track application status in system",
              "Step 8: Upload renewed license when received",
              "Step 9: Update expiration date in system",
              "Step 10: Verify renewal is complete"
            ]
          },
          {
            title: "How to Bulk Assign Physicians",
            icon: Users,
            steps: [
              "Step 1: Navigate to 'All Clinicians' page",
              "Step 2: Use filters to find target physicians",
              "Step 3: Select physicians using checkboxes",
              "Step 4: Click 'Bulk Actions' dropdown",
              "Step 5: Select 'Assign to Practice'",
              "Step 6: Choose practice from list",
              "Step 7: Set assignment details",
              "Step 8: Confirm bulk assignment",
              "Step 9: Review assignment summary"
            ]
          },
          {
            title: "How to Upload Documents",
            icon: Upload,
            steps: [
              "Step 1: Go to physician's profile",
              "Step 2: Click 'Documents' tab",
              "Step 3: Click 'Upload Document' button",
              "Step 4: Select document type from dropdown",
              "Step 5: Choose file from computer (PDF/JPG/PNG)",
              "Step 6: Enter document description",
              "Step 7: Set expiration date if applicable",
              "Step 8: Add any relevant notes",
              "Step 9: Click 'Upload' to save"
            ]
          },
          {
            title: "How to Track Credential Expirations",
            icon: Clock,
            steps: [
              "Step 1: Open main Dashboard",
              "Step 2: View 'Expiring Soon' widget",
              "Step 3: Click on time range filter",
              "Step 4: Select 30, 60, or 90 days",
              "Step 5: Review list of expiring credentials",
              "Step 6: Click physician name for details",
              "Step 7: Export list for follow-up",
              "Step 8: Set calendar reminders"
            ]
          },
          {
            title: "How to Generate Analytics Reports",
            icon: BarChart3,
            steps: [
              "Step 1: Navigate to 'Analytics' page",
              "Step 2: Select report type from menu",
              "Step 3: Choose date range for report",
              "Step 4: Apply filters (state, specialty, etc.)",
              "Step 5: Click 'Generate Report'",
              "Step 6: Review report preview",
              "Step 7: Adjust parameters if needed",
              "Step 8: Export as PDF or Excel",
              "Step 9: Share with stakeholders"
            ]
          }
        ]
      }
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: Wrench,
      content: {
        overview: "Solutions for common issues and error messages.",
        sections: [
          {
            title: "Common Issues and Solutions",
            icon: AlertCircle,
            content: [
              "Cannot log in: Check credentials, reset password if needed",
              "Upload fails: Verify file size (max 10MB) and format (PDF/JPG/PNG)",
              "Missing physicians: Check filters and search terms",
              "Alerts not received: Verify email settings and spam folder",
              "Report won't generate: Reduce date range or filters",
              "Slow performance: Clear browser cache, check internet connection"
            ]
          },
          {
            title: "Error Messages Explained",
            icon: AlertCircle,
            errors: [
              {
                error: "Invalid NPI Number",
                solution: "NPI must be exactly 10 digits. Verify the number and re-enter."
              },
              {
                error: "Duplicate License Number",
                solution: "This license is already in the system. Check existing records."
              },
              {
                error: "Document Upload Failed",
                solution: "Check file size (max 10MB) and format. Try again or contact support."
              },
              {
                error: "Permission Denied",
                solution: "You don't have access to this feature. Contact your administrator."
              },
              {
                error: "Session Expired",
                solution: "Your session timed out. Please log in again."
              },
              {
                error: "Data Validation Error",
                solution: "Check all required fields are filled correctly. Review red highlighted fields."
              }
            ]
          },
          {
            title: "Getting Support",
            icon: MessageCircle,
            content: [
              "In-app support: Click the help icon in the top navigation",
              "Email support: support@credentialmanagement.com",
              "Phone support: 1-800-XXX-XXXX (Mon-Fri, 8 AM - 6 PM EST)",
              "Documentation: You're already here!",
              "Video tutorials: Available in the Resources section",
              "Submit a ticket: Use the Settings → Support page"
            ]
          },
          {
            title: "Best Practices",
            icon: CheckCircle,
            content: [
              "Regular backups: Export data monthly for backup",
              "Keep documents current: Upload new versions promptly",
              "Set reminders early: 90-day alerts recommended",
              "Verify data accuracy: Regular audits prevent issues",
              "Train new users: Ensure proper system usage",
              "Update contact info: Keep emails and phones current"
            ]
          }
        ]
      }
    }
  ];

  // Filter sections based on search
  const filteredSections = searchQuery
    ? documentationSections.filter(section => 
        filterContent(section.title) || 
        filterContent(JSON.stringify(section.content))
      )
    : documentationSections;

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl">Help & Documentation</CardTitle>
              <CardDescription className="text-base mt-1">
                Everything you need to know about using the Clinician Credentialing Management System
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-documentation"
            />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => {
                setSearchQuery("");
                document.getElementById("getting-started")?.scrollIntoView({ behavior: "smooth" });
              }}
              data-testid="quick-link-getting-started"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Getting Started
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => {
                setSearchQuery("");
                document.getElementById("common-tasks")?.scrollIntoView({ behavior: "smooth" });
              }}
              data-testid="quick-link-common-tasks"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Common Tasks
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => {
                setSearchQuery("");
                document.getElementById("troubleshooting")?.scrollIntoView({ behavior: "smooth" });
              }}
              data-testid="quick-link-troubleshooting"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Troubleshooting
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => {
                setSearchQuery("notifications");
              }}
              data-testid="quick-link-notifications"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Sections */}
      <Accordion type="multiple" className="space-y-4">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} id={section.id}>
              <AccordionItem value={section.id} className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {/* Section Overview */}
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {section.content.overview}
                    </AlertDescription>
                  </Alert>

                  {/* Section Content */}
                  <div className="space-y-6">
                    {section.content.sections?.map((subsection, idx) => {
                      const SubIcon = subsection.icon;
                      return (
                        <div key={idx} className="border-l-2 border-primary/20 pl-4">
                          <div className="flex items-center gap-2 mb-3">
                            {SubIcon && <SubIcon className="h-4 w-4 text-primary" />}
                            <h3 className="font-semibold text-base">{subsection.title}</h3>
                          </div>
                          
                          {/* Steps */}
                          {subsection.steps && (
                            <ol className="space-y-2">
                              {subsection.steps.map((step, stepIdx) => (
                                <li key={stepIdx} className="flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}

                          {/* Content List */}
                          {subsection.content && Array.isArray(subsection.content) && (
                            <ul className="space-y-2">
                              {subsection.content.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Error Messages */}
                          {subsection.errors && (
                            <div className="space-y-3">
                              {subsection.errors.map((errorItem, errorIdx) => (
                                <Alert key={errorIdx} variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle className="text-sm">{errorItem.error}</AlertTitle>
                                  <AlertDescription className="text-sm">
                                    {errorItem.solution}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>

      {/* No Results */}
      {searchQuery && filteredSections.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse the documentation sections above.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feedback Section */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-3">Was this documentation helpful?</h3>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Button
                variant={helpfulFeedback === true ? "default" : "outline"}
                size="sm"
                onClick={() => setHelpfulFeedback(true)}
                data-testid="feedback-helpful"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes, helpful
              </Button>
              <Button
                variant={helpfulFeedback === false ? "default" : "outline"}
                size="sm"
                onClick={() => setHelpfulFeedback(false)}
                data-testid="feedback-not-helpful"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Not helpful
              </Button>
            </div>
            {helpfulFeedback !== null && (
              <Alert className="max-w-md mx-auto">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Thank you for your feedback! We use it to improve our documentation.
                </AlertDescription>
              </Alert>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Need more help? <Button variant="link" className="p-0 h-auto">Contact Support</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpDocumentationPage;
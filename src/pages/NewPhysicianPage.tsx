import { useState } from "react";
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
  User,
  Phone,
  Building2,
  GraduationCap,
  Shield,
  Upload,
  FileText,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NewPhysicianPage() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("demographics");

  const tabSections = [
    { id: "demographics", label: "Demographics", icon: User },
    { id: "contact", label: "Contact Info", icon: Phone },
    { id: "practice", label: "Practice Info", icon: Building2 },
    { id: "licensure", label: "Licensure", icon: Shield },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Physician</h1>
          <p className="text-muted-foreground">Enter physician information and credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Progress Sidebar */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
            <CardDescription>Complete all sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tabSections.map((section) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    currentTab === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setCurrentTab(section.id)}
                >
                  <section.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{section.label}</span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs"
                  >
                    0/5
                  </Badge>
                </div>
              ))}
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
                    Physician Demographics
                  </CardTitle>
                  <CardDescription>
                    Basic personal information and identifiers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Legal Name *</Label>
                      <Input id="fullName" placeholder="Enter full legal name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="npi">National Provider Identifier (NPI) *</Label>
                      <Input id="npi" placeholder="10-digit NPI number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input id="dob" type="date" />
                      <p className="text-xs text-muted-foreground">Sensitive information - secured</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssn">Social Security Number *</Label>
                      <Input id="ssn" placeholder="XXX-XX-XXXX" type="password" />
                      <p className="text-xs text-muted-foreground">Sensitive information - secured</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tin">Tax Identification Number (TIN) *</Label>
                      <Input id="tin" placeholder="XX-XXXXXXX" />
                      <p className="text-xs text-muted-foreground">Sensitive information - secured</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dea">DEA Number</Label>
                      <Input id="dea" placeholder="DEA number (if applicable)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="caqh">CAQH ID</Label>
                      <Input id="caqh" placeholder="CAQH ID (if available)" />
                    </div>
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
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" placeholder="physician@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" placeholder="(555) 123-4567" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="homeAddress">Home Address *</Label>
                      <Textarea id="homeAddress" placeholder="Enter complete home address" />
                      <p className="text-xs text-muted-foreground">Sensitive information - secured</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mailingAddress">Mailing Address</Label>
                      <Textarea id="mailingAddress" placeholder="Enter mailing address (if different)" />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyName">Contact Name</Label>
                        <Input id="emergencyName" placeholder="Emergency contact name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Contact Phone</Label>
                        <Input id="emergencyPhone" placeholder="Emergency contact phone" />
                      </div>
                    </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="practiceName">Practice/Facility Name *</Label>
                      <Input id="practiceName" placeholder="Enter practice name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupNpi">Group NPI</Label>
                      <Input id="groupNpi" placeholder="Group NPI (if applicable)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="officePhone">Office Phone *</Label>
                      <Input id="officePhone" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="officeFax">Office Fax</Label>
                      <Input id="officeFax" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Office Contact Person</Label>
                      <Input id="contactPerson" placeholder="Primary contact name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupTaxId">Group Tax ID</Label>
                      <Input id="groupTaxId" placeholder="Group tax identification" />
                      <p className="text-xs text-muted-foreground">Sensitive information - secured</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryAddress">Primary Practice Address *</Label>
                      <Textarea id="primaryAddress" placeholder="Enter complete practice address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryAddress">Secondary Practice Addresses</Label>
                      <Textarea id="secondaryAddress" placeholder="Additional practice locations (if any)" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
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
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Driver's License", sensitive: true },
                      { label: "Social Security Card", sensitive: true },
                      { label: "DEA Certificate", sensitive: false },
                      { label: "NPI Confirmation Letter", sensitive: false },
                      { label: "W-9 Form", sensitive: true },
                      { label: "Malpractice Insurance", sensitive: false },
                    ].map((doc) => (
                      <div key={doc.label} className="space-y-2">
                        <Label>{doc.label}</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, JPG, PNG up to 10MB
                          </p>
                          {doc.sensitive && (
                            <Badge variant="outline" className="mt-2 text-xs bg-destructive/10 text-destructive border-destructive/20">
                              Sensitive
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Actions */}
          <div className="flex justify-between pt-6">
            <Button variant="outline">Save as Draft</Button>
            <div className="flex gap-3">
              <Button variant="outline">Previous</Button>
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
                <Save className="h-4 w-4" />
                Save & Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  FileText,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const physicians = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    npi: "1234567890",
    specialty: "Cardiology",
    status: "Active",
    lastUpdated: "2024-01-15",
    documentsCount: 12,
    phone: "(555) 123-4567",
    email: "sarah.johnson@medical.com"
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    npi: "0987654321", 
    specialty: "Neurology",
    status: "Pending",
    lastUpdated: "2024-01-14",
    documentsCount: 8,
    phone: "(555) 234-5678",
    email: "michael.chen@hospital.org"
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    npi: "1122334455",
    specialty: "Pediatrics",
    status: "Active",
    lastUpdated: "2024-01-13",
    documentsCount: 15,
    phone: "(555) 345-6789",
    email: "emily.rodriguez@clinic.com"
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    npi: "5566778899",
    specialty: "Orthopedics",
    status: "Review",
    lastUpdated: "2024-01-12",
    documentsCount: 6,
    phone: "(555) 456-7890",
    email: "james.wilson@orthocenter.com"
  },
  {
    id: 5,
    name: "Dr. Maria Garcia",
    npi: "9988776655",
    specialty: "Internal Medicine",
    status: "Active",
    lastUpdated: "2024-01-11",
    documentsCount: 11,
    phone: "(555) 567-8901",
    email: "maria.garcia@family.med"
  }
];

export default function PhysiciansPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPhysicians = physicians.filter(physician =>
    physician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    physician.npi.includes(searchTerm) ||
    physician.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success/10 text-success border-success/20";
      case "Pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "Review":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Physicians</h1>
          <p className="text-muted-foreground">Manage physician profiles and credentials</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
          <Plus className="h-4 w-4" />
          Add New Physician
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Physician Directory</CardTitle>
              <CardDescription>
                {filteredPhysicians.length} of {physicians.length} physicians
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search physicians..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Physician</TableHead>
                  <TableHead className="font-semibold">NPI</TableHead>
                  <TableHead className="font-semibold">Specialty</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Documents</TableHead>
                  <TableHead className="font-semibold">Last Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPhysicians.map((physician) => (
                  <TableRow key={physician.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{physician.name}</div>
                        <div className="text-sm text-muted-foreground">{physician.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{physician.npi}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        {physician.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(physician.status)}>
                        {physician.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{physician.documentsCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {physician.lastUpdated}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <FileText className="h-4 w-4" />
                            View Documents
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
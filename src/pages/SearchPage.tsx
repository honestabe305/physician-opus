import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  X,
  User,
  Building2,
  Calendar,
} from "lucide-react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const removeFilter = (filter: string) => {
    setSelectedFilters(prev => prev.filter(f => f !== filter));
  };

  const searchResults = [
    {
      id: 1,
      type: "physician",
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      npi: "1234567890",
      status: "Active",
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      type: "practice",
      name: "Metro Heart Center",
      address: "123 Medical Plaza",
      phone: "(555) 123-4567",
      physicianCount: 12
    },
    {
      id: 3,
      type: "document",
      name: "Medical License - Dr. Emily Rodriguez",
      type_detail: "State License",
      uploaded: "2024-01-10",
      expires: "2025-12-31"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground">Search across physicians, practices, and documents</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Advanced Search</CardTitle>
          <CardDescription>Find physicians, practices, or documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Search type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="physicians">Physicians</SelectItem>
                <SelectItem value="practices">Practices</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="neurology">Neurology</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
                <SelectItem value="orthopedics">Orthopedics</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>

          {selectedFilters.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => removeFilter(filter)}
                >
                  {filter}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>{searchResults.length} results found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {result.type === "physician" && <User className="h-5 w-5 text-primary" />}
                      {result.type === "practice" && <Building2 className="h-5 w-5 text-primary" />}
                      {result.type === "document" && <Calendar className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{result.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                      
                      {result.type === "physician" && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Specialty: {result.specialty}</p>
                          <p>NPI: {result.npi}</p>
                          <p>Last updated: {result.lastUpdated}</p>
                        </div>
                      )}
                      
                      {result.type === "practice" && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Address: {result.address}</p>
                          <p>Phone: {result.phone}</p>
                          <p>Physicians: {result.physicianCount}</p>
                        </div>
                      )}
                      
                      {result.type === "document" && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Type: {result.type_detail}</p>
                          <p>Uploaded: {result.uploaded}</p>
                          <p>Expires: {result.expires}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {result.type === "physician" && (
                    <Badge className={
                      result.status === "Active" ? "bg-success/10 text-success border-success/20" :
                      "bg-warning/10 text-warning border-warning/20"
                    }>
                      {result.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  FileText,
  Plus,
  Search,
  AlertCircle,
  Users,
  Phone,
  Building,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Import sections as separate components
import { PracticeInfoSection } from "./practice-sections/PracticeInfoSection";
import { PracticeLocationsSection } from "./practice-sections/PracticeLocationsSection";
import { PracticeDocumentsSection } from "./practice-sections/PracticeDocumentsSection";

interface ConsolidatedPracticePageProps {
  defaultTab?: string;
}

export default function ConsolidatedPracticePage({ defaultTab = "info" }: ConsolidatedPracticePageProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { toast } = useToast();

  // Parse URL for tab selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section && ['info', 'locations', 'documents'].includes(section)) {
      setActiveTab(section);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === 'info') {
      params.delete('section');
    } else {
      params.set('section', tab);
    }
    const newSearch = params.toString();
    const newPath = `/practice${newSearch ? `?${newSearch}` : ''}`;
    window.history.replaceState({}, '', newPath);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch practices data for overview
  const { data: practicesResponse, isLoading: practicesLoading, error: practicesError } = useQuery({
    queryKey: ['/practices'],
  });

  const practices = practicesResponse?.data || [];

  // Overview stats
  const practiceStats = {
    totalPractices: practices.length,
    activePractices: practices.filter((p: any) => p.isActive).length,
    totalLocations: 0, // Will be calculated from locations data
    totalDocuments: 0, // Will be calculated from documents data
  };

  if (practicesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Practice Management</h1>
            <p className="text-muted-foreground">Manage practice information, locations, and documents</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load practice data: {practicesError instanceof Error ? practicesError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="consolidated-practice-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Practice Management</h1>
          <p className="text-muted-foreground">Manage practice information, locations, and documents</p>
        </div>
      </div>

      {/* Overview Statistics */}
      {!practicesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Practices</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-practices">{practiceStats.totalPractices}</div>
              <p className="text-xs text-muted-foreground">
                {practiceStats.activePractices} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Practice Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-locations">{practiceStats.totalLocations}</div>
              <p className="text-xs text-muted-foreground">across all practices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-documents">{practiceStats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">stored documents</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Search</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search practices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search-practices"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" data-testid="tab-practice-info">
            <Building className="h-4 w-4 mr-2" />
            Practice Info
          </TabsTrigger>
          <TabsTrigger value="locations" data-testid="tab-practice-locations">
            <MapPin className="h-4 w-4 mr-2" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-practice-documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {practicesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <PracticeInfoSection 
              practices={practices} 
              searchTerm={debouncedSearch}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/practices'] })}
            />
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <PracticeLocationsSection 
            practices={practices}
            searchTerm={debouncedSearch}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/practices'] })}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <PracticeDocumentsSection 
            practices={practices}
            searchTerm={debouncedSearch}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/practices'] })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
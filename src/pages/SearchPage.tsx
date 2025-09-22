import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  AlertCircle,
  FileText,
} from "lucide-react";
import { Link } from "wouter";
import type { SelectPhysician } from "../../shared/schema";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (statusFilter) params.append('status', statusFilter);
    return params.toString();
  };

  // Fetch search results
  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ['/physicians', { search: debouncedSearch, status: statusFilter }],
    queryFn: () => {
      const queryParams = buildQueryParams();
      return apiRequest(`/physicians${queryParams ? `?${queryParams}` : ''}`);
    },
    enabled: !!debouncedSearch || !!statusFilter, // Only search when there's a query or filter
  });

  const physicians = searchData?.physicians || [];

  const removeFilter = (filter: string) => {
    setSelectedFilters(prev => prev.filter(f => f !== filter));
    if (filter.startsWith('Status: ')) {
      setStatusFilter('');
    }
  };

  const addStatusFilter = (status: string) => {
    if (status && !selectedFilters.some(f => f.startsWith('Status: '))) {
      setStatusFilter(status);
      setSelectedFilters(prev => [...prev, `Status: ${status}`]);
    }
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setStatusFilter('');
  };

  const handleSearch = () => {
    // Search is automatically triggered by debounced search term
    // This function exists for explicit search button clicks
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "review":
      case "under review":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground">Search across physician profiles and credentials</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Physician Search</CardTitle>
          <CardDescription>Find physicians by name, NPI, practice, or email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for physicians..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-query"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="gap-2 bg-gradient-to-r from-primary to-accent"
              data-testid="button-search"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={addStatusFilter}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={clearAllFilters}
                disabled={selectedFilters.length === 0}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
              <Button variant="outline" className="gap-2" data-testid="button-more-filters">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
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
                  data-testid={`filter-${filter.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : error ? (
              "Error loading results"
            ) : !debouncedSearch && !statusFilter ? (
              "Enter a search term or select a filter to see results"
            ) : (
              `${physicians.length} physician${physicians.length !== 1 ? 's' : ''} found`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to search physicians: {error instanceof Error ? error.message : 'Unknown error'}
              </AlertDescription>
            </Alert>
          ) : !debouncedSearch && !statusFilter ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Start your search</p>
              <p className="text-sm">Enter a physician name, NPI, practice name, or email address to find matching profiles.</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : physicians.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try adjusting your search terms or filters to find what you're looking for.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {physicians.map((physician: SelectPhysician) => (
                <Link key={physician.id} href={`/physicians/${physician.id}`}>
                  <div
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    data-testid={`result-physician-${physician.id}`}
                  >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground" data-testid={`name-${physician.id}`}>
                            {physician.fullLegalName}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            physician
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1 mt-2">
                          {physician.clinicianType && (
                            <p data-testid={`specialty-${physician.id}`}>
                              Type: {physician.clinicianType}
                            </p>
                          )}
                          {physician.npi && (
                            <p data-testid={`npi-${physician.id}`}>
                              NPI: {physician.npi}
                            </p>
                          )}
                          {physician.emailAddress && (
                            <p data-testid={`email-${physician.id}`}>
                              Email: {physician.emailAddress}
                            </p>
                          )}
                          {physician.updatedAt && (
                            <p data-testid={`updated-${physician.id}`}>
                              Last updated: {new Date(physician.updatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      className={getStatusColor(physician.status || 'inactive')}
                      data-testid={`status-${physician.id}`}
                    >
                      {physician.status || 'inactive'}
                    </Badge>
                  </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
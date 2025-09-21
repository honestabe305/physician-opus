import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useDisplayPreferences } from "@/hooks/use-display-preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import type { SelectPhysician } from "../../shared/schema";

export default function PhysiciansPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [, setLocation] = useLocation();
  const { preferences, formatDate, getTableRowClass, getTableCellClass } = useDisplayPreferences();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch physicians data
  const { data: physiciansData, isLoading, error } = useQuery({
    queryKey: debouncedSearch ? [`/physicians?search=${encodeURIComponent(debouncedSearch)}`] : ['/physicians'],
    enabled: true,
    throwOnError: false,
    retry: 1,
  });

  // Fetch document counts for each physician
  const physicians = (physiciansData as any)?.physicians || [];
  
  // Pagination logic
  const itemsPerPage = preferences.itemsPerPage;
  const totalPages = Math.ceil(physicians.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPhysicians = physicians.slice(startIndex, endIndex);
  
  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);
  
  // Helper function to get document count
  const getDocumentCount = (physicianId: string) => {
    // This could be optimized to batch fetch all document counts
    // For now, we'll return a placeholder
    return 0;
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clinicians</h1>
            <p className="text-muted-foreground">Manage clinician profiles and credentials</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load physicians: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clinicians</h1>
          <p className="text-muted-foreground">Manage clinician profiles and credentials</p>
        </div>
        <Link href="/physicians/new">
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent" data-testid="button-add-physician">
            <Plus className="h-4 w-4" />
            Add New Clinician
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clinician Directory</CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  `${physicians.length} clinician${physicians.length !== 1 ? 's' : ''}`
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clinicians..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-physicians"
                />
              </div>
              <Button 
                variant="outline" 
                className="gap-2" 
                data-testid="button-filter"
                onClick={() => {
                  // TODO: Implement filter functionality
                  console.log('Filter clicked - functionality to be implemented');
                }}
              >
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
                  <TableHead className="font-semibold">Clinician</TableHead>
                  <TableHead className="font-semibold">NPI</TableHead>
                  <TableHead className="font-semibold">Practice</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Documents</TableHead>
                  <TableHead className="font-semibold">Last Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : physicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No physicians found matching your search.' : 'No physicians found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPhysicians.map((physician: SelectPhysician) => (
                    <TableRow key={physician.id} className="hover:bg-muted/20" data-testid={`row-physician-${physician.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground" data-testid={`text-physician-name-${physician.id}`}>
                            {physician.fullLegalName}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-physician-email-${physician.id}`}>
                            {physician.emailAddress || 'No email provided'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-physician-npi-${physician.id}`}>
                        {physician.npi || 'N/A'}
                      </TableCell>
                      <TableCell data-testid={`text-physician-practice-${physician.id}`}>
                        <div className="text-sm">
                          {physician.practiceName || 'No practice listed'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(physician.status || 'inactive')} data-testid={`badge-physician-status-${physician.id}`}>
                          {physician.status || 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" data-testid={`text-physician-documents-${physician.id}`}>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{getDocumentCount(physician.id)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-physician-updated-${physician.id}`}>
                        {physician.updatedAt ? formatDate(physician.updatedAt) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-actions-${physician.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="gap-2" 
                              data-testid={`action-view-${physician.id}`}
                              onClick={() => setLocation(`/physicians/${physician.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2" 
                              data-testid={`action-edit-${physician.id}`}
                              onClick={() => setLocation(`/physicians/${physician.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2" 
                              data-testid={`action-documents-${physician.id}`}
                              onClick={() => setLocation(`/physicians/${physician.id}/documents`)}
                            >
                              <FileText className="h-4 w-4" />
                              Documents
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {!isLoading && physicians.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, physicians.length)} of {physicians.length} clinicians
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
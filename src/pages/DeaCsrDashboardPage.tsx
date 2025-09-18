import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeaRegistrationCard } from "@/components/DeaRegistrationCard";
import { CsrLicenseCard } from "@/components/CsrLicenseCard";
import { DeaCsrTimeline } from "@/components/DeaCsrTimeline";
import { MateTrainingTracker } from "@/components/MateTrainingTracker";
import { StateComplianceGrid } from "@/components/StateComplianceGrid";
import { DeaCsrCalendar } from "@/components/DeaCsrCalendar";
import { DeaRenewalForm } from "@/components/DeaRenewalForm";
import { CsrRenewalForm } from "@/components/CsrRenewalForm";
import {
  Shield,
  FileKey,
  Calendar,
  AlertCircle,
  Download,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Send,
  CheckSquare,
  Users,
  TrendingUp,
  Clock
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { type SelectDeaRegistration, type SelectCsrLicense, type SelectPhysician } from "../../shared/schema";

export default function DeaCsrDashboardPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterExpiration, setFilterExpiration] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeaRenewalDialog, setShowDeaRenewalDialog] = useState(false);
  const [showCsrRenewalDialog, setShowCsrRenewalDialog] = useState(false);
  const [selectedDea, setSelectedDea] = useState<SelectDeaRegistration | null>(null);
  const [selectedCsr, setSelectedCsr] = useState<SelectCsrLicense | null>(null);
  const [selectedPhysicianId, setSelectedPhysicianId] = useState<string>("");

  // Fetch data
  const { data: physicians = [] } = useQuery<SelectPhysician[]>({
    queryKey: ['/api/physicians']
  });

  const { data: deaRegistrations = [], isLoading: isLoadingDea } = useQuery<SelectDeaRegistration[]>({
    queryKey: ['/api/dea-registrations']
  });

  const { data: csrLicenses = [], isLoading: isLoadingCsr } = useQuery<SelectCsrLicense[]>({
    queryKey: ['/api/csr-licenses']
  });

  // Create physician map for easy lookup
  const physicianMap = new Map(physicians.map(p => [p.id, p.fullLegalName]));

  // Filter data based on search and filters
  const filterData = <T extends { state: string; expireDate: string; physicianId: string }>(
    data: T[],
    isExpired: (item: T) => boolean
  ): T[] => {
    return data.filter(item => {
      // Search filter
      if (searchTerm) {
        const physicianName = physicianMap.get(item.physicianId)?.toLowerCase() || "";
        const searchLower = searchTerm.toLowerCase();
        if (!physicianName.includes(searchLower) && 
            !item.state.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // State filter
      if (filterState !== "all" && item.state !== filterState) {
        return false;
      }

      // Status filter
      if (filterStatus !== "all") {
        const expired = isExpired(item);
        const daysUntil = differenceInDays(new Date(item.expireDate), new Date());
        
        if (filterStatus === "expired" && !expired) return false;
        if (filterStatus === "expiring" && (expired || daysUntil > 90)) return false;
        if (filterStatus === "active" && (expired || daysUntil <= 90)) return false;
      }

      // Expiration range filter
      if (filterExpiration !== "all") {
        const daysUntil = differenceInDays(new Date(item.expireDate), new Date());
        
        if (filterExpiration === "30" && daysUntil > 30) return false;
        if (filterExpiration === "60" && daysUntil > 60) return false;
        if (filterExpiration === "90" && daysUntil > 90) return false;
      }

      return true;
    });
  };

  const filteredDea = filterData(
    deaRegistrations,
    (item) => differenceInDays(new Date(item.expireDate), new Date()) < 0
  );

  const filteredCsr = filterData(
    csrLicenses,
    (item) => differenceInDays(new Date(item.expireDate), new Date()) < 0
  );

  // Calculate summary statistics
  const today = new Date();
  const totalDea = deaRegistrations.length;
  const totalCsr = csrLicenses.length;
  
  const deaExpiring = deaRegistrations.filter(d => {
    const daysUntil = differenceInDays(new Date(d.expireDate), today);
    return daysUntil > 0 && daysUntil <= 90;
  }).length;
  
  const csrExpiring = csrLicenses.filter(c => {
    const daysUntil = differenceInDays(new Date(c.expireDate), today);
    return daysUntil > 0 && daysUntil <= 90;
  }).length;

  const deaExpired = deaRegistrations.filter(d => 
    differenceInDays(new Date(d.expireDate), today) < 0
  ).length;
  
  const csrExpired = csrLicenses.filter(c => 
    differenceInDays(new Date(c.expireDate), today) < 0
  ).length;

  const mateCompliant = deaRegistrations.filter(d => d.mateAttested).length;
  const mateComplianceRate = totalDea > 0 ? (mateCompliant / totalDea * 100).toFixed(1) : "0";

  // Mutations for DEA and CSR operations
  const createDeaMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/dea-registrations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dea-registrations'] });
      toast({
        title: "Success",
        description: "DEA registration created successfully",
      });
      setShowDeaRenewalDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create DEA registration",
        variant: "destructive",
      });
    },
  });

  const createCsrMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/csr-licenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/csr-licenses'] });
      toast({
        title: "Success",
        description: "CSR license created successfully",
      });
      setShowCsrRenewalDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create CSR license",
        variant: "destructive",
      });
    },
  });

  const handleDeaRenew = (deaId: string) => {
    const dea = deaRegistrations.find(d => d.id === deaId);
    if (dea) {
      setSelectedDea(dea);
      setSelectedPhysicianId(dea.physicianId);
      setShowDeaRenewalDialog(true);
    }
  };

  const handleCsrRenew = (csrId: string) => {
    const csr = csrLicenses.find(c => c.id === csrId);
    if (csr) {
      setSelectedCsr(csr);
      setSelectedPhysicianId(csr.physicianId);
      setShowCsrRenewalDialog(true);
    }
  };

  const handleExportSelected = () => {
    // Implement CSV export
    toast({
      title: "Export Started",
      description: `Exporting ${selectedItems.size} selected items...`,
    });
  };

  const handleBatchRenewal = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items for batch renewal",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Batch Renewal",
      description: `Initiating renewal for ${selectedItems.size} items...`,
    });
  };

  const handleSendReminders = () => {
    const expiringCount = deaExpiring + csrExpiring;
    toast({
      title: "Reminders Sent",
      description: `Renewal reminders sent for ${expiringCount} expiring licenses`,
    });
  };

  // Get unique states for filter
  const uniqueStates = Array.from(new Set([
    ...deaRegistrations.map(d => d.state),
    ...csrLicenses.map(c => c.state)
  ])).sort();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DEA/CSR Management</h1>
        <p className="text-muted-foreground">
          Comprehensive dashboard for managing DEA registrations and CSR licenses
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Total DEA Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDea}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">
                {deaExpired} Expired
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {deaExpiring} Expiring
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileKey className="h-4 w-4 text-primary" />
              Total CSR Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCsr}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">
                {csrExpired} Expired
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {csrExpiring} Expiring
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Upcoming Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {deaExpiring + csrExpiring}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Within next 90 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              MATE Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mateComplianceRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {mateCompliant} of {totalDea} compliant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by physician or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
          
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-32" data-testid="select-filter-state">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterExpiration} onValueChange={setFilterExpiration}>
            <SelectTrigger className="w-36" data-testid="select-filter-expiration">
              <SelectValue placeholder="Expiration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
              <SelectItem value="60">Next 60 days</SelectItem>
              <SelectItem value="90">Next 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bulk-actions">
                <CheckSquare className="h-4 w-4 mr-1" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Selected: {selectedItems.size}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => {}}
              >
                Select All
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                onClick={handleBatchRenewal}
                disabled={selectedItems.size === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Batch Renewal
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={handleExportSelected}
                disabled={selectedItems.size === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendReminders}
            data-testid="button-send-reminders"
          >
            <Send className="h-4 w-4 mr-1" />
            Send Reminders
          </Button>

          <Button
            size="sm"
            onClick={() => setShowDeaRenewalDialog(true)}
            data-testid="button-add-dea"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add DEA
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCsrRenewalDialog(true)}
            data-testid="button-add-csr"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add CSR
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="mate">MATE Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DEA Registrations */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                DEA Registrations
              </h2>
              <div className="space-y-3">
                {filteredDea.slice(0, 5).map(dea => (
                  <DeaRegistrationCard
                    key={dea.id}
                    registration={dea}
                    physicianName={physicianMap.get(dea.physicianId)}
                    onRenew={handleDeaRenew}
                    onViewDetails={() => {}}
                  />
                ))}
                {filteredDea.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No DEA registrations found</p>
                    </CardContent>
                  </Card>
                )}
                {filteredDea.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All {filteredDea.length} DEA Registrations
                  </Button>
                )}
              </div>
            </div>

            {/* CSR Licenses */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileKey className="h-5 w-5" />
                CSR Licenses
              </h2>
              <div className="space-y-3">
                {filteredCsr.slice(0, 5).map(csr => (
                  <CsrLicenseCard
                    key={csr.id}
                    license={csr}
                    physicianName={physicianMap.get(csr.physicianId)}
                    onRenew={handleCsrRenew}
                    onViewDetails={() => {}}
                    onViewRequirements={() => {}}
                  />
                ))}
                {filteredCsr.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No CSR licenses found</p>
                    </CardContent>
                  </Card>
                )}
                {filteredCsr.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All {filteredCsr.length} CSR Licenses
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <DeaCsrTimeline
            deaRegistrations={filteredDea}
            csrLicenses={filteredCsr}
            physicianMap={physicianMap}
            onItemClick={(type, id) => {
              if (type === 'dea') {
                handleDeaRenew(id);
              } else {
                handleCsrRenew(id);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <DeaCsrCalendar
            deaRegistrations={filteredDea}
            csrLicenses={filteredCsr}
            physicianMap={physicianMap}
            onEventClick={(type, id) => {
              if (type === 'dea') {
                handleDeaRenew(id);
              } else {
                handleCsrRenew(id);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="compliance">
          <StateComplianceGrid
            physicians={physicians}
            deaRegistrations={deaRegistrations}
            csrLicenses={csrLicenses}
            onStateClick={(state) => setFilterState(state)}
            onExport={() => {
              toast({
                title: "Export Started",
                description: "Generating compliance report...",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="mate">
          <MateTrainingTracker
            deaRegistrations={deaRegistrations}
            physicianMap={physicianMap}
            onUpdateTraining={(deaId) => handleDeaRenew(deaId)}
            onExport={() => {
              toast({
                title: "Export Started",
                description: "Generating MATE compliance report...",
              });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* DEA Renewal Dialog */}
      <Dialog open={showDeaRenewalDialog} onOpenChange={setShowDeaRenewalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDea ? 'Renew DEA Registration' : 'Add New DEA Registration'}
            </DialogTitle>
          </DialogHeader>
          <DeaRenewalForm
            registration={selectedDea || undefined}
            physicianId={selectedPhysicianId || physicians[0]?.id || ""}
            physicianName={selectedDea ? physicianMap.get(selectedDea.physicianId) : undefined}
            onSubmit={async (data) => {
              await createDeaMutation.mutateAsync({
                ...data,
                physicianId: selectedPhysicianId || physicians[0]?.id,
                status: 'active'
              });
            }}
            onCancel={() => {
              setShowDeaRenewalDialog(false);
              setSelectedDea(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* CSR Renewal Dialog */}
      <Dialog open={showCsrRenewalDialog} onOpenChange={setShowCsrRenewalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCsr ? 'Renew CSR License' : 'Add New CSR License'}
            </DialogTitle>
          </DialogHeader>
          <CsrRenewalForm
            license={selectedCsr || undefined}
            physicianId={selectedPhysicianId || physicians[0]?.id || ""}
            physicianName={selectedCsr ? physicianMap.get(selectedCsr.physicianId) : undefined}
            onSubmit={async (data) => {
              await createCsrMutation.mutateAsync({
                ...data,
                physicianId: selectedPhysicianId || physicians[0]?.id,
                status: 'active'
              });
            }}
            onCancel={() => {
              setShowCsrRenewalDialog(false);
              setSelectedCsr(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
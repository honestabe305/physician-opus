import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Map, Shield, FileKey, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { type SelectDeaRegistration, type SelectCsrLicense, type SelectPhysician } from "../../shared/schema";

interface StateComplianceData {
  state: string;
  totalPhysicians: number;
  deaActive: number;
  deaExpiring: number;
  deaExpired: number;
  csrActive: number;
  csrExpiring: number;
  csrExpired: number;
  mateCompliant: number;
  overallCompliance: number;
}

interface StateComplianceGridProps {
  physicians: SelectPhysician[];
  deaRegistrations: SelectDeaRegistration[];
  csrLicenses: SelectCsrLicense[];
  onStateClick?: (state: string) => void;
  onExport?: () => void;
}

export function StateComplianceGrid({
  physicians,
  deaRegistrations,
  csrLicenses,
  onStateClick,
  onExport
}: StateComplianceGridProps) {
  const today = new Date();

  // Process data by state
  const stateData = new Map<string, StateComplianceData>();

  // Get unique states from DEA and CSR
  const allStates = new Set<string>();
  deaRegistrations.forEach(dea => allStates.add(dea.state));
  csrLicenses.forEach(csr => allStates.add(csr.state));

  // Calculate compliance data for each state
  allStates.forEach(state => {
    const stateDeas = deaRegistrations.filter(d => d.state === state);
    const stateCsrs = csrLicenses.filter(c => c.state === state);
    
    // Count physicians in this state (approximate based on licenses)
    const physiciansInState = new Set([
      ...stateDeas.map(d => d.physicianId),
      ...stateCsrs.map(c => c.physicianId)
    ]).size;

    // DEA status counts
    const deaActive = stateDeas.filter(d => {
      const daysUntil = Math.floor((new Date(d.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 90;
    }).length;
    
    const deaExpiring = stateDeas.filter(d => {
      const daysUntil = Math.floor((new Date(d.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 90;
    }).length;
    
    const deaExpired = stateDeas.filter(d => {
      const daysUntil = Math.floor((new Date(d.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 0;
    }).length;

    // CSR status counts
    const csrActive = stateCsrs.filter(c => {
      const daysUntil = Math.floor((new Date(c.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 90;
    }).length;
    
    const csrExpiring = stateCsrs.filter(c => {
      const daysUntil = Math.floor((new Date(c.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 90;
    }).length;
    
    const csrExpired = stateCsrs.filter(c => {
      const daysUntil = Math.floor((new Date(c.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 0;
    }).length;

    // MATE compliance
    const mateCompliant = stateDeas.filter(d => d.mateAttested).length;

    // Calculate overall compliance percentage
    const totalLicenses = stateDeas.length + stateCsrs.length;
    const activeLicenses = deaActive + csrActive;
    const overallCompliance = totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 0;

    stateData.set(state, {
      state,
      totalPhysicians: physiciansInState,
      deaActive,
      deaExpiring,
      deaExpired,
      csrActive,
      csrExpiring,
      csrExpired,
      mateCompliant,
      overallCompliance
    });
  });

  const sortedStates = Array.from(stateData.values()).sort((a: StateComplianceData, b: StateComplianceData) => a.state.localeCompare(b.state));

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (active: number, expiring: number, expired: number) => {
    if (expired > 0) return <Badge variant="destructive">Needs Attention</Badge>;
    if (expiring > 0) return <Badge variant="secondary">Action Required</Badge>;
    if (active > 0) return <Badge variant="secondary">Compliant</Badge>;
    return <Badge variant="secondary">No Licenses</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              State-by-State Compliance Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              DEA and CSR license status across all states
            </p>
          </div>
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              data-testid="button-export-compliance"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead className="text-center">Providers</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" />
                    DEA Status
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <FileKey className="h-3 w-3" />
                    CSR Status
                  </div>
                </TableHead>
                <TableHead className="text-center">MATE</TableHead>
                <TableHead className="text-center">Compliance</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStates.map(stateInfo => (
                <TableRow
                  key={stateInfo.state}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => onStateClick?.(stateInfo.state)}
                  data-testid={`state-row-${stateInfo.state}`}
                >
                  <TableCell className="font-medium">
                    {stateInfo.state}
                  </TableCell>
                  <TableCell className="text-center">
                    {stateInfo.totalPhysicians}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              {stateInfo.deaActive > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  {stateInfo.deaActive}
                                </span>
                              )}
                              {stateInfo.deaExpiring > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                  {stateInfo.deaExpiring}
                                </span>
                              )}
                              {stateInfo.deaExpired > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  {stateInfo.deaExpired}
                                </span>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p>Active: {stateInfo.deaActive}</p>
                            <p>Expiring: {stateInfo.deaExpiring}</p>
                            <p>Expired: {stateInfo.deaExpired}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              {stateInfo.csrActive > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  {stateInfo.csrActive}
                                </span>
                              )}
                              {stateInfo.csrExpiring > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                  {stateInfo.csrExpiring}
                                </span>
                              )}
                              {stateInfo.csrExpired > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  {stateInfo.csrExpired}
                                </span>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p>Active: {stateInfo.csrActive}</p>
                            <p>Expiring: {stateInfo.csrExpiring}</p>
                            <p>Expired: {stateInfo.csrExpired}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {stateInfo.mateCompliant > 0 ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs">{stateInfo.mateCompliant}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${getComplianceColor(stateInfo.overallCompliance)}`}>
                      {stateInfo.overallCompliance}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(
                      stateInfo.deaActive + stateInfo.csrActive,
                      stateInfo.deaExpiring + stateInfo.csrExpiring,
                      stateInfo.deaExpired + stateInfo.csrExpired
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-4 gap-4 border-t pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{sortedStates.length}</div>
            <p className="text-xs text-muted-foreground">Active States</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {deaRegistrations.filter(d => {
                const daysUntil = Math.floor((new Date(d.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil > 90;
              }).length + csrLicenses.filter(c => {
                const daysUntil = Math.floor((new Date(c.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil > 90;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Active Licenses</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {deaRegistrations.filter(d => {
                const daysUntil = Math.floor((new Date(d.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil > 0 && daysUntil <= 90;
              }).length + csrLicenses.filter(c => {
                const daysUntil = Math.floor((new Date(c.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil > 0 && daysUntil <= 90;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Need Renewal</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {deaRegistrations.filter(d => {
                const daysUntil = Math.floor((new Date(d.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil <= 0;
              }).length + csrLicenses.filter(c => {
                const daysUntil = Math.floor((new Date(c.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntil <= 0;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
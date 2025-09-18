import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, CheckCircle, XCircle, AlertTriangle, Download, Users } from "lucide-react";
import { format } from "date-fns";
import { type SelectDeaRegistration } from "../../shared/schema";

interface MateTrainingTrackerProps {
  deaRegistrations: SelectDeaRegistration[];
  physicianMap?: Map<string, string>;
  onUpdateTraining?: (deaId: string) => void;
  onExport?: () => void;
}

export function MateTrainingTracker({
  deaRegistrations,
  physicianMap,
  onUpdateTraining,
  onExport
}: MateTrainingTrackerProps) {
  const totalRegistrations = deaRegistrations.length;
  const completedCount = deaRegistrations.filter(dea => dea.mateAttested).length;
  const pendingCount = totalRegistrations - completedCount;
  const completionRate = totalRegistrations > 0 ? (completedCount / totalRegistrations) * 100 : 0;

  const getComplianceStatus = (dea: SelectDeaRegistration) => {
    if (dea.mateAttested) return 'completed';
    
    // DEA registrations issued after June 27, 2023 require MATE training
    const requirementDate = new Date('2023-06-27');
    const issueDate = new Date(dea.issueDate);
    
    if (issueDate >= requirementDate) return 'required';
    return 'recommended';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'required':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'required':
        return <Badge variant="destructive">Required</Badge>;
      default:
        return <Badge variant="secondary">Recommended</Badge>;
    }
  };

  // Group DEA registrations by state
  const byState = deaRegistrations.reduce((acc, dea) => {
    if (!acc[dea.state]) {
      acc[dea.state] = [];
    }
    acc[dea.state].push(dea);
    return acc;
  }, {} as Record<string, SelectDeaRegistration[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              MATE Act Training Compliance
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Medication Access and Training Expansion Act compliance tracking
            </p>
          </div>
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              data-testid="button-export-mate"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Statistics */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">Total DEAs</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span className="font-medium">{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </div>

        {/* State Breakdown */}
        <div>
          <h3 className="text-sm font-semibold mb-3">State-by-State Compliance</h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {Object.entries(byState).map(([state, registrations]) => {
                const stateCompleted = registrations.filter(r => r.mateAttested).length;
                const stateTotal = registrations.length;
                const stateRate = (stateCompleted / stateTotal) * 100;
                
                return (
                  <div key={state} className="border rounded-lg p-3" data-testid={`mate-state-${state}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{state}</span>
                        <Badge variant="outline" className="text-xs">
                          {stateCompleted}/{stateTotal}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stateRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={stateRate} className="h-1.5 mb-2" />
                    
                    {/* Individual DEAs in this state */}
                    <div className="space-y-1 mt-2">
                      {registrations.slice(0, 3).map(dea => {
                        const status = getComplianceStatus(dea);
                        const physicianName = physicianMap?.get(dea.physicianId);
                        
                        return (
                          <div
                            key={dea.id}
                            className="flex items-center justify-between text-xs py-1"
                            data-testid={`mate-dea-${dea.id}`}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <span className="text-muted-foreground">
                                {physicianName || 'Unknown'} - {dea.deaNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {dea.mateAttested ? (
                                <span className="text-green-600">
                                  Completed
                                </span>
                              ) : (
                                <>
                                  {getStatusBadge(status)}
                                  {onUpdateTraining && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs"
                                      onClick={() => onUpdateTraining(dea.id)}
                                      data-testid={`button-update-mate-${dea.id}`}
                                    >
                                      Update
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {registrations.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-6">
                          +{registrations.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Compliance Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">MATE Act Requirements</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>8 hours of training on treating patients with opioid or substance use disorders</li>
                <li>Required for all DEA registrations issued or renewed after June 27, 2023</li>
                <li>One-time training requirement (does not need renewal)</li>
                <li>Training must be from accredited organizations</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
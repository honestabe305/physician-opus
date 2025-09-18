import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar, AlertCircle, CheckCircle, Shield, FileKey } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { type SelectDeaRegistration, type SelectCsrLicense } from "../../shared/schema";

interface TimelineItem {
  id: string;
  type: 'dea' | 'csr';
  state: string;
  registrationNumber: string;
  expirationDate: Date;
  daysUntil: number;
  physicianName?: string;
  status: 'expired' | 'critical' | 'warning' | 'info' | 'active';
}

interface DeaCsrTimelineProps {
  deaRegistrations: SelectDeaRegistration[];
  csrLicenses: SelectCsrLicense[];
  physicianMap?: Map<string, string>;
  onItemClick?: (type: 'dea' | 'csr', id: string) => void;
}

export function DeaCsrTimeline({
  deaRegistrations,
  csrLicenses,
  physicianMap,
  onItemClick
}: DeaCsrTimelineProps) {
  const today = new Date();

  // Create timeline items from DEA registrations and CSR licenses
  const timelineItems: TimelineItem[] = [
    ...deaRegistrations.map(dea => {
      const daysUntil = differenceInDays(new Date(dea.expireDate), today);
      let status: TimelineItem['status'] = 'active';
      if (daysUntil < 0) status = 'expired';
      else if (daysUntil <= 7) status = 'critical';
      else if (daysUntil <= 30) status = 'warning';
      else if (daysUntil <= 90) status = 'info';
      
      return {
        id: dea.id,
        type: 'dea' as const,
        state: dea.state,
        registrationNumber: dea.deaNumber,
        expirationDate: new Date(dea.expireDate),
        daysUntil,
        physicianName: physicianMap?.get(dea.physicianId),
        status
      };
    }),
    ...csrLicenses.map(csr => {
      const daysUntil = differenceInDays(new Date(csr.expireDate), today);
      let status: TimelineItem['status'] = 'active';
      if (daysUntil < 0) status = 'expired';
      else if (daysUntil <= 7) status = 'critical';
      else if (daysUntil <= 30) status = 'warning';
      else if (daysUntil <= 90) status = 'info';
      
      return {
        id: csr.id,
        type: 'csr' as const,
        state: csr.state,
        registrationNumber: csr.csrNumber,
        expirationDate: new Date(csr.expireDate),
        daysUntil,
        physicianName: physicianMap?.get(csr.physicianId),
        status
      };
    })
  ];

  // Sort by days until expiration
  timelineItems.sort((a, b) => a.daysUntil - b.daysUntil);

  const getStatusColor = (status: TimelineItem['status']) => {
    switch (status) {
      case 'expired': return 'destructive';
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      case 'info': return 'secondary';
      default: return 'success';
    }
  };

  const getStatusIcon = (status: TimelineItem['status']) => {
    switch (status) {
      case 'expired':
      case 'critical':
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTimelineLabel = (daysUntil: number) => {
    if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} days ago`;
    if (daysUntil === 0) return 'Expires today';
    if (daysUntil === 1) return 'Expires tomorrow';
    if (daysUntil <= 7) return `Expires in ${daysUntil} days`;
    if (daysUntil <= 30) return `Expires in ${Math.round(daysUntil / 7)} weeks`;
    if (daysUntil <= 90) return `Expires in ${Math.round(daysUntil / 30)} months`;
    return `Expires in ${Math.round(daysUntil / 30)} months`;
  };

  const milestones = [1, 7, 30, 60, 90];
  const upcomingMilestones = milestones.map(days => ({
    days,
    date: addDays(today, days),
    items: timelineItems.filter(item => 
      item.daysUntil >= days - 1 && item.daysUntil <= days + 1
    )
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Renewal Timeline
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upcoming expirations and renewal milestones
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Critical Items First */}
            {timelineItems.filter(item => item.status === 'expired' || item.status === 'critical').length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-destructive mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Immediate Action Required
                </h3>
                <div className="space-y-2">
                  {timelineItems
                    .filter(item => item.status === 'expired' || item.status === 'critical')
                    .map(item => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                        onClick={() => onItemClick?.(item.type, item.id)}
                        data-testid={`timeline-item-${item.type}-${item.id}`}
                      >
                        <div className="mt-1">
                          {item.type === 'dea' ? (
                            <Shield className="h-4 w-4 text-destructive" />
                          ) : (
                            <FileKey className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {item.type.toUpperCase()} - {item.state}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {getTimelineLabel(item.daysUntil)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.physicianName} • #{item.registrationNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires: {format(item.expirationDate, "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Milestone Sections */}
            {upcomingMilestones.map(milestone => {
              if (milestone.items.length === 0) return null;
              return (
                <div key={milestone.days}>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {milestone.days} Day Milestone - {format(milestone.date, "MMM d, yyyy")}
                  </h3>
                  <div className="space-y-2">
                    {milestone.items.map(item => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => onItemClick?.(item.type, item.id)}
                        data-testid={`timeline-milestone-${milestone.days}-${item.type}-${item.id}`}
                      >
                        <div className="mt-1">
                          {item.type === 'dea' ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <FileKey className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {item.type.toUpperCase()} - {item.state}
                            </span>
                            <Badge variant={getStatusColor(item.status) as any} className="text-xs">
                              {getTimelineLabel(item.daysUntil)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.physicianName} • #{item.registrationNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* All Other Items */}
            {timelineItems.filter(item => item.status === 'active' || item.status === 'info').length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  Upcoming Renewals
                </h3>
                <div className="space-y-2">
                  {timelineItems
                    .filter(item => item.status === 'active' || item.status === 'info')
                    .slice(0, 10)
                    .map(item => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => onItemClick?.(item.type, item.id)}
                        data-testid={`timeline-upcoming-${item.type}-${item.id}`}
                      >
                        <div className="mt-1">
                          {item.type === 'dea' ? (
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileKey className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {item.type.toUpperCase()} - {item.state}
                            </span>
                            <Badge variant={getStatusColor(item.status) as any} className="text-xs">
                              {getTimelineLabel(item.daysUntil)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.physicianName} • #{item.registrationNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires: {format(item.expirationDate, "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
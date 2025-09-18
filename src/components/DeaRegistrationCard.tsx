import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Calendar, MapPin, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { type SelectDeaRegistration } from "../../shared/schema";

interface DeaRegistrationCardProps {
  registration: SelectDeaRegistration;
  physicianName?: string;
  onRenew?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function DeaRegistrationCard({
  registration,
  physicianName,
  onRenew,
  onViewDetails
}: DeaRegistrationCardProps) {
  const getStatusColor = () => {
    if (registration.status === 'expired') return 'destructive';
    
    const daysUntilExpiration = differenceInDays(
      new Date(registration.expireDate),
      new Date()
    );
    
    if (daysUntilExpiration < 0) return 'destructive';
    if (daysUntilExpiration <= 30) return 'destructive';
    if (daysUntilExpiration <= 90) return 'warning';
    return 'success';
  };

  const getStatusLabel = () => {
    const daysUntilExpiration = differenceInDays(
      new Date(registration.expireDate),
      new Date()
    );
    
    if (registration.status === 'expired' || daysUntilExpiration < 0) {
      return 'Expired';
    }
    if (daysUntilExpiration <= 30) return 'Expiring Soon';
    if (daysUntilExpiration <= 90) return 'Renewal Required';
    return 'Active';
  };

  const daysUntilExpiration = differenceInDays(
    new Date(registration.expireDate),
    new Date()
  );

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`dea-card-${registration.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            DEA Registration
          </CardTitle>
          <Badge variant={getStatusColor() as any} data-testid={`dea-status-${registration.id}`}>
            {getStatusLabel()}
          </Badge>
        </div>
        {physicianName && (
          <p className="text-sm text-muted-foreground mt-1">{physicianName}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              State
            </span>
            <span className="font-medium" data-testid={`dea-state-${registration.id}`}>
              {registration.state}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Registration #</span>
            <span className="font-mono font-medium" data-testid={`dea-number-${registration.id}`}>
              {registration.deaNumber}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Issue Date
            </span>
            <span className="text-sm">
              {format(new Date(registration.issueDate), "MMM d, yyyy")}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires
            </span>
            <span className={`text-sm font-medium ${
              daysUntilExpiration <= 90 ? 'text-destructive' : ''
            }`}>
              {format(new Date(registration.expireDate), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">MATE Training</span>
            <div className="flex items-center gap-1">
              {registration.mateAttested ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600" data-testid={`mate-status-${registration.id}`}>
                    Completed
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600" data-testid={`mate-status-${registration.id}`}>
                    Required
                  </span>
                </>
              )}
            </div>
          </div>
          
          {registration.mateAttested && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MATE Status</span>
              <span className="text-sm">
                Attested
              </span>
            </div>
          )}
        </div>

        {daysUntilExpiration <= 90 && daysUntilExpiration > 0 && (
          <>
            <Separator />
            <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">
                  {daysUntilExpiration} days until expiration
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-3">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(registration.id)}
            data-testid={`button-view-dea-${registration.id}`}
          >
            <FileText className="h-4 w-4 mr-1" />
            Details
          </Button>
        )}
        {onRenew && (daysUntilExpiration <= 90 || registration.status === 'expired') && (
          <Button
            size="sm"
            onClick={() => onRenew(registration.id)}
            data-testid={`button-renew-dea-${registration.id}`}
          >
            Renew Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
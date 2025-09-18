import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileKey, Calendar, MapPin, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { type SelectCsrLicense } from "../../shared/schema";

interface CsrLicenseCardProps {
  license: SelectCsrLicense;
  physicianName?: string;
  onRenew?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onViewRequirements?: (state: string) => void;
}

export function CsrLicenseCard({
  license,
  physicianName,
  onRenew,
  onViewDetails,
  onViewRequirements
}: CsrLicenseCardProps) {
  const getStatusColor = () => {
    if (license.status === 'expired') return 'destructive';
    
    const daysUntilExpiration = differenceInDays(
      new Date(license.expireDate),
      new Date()
    );
    
    if (daysUntilExpiration < 0) return 'destructive';
    if (daysUntilExpiration <= 30) return 'destructive';
    if (daysUntilExpiration <= 90) return 'warning';
    return 'success';
  };

  const getStatusLabel = () => {
    const daysUntilExpiration = differenceInDays(
      new Date(license.expireDate),
      new Date()
    );
    
    if (license.status === 'expired' || daysUntilExpiration < 0) {
      return 'Expired';
    }
    if (daysUntilExpiration <= 30) return 'Expiring Soon';
    if (daysUntilExpiration <= 90) return 'Renewal Required';
    return 'Active';
  };

  const daysUntilExpiration = differenceInDays(
    new Date(license.expireDate),
    new Date()
  );

  const getRenewalCycleLabel = () => {
    return license.renewalCycle === 'annual' ? 'Annual' : 'Biennial';
  };

  const getStateBoardUrl = (state: string) => {
    const urls: Record<string, string> = {
      'CA': 'https://www.pharmacy.ca.gov/',
      'NY': 'https://www.op.nysed.gov/professions/pharmacy',
      'TX': 'https://www.pharmacy.texas.gov/',
      'FL': 'https://floridaspharmacy.gov/',
      'IL': 'https://www.idfpr.com/profs/pharm.asp',
      'PA': 'https://www.dos.pa.gov/ProfessionalLicensing/BoardsCommissions/Pharmacy/',
      'OH': 'https://www.pharmacy.ohio.gov/',
      'GA': 'https://gbp.georgia.gov/',
      'NC': 'https://ncbop.org/',
      'MI': 'https://www.michigan.gov/lara/bureau-list/bpl/occ/prof/pharmacy'
    };
    return urls[state.toUpperCase()] || '#';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`csr-card-${license.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileKey className="h-5 w-5 text-primary" />
            CSR License
          </CardTitle>
          <Badge variant={getStatusColor() as any} data-testid={`csr-status-${license.id}`}>
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
            <div className="flex items-center gap-2">
              <span className="font-medium" data-testid={`csr-state-${license.id}`}>
                {license.state}
              </span>
              <a
                href={getStateBoardUrl(license.state)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
                data-testid={`csr-board-link-${license.id}`}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">License #</span>
            <span className="font-mono font-medium" data-testid={`csr-number-${license.id}`}>
              {license.csrNumber}
            </span>
          </div>

          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Issue Date
            </span>
            <span className="text-sm">
              {format(new Date(license.issueDate), "MMM d, yyyy")}
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
              {format(new Date(license.expireDate), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Renewal Cycle
            </span>
            <Badge variant="secondary" className="text-xs">
              {getRenewalCycleLabel()}
            </Badge>
          </div>
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
        {onViewRequirements && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewRequirements(license.state)}
            data-testid={`button-requirements-${license.id}`}
          >
            Requirements
          </Button>
        )}
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(license.id)}
            data-testid={`button-view-csr-${license.id}`}
          >
            Details
          </Button>
        )}
        {onRenew && (daysUntilExpiration <= 90 || license.status === 'expired') && (
          <Button
            size="sm"
            onClick={() => onRenew(license.id)}
            data-testid={`button-renew-csr-${license.id}`}
          >
            Renew Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
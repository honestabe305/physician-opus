import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, UserCheck, AlertTriangle, TrendingUp, FileText, Clock } from 'lucide-react';

interface ProviderMetrics {
  role: 'physician' | 'pa' | 'np';
  total: number;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
  avgLicensesPerProvider: number;
  expiringWithin30Days: number;
}

interface ProviderMetricsCardProps {
  metrics: ProviderMetrics[];
  title?: string;
  description?: string;
}

export function ProviderMetricsCard({ 
  metrics, 
  title = "Provider Metrics", 
  description = "Key performance indicators by provider role"
}: ProviderMetricsCardProps) {
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'physician': return 'Physicians';
      case 'pa': return 'Physician Assistants';
      case 'np': return 'Nurse Practitioners';
      default: return role.toUpperCase();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'physician': return <Users className="h-5 w-5" />;
      case 'pa': return <UserCheck className="h-5 w-5" />;
      case 'np': return <FileText className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-700">Excellent</Badge>;
    if (rate >= 70) return <Badge className="bg-yellow-100 text-yellow-700">Good</Badge>;
    return <Badge className="bg-red-100 text-red-700">Needs Improvement</Badge>;
  };

  const totalProviders = metrics.reduce((sum, m) => sum + m.total, 0);
  const totalCompliant = metrics.reduce((sum, m) => sum + m.compliant, 0);
  const overallComplianceRate = totalProviders > 0 ? (totalCompliant / totalProviders) * 100 : 0;
  const totalExpiring = metrics.reduce((sum, m) => sum + m.expiringWithin30Days, 0);

  return (
    <div className="space-y-4" data-testid="provider-metrics-card">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                Total Providers
              </div>
              <div className="text-2xl font-bold">{totalProviders}</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <UserCheck className="h-4 w-4" />
                Compliant
              </div>
              <div className="text-2xl font-bold text-green-600">{totalCompliant}</div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Overall Compliance
              </div>
              <div className={`text-2xl font-bold ${getComplianceColor(overallComplianceRate)}`}>
                {overallComplianceRate.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Expiring Soon
              </div>
              <div className="text-2xl font-bold text-yellow-600">{totalExpiring}</div>
            </div>
          </div>

          <div className="space-y-4">
            {metrics.map((metric) => (
              <Card key={metric.role} className="border-l-4" style={{
                borderLeftColor: metric.complianceRate >= 90 ? '#22c55e' : 
                               metric.complianceRate >= 70 ? '#eab308' : '#ef4444'
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getRoleIcon(metric.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{getRoleLabel(metric.role)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {metric.total} total providers
                        </p>
                      </div>
                    </div>
                    {getComplianceBadge(metric.complianceRate)}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Compliance Rate</span>
                        <span className={`font-medium ${getComplianceColor(metric.complianceRate)}`}>
                          {metric.complianceRate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={metric.complianceRate} 
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Compliant:</span>
                        <span className="ml-2 font-medium">{metric.compliant}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Non-Compliant:</span>
                        <span className="ml-2 font-medium">{metric.nonCompliant}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg. Licenses:</span>
                        <span className="ml-2 font-medium">
                          {metric.avgLicensesPerProvider.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expiring Soon:</span>
                        <span className="ml-2 font-medium text-yellow-600">
                          {metric.expiringWithin30Days}
                        </span>
                      </div>
                    </div>

                    {metric.expiringWithin30Days > 0 && (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-500">
                          {metric.expiringWithin30Days} licenses expiring within 30 days
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
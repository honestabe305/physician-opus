import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, FileText } from 'lucide-react';

interface ExpirationForecastData {
  period: string;
  days: number;
  licenses: number;
  deaRegistrations: number;
  csrLicenses: number;
  certifications: number;
  total: number;
}

interface ExpirationForecastChartProps {
  data: ExpirationForecastData[];
  title?: string;
  description?: string;
  onDrillDown?: (period: string, type: string) => void;
}

export function ExpirationForecastChart({ 
  data, 
  title = "Expiration Forecast", 
  description = "Upcoming credential expirations",
  onDrillDown
}: ExpirationForecastChartProps) {
  
  const urgentExpirations = data.find(d => d.days === 30)?.total || 0;
  const totalExpirations = data.reduce((sum, item) => sum + item.total, 0);

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return 'text-red-600';
    if (days <= 60) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 30) return <Badge variant="destructive">Urgent</Badge>;
    if (days <= 60) return <Badge className="bg-yellow-500">Warning</Badge>;
    return <Badge variant="secondary">Monitor</Badge>;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <p className="font-semibold">{label}</p>
            {getUrgencyBadge(data.days)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Licenses:</span>
              <span className="font-medium">{data.licenses}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">DEA Registrations:</span>
              <span className="font-medium">{data.deaRegistrations}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">CSR Licenses:</span>
              <span className="font-medium">{data.csrLicenses}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Certifications:</span>
              <span className="font-medium">{data.certifications}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between gap-4">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-primary">{data.total}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full" data-testid="chart-expiration-forecast">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              Total: {totalExpirations}
            </Badge>
          </div>
        </div>
        
        {urgentExpirations > 0 && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{urgentExpirations} credentials</strong> expiring within 30 days require immediate attention.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {data.map((item) => (
            <div 
              key={item.period}
              className="bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => onDrillDown?.(item.period, 'all')}
              data-testid={`forecast-card-${item.days}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${getUrgencyColor(item.days)}`} />
                  <span className="text-sm font-medium">{item.period}</span>
                </div>
                {getUrgencyBadge(item.days)}
              </div>
              <div className="text-2xl font-bold mb-1">{item.total}</div>
              <div className="text-xs text-muted-foreground">
                {item.licenses > 0 && `${item.licenses} licenses`}
                {item.deaRegistrations > 0 && `, ${item.deaRegistrations} DEA`}
              </div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="licenses" 
              stackId="1"
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.6}
              name="Licenses"
            />
            <Area 
              type="monotone" 
              dataKey="deaRegistrations" 
              stackId="1"
              stroke="#22c55e" 
              fill="#22c55e" 
              fillOpacity={0.6}
              name="DEA Registrations"
            />
            <Area 
              type="monotone" 
              dataKey="csrLicenses" 
              stackId="1"
              stroke="#eab308" 
              fill="#eab308" 
              fillOpacity={0.6}
              name="CSR Licenses"
            />
            <Area 
              type="monotone" 
              dataKey="certifications" 
              stackId="1"
              stroke="#ef4444" 
              fill="#ef4444" 
              fillOpacity={0.6}
              name="Certifications"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
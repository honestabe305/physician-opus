import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText, Shield } from 'lucide-react';

interface LicenseDistributionData {
  category: string;
  value: number;
  percentage: number;
  subcategories?: Record<string, number>;
}

interface LicenseDistributionChartProps {
  byState: LicenseDistributionData[];
  byType: LicenseDistributionData[];
  byStatus: LicenseDistributionData[];
  title?: string;
  description?: string;
}

const COLORS = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#eab308', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#6366f1', // Indigo
];

export function LicenseDistributionChart({ 
  byState, 
  byType, 
  byStatus,
  title = "License Distribution", 
  description = "Breakdown of licenses across different categories"
}: LicenseDistributionChartProps) {

  const renderCustomLabel = (entry: any) => {
    return `${entry.category}: ${entry.percentage.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            Count: {data.value}
          </p>
          <p className="text-sm font-medium">
            Percentage: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const StatusLabel = ({ status }: { status: string }) => {
    const getStatusVariant = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active': return 'default';
        case 'expired': return 'destructive';
        case 'pending_renewal': return 'secondary';
        default: return 'outline';
      }
    };
    
    return (
      <Badge variant={getStatusVariant(status)}>
        {status}
      </Badge>
    );
  };

  const renderPieChart = (data: LicenseDistributionData[], type: string) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const topItems = data.slice(0, 10); // Show top 10 items
    const hasMore = data.length > 10;
    
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Total: {total} licenses
          </div>
          {hasMore && (
            <Badge variant="outline">
              Showing top 10 of {data.length}
            </Badge>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={topItems}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={renderCustomLabel}
            >
              {topItems.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend as a list for better readability */}
        <div className="mt-4 max-h-40 overflow-y-auto">
          {topItems.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between py-1 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-muted-foreground">{item.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.value}</span>
                <span className="text-muted-foreground">({item.percentage.toFixed(1)}%)</span>
                {type === 'status' && <StatusLabel status={item.category} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full" data-testid="chart-license-distribution">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="state" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="state" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              By State
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              By Type
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              By Status
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="state" className="mt-4">
            {byState.length > 0 ? (
              renderPieChart(byState, 'state')
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No state distribution data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="type" className="mt-4">
            {byType.length > 0 ? (
              renderPieChart(byType, 'type')
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No type distribution data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="status" className="mt-4">
            {byStatus.length > 0 ? (
              renderPieChart(byStatus, 'status')
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No status distribution data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface RenewalTrendData {
  period: string;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
}

interface RenewalTrendChartProps {
  data: RenewalTrendData[];
  title?: string;
  description?: string;
  onPeriodChange?: (period: string) => void;
}

export function RenewalTrendChart({ 
  data, 
  title = "Renewal Trends", 
  description = "Success rate over time",
  onPeriodChange 
}: RenewalTrendChartProps) {
  const [viewMode, setViewMode] = useState<'count' | 'rate'>('count');
  
  const currentSuccessRate = data.length > 0 ? data[data.length - 1].successRate : 0;
  const previousSuccessRate = data.length > 1 ? data[data.length - 2].successRate : currentSuccessRate;
  const trend = currentSuccessRate - previousSuccessRate;

  const totalRenewals = data.reduce((sum, item) => sum + item.successful + item.failed + item.pending, 0);
  const avgSuccessRate = data.length > 0 
    ? data.reduce((sum, item) => sum + item.successRate, 0) / data.length 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">Successful: {data.successful}</p>
            <p className="text-red-600">Failed: {data.failed}</p>
            <p className="text-yellow-600">Pending: {data.pending}</p>
            <p className="font-medium mt-2 border-t pt-2">
              Success Rate: {data.successRate.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full" data-testid="chart-renewal-trend">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-[140px]" data-testid="select-view-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Count View</SelectItem>
              <SelectItem value="rate">Rate View</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              Current Rate
            </div>
            <div className="text-2xl font-bold text-primary">
              {currentSuccessRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              {trend > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{trend.toFixed(1)}%</span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{trend.toFixed(1)}%</span>
                </>
              ) : (
                <span className="text-muted-foreground">No change</span>
              )}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Average Rate</div>
            <div className="text-2xl font-bold">
              {avgSuccessRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Total Processed</div>
            <div className="text-2xl font-bold">
              {totalRenewals}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {viewMode === 'count' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="successful" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Successful"
                dot={{ fill: '#22c55e' }}
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Failed"
                dot={{ fill: '#ef4444' }}
              />
              <Line 
                type="monotone" 
                dataKey="pending" 
                stroke="#eab308" 
                strokeWidth={2}
                name="Pending"
                dot={{ fill: '#eab308' }}
              />
            </LineChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value: any) => `${value.toFixed(1)}%`}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="successRate" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Success Rate"
                dot={{ fill: '#3b82f6', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ComplianceData {
  category: string;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
}

interface ComplianceChartProps {
  data: ComplianceData[];
  title: string;
  description?: string;
  showTrend?: boolean;
  previousRate?: number;
}

export function ComplianceChart({ data, title, description, showTrend = true, previousRate }: ComplianceChartProps) {
  const overallRate = data.length > 0
    ? data.reduce((sum, item) => sum + item.complianceRate, 0) / data.length
    : 0;

  const getColor = (value: number) => {
    if (value >= 90) return '#22c55e'; // Green
    if (value >= 70) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const formatData = data.map(item => ({
    ...item,
    'Compliance Rate': item.complianceRate,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">
            Compliant: {data.compliant}
          </p>
          <p className="text-sm text-muted-foreground">
            Non-Compliant: {data.nonCompliant}
          </p>
          <p className="text-sm font-medium">
            Rate: {data.complianceRate.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const trend = previousRate ? overallRate - previousRate : 0;

  return (
    <Card className="w-full" data-testid="chart-compliance">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: getColor(overallRate) }}>
              {overallRate.toFixed(1)}%
            </div>
            {showTrend && previousRate !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {trend > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">+{trend.toFixed(1)}%</span>
                  </>
                ) : trend < 0 ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">{trend.toFixed(1)}%</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">No change</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              fontSize={12}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="Compliance Rate" 
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex gap-4 justify-center">
          <Badge variant="outline" className="bg-green-50">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            ≥90% Compliant
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
            70-89% Warning
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            &lt;70% Critical
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
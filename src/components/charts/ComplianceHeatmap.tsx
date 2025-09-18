import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Building2, Activity } from 'lucide-react';

interface HeatmapData {
  category: string;
  compliant: number;
  nonCompliant: number;
  complianceRate: number;
}

interface ComplianceHeatmapProps {
  byDepartment: HeatmapData[];
  byState?: HeatmapData[];
  bySpecialty?: HeatmapData[];
  title?: string;
  description?: string;
  onCellClick?: (category: string, type: string) => void;
}

export function ComplianceHeatmap({ 
  byDepartment,
  byState,
  bySpecialty,
  title = "Compliance Heatmap", 
  description = "Visual representation of compliance across different dimensions",
  onCellClick
}: ComplianceHeatmapProps) {

  const getHeatmapColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500 hover:bg-green-600';
    if (rate >= 80) return 'bg-green-400 hover:bg-green-500';
    if (rate >= 70) return 'bg-yellow-400 hover:bg-yellow-500';
    if (rate >= 60) return 'bg-yellow-500 hover:bg-yellow-600';
    if (rate >= 50) return 'bg-orange-400 hover:bg-orange-500';
    if (rate >= 40) return 'bg-orange-500 hover:bg-orange-600';
    if (rate >= 30) return 'bg-red-400 hover:bg-red-500';
    return 'bg-red-500 hover:bg-red-600';
  };

  const getTextColor = (rate: number) => {
    return rate >= 50 ? 'text-white' : 'text-white';
  };

  const renderHeatmapGrid = (data: HeatmapData[], type: string) => {
    if (data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No data available
        </div>
      );
    }

    // Sort data by compliance rate for better visualization
    const sortedData = [...data].sort((a, b) => b.complianceRate - a.complianceRate);

    return (
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Average Compliance</div>
            <div className="text-2xl font-bold">
              {(sortedData.reduce((sum, item) => sum + item.complianceRate, 0) / sortedData.length).toFixed(1)}%
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Fully Compliant</div>
            <div className="text-2xl font-bold text-green-600">
              {sortedData.filter(item => item.complianceRate === 100).length}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Below 70%</div>
            <div className="text-2xl font-bold text-red-600">
              {sortedData.filter(item => item.complianceRate < 70).length}
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sortedData.map((item) => (
            <div
              key={item.category}
              className={`${getHeatmapColor(item.complianceRate)} ${getTextColor(item.complianceRate)} 
                         rounded-lg p-4 cursor-pointer transition-all duration-200 transform hover:scale-105`}
              onClick={() => onCellClick?.(item.category, type)}
              data-testid={`heatmap-cell-${item.category}`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-sm truncate" title={item.category}>
                  {item.category}
                </div>
                <div className="text-2xl font-bold">
                  {item.complianceRate.toFixed(0)}%
                </div>
                <div className="text-xs opacity-90">
                  {item.compliant}/{item.compliant + item.nonCompliant}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium mb-3">Compliance Scale</div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            <div className="text-center">
              <div className="w-full h-8 bg-green-500 rounded mb-1"></div>
              <div className="text-xs">≥90%</div>
            </div>
            <div className="text-center">
              <div className="w-full h-8 bg-green-400 rounded mb-1"></div>
              <div className="text-xs">80-89%</div>
            </div>
            <div className="text-center">
              <div className="w-full h-8 bg-yellow-400 rounded mb-1"></div>
              <div className="text-xs">70-79%</div>
            </div>
            <div className="text-center">
              <div className="w-full h-8 bg-yellow-500 rounded mb-1"></div>
              <div className="text-xs">60-69%</div>
            </div>
            <div className="text-center">
              <div className="w-full h-8 bg-orange-400 rounded mb-1"></div>
              <div className="text-xs">50-59%</div>
            </div>
            <div className="text-center">
              <div className="w-full h-8 bg-orange-500 rounded mb-1"></div>
              <div className="text-xs">40-49%</div>
            </div>
            <div className="text-center">
              <div className="w-full h-8 bg-red-400 rounded mb-1"></div>
              <div className="text-xs">30-39%</div>
            </div>
            <div className="text-center">
              <div className="w-full h-8 bg-red-500 rounded mb-1"></div>
              <div className="text-xs">&lt;30%</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full" data-testid="chart-compliance-heatmap">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {(byState || bySpecialty) ? (
          <Tabs defaultValue="department" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="department" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department
              </TabsTrigger>
              {byState && (
                <TabsTrigger value="state" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  State
                </TabsTrigger>
              )}
              {bySpecialty && (
                <TabsTrigger value="specialty" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Specialty
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="department" className="mt-4">
              {renderHeatmapGrid(byDepartment, 'department')}
            </TabsContent>
            
            {byState && (
              <TabsContent value="state" className="mt-4">
                {renderHeatmapGrid(byState, 'state')}
              </TabsContent>
            )}
            
            {bySpecialty && (
              <TabsContent value="specialty" className="mt-4">
                {renderHeatmapGrid(bySpecialty, 'specialty')}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          renderHeatmapGrid(byDepartment, 'department')
        )}
      </CardContent>
    </Card>
  );
}
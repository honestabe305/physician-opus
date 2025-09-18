import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface MetricSummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number;
  trendLabel?: string;
  icon?: LucideIcon;
  status?: 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  className?: string;
}

export function MetricSummaryCard({
  title,
  value,
  description,
  trend,
  trendLabel,
  icon: Icon,
  status = 'info',
  onClick,
  className = ''
}: MetricSummaryCardProps) {
  
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'danger': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'danger': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'success': return 'border-green-200 dark:border-green-800';
      case 'warning': return 'border-yellow-200 dark:border-yellow-800';
      case 'danger': return 'border-red-200 dark:border-red-800';
      default: return 'border-blue-200 dark:border-blue-800';
    }
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    } else if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) {
      return 'text-gray-500';
    } else if (trend > 0) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const formatTrend = () => {
    if (trend === undefined) return '';
    if (trend === 0) return 'No change';
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${getBorderColor()} ${className}`}
      onClick={onClick}
      data-testid="metric-summary-card"
    >
      <CardContent className="p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }} />
        </div>

        {/* Content */}
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`p-2 rounded-lg ${getStatusBg()}`}>
                  <Icon className={`h-5 w-5 ${getStatusColor()}`} />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold tracking-tight">
              {typeof value === 'number' && value >= 1000 
                ? `${(value / 1000).toFixed(1)}k`
                : value}
            </div>
            
            {trend !== undefined && (
              <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span>{formatTrend()}</span>
                </div>
                {trendLabel && (
                  <span className="text-xs text-muted-foreground">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator Line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${getStatusBg()}`}>
          <div 
            className={`h-full transition-all duration-1000 ${
              status === 'success' ? 'bg-green-500' :
              status === 'warning' ? 'bg-yellow-500' :
              status === 'danger' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{ 
              width: typeof value === 'number' ? `${Math.min(100, (value / 100) * 100)}%` : '100%',
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
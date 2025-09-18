import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineItem {
  status: string;
  date: Date | string | null;
  description: string;
  completed: boolean;
}

interface RenewalTimelineProps {
  timeline: TimelineItem[];
  currentStatus?: string;
}

export function RenewalTimeline({ timeline, currentStatus }: RenewalTimelineProps) {
  const getIcon = (item: TimelineItem) => {
    if (item.status === 'rejected') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (item.status === 'expired') {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    if (item.completed) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (item.status === currentStatus) {
      return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
    }
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getLineColor = (item: TimelineItem, index: number) => {
    if (item.status === 'rejected' || item.status === 'expired') {
      return 'bg-red-200';
    }
    if (item.completed) {
      return 'bg-green-200';
    }
    if (index === 0 || timeline[index - 1]?.completed) {
      return 'bg-blue-200';
    }
    return 'bg-gray-200';
  };

  const getTextColor = (item: TimelineItem) => {
    if (item.status === 'rejected' || item.status === 'expired') {
      return 'text-red-700';
    }
    if (item.completed) {
      return 'text-green-700';
    }
    if (item.status === currentStatus) {
      return 'text-blue-700';
    }
    return 'text-gray-500';
  };

  return (
    <Card data-testid="card-renewal-timeline">
      <CardHeader>
        <CardTitle>Renewal Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {timeline.map((item, index) => (
            <div key={index} className="flex gap-4 pb-8 relative">
              {/* Vertical line */}
              {index < timeline.length - 1 && (
                <div
                  className={cn(
                    "absolute left-2.5 top-8 w-0.5 h-full",
                    getLineColor(item, index)
                  )}
                />
              )}
              
              {/* Icon */}
              <div className="flex-shrink-0 z-10 bg-white">
                {getIcon(item)}
              </div>
              
              {/* Content */}
              <div className="flex-1 -mt-0.5">
                <div className={cn("font-medium text-sm", getTextColor(item))}>
                  {item.description}
                </div>
                {item.date && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(
                      typeof item.date === 'string' ? new Date(item.date) : item.date,
                      'MMMM dd, yyyy'
                    )}
                  </div>
                )}
                {item.status === currentStatus && !item.completed && (
                  <div className="inline-flex items-center gap-1 mt-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Current Stage
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
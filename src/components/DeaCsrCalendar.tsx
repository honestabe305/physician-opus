import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, Shield, FileKey, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";
import { useState } from "react";
import { type SelectDeaRegistration, type SelectCsrLicense } from "../../shared/schema";

interface CalendarEvent {
  id: string;
  type: 'dea' | 'csr';
  date: Date;
  state: string;
  registrationNumber: string;
  physicianName?: string;
  status: 'expired' | 'critical' | 'warning' | 'upcoming';
}

interface DeaCsrCalendarProps {
  deaRegistrations: SelectDeaRegistration[];
  csrLicenses: SelectCsrLicense[];
  physicianMap?: Map<string, string>;
  onEventClick?: (type: 'dea' | 'csr', id: string) => void;
}

export function DeaCsrCalendar({
  deaRegistrations,
  csrLicenses,
  physicianMap,
  onEventClick
}: DeaCsrCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Convert DEA and CSR data to calendar events
  const events: CalendarEvent[] = [
    ...deaRegistrations.map(dea => {
      const expireDate = new Date(dea.expireDate);
      const daysUntil = Math.floor((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: CalendarEvent['status'] = 'upcoming';
      if (daysUntil < 0) status = 'expired';
      else if (daysUntil <= 7) status = 'critical';
      else if (daysUntil <= 30) status = 'warning';
      
      return {
        id: dea.id,
        type: 'dea' as const,
        date: expireDate,
        state: dea.state,
        registrationNumber: dea.deaNumber,
        physicianName: physicianMap?.get(dea.physicianId),
        status
      };
    }),
    ...csrLicenses.map(csr => {
      const expireDate = new Date(csr.expireDate);
      const daysUntil = Math.floor((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: CalendarEvent['status'] = 'upcoming';
      if (daysUntil < 0) status = 'expired';
      else if (daysUntil <= 7) status = 'critical';
      else if (daysUntil <= 30) status = 'warning';
      
      return {
        id: csr.id,
        type: 'csr' as const,
        date: expireDate,
        state: csr.state,
        registrationNumber: csr.csrNumber,
        physicianName: physicianMap?.get(csr.physicianId),
        status
      };
    })
  ];

  // Get calendar days for current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - getDay(monthStart));
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - getDay(monthEnd)));
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by day
  const eventsByDay = new Map<string, CalendarEvent[]>();
  events.forEach(event => {
    const dateKey = format(event.date, 'yyyy-MM-dd');
    if (!eventsByDay.has(dateKey)) {
      eventsByDay.set(dateKey, []);
    }
    eventsByDay.get(dateKey)?.push(event);
  });

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'expired': return 'bg-red-500';
      case 'critical': return 'bg-red-400';
      case 'warning': return 'bg-yellow-400';
      default: return 'bg-blue-400';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Renewal Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              data-testid="button-today"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-lg font-medium mt-2">{format(currentDate, 'MMMM yyyy')}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" />
              <span>DEA</span>
            </div>
            <div className="flex items-center gap-1">
              <FileKey className="h-3 w-3 text-primary" />
              <span>CSR</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Expired/Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span>Upcoming</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Week days header */}
            <div className="grid grid-cols-7 bg-muted/50">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDay.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border-r border-b last:border-r-0 ${
                      !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
                    } ${isToday ? 'bg-primary/5' : ''}`}
                    data-testid={`calendar-day-${dateKey}`}
                  >
                    <div className="font-medium text-sm mb-1">
                      {format(day, 'd')}
                    </div>
                    
                    {dayEvents.length > 0 && (
                      <ScrollArea className="h-[60px]">
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <TooltipProvider key={event.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`flex items-center gap-1 p-1 rounded cursor-pointer hover:opacity-80 ${getEventColor(event.status)} text-white text-xs`}
                                    onClick={() => onEventClick?.(event.type, event.id)}
                                    data-testid={`calendar-event-${event.id}`}
                                  >
                                    {event.type === 'dea' ? (
                                      <Shield className="h-3 w-3 flex-shrink-0" />
                                    ) : (
                                      <FileKey className="h-3 w-3 flex-shrink-0" />
                                    )}
                                    <span className="truncate">
                                      {event.state}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs space-y-1">
                                    <p className="font-medium">
                                      {event.type.toUpperCase()} - {event.state}
                                    </p>
                                    <p>{event.physicianName || 'Unknown'}</p>
                                    <p>#{event.registrationNumber}</p>
                                    <p>Expires: {format(event.date, 'MMM d, yyyy')}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-center text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events Summary */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">This Month's Expirations</h3>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {events
                  .filter(event => isSameMonth(event.date, currentDate))
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map(event => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => onEventClick?.(event.type, event.id)}
                      data-testid={`calendar-summary-${event.id}`}
                    >
                      <div className="flex items-center gap-2">
                        {event.type === 'dea' ? (
                          <Shield className="h-4 w-4 text-primary" />
                        ) : (
                          <FileKey className="h-4 w-4 text-primary" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {event.type.toUpperCase()} - {event.state}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.physicianName || 'Unknown'} • #{event.registrationNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(event.date, 'MMM d')}
                        </p>
                        <Badge
                          variant={
                            event.status === 'expired' || event.status === 'critical'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {event.status === 'expired' ? 'Expired' :
                           event.status === 'critical' ? 'Critical' :
                           event.status === 'warning' ? 'Warning' : 'Upcoming'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {events.filter(event => isSameMonth(event.date, currentDate)).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No expirations this month
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
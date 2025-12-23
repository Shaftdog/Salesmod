'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { useCalendarData } from '@/hooks/use-production';
import type { ProductionCardWithOrder, CalendarItem } from '@/types/production';
import { PRIORITY_COLORS, PRODUCTION_STAGE_LABELS } from '@/types/production';

type CalendarViewMode = 'month' | 'week';

interface CalendarViewProps {
  onCardClick: (card: ProductionCardWithOrder) => void;
}

export function CalendarView({ onCardClick }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      // Extend to full weeks for calendar grid
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      };
    } else {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    }
  }, [viewMode, currentDate]);

  // Fetch calendar data
  const { data: calendarData, isLoading, error } = useCalendarData(dateRange.start, dateRange.end);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const groups: Record<string, CalendarItem[]> = {};

    if (calendarData?.items) {
      calendarData.items.forEach((item) => {
        const dateKey = format(new Date(item.dueDate), 'yyyy-MM-dd');
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(item);
      });
    }

    return groups;
  }, [calendarData]);

  // Get days for the calendar grid
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Navigation handlers
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get items for a specific date
  const getItemsForDate = (date: Date): CalendarItem[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return itemsByDate[dateKey] || [];
  };

  // Handle card click from calendar item
  const handleItemClick = (item: CalendarItem) => {
    // Find the full card data from calendarData
    const card = calendarData?.cards.find(c => c.id === item.cardId);
    if (card) {
      onCardClick(card);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load calendar data. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
            }
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              aria-label={viewMode === 'month' ? "Previous month" : "Previous week"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              aria-label={viewMode === 'month' ? "Next month" : "Next week"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Select value={viewMode} onValueChange={(v) => setViewMode(v as CalendarViewMode)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : viewMode === 'month' ? (
        <MonthView
          days={days}
          currentDate={currentDate}
          getItemsForDate={getItemsForDate}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onItemClick={handleItemClick}
        />
      ) : (
        <WeekView
          days={days}
          getItemsForDate={getItemsForDate}
          onItemClick={handleItemClick}
        />
      )}

      {/* Selected Date Detail Popover - shown inline for month view */}
      {selectedDate && viewMode === 'month' && (
        <DayDetailCard
          date={selectedDate}
          items={getItemsForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onItemClick={handleItemClick}
        />
      )}
    </div>
  );
}

// Month View Component
interface MonthViewProps {
  days: Date[];
  currentDate: Date;
  getItemsForDate: (date: Date) => CalendarItem[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  onItemClick: (item: CalendarItem) => void;
}

function MonthView({ days, currentDate, getItemsForDate, selectedDate, onDateSelect, onItemClick }: MonthViewProps) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardContent className="p-2">
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const items = getItemsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const todayClass = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[100px] p-1 border rounded-md cursor-pointer transition-colors',
                  isCurrentMonth ? 'bg-background' : 'bg-muted/30',
                  isSelected && 'ring-2 ring-primary',
                  todayClass && 'border-primary',
                  'hover:bg-muted/50'
                )}
                onClick={() => onDateSelect(isSelected ? null : day)}
              >
                <div className={cn(
                  'text-sm font-medium mb-1',
                  !isCurrentMonth && 'text-muted-foreground',
                  todayClass && 'text-primary'
                )}>
                  {format(day, 'd')}
                </div>

                {/* Item dots/badges */}
                <div className="space-y-0.5">
                  {items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'text-xs truncate px-1 py-0.5 rounded',
                        PRIORITY_COLORS[item.priority]
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      title={item.title}
                    >
                      {item.type === 'card' ? '📋' : '✓'} {item.title}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{items.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Week View Component
interface WeekViewProps {
  days: Date[];
  getItemsForDate: (date: Date) => CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}

function WeekView({ days, getItemsForDate, onItemClick }: WeekViewProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-4">
          {days.map((day) => {
            const items = getItemsForDate(day);
            const todayClass = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[400px] border rounded-lg p-2',
                  todayClass && 'border-primary bg-primary/5'
                )}
              >
                {/* Day header */}
                <div className={cn(
                  'text-center pb-2 mb-2 border-b',
                  todayClass && 'text-primary'
                )}>
                  <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                  <div className={cn(
                    'text-2xl font-bold',
                    todayClass && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Items list */}
                <ScrollArea className="h-[340px]">
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No items due
                      </p>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'p-2 rounded-md cursor-pointer border transition-colors hover:shadow-sm',
                            PRIORITY_COLORS[item.priority]
                          )}
                          onClick={() => onItemClick(item)}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {item.type === 'card' ? 'Card' : 'Task'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {PRODUCTION_STAGE_LABELS[item.stage]}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          {item.orderNumber && (
                            <div className="text-xs text-muted-foreground truncate">
                              #{item.orderNumber}
                            </div>
                          )}
                          {item.propertyAddress && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.propertyAddress}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Day Detail Card Component
interface DayDetailCardProps {
  date: Date;
  items: CalendarItem[];
  onClose: () => void;
  onItemClick: (item: CalendarItem) => void;
}

function DayDetailCard({ date, items, onClose, onItemClick }: DayDetailCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(date, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No items due on this date
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-3 rounded-md cursor-pointer border transition-colors hover:shadow-md',
                  PRIORITY_COLORS[item.priority]
                )}
                onClick={() => onItemClick(item)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {item.type === 'card' ? 'Production Card' : 'Task'}
                    </Badge>
                    <Badge variant="outline">
                      {PRODUCTION_STAGE_LABELS[item.stage]}
                    </Badge>
                  </div>
                  <Badge className={PRIORITY_COLORS[item.priority]}>
                    {item.priority}
                  </Badge>
                </div>
                <div className="font-medium">{item.title}</div>
                {item.orderNumber && (
                  <div className="text-sm text-muted-foreground">
                    Order #{item.orderNumber}
                  </div>
                )}
                {item.propertyAddress && (
                  <div className="text-sm text-muted-foreground">
                    {item.propertyAddress}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

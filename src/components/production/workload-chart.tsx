'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, CalendarIcon, Loader2, Users, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
} from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useWorkloadData } from '@/hooks/use-production';
import type { WorkloadMetric, WorkloadPeriod, ResourceWorkload } from '@/types/production';
import { PRODUCTION_ROLE_LABELS } from '@/types/production';
import { useWorkloadDrillDown } from './workload-drill-down-context';

// Constants for capacity calculations (must match use-production.ts)
const BUSINESS_DAYS_PER_WEEK = 5;
const BUSINESS_DAYS_PER_MONTH = 22;
const WEEKS_PER_MONTH = 4.33;
const WEEK_TO_DAY_RATIO = 0.2;

const chartConfig = {
  taskCount: {
    label: 'Tasks',
    color: 'hsl(var(--primary))',
  },
  estimatedHours: {
    label: 'Hours',
    color: 'hsl(var(--chart-2))',
  },
  capacity: {
    label: 'Capacity',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

export function WorkloadChart() {
  const [metric, setMetric] = useState<WorkloadMetric>('task_count');
  const [period, setPeriod] = useState<WorkloadPeriod>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { openDrillDown } = useWorkloadDrillDown();

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    switch (period) {
      case 'day':
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        };
      case 'week':
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 0 }),
        };
      case 'month':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
    }
  }, [period, selectedDate]);

  // Fetch workload data
  const { data: workloadData, isLoading, error } = useWorkloadData(period, selectedDate);

  // Navigation handlers
  const goToPrevious = () => {
    switch (period) {
      case 'day':
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case 'month':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
    }
  };

  const goToNext = () => {
    switch (period) {
      case 'day':
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      case 'month':
        setSelectedDate(addMonths(selectedDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Format the chart data
  const chartData = useMemo(() => {
    if (!workloadData?.resources) return [];

    return workloadData.resources.map((resource) => ({
      name: resource.userName || 'Unknown',
      userId: resource.userId,
      roles: resource.roles,
      value: metric === 'task_count' ? resource.taskCount : resource.estimatedHours,
      capacity: metric === 'task_count'
        ? resource.maxDailyTasks * (period === 'day' ? 1 : period === 'week' ? BUSINESS_DAYS_PER_WEEK : BUSINESS_DAYS_PER_MONTH)
        : resource.maxWeeklyHours * (period === 'day' ? WEEK_TO_DAY_RATIO : period === 'week' ? 1 : WEEKS_PER_MONTH),
      capacityUsedPercent: resource.capacityUsedPercent,
      isOverloaded: resource.isOverloaded,
      taskCount: resource.taskCount,
      estimatedHours: resource.estimatedHours,
    }));
  }, [workloadData, metric, period]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!workloadData?.resources) {
      return { totalResources: 0, overloaded: 0, totalTasks: 0, totalHours: 0 };
    }

    return {
      totalResources: workloadData.resources.length,
      overloaded: workloadData.resources.filter(r => r.isOverloaded).length,
      totalTasks: workloadData.resources.reduce((sum, r) => sum + r.taskCount, 0),
      totalHours: workloadData.resources.reduce((sum, r) => sum + r.estimatedHours, 0),
    };
  }, [workloadData]);

  // Get period display text
  const getPeriodDisplayText = () => {
    switch (period) {
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return `Week of ${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
    }
  };

  // Handle resource click to open drill-down
  const handleResourceClick = (resource: ResourceWorkload) => {
    openDrillDown({
      userId: resource.userId,
      userName: resource.userName || 'Unknown',
      period,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      taskCount: resource.taskCount,
      estimatedHours: resource.estimatedHours,
      capacityUsedPercent: resource.capacityUsedPercent,
      isOverloaded: resource.isOverloaded,
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load workload data. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">{getPeriodDisplayText()}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <Select value={period} onValueChange={(v) => setPeriod(v as WorkloadPeriod)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Metric Selector */}
          <Select value={metric} onValueChange={(v) => setMetric(v as WorkloadMetric)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task_count">Task Count</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalResources}</div>
                <div className="text-sm text-muted-foreground">Resources</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                stats.overloaded > 0 ? "text-destructive" : "text-muted-foreground"
              )} />
              <div>
                <div className={cn(
                  "text-2xl font-bold",
                  stats.overloaded > 0 && "text-destructive"
                )}>
                  {stats.overloaded}
                </div>
                <div className="text-sm text-muted-foreground">Overloaded</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Est. Hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Workload</CardTitle>
          <CardDescription>
            {metric === 'task_count'
              ? 'Number of assigned tasks per resource'
              : 'Estimated hours of work per resource'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No resources with assigned tasks in this period
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {data.roles?.map((r: string) => PRODUCTION_ROLE_LABELS[r as keyof typeof PRODUCTION_ROLE_LABELS] || r).join(', ')}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Tasks: {data.taskCount}</div>
                          <div>Est. Hours: {data.estimatedHours.toFixed(1)}</div>
                          <div>Capacity: {Math.round(data.capacityUsedPercent)}%</div>
                          {data.isOverloaded && (
                            <div className="text-destructive font-medium">Overloaded!</div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  className="cursor-pointer"
                  onClick={(data) => {
                    if (data && workloadData?.resources) {
                      const resource = workloadData.resources.find(r => r.userId === data.userId);
                      if (resource) {
                        handleResourceClick(resource);
                      }
                    }
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isOverloaded
                        ? 'hsl(var(--destructive))'
                        : 'hsl(var(--primary))'
                      }
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
                {/* Capacity reference lines for each resource */}
                {chartData.map((entry, index) => (
                  <ReferenceLine
                    key={`ref-${index}`}
                    x={entry.capacity}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Resource Details Table */}
      {workloadData?.resources && workloadData.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Resource</th>
                    <th className="text-left py-2 px-3">Roles</th>
                    <th className="text-right py-2 px-3">Tasks</th>
                    <th className="text-right py-2 px-3">Est. Hours</th>
                    <th className="text-right py-2 px-3">Capacity</th>
                    <th className="text-center py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workloadData.resources.map((resource) => (
                    <tr
                      key={resource.userId}
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleResourceClick(resource)}
                    >
                      <td className="py-2 px-3 font-medium">{resource.userName}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {resource.roles.slice(0, 3).map((role) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {PRODUCTION_ROLE_LABELS[role as keyof typeof PRODUCTION_ROLE_LABELS] || role}
                            </Badge>
                          ))}
                          {resource.roles.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.roles.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">{resource.taskCount}</td>
                      <td className="py-2 px-3 text-right">{resource.estimatedHours.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={cn(
                          resource.capacityUsedPercent > 100 && "text-destructive font-medium"
                        )}>
                          {Math.round(resource.capacityUsedPercent)}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {resource.isOverloaded ? (
                          <Badge variant="destructive">Overloaded</Badge>
                        ) : resource.capacityUsedPercent > 80 ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            High
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

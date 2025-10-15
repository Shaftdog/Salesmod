"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGoal } from "@/hooks/use-goals";
import { useToast } from "@/hooks/use-toast";
import { Goal, goalMetricTypes, periodTypes, PeriodType, GoalMetricType } from "@/lib/types";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from "date-fns";
import { Loader2, Target } from "lucide-react";

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal; // For editing existing goals
}

export function GoalFormDialog({ open, onOpenChange, goal }: GoalFormDialogProps) {
  const { toast } = useToast();
  const createGoal = useCreateGoal();
  
  // Form state
  const [metricType, setMetricType] = useState<GoalMetricType>(goal?.metricType || 'order_volume');
  const [targetValue, setTargetValue] = useState(goal?.targetValue?.toString() || '');
  const [periodType, setPeriodType] = useState<PeriodType>(goal?.periodType || 'monthly');
  const [description, setDescription] = useState(goal?.description || '');
  
  // Auto-calculate period dates based on period type
  const getPeriodDates = (type: string) => {
    const now = new Date();
    switch(type) {
      case 'monthly':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'quarterly':
        return {
          start: format(startOfQuarter(now), 'yyyy-MM-dd'),
          end: format(endOfQuarter(now), 'yyyy-MM-dd')
        };
      case 'yearly':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
    }
  };
  
  const [periodDates, setPeriodDates] = useState(
    goal 
      ? { start: goal.periodStart, end: goal.periodEnd }
      : getPeriodDates(periodType)
  );
  
  const handlePeriodTypeChange = (value: string) => {
    setPeriodType(value as PeriodType);
    setPeriodDates(getPeriodDates(value));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetValue || parseFloat(targetValue) <= 0) {
      toast({
        title: "Invalid target",
        description: "Please enter a valid target value greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    // Validate completion_rate is between 0-100
    if (metricType === 'completion_rate') {
      const value = parseFloat(targetValue);
      if (value < 0 || value > 100) {
        toast({
          title: "Invalid completion rate",
          description: "Completion rate must be between 0 and 100",
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      await createGoal.mutateAsync({
        metricType,
        targetValue: parseFloat(targetValue),
        periodType,
        periodStart: periodDates.start,
        periodEnd: periodDates.end,
        description: description || undefined,
      });
      
      toast({
        title: "Goal created!",
        description: `Your ${metricType.replace(/_/g, ' ')} goal has been set.`
      });
      
      // Reset form
      setMetricType('order_volume');
      setTargetValue('');
      setPeriodType('monthly');
      setDescription('');
      setPeriodDates(getPeriodDates('monthly'));
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const getMetricLabel = (metric: string) => {
    return metric.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const getMetricUnit = (metric: string) => {
    switch(metric) {
      case 'revenue':
      case 'deal_value':
        return '($)';
      case 'completion_rate':
        return '(%)';
      case 'order_volume':
      case 'new_clients':
      case 'deals_closed':
        return '(count)';
      default:
        return '';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {goal ? 'Edit Goal' : 'Set New Goal'}
          </DialogTitle>
          <DialogDescription>
            Set a target for a specific metric over a time period.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Metric Type */}
            <div className="space-y-2">
              <Label htmlFor="metricType">Metric</Label>
              <Select value={metricType} onValueChange={(value) => setMetricType(value as GoalMetricType)}>
                <SelectTrigger id="metricType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalMetricTypes.map(metric => (
                    <SelectItem key={metric} value={metric}>
                      {getMetricLabel(metric)} {getMetricUnit(metric)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the metric you want to track
              </p>
            </div>
            
            {/* Target Value */}
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                step={metricType === 'revenue' || metricType === 'deal_value' ? '0.01' : '1'}
                min="0"
                max={metricType === 'completion_rate' ? '100' : undefined}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Enter target value"
                required
              />
              <p className="text-xs text-muted-foreground">
                {metricType === 'revenue' || metricType === 'deal_value' 
                  ? 'Enter the dollar amount you want to achieve'
                  : metricType === 'completion_rate'
                  ? 'Enter the percentage (0-100)'
                  : 'Enter the number you want to achieve'
                }
              </p>
            </div>
            
            {/* Period Type */}
            <div className="space-y-2">
              <Label htmlFor="periodType">Time Period</Label>
              <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                <SelectTrigger id="periodType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodTypes.map(period => (
                    <SelectItem key={period} value={period}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Goal period: {format(new Date(periodDates.start), 'MMM d')} - {format(new Date(periodDates.end), 'MMM d, yyyy')}
              </p>
            </div>
            
            {/* Custom Date Range (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Start Date</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={periodDates.start}
                  onChange={(e) => setPeriodDates({ ...periodDates, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">End Date</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodDates.end}
                  onChange={(e) => setPeriodDates({ ...periodDates, end: e.target.value })}
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this goal..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createGoal.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


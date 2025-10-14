"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useCurrentGoals, useGoalProgress, useDeleteGoal } from "@/hooks/use-goals";
import { useOrders } from "@/hooks/use-orders";
import { useDeals } from "@/hooks/use-deals";
import { useClients } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";
import { Target, TrendingUp, Settings, Plus, Calendar, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useState } from "react";
import { GoalFormDialog } from "./goal-form-dialog";

export function GoalsWidget() {
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const { data: goals, isLoading } = useCurrentGoals();
  const { orders } = useOrders();
  const { data: deals } = useDeals();
  const { clients } = useClients();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();
  
  const currentMonth = format(new Date(), 'MMMM yyyy');
  
  const handleDeleteGoal = async (goalId: string, metricLabel: string) => {
    if (window.confirm(`Are you sure you want to delete the ${metricLabel} goal? This action cannot be undone.`)) {
      try {
        await deleteGoal.mutateAsync(goalId);
        toast({
          title: "Goal deleted",
          description: "The goal has been removed successfully."
        });
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast({
          title: "Error",
          description: "Failed to delete goal. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              Monthly Goals
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {currentMonth}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowGoalDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Set Goal
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
            </div>
          ) : goals && goals.length > 0 ? (
            <div className="space-y-5">
              {goals.slice(0, 4).map(goal => {
                const progressData = useGoalProgress(goal, orders, deals, clients);
                const progressCapped = Math.min(progressData.progress, 100);
                
                // Determine color based on status
                const getProgressColor = () => {
                  if (progressData.progress >= 100) return "bg-green-500";
                  if (progressData.isOnTrack) return "bg-blue-500";
                  return "bg-yellow-500";
                };
                
                const getProgressBgColor = () => {
                  if (progressData.progress >= 100) return "bg-green-100 dark:bg-green-950";
                  if (progressData.isOnTrack) return "bg-blue-100 dark:bg-blue-950";
                  return "bg-yellow-100 dark:bg-yellow-950";
                };
                
                // Format value display based on metric type
                const formatValue = (value: number) => {
                  if (goal.metricType === 'revenue') {
                    return `$${value.toLocaleString()}`;
                  } else if (goal.metricType === 'completion_rate') {
                    return `${value.toFixed(1)}%`;
                  }
                  return value.toFixed(0);
                };
                
                const metricLabel = goal.metricType
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm">{metricLabel}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteGoal(goal.id, metricLabel)}
                            disabled={deleteGoal.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-sm font-semibold">
                          {formatValue(progressData.currentValue)} / {formatValue(goal.targetValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progressData.daysRemaining > 0 
                            ? `${progressData.daysRemaining} days left`
                            : progressData.daysRemaining === 0
                            ? 'Last day!'
                            : 'Period ended'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Progress 
                        value={progressCapped} 
                        className={`h-2 ${getProgressBgColor()}`}
                        indicatorClassName={getProgressColor()}
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {progressData.progress.toFixed(1)}% complete
                        </span>
                        {progressData.progress >= 100 ? (
                          <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Goal achieved!
                          </span>
                        ) : progressData.isOnTrack ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            On track
                          </span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                            Needs attention
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {goals.length > 4 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowGoalDialog(true)}
                >
                  View all {goals.length} goals
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No goals set</p>
                <p className="text-xs text-muted-foreground">
                  Set your first goal to start tracking progress
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowGoalDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <GoalFormDialog 
        open={showGoalDialog}
        onOpenChange={setShowGoalDialog}
      />
    </>
  );
}


"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import { useMyTasks, useCompleteTask } from "@/hooks/use-tasks";
import { CheckCircle, ListTodo, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function MyTasksWidget() {
  const { data: tasks = [], isLoading } = useMyTasks();
  const { mutateAsync: completeTask } = useCompleteTask();

  const handleComplete = async (task: any) => {
    await completeTask(task.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const tasksToShow = tasks.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              My Tasks
            </CardTitle>
            <CardDescription>
              {tasks.length} active task{tasks.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/tasks">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasksToShow.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active tasks!</p>
            <p className="text-sm">You're all caught up 🎉</p>
          </div>
        ) : (
          <>
            {tasksToShow.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                showClient={true}
              />
            ))}
            {tasks.length > 5 && (
              <Button asChild variant="ghost" className="w-full mt-2">
                <Link href="/tasks">
                  +{tasks.length - 5} more tasks
                </Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { useTasks, useCreateTask, useUpdateTask, useCompleteTask, useDeleteTask } from "@/hooks/use-tasks";
import { useAppraisers, useCurrentUser } from "@/hooks/use-appraisers";
import { useClients } from "@/hooks/use-clients";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/lib/types";

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  
  const { data: allTasks = [], isLoading } = useTasks();
  const { appraisers } = useAppraisers();
  const { clients } = useClients();
  const { data: currentUser } = useCurrentUser();
  const { mutateAsync: createTask, isPending: isCreating } = useCreateTask();
  const { mutateAsync: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutateAsync: completeTask } = useCompleteTask();
  const { mutateAsync: deleteTask } = useDeleteTask();

  const filteredTasks = allTasks.filter(task => {
    if (statusFilter === "active") {
      return task.status === 'pending' || task.status === 'in_progress';
    }
    if (statusFilter === "completed") {
      return task.status === 'completed';
    }
    if (statusFilter === "my-tasks" && currentUser) {
      return task.assignedTo === currentUser.id && (task.status === 'pending' || task.status === 'in_progress');
    }
    return true;
  });

  const handleAdd = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleView = (task: any) => {
    setSelectedTask(task);
    setShowDetailSheet(true);
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleComplete = async (task: any) => {
    await completeTask(task.id);
  };

  const handleDelete = async (task: any) => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await deleteTask(task.id);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!currentUser) return;

    if (editingTask) {
      await updateTask({
        id: editingTask.id,
        title: data.title,
        description: data.description,
        client_id: data.clientId || null,
        priority: data.priority,
        status: data.status,
        due_date: data.dueDate?.toISOString(),
        assigned_to: data.assignedTo,
      });
    } else {
      await createTask({
        title: data.title,
        description: data.description,
        client_id: data.clientId || null,
        priority: data.priority,
        status: data.status,
        due_date: data.dueDate?.toISOString(),
        assigned_to: data.assignedTo,
        created_by: currentUser.id,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Manage and track tasks across your team
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <div className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks found</p>
                  <Button onClick={handleAdd} variant="outline" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onEdit={handleView}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <TaskForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        appraisers={appraisers}
        clients={clients}
        task={editingTask}
        isLoading={isCreating || isUpdating}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onEdit={handleEdit}
        onComplete={handleComplete}
        onDelete={handleDelete}
      />
    </div>
  );
}


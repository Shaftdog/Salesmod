'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductionKanbanBoard } from './kanban-board';
import { CalendarView } from './calendar-view';
import { WorkloadChart } from './workload-chart';
import { ResourceTasksKanban } from './resource-tasks-kanban';
import { TaskDetailDialog } from './task-detail-dialog';
import { WorkloadDrillDownProvider } from './workload-drill-down-context';
import { WorkloadDrillDownDialog } from './workload-drill-down-dialog';
import { LayoutGrid, Calendar, BarChart3, Users } from 'lucide-react';
import type { ProductionCardWithOrder, ResourceTaskWithRelations } from '@/types/production';

type ProductionView = 'kanban' | 'calendar' | 'workload' | 'resource-tasks';

interface ProductionBoardTabsProps {
  onCardClick: (card: ProductionCardWithOrder) => void;
}

export function ProductionBoardTabs({ onCardClick }: ProductionBoardTabsProps) {
  const [activeView, setActiveView] = useState<ProductionView>('kanban');
  const [selectedTask, setSelectedTask] = useState<ResourceTaskWithRelations | null>(null);

  const handleTaskClick = (task: ResourceTaskWithRelations) => {
    setSelectedTask(task);
  };

  return (
    <>
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ProductionView)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="resource-tasks" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Resource Tasks
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Workload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-0">
          <ProductionKanbanBoard onCardClick={onCardClick} />
        </TabsContent>

        <TabsContent value="resource-tasks" className="mt-0">
          <ResourceTasksKanban onTaskClick={handleTaskClick} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <CalendarView onCardClick={onCardClick} />
        </TabsContent>

        <TabsContent value="workload" className="mt-0">
          <WorkloadDrillDownProvider>
            <WorkloadChart />
            <WorkloadDrillDownDialog />
          </WorkloadDrillDownProvider>
        </TabsContent>
      </Tabs>

      {/* Task Detail Dialog for Resource Tasks view */}
      {selectedTask && (
        <TaskDetailDialog
          task={{
            ...selectedTask,
            subtasks: selectedTask.subtasks || [],
            time_entries: [],
            active_timer: null,
          }}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </>
  );
}

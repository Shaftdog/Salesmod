'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductionKanbanBoard } from './kanban-board';
import { CalendarView } from './calendar-view';
import { WorkloadChart } from './workload-chart';
import { LayoutGrid, Calendar, BarChart3 } from 'lucide-react';
import type { ProductionCardWithOrder } from '@/types/production';

type ProductionView = 'kanban' | 'calendar' | 'workload';

interface ProductionBoardTabsProps {
  onCardClick: (card: ProductionCardWithOrder) => void;
}

export function ProductionBoardTabs({ onCardClick }: ProductionBoardTabsProps) {
  const [activeView, setActiveView] = useState<ProductionView>('kanban');

  return (
    <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ProductionView)} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="kanban" className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Kanban
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

      <TabsContent value="calendar" className="mt-0">
        <CalendarView onCardClick={onCardClick} />
      </TabsContent>

      <TabsContent value="workload" className="mt-0">
        <WorkloadChart />
      </TabsContent>
    </Tabs>
  );
}

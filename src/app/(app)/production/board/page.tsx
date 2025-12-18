'use client';

import { useState } from 'react';
import { ProductionBoardTabs } from '@/components/production/production-board-tabs';
import { ProductionCardModal } from '@/components/production/production-card-modal';
import { SLAConfigDialog } from '@/components/production/sla-config-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, ListTodo, Clock } from 'lucide-react';
import { useProductionBoardData } from '@/hooks/use-production';
import type { ProductionCardWithOrder } from '@/types/production';
import Link from 'next/link';

export default function ProductionBoardPage() {
  const { refetch, isRefetching } = useProductionBoardData();
  const [selectedCard, setSelectedCard] = useState<ProductionCardWithOrder | null>(null);
  const [slaConfigOpen, setSlaConfigOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Board</h1>
          <p className="text-sm text-muted-foreground">
            Track appraisal orders through the production workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/production/my-tasks">
              <ListTodo className="h-4 w-4 mr-2" />
              My Tasks
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/production/templates">
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSlaConfigOpen(true)}
          >
            <Clock className="h-4 w-4 mr-2" />
            SLA
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Production Board with Views (Kanban | Calendar | Workload) */}
      <ProductionBoardTabs onCardClick={setSelectedCard} />

      {/* Card Detail Modal */}
      {selectedCard && (
        <ProductionCardModal
          cardId={selectedCard.id}
          open={!!selectedCard}
          onOpenChange={(open) => !open && setSelectedCard(null)}
        />
      )}

      {/* SLA Configuration Dialog */}
      <SLAConfigDialog
        open={slaConfigOpen}
        onOpenChange={setSlaConfigOpen}
      />
    </div>
  );
}

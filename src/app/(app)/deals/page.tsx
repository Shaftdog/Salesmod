"use client";

import { PipelineBoard } from "@/components/deals/pipeline-board";
import { useDeals } from "@/hooks/use-deals";
import { useClients } from "@/hooks/use-clients";
import { Skeleton } from "@/components/ui/skeleton";

export default function DealsPage() {
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { clients } = useClients();

  if (dealsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return <PipelineBoard deals={deals} clients={clients} />;
}


"use client";

import { useState, useMemo } from "react";
import { DealCard } from "./deal-card";
import { DealForm } from "./deal-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Deal, Client } from "@/lib/types";
import { dealStages } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCreateDeal, useUpdateDeal, useDeleteDeal } from "@/hooks/use-deals";
import { useCurrentUser } from "@/hooks/use-appraisers";

type PipelineBoardProps = {
  deals: Deal[];
  clients: Client[];
  isLoading?: boolean;
};

const stageLabels = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const stageColors = {
  lead: "bg-gray-200",
  qualified: "bg-blue-200",
  proposal: "bg-purple-200",
  negotiation: "bg-orange-200",
  won: "bg-green-200",
  lost: "bg-red-200",
};

export function PipelineBoard({ deals, clients, isLoading }: PipelineBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  const { mutateAsync: createDeal, isPending: isCreating } = useCreateDeal();
  const { mutateAsync: updateDeal, isPending: isUpdating } = useUpdateDeal();
  const { mutateAsync: deleteDeal } = useDeleteDeal();
  const { data: currentUser } = useCurrentUser();

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    dealStages.forEach(stage => {
      grouped[stage] = deals.filter(d => d.stage === stage);
    });
    return grouped;
  }, [deals]);

  const handleAdd = () => {
    setEditingDeal(null);
    setShowForm(true);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleDelete = async (deal: Deal) => {
    if (window.confirm(`Delete deal "${deal.title}"?`)) {
      await deleteDeal(deal.id);
    }
  };

  const handleStageChange = async (deal: Deal, newStage: string) => {
    await updateDeal({
      id: deal.id,
      stage: newStage,
    });
  };

  // Drag and drop handlers
  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (draggedDeal && draggedDeal.stage !== stage) {
      await handleStageChange(draggedDeal, stage);
    }
    setDraggedDeal(null);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
  };

  const handleSubmit = async (data: any) => {
    if (!currentUser) return;

    if (editingDeal) {
      await updateDeal({
        id: editingDeal.id,
        title: data.title,
        description: data.description,
        client_id: data.clientId,
        value: data.value,
        probability: data.probability || 50,
        stage: data.stage,
        expected_close_date: data.expectedCloseDate?.toISOString().split('T')[0],
      });
    } else {
      await createDeal({
        title: data.title,
        description: data.description,
        client_id: data.clientId,
        value: data.value,
        probability: data.probability || 50,
        stage: data.stage,
        expected_close_date: data.expectedCloseDate?.toISOString().split('T')[0],
        created_by: currentUser.id,
        assigned_to: currentUser.id,
      });
    }
  };

  const calculateStageValue = (stage: string) => {
    const stageDeals = dealsByStage[stage] || [];
    return stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  const calculateWeightedValue = (stage: string) => {
    const stageDeals = dealsByStage[stage] || [];
    return stageDeals.reduce((sum, deal) => {
      return sum + ((deal.value || 0) * deal.probability) / 100;
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Pipeline</h2>
          <p className="text-muted-foreground">
            Total Pipeline: {formatCurrency(deals.reduce((sum, d) => sum + (d.value || 0), 0))}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {dealStages.map((stage) => {
          const stageDeals = dealsByStage[stage] || [];
          const totalValue = calculateStageValue(stage);
          const weightedValue = calculateWeightedValue(stage);

          return (
            <div
              key={stage}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              <div className={`rounded-t-lg p-3 ${stageColors[stage]}`}>
                <h3 className="font-semibold capitalize">{stageLabels[stage]}</h3>
                <div className="text-sm mt-1">
                  <div>{stageDeals.length} deals</div>
                  <div className="font-semibold">{formatCurrency(totalValue)}</div>
                  {stage !== 'won' && stage !== 'lost' && totalValue > 0 && (
                    <div className="text-xs opacity-75">
                      Weighted: {formatCurrency(weightedValue)}
                    </div>
                  )}
                </div>
              </div>
              <div className={`flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px] ${draggedDeal ? 'ring-2 ring-primary/20' : ''}`}>
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStageChange={handleStageChange}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedDeal?.id === deal.id}
                  />
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DealForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        clients={clients}
        deal={editingDeal || undefined}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}


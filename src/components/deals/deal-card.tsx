import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Deal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, TrendingUp, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const stageColors = {
  lead: "bg-gray-100 text-gray-800 border-gray-300",
  qualified: "bg-blue-100 text-blue-800 border-blue-300",
  proposal: "bg-purple-100 text-purple-800 border-purple-300",
  negotiation: "bg-orange-100 text-orange-800 border-orange-300",
  won: "bg-green-100 text-green-800 border-green-300",
  lost: "bg-red-100 text-red-800 border-red-300",
};

type DealCardProps = {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  onStageChange?: (deal: Deal, newStage: string) => void;
};

export function DealCard({ deal, onEdit, onDelete, onStageChange }: DealCardProps) {
  const router = useRouter();
  const weightedValue = deal.value ? (deal.value * deal.probability) / 100 : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('[role="button"]')) {
      return;
    }
    router.push(`/deals/${deal.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">{deal.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{deal.client?.companyName}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(deal); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(deal); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {deal.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{deal.description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{deal.value ? formatCurrency(deal.value) : "No value"}</span>
          </div>
          {deal.value && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">{deal.probability}% = {formatCurrency(weightedValue)}</span>
            </div>
          )}
        </div>

        {deal.expectedCloseDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}</span>
          </div>
        )}

        {deal.assignee && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {deal.assignee.name?.charAt(0)}
            </div>
            <span className="text-xs text-muted-foreground">{deal.assignee.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


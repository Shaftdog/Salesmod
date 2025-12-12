import { Badge, type BadgeProps } from "@/components/ui/badge";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  // Use status directly as variant - badge component has all variants defined
  const variant: BadgeProps["variant"] = status === 'cancelled' ? 'destructive' : status;
  const label = orderStatusLabels[status] || status.replace(/_/g, " ");

  return (
    <Badge variant={variant} className={cn("font-normal", className)}>
      {label}
    </Badge>
  );
}

import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const variant: BadgeProps["variant"] =
    status === "in_progress"
      ? "in_progress"
      : status === "in_review"
      ? "in_review"
      : status === 'cancelled'
      ? 'destructive'
      : status;

  return (
    <Badge variant={variant} className={cn("font-normal", className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

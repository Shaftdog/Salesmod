/**
 * Invoice Status Badge Component
 * Displays invoice status with appropriate color coding
 */

import { Badge } from '@/components/ui/badge';
import type { InvoiceStatusType } from '@/types/invoicing';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatusType;
  className?: string;
}

const STATUS_CONFIG: Record<InvoiceStatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  sent: { label: 'Sent', variant: 'default' },
  viewed: { label: 'Viewed', variant: 'secondary' },
  partially_paid: { label: 'Partially Paid', variant: 'default' },
  paid: { label: 'Paid', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  void: { label: 'Void', variant: 'outline' },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

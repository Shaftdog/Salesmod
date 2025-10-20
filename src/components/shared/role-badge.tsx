'use client';

import { Badge } from '@/components/ui/badge';
import type { PartyRoleCode } from '@/lib/roles/mapPartyRole';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  code: PartyRoleCode | string | null | undefined;
  label?: string;
  className?: string;
}

export function RoleBadge({ code, label, className }: RoleBadgeProps) {
  if (!code || code === 'unknown') {
    return (
      <Badge variant="secondary" className={cn('text-xs', className)}>
        No Role
      </Badge>
    );
  }
  
  return (
    <Badge variant="default" className={cn('text-xs', className)}>
      {label || code.replace(/_/g, ' ')}
    </Badge>
  );
}


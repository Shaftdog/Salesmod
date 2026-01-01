'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductionResourceWithUser } from '@/types/production';

interface ResourceFilterSelectProps {
  resources: ProductionResourceWithUser[] | undefined;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  isLoading?: boolean;
}

export function ResourceFilterSelect({
  resources,
  value,
  onChange,
  isLoading,
}: ResourceFilterSelectProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={(val) => onChange(val === 'all' ? undefined : val)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Filter by resource" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Resources</SelectItem>
        {resources?.map((resource) => (
          <SelectItem key={resource.id} value={resource.user_id}>
            <div className="flex flex-col">
              <span>{resource.user?.name || resource.user?.email}</span>
              {resource.user?.name && (
                <span className="text-xs text-muted-foreground">
                  {resource.user.email}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

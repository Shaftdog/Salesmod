'use client';

import { usePartyRoles } from '@/hooks/use-party-roles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface RoleSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RoleSelect({ value, onChange, placeholder = 'Select role...', disabled }: RoleSelectProps) {
  const { data: roles, isLoading } = usePartyRoles();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading roles...
      </div>
    );
  }
  
  const handleChange = (newValue: string) => {
    // Allow clearing the selection
    if (newValue === '__none__') {
      onChange('');
    } else {
      onChange(newValue);
    }
  };

  return (
    <Select value={value || '__none__'} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">No Role</SelectItem>
        {roles?.map((role) => (
          <SelectItem key={role.code} value={role.code}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


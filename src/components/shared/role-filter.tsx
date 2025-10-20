'use client';

import { usePartyRoles } from '@/hooks/use-party-roles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';

interface RoleFilterProps {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
}

export function RoleFilter({ selectedRoles, onChange }: RoleFilterProps) {
  const { data: roles, isLoading } = usePartyRoles();
  
  const toggleRole = (roleCode: string) => {
    if (selectedRoles.includes(roleCode)) {
      onChange(selectedRoles.filter(r => r !== roleCode));
    } else {
      onChange([...selectedRoles, roleCode]);
    }
  };
  
  const clearFilters = () => {
    onChange([]);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Role
          {selectedRoles.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {selectedRoles.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-2 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            {roles?.map((role) => (
              <DropdownMenuCheckboxItem
                key={role.code}
                checked={selectedRoles.includes(role.code)}
                onCheckedChange={() => toggleRole(role.code)}
              >
                {role.label}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
        {selectedRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


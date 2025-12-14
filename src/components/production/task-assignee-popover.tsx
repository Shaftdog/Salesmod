'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, User, UserPlus, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductionResources, useUpdateProductionTask } from '@/hooks/use-production';

interface TaskAssigneePopoverProps {
  taskId: string;
  currentAssignee?: {
    id: string;
    name?: string | null;
    email?: string;
  } | null;
  disabled?: boolean;
}

export function TaskAssigneePopover({
  taskId,
  currentAssignee,
  disabled = false,
}: TaskAssigneePopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: resources, isLoading: isLoadingResources } = useProductionResources();
  const updateTask = useUpdateProductionTask();

  const handleAssign = async (userId: string | null) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        assigned_to: userId,
      });
      setOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Filter resources by search term
  const filteredResources = resources?.filter((resource) => {
    if (!search) return true;
    const name = resource.user?.name?.toLowerCase() || '';
    const email = resource.user?.email?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  }) || [];

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled || updateTask.isPending}
          className={cn(
            'flex items-center gap-1 text-xs rounded px-1.5 py-0.5 -ml-1.5 transition-colors',
            'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            disabled && 'opacity-50 cursor-not-allowed',
            !currentAssignee && 'text-muted-foreground hover:text-foreground'
          )}
        >
          {updateTask.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : currentAssignee ? (
            <>
              <User className="h-3 w-3" />
              <span>{currentAssignee.name || currentAssignee.email}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-3 w-3" />
              <span>Assign</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="max-h-64">
          {isLoadingResources ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {search ? 'No matching team members' : 'No team members available'}
            </div>
          ) : (
            <div className="py-1">
              {/* Unassign option */}
              {currentAssignee && (
                <button
                  onClick={() => handleAssign(null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition-colors text-red-600"
                >
                  <X className="h-4 w-4" />
                  <span>Unassign</span>
                </button>
              )}

              {filteredResources.map((resource) => {
                const isCurrentAssignee = currentAssignee?.id === resource.user?.id;
                return (
                  <button
                    key={resource.id}
                    onClick={() => handleAssign(resource.user?.id || null)}
                    disabled={isCurrentAssignee}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition-colors',
                      isCurrentAssignee && 'bg-blue-50'
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(resource.user?.name || undefined, resource.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">
                        {resource.user?.name || resource.user?.email || 'Unknown'}
                      </p>
                      {resource.user?.name && resource.user?.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.user.email}
                        </p>
                      )}
                    </div>
                    {isCurrentAssignee && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

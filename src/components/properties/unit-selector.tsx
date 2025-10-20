"use client";

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { PropertyUnit, PropertyType } from '@/lib/types';
import { usePropertyUnits, useCreatePropertyUnit } from '@/hooks/use-property-units';
import { normalizeUnit, areUnitsEquivalent } from '@/lib/units';

interface UnitSelectorProps {
  propertyId: string;
  propertyType?: PropertyType;
  selectedUnitId?: string | null;
  onSelectUnit: (unitId: string | null, unit?: PropertyUnit) => void;
  allowCreate?: boolean;
  disabled?: boolean;
}

export function UnitSelector({
  propertyId,
  propertyType,
  selectedUnitId,
  onSelectUnit,
  allowCreate = true,
  disabled = false,
}: UnitSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showNewUnitInput, setShowNewUnitInput] = useState(false);
  const [newUnitIdentifier, setNewUnitIdentifier] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: units = [], isLoading } = usePropertyUnits(propertyId);
  const createMutation = useCreatePropertyUnit();

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  const handleSelectUnit = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    onSelectUnit(unitId, unit);
    setOpen(false);
  };

  const handleShowNewUnit = () => {
    setShowNewUnitInput(true);
    setNewUnitIdentifier('');
    setValidationError(null);
  };

  const handleCancelNewUnit = () => {
    setShowNewUnitInput(false);
    setNewUnitIdentifier('');
    setValidationError(null);
  };

  const handleCreateUnit = async () => {
    if (!newUnitIdentifier.trim()) {
      setValidationError('Unit identifier cannot be empty');
      return;
    }

    // Check for normalized duplicates
    const normalized = normalizeUnit(newUnitIdentifier);
    const duplicate = units.find((u) => 
      areUnitsEquivalent(u.unitIdentifier, newUnitIdentifier)
    );

    if (duplicate) {
      setValidationError(`Unit "${duplicate.unitIdentifier}" already exists`);
      return;
    }

    try {
      const newUnit = await createMutation.mutateAsync({
        propertyId,
        unitIdentifier: newUnitIdentifier.trim(),
        unitType: propertyType === 'condo' ? 'condo' : undefined,
      });

      onSelectUnit(newUnit.id, newUnit);
      setShowNewUnitInput(false);
      setNewUnitIdentifier('');
      setValidationError(null);
      setOpen(false);
    } catch (error: any) {
      setValidationError(error.message || 'Failed to create unit');
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              'Loading units...'
            ) : selectedUnit ? (
              selectedUnit.unitIdentifier
            ) : (
              'Select unit...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search units..." />
            <CommandEmpty>No units found.</CommandEmpty>
            <CommandGroup>
              {units.map((unit) => (
                <CommandItem
                  key={unit.id}
                  value={unit.unitIdentifier}
                  onSelect={() => handleSelectUnit(unit.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedUnitId === unit.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{unit.unitIdentifier}</span>
                    {unit.unitType && (
                      <span className="text-xs text-muted-foreground">
                        {unit.unitType}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              
              {allowCreate && !showNewUnitInput && (
                <CommandItem onSelect={handleShowNewUnit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Unit
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Inline new unit creation */}
      {showNewUnitInput && (
        <div className="flex flex-col gap-2 p-3 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
            <Input
              value={newUnitIdentifier}
              onChange={(e) => {
                setNewUnitIdentifier(e.target.value);
                setValidationError(null);
              }}
              placeholder="Enter unit identifier (e.g., 2B, 305)"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateUnit();
                } else if (e.key === 'Escape') {
                  handleCancelNewUnit();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleCreateUnit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelNewUnit}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
          </div>
          
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Press Enter to create, Esc to cancel
          </p>
        </div>
      )}

      {/* Clear selection button */}
      {selectedUnitId && !disabled && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectUnit(null)}
          className="w-full"
        >
          Clear Unit Selection
        </Button>
      )}
    </div>
  );
}



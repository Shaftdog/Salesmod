"use client";

import { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Edit, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PropertyUnit } from '@/lib/types';
import { usePropertyUnits, useDeletePropertyUnit } from '@/hooks/use-property-units';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyUnitsListProps {
  propertyId: string;
  onEditUnit?: (unit: PropertyUnit) => void;
  onUnitClick?: (unit: PropertyUnit) => void;
}

export function PropertyUnitsList({
  propertyId,
  onEditUnit,
  onUnitClick,
}: PropertyUnitsListProps) {
  const router = useRouter();
  const { data: units = [], isLoading } = usePropertyUnits(propertyId);
  const deleteMutation = useDeletePropertyUnit();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<PropertyUnit | null>(null);

  const handleDeleteClick = (unit: PropertyUnit) => {
    setUnitToDelete(unit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!unitToDelete) return;

    await deleteMutation.mutateAsync({
      propertyId,
      unitId: unitToDelete.id,
    });

    setDeleteDialogOpen(false);
    setUnitToDelete(null);
  };

  const getUnitTypeBadgeColor = (type?: string) => {
    const colors: Record<string, string> = {
      condo: 'bg-blue-100 text-blue-800',
      apartment: 'bg-green-100 text-green-800',
      townhouse: 'bg-purple-100 text-purple-800',
      office: 'bg-orange-100 text-orange-800',
      half_duplex: 'bg-yellow-100 text-yellow-800',
    };
    return type ? colors[type] || 'bg-gray-100 text-gray-800' : '';
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No units found for this property.</p>
        <p className="text-sm mt-1">Units will appear here when orders are created with unit information.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Prior Work (3y)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow
              key={unit.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onUnitClick?.(unit)}
            >
              <TableCell className="font-medium">
                {unit.unitIdentifier}
              </TableCell>
              <TableCell>
                {unit.unitType ? (
                  <Badge className={getUnitTypeBadgeColor(unit.unitType)}>
                    {unit.unitType.replace('_', ' ')}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">
                  {unit.orderCount || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    (unit.priorWork3y || 0) > 0 ? 'destructive' : 'secondary'
                  }
                >
                  {unit.priorWork3y || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {onEditUnit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditUnit(unit);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/orders?propertyUnitId=${unit.id}`);
                    }}
                    title="View orders for this unit"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(unit);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete unit "{unitToDelete?.unitIdentifier}"? 
              This action cannot be undone.
              {(unitToDelete?.orderCount || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This unit has {unitToDelete?.orderCount} linked order(s).
                  You must reassign or delete those orders first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Unit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Expandable row component for use in properties table
 * Shows units when expanded
 */
interface ExpandableUnitsRowProps {
  propertyId: string;
  isExpanded: boolean;
  onToggle: () => void;
  unitCount?: number;
}

export function ExpandableUnitsRow({
  propertyId,
  isExpanded,
  onToggle,
  unitCount,
}: ExpandableUnitsRowProps) {
  const { data: units = [] } = usePropertyUnits(isExpanded ? propertyId : undefined);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-6 w-6 p-0"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      {unitCount !== undefined && unitCount > 0 && (
        <Badge variant="secondary" className="ml-2">
          {unitCount} {unitCount === 1 ? 'unit' : 'units'}
        </Badge>
      )}
    </>
  );
}



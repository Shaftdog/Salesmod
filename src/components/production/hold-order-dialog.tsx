'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PauseCircle } from 'lucide-react';
import { useHoldProductionCard } from '@/hooks/use-production';

interface HoldOrderDialogProps {
  cardId: string;
  orderNumber: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HoldOrderDialog({
  cardId,
  orderNumber,
  open,
  onOpenChange,
}: HoldOrderDialogProps) {
  const [holdReason, setHoldReason] = useState('');
  const holdCard = useHoldProductionCard();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setHoldReason('');
    }
  }, [open]);

  const handleHold = async () => {
    try {
      await holdCard.mutateAsync({
        cardId,
        holdReason: holdReason.trim() || undefined,
      });
      onOpenChange(false);
      setHoldReason('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-amber-500" />
            Put Order On Hold
          </DialogTitle>
          <DialogDescription>
            This will pause the production workflow for{' '}
            <span className="font-medium">{orderNumber || 'this order'}</span>.
            The card will move to the &quot;On Hold&quot; column and can be resumed later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="hold-reason">Reason for holding (optional)</Label>
            <Textarea
              id="hold-reason"
              placeholder="Enter the reason for putting this order on hold..."
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={holdCard.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleHold}
            disabled={holdCard.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {holdCard.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Holding...
              </>
            ) : (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Put On Hold
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HoldOrderDialog;

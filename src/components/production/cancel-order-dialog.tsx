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
import { Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { useCancelProductionCard } from '@/hooks/use-production';

interface CancelOrderDialogProps {
  cardId: string;
  orderNumber: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelOrderDialog({
  cardId,
  orderNumber,
  open,
  onOpenChange,
}: CancelOrderDialogProps) {
  const [cancelReason, setCancelReason] = useState('');
  const cancelCard = useCancelProductionCard();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCancelReason('');
    }
  }, [open]);

  const handleCancel = async () => {
    try {
      await cancelCard.mutateAsync({
        cardId,
        cancelReason: cancelReason.trim() || undefined,
      });
      onOpenChange(false);
      setCancelReason('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-start gap-2 text-amber-600 bg-amber-50 p-2 rounded mt-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                This action will cancel the production workflow for{' '}
                <span className="font-medium">{orderNumber || 'this order'}</span>.
                The card will move to the &quot;Cancelled&quot; column.
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter the reason for cancelling this order..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelCard.isPending}
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelCard.isPending}
          >
            {cancelCard.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CancelOrderDialog;

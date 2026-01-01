'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ResourceTaskWithRelations } from '@/types/production';

interface IssueDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (description: string) => Promise<void>;
  task?: ResourceTaskWithRelations | null;
  isLoading?: boolean;
}

export function IssueDescriptionDialog({
  open,
  onOpenChange,
  onSubmit,
  task,
  isLoading,
}: IssueDescriptionDialogProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please describe the issue');
      return;
    }

    setError(null);
    await onSubmit(description.trim());
    setDescription('');
  };

  const handleCancel = () => {
    setDescription('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Report Issue
          </DialogTitle>
          <DialogDescription>
            Describe the issue with this task. This will move the task to the Issues column.
          </DialogDescription>
        </DialogHeader>

        {task && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">{task.title}</p>
            {task.production_card?.order?.order_number && (
              <p className="text-muted-foreground">
                Order: {task.production_card.order.order_number}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="issue-description">Issue Description *</Label>
          <Textarea
            id="issue-description"
            placeholder="Describe what's preventing this task from being completed..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Report Issue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

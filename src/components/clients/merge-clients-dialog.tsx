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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMergeClients, useDuplicateClients } from '@/hooks/use-merge-clients';
import { Loader2, AlertCircle, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DuplicateClient } from '@/lib/clients-merge';

interface MergeClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MergeClientsDialog({ open, onOpenChange }: MergeClientsDialogProps) {
  const [selectedPair, setSelectedPair] = useState<DuplicateClient | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const { data, isLoading } = useDuplicateClients();
  const mergeMutation = useMergeClients();

  const handleMerge = async () => {
    if (!selectedPair || !winnerId) return;

    const loserId =
      winnerId === selectedPair.client1Id
        ? selectedPair.client2Id
        : selectedPair.client1Id;

    await mergeMutation.mutateAsync({ winnerId, loserId });

    // Reset state and close
    setSelectedPair(null);
    setWinnerId(null);
    onOpenChange(false);
  };

  const handleSelectPair = (pair: DuplicateClient) => {
    setSelectedPair(pair);
    // Auto-select first client as winner by default
    setWinnerId(pair.client1Id);
  };

  const duplicates = data?.duplicates || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Merge Duplicate Clients</DialogTitle>
          <DialogDescription>
            Review and merge duplicate clients to keep your data clean. All contacts, orders, and related
            records will be transferred to the winner.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : duplicates.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No duplicate clients found. Your client list is clean!
            </AlertDescription>
          </Alert>
        ) : !selectedPair ? (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Found {duplicates.length} potential duplicate{duplicates.length > 1 ? 's' : ''}
              </p>
              {duplicates.map((pair, index) => (
                <div
                  key={`${pair.client1Id}-${pair.client2Id}`}
                  className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition"
                  onClick={() => handleSelectPair(pair)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{pair.client1Name}</div>
                      {pair.client1Domain && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {pair.client1Domain}
                        </div>
                      )}
                    </div>
                    <div className="mx-4 text-muted-foreground">↔</div>
                    <div className="flex-1">
                      <div className="font-medium">{pair.client2Name}</div>
                      {pair.client2Domain && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {pair.client2Domain}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {pair.matchType === 'exact_domain' ? 'Exact Domain Match' : 'Similar Name'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(pair.similarityScore * 100)}% match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select which client to keep. All contacts, orders, properties, and related records will be
                transferred to the winner. The other client will be deleted.
              </AlertDescription>
            </Alert>

            <RadioGroup value={winnerId || ''} onValueChange={setWinnerId}>
              <div className="grid grid-cols-2 gap-4">
                {/* Client 1 */}
                <div
                  className={`border rounded-lg p-4 ${
                    winnerId === selectedPair.client1Id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={selectedPair.client1Id}
                      id="client1"
                      className="mt-1"
                    />
                    <Label htmlFor="client1" className="flex-1 cursor-pointer">
                      <div className="font-medium mb-2">{selectedPair.client1Name}</div>
                      {selectedPair.client1Domain && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <Globe className="h-3 w-3" />
                          {selectedPair.client1Domain}
                        </div>
                      )}
                    </Label>
                  </div>
                </div>

                {/* Client 2 */}
                <div
                  className={`border rounded-lg p-4 ${
                    winnerId === selectedPair.client2Id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={selectedPair.client2Id}
                      id="client2"
                      className="mt-1"
                    />
                    <Label htmlFor="client2" className="flex-1 cursor-pointer">
                      <div className="font-medium mb-2">{selectedPair.client2Name}</div>
                      {selectedPair.client2Domain && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <Globe className="h-3 w-3" />
                          {selectedPair.client2Domain}
                        </div>
                      )}
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPair(null);
                  setWinnerId(null);
                }}
              >
                Back to List
              </Button>
              <Button onClick={handleMerge} disabled={!winnerId || mergeMutation.isPending}>
                {mergeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Merge Clients
              </Button>
            </div>
          </div>
        )}

        {!selectedPair && duplicates.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

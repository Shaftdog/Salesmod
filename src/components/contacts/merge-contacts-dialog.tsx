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
import { useMergeContacts, useDuplicateContacts } from '@/hooks/use-merge-contacts';
import { Loader2, AlertCircle, Mail, Phone, Building } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DuplicateContact } from '@/lib/contacts-merge';

interface MergeContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MergeContactsDialog({ open, onOpenChange }: MergeContactsDialogProps) {
  const [selectedPair, setSelectedPair] = useState<DuplicateContact | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const { data, isLoading } = useDuplicateContacts();
  const mergeMutation = useMergeContacts();

  const handleMerge = async () => {
    if (!selectedPair || !winnerId) return;

    const loserId =
      winnerId === selectedPair.contact1Id
        ? selectedPair.contact2Id
        : selectedPair.contact1Id;

    await mergeMutation.mutateAsync({ winnerId, loserId });

    // Reset state and close
    setSelectedPair(null);
    setWinnerId(null);
    onOpenChange(false);
  };

  const handleSelectPair = (pair: DuplicateContact) => {
    setSelectedPair(pair);
    // Auto-select first contact as winner by default
    setWinnerId(pair.contact1Id);
  };

  const duplicates = data?.duplicates || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Merge Duplicate Contacts</DialogTitle>
          <DialogDescription>
            Review and merge duplicate contacts to keep your data clean.
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
              No duplicate contacts found. Your contact list is clean!
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
                  key={`${pair.contact1Id}-${pair.contact2Id}`}
                  className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition"
                  onClick={() => handleSelectPair(pair)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{pair.contact1Name}</div>
                      {pair.contact1Email && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {pair.contact1Email}
                        </div>
                      )}
                    </div>
                    <div className="mx-4 text-muted-foreground">↔</div>
                    <div className="flex-1">
                      <div className="font-medium">{pair.contact2Name}</div>
                      {pair.contact2Email && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {pair.contact2Email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {pair.matchType === 'exact_email' ? 'Exact Email Match' : 'Similar Name'}
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
                Select which contact to keep. All related records will be transferred to the winner.
                The other contact will be deleted.
              </AlertDescription>
            </Alert>

            <RadioGroup value={winnerId || ''} onValueChange={setWinnerId}>
              <div className="grid grid-cols-2 gap-4">
                {/* Contact 1 */}
                <div
                  className={`border rounded-lg p-4 ${
                    winnerId === selectedPair.contact1Id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={selectedPair.contact1Id}
                      id="contact1"
                      className="mt-1"
                    />
                    <Label htmlFor="contact1" className="flex-1 cursor-pointer">
                      <div className="font-medium mb-2">{selectedPair.contact1Name}</div>
                      {selectedPair.contact1Email && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <Mail className="h-3 w-3" />
                          {selectedPair.contact1Email}
                        </div>
                      )}
                    </Label>
                  </div>
                </div>

                {/* Contact 2 */}
                <div
                  className={`border rounded-lg p-4 ${
                    winnerId === selectedPair.contact2Id
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={selectedPair.contact2Id}
                      id="contact2"
                      className="mt-1"
                    />
                    <Label htmlFor="contact2" className="flex-1 cursor-pointer">
                      <div className="font-medium mb-2">{selectedPair.contact2Name}</div>
                      {selectedPair.contact2Email && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <Mail className="h-3 w-3" />
                          {selectedPair.contact2Email}
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
                Merge Contacts
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

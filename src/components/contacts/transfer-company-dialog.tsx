"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, ArrowRight } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useTransferContact } from "@/hooks/use-transfer-contact";
import type { ContactWithCompany } from "@/hooks/use-contact-detail";
import type { Client } from "@/lib/types";

interface TransferCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactWithCompany;
}

export function TransferCompanyDialog({ 
  open, 
  onOpenChange, 
  contact 
}: TransferCompanyDialogProps) {
  const [newCompanyId, setNewCompanyId] = useState<string>("");
  const [reason, setReason] = useState("");

  const { clients, isLoading: clientsLoading } = useClients();
  const { mutateAsync: transferContact, isPending } = useTransferContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCompanyId) {
      return;
    }

    try {
      await transferContact({
        contactId: contact.id,
        newCompanyId,
        reason: reason || undefined,
      });

      // Reset form and close
      setNewCompanyId("");
      setReason("");
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Transfer error:', error);
    }
  };

  const handleCancel = () => {
    setNewCompanyId("");
    setReason("");
    onOpenChange(false);
  };

  // Filter out current company from selection
  const availableClients = clients?.filter((c: Client) => c.id !== contact.client_id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Transfer Contact to Another Company</DialogTitle>
            <DialogDescription>
              Move {contact.first_name} {contact.last_name} to a different company. 
              This will preserve their employment history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Company */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Company</p>
                <p className="font-semibold">
                  {contact.client?.company_name || "No company"}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* New Company */}
            <div className="space-y-2">
              <Label htmlFor="new-company">New Company *</Label>
              <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                <SelectTrigger id="new-company">
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading companies...
                    </SelectItem>
                  ) : availableClients.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No other companies available
                    </SelectItem>
                  ) : (
                    availableClients.map((client: Client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The contact will become associated with this company
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Transfer (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Career advancement, company reorganization..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
              <p className="text-blue-900 dark:text-blue-100">
                ✓ Employment history will be preserved<br />
                ✓ Previous company will show in history tab<br />
                ✓ Activities will remain linked to this contact
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newCompanyId || isPending}
            >
              {isPending ? "Transferring..." : "Transfer Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



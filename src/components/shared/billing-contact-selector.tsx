'use client';

/**
 * Billing Contact Selector Component
 * Allows users to set a billing contact or confirm the company email for invoicing
 */

import { useContacts } from '@/hooks/use-contacts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingContactSelectorProps {
  clientId: string;
  clientEmail: string;
  billingContactId?: string | null;
  billingEmailConfirmed: boolean;
  onBillingContactChange: (contactId: string | null) => void;
  onBillingEmailConfirmedChange: (confirmed: boolean) => void;
  disabled?: boolean;
  error?: string;
  compact?: boolean;
}

export function BillingContactSelector({
  clientId,
  clientEmail,
  billingContactId,
  billingEmailConfirmed,
  onBillingContactChange,
  onBillingEmailConfirmedChange,
  disabled,
  error,
  compact = false,
}: BillingContactSelectorProps) {
  const { data: contacts, isLoading } = useContacts(clientId);

  // When checkbox is checked, clear billing contact
  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      onBillingContactChange(null);
    }
    onBillingEmailConfirmedChange(checked);
  };

  // When contact is selected, uncheck the checkbox
  const handleContactChange = (value: string) => {
    if (value === '__none__') {
      onBillingContactChange(null);
    } else {
      onBillingContactChange(value);
      onBillingEmailConfirmedChange(false);
    }
  };

  // Filter contacts that have valid emails
  const contactsWithEmail = contacts?.filter(
    (c) => c.email && c.email.trim() !== ''
  ) || [];

  const showValidationWarning = !billingContactId && !billingEmailConfirmed;

  // Get the selected contact's email for display
  const selectedContact = contactsWithEmail.find(c => c.id === billingContactId);
  const billingEmail = billingEmailConfirmed
    ? clientEmail
    : selectedContact?.email || null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading contacts...
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Current billing email display */}
        {billingEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Billing email:</span>
            <span className="font-medium">{billingEmail}</span>
          </div>
        )}

        {/* Checkbox for company email */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="billing-email-same"
            checked={billingEmailConfirmed}
            onCheckedChange={handleCheckboxChange}
            disabled={disabled}
          />
          <Label
            htmlFor="billing-email-same"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Use company email ({clientEmail})
          </Label>
        </div>

        {/* Contact dropdown */}
        {!billingEmailConfirmed && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select
              value={billingContactId || '__none__'}
              onValueChange={handleContactChange}
              disabled={disabled}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select billing contact..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No billing contact</SelectItem>
                {contactsWithEmail.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} ({contact.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Warning */}
        {showValidationWarning && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Set a billing contact to send invoices
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current billing status */}
      {billingEmail && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          <Mail className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Invoices will be sent to:
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">{billingEmail}</p>
          </div>
        </div>
      )}

      {/* Option 1: Use main email */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="billing-email-same"
          checked={billingEmailConfirmed}
          onCheckedChange={handleCheckboxChange}
          disabled={disabled}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="billing-email-same"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Use company email for billing
          </Label>
          <p className="text-sm text-muted-foreground">
            Send invoices to {clientEmail}
          </p>
        </div>
      </div>

      {/* Option 2: Select billing contact */}
      <div className={cn('space-y-2', billingEmailConfirmed && 'opacity-50')}>
        <Label className="text-sm font-medium">Or select a billing contact</Label>
        <Select
          value={billingContactId || '__none__'}
          onValueChange={handleContactChange}
          disabled={disabled || billingEmailConfirmed}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select billing contact..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No billing contact</SelectItem>
            {contactsWithEmail.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName} - {contact.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {contactsWithEmail.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No contacts with email addresses found. Add contacts first.
          </p>
        )}
      </div>

      {/* Validation warning */}
      {showValidationWarning && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please select a billing contact or confirm the company email to send invoices.
          </p>
        </div>
      )}

      {/* Error display */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

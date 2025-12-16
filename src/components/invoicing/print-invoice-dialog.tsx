"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import { PrintableInvoice } from './printable-invoice';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  notes?: string;
  terms_and_conditions?: string;
  payment_method?: string;
  client?: {
    id: string;
    company_name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  line_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    tax_rate?: number;
  }>;
}

interface PrintInvoiceDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyInfo?: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
}

export function PrintInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  companyInfo,
}: PrintInvoiceDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice.invoice_number}`,
    onAfterPrint: () => {
      // Optional: track print event or close dialog
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Print Invoice {invoice.invoice_number}</span>
          </DialogTitle>
          <DialogDescription>
            Preview your invoice before printing. Click Print to send to your printer.
          </DialogDescription>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto border rounded-lg bg-gray-100 p-4">
          <div className="transform scale-[0.7] origin-top">
            <PrintableInvoice
              ref={printRef}
              invoice={invoice}
              companyInfo={companyInfo}
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PrintInvoiceDialog;

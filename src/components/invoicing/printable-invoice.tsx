"use client";

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate?: number;
}

interface InvoiceClient {
  id: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface PrintableInvoiceProps {
  invoice: {
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
    client?: InvoiceClient;
    line_items?: InvoiceLineItem[];
  };
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

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, companyInfo }, ref) => {
    // Default company info if not provided
    const company = companyInfo || {
      name: 'My ROI Home',
      address: '',
      city: '',
      state: 'FL',
      zip: '',
      phone: '',
      email: '',
      website: '',
    };

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        draft: 'DRAFT',
        sent: 'SENT',
        viewed: 'VIEWED',
        partially_paid: 'PARTIALLY PAID',
        paid: 'PAID',
        overdue: 'OVERDUE',
        cancelled: 'CANCELLED',
        void: 'VOID',
      };
      return labels[status] || status.toUpperCase();
    };

    const getPaymentMethodLabel = (method?: string) => {
      const labels: Record<string, string> = {
        cod: 'Cash on Delivery',
        stripe_link: 'Credit Card',
        net_terms: 'Net Terms',
      };
      return method ? labels[method] || method : 'N/A';
    };

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[8.5in] mx-auto font-sans print:p-0 print:max-w-none"
        style={{ minHeight: '11in' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6">
          <div>
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-16 mb-2" />
            ) : (
              <h1 className="text-3xl font-bold text-gray-800">{company.name}</h1>
            )}
            {company.address && (
              <p className="text-sm text-gray-600">{company.address}</p>
            )}
            {(company.city || company.state || company.zip) && (
              <p className="text-sm text-gray-600">
                {[company.city, company.state, company.zip].filter(Boolean).join(', ')}
              </p>
            )}
            {company.phone && (
              <p className="text-sm text-gray-600">Phone: {company.phone}</p>
            )}
            {company.email && (
              <p className="text-sm text-gray-600">Email: {company.email}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">INVOICE</h2>
            <p className="text-lg font-semibold text-gray-700">
              {invoice.invoice_number}
            </p>
            {invoice.status !== 'draft' && (
              <div className={`mt-2 inline-block px-3 py-1 rounded text-sm font-semibold ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                invoice.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getStatusLabel(invoice.status)}
              </div>
            )}
          </div>
        </div>

        {/* Bill To & Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Bill To
            </h3>
            <div className="text-gray-800">
              <p className="font-semibold text-lg">
                {invoice.client?.company_name || 'N/A'}
              </p>
              {invoice.client?.address && (
                <p className="text-sm">{invoice.client.address}</p>
              )}
              {(invoice.client?.city || invoice.client?.state || invoice.client?.zip) && (
                <p className="text-sm">
                  {[invoice.client?.city, invoice.client?.state, invoice.client?.zip]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {invoice.client?.email && (
                <p className="text-sm text-gray-600 mt-1">{invoice.client.email}</p>
              )}
              {invoice.client?.phone && (
                <p className="text-sm text-gray-600">{invoice.client.phone}</p>
              )}
            </div>
          </div>
          <div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="text-gray-500 py-1">Invoice Date:</td>
                    <td className="text-right font-medium">
                      {format(new Date(invoice.invoice_date), 'MMMM dd, yyyy')}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-1">Due Date:</td>
                    <td className="text-right font-medium">
                      {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-500 py-1">Payment Method:</td>
                    <td className="text-right font-medium">
                      {getPaymentMethodLabel(invoice.payment_method)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                <th className="text-right py-3 px-4 font-semibold w-20">Qty</th>
                <th className="text-right py-3 px-4 font-semibold w-28">Unit Price</th>
                <th className="text-right py-3 px-4 font-semibold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items && invoice.line_items.length > 0 ? (
                invoice.line_items.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="py-3 px-4 border-b border-gray-200">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-right border-b border-gray-200">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right border-b border-gray-200">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-3 px-4 text-right border-b border-gray-200 font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-600">Subtotal:</td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                </tr>
                {invoice.discount_amount && invoice.discount_amount > 0 && (
                  <tr>
                    <td className="py-2 text-gray-600">Discount:</td>
                    <td className="py-2 text-right font-medium text-red-600">
                      -{formatCurrency(invoice.discount_amount)}
                    </td>
                  </tr>
                )}
                {invoice.tax_amount > 0 && (
                  <tr>
                    <td className="py-2 text-gray-600">
                      Tax{invoice.tax_rate ? ` (${(invoice.tax_rate * 100).toFixed(1)}%)` : ''}:
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(invoice.tax_amount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-800">
                  <td className="py-3 text-lg font-bold">Total:</td>
                  <td className="py-3 text-right text-lg font-bold">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                </tr>
                {invoice.amount_paid > 0 && (
                  <>
                    <tr>
                      <td className="py-2 text-gray-600">Amount Paid:</td>
                      <td className="py-2 text-right font-medium text-green-600">
                        -{formatCurrency(invoice.amount_paid)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="py-3 font-bold text-lg">Balance Due:</td>
                      <td className="py-3 text-right font-bold text-lg text-gray-800">
                        {formatCurrency(invoice.amount_due)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms_and_conditions) && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            {invoice.notes && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms_and_conditions && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Terms & Conditions
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {invoice.terms_and_conditions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          {company.website && <p className="mt-1">{company.website}</p>}
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: letter;
              margin: 0.5in;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;

/**
 * Invoice Email Template
 * Generates HTML email for sending invoices to clients
 */

interface InvoiceEmailData {
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  dueDate: string;
  viewUrl: string;
  orgName: string;
  orgEmail?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate HTML email for invoice
 */
export function generateInvoiceEmailHtml(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    clientName,
    totalAmount,
    dueDate,
    viewUrl,
    orgName,
    orgEmail,
    lineItems = [],
  } = data;

  const lineItemsHtml = lineItems.length > 0
    ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb;">Description</th>
            <th style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">Qty</th>
            <th style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">Price</th>
            <th style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems.map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.description)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.unitPrice)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; color: #111827;">${escapeHtml(orgName)}</h1>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Invoice ${invoiceNumber}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                Dear ${escapeHtml(clientName)},
              </p>
              <p style="margin: 16px 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Please find attached your invoice for ${formatCurrency(totalAmount)}.
                Payment is due by <strong>${formatDate(dueDate)}</strong>.
              </p>
            </td>
          </tr>

          <!-- Invoice Summary -->
          <tr>
            <td style="padding: 20px 40px;">
              <table style="width: 100%; background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table style="width: 100%;">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Invoice Number</td>
                        <td style="text-align: right; font-weight: 600; color: #111827;">${invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Due Date</td>
                        <td style="text-align: right; font-weight: 600; color: #111827; padding-top: 8px;">${formatDate(dueDate)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="color: #111827; font-size: 18px; font-weight: 600; padding-top: 8px;">Amount Due</td>
                        <td style="text-align: right; font-size: 24px; font-weight: 700; color: #111827; padding-top: 8px;">${formatCurrency(totalAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${lineItemsHtml ? `
          <!-- Line Items -->
          <tr>
            <td style="padding: 0 40px 20px;">
              ${lineItemsHtml}
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center;">
              <a href="${viewUrl}"
                 style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View & Pay Invoice
              </a>
              <p style="margin: 16px 0 0; font-size: 14px; color: #6b7280;">
                Click the button above to view the full invoice and make a secure payment.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                If you have any questions about this invoice, please contact us at
                <a href="mailto:${orgEmail || 'support@example.com'}" style="color: #2563eb; text-decoration: none;">
                  ${orgEmail || 'our support team'}
                </a>
              </p>
              <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                This is an automated message from ${escapeHtml(orgName)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of invoice email
 */
export function generateInvoiceEmailText(data: InvoiceEmailData): string {
  const {
    invoiceNumber,
    clientName,
    totalAmount,
    dueDate,
    viewUrl,
    orgName,
  } = data;

  // Plain text doesn't need HTML escaping, but sanitize for safety
  const safeOrgName = String(orgName).replace(/[<>]/g, '');
  const safeClientName = String(clientName).replace(/[<>]/g, '');

  return `
${safeOrgName}
Invoice ${invoiceNumber}

Dear ${safeClientName},

Please find your invoice for ${formatCurrency(totalAmount)}.
Payment is due by ${formatDate(dueDate)}.

Invoice Number: ${invoiceNumber}
Due Date: ${formatDate(dueDate)}
Amount Due: ${formatCurrency(totalAmount)}

View and pay your invoice online:
${viewUrl}

If you have any questions about this invoice, please contact us.

Thank you for your business!

${safeOrgName}
  `.trim();
}

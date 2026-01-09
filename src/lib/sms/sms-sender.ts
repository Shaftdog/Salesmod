/**
 * SMS Sender using Twilio
 * Handles sending SMS messages with rate limiting and logging
 */

import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Check if Twilio is configured
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}

// Create Twilio client (lazy initialization)
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (!isTwilioConfigured()) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export interface SmsPayload {
  to: string; // Phone number with country code (e.g., +1234567890)
  body: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Format phone number to E.164 format
 * Assumes US numbers if no country code provided
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If already has +, assume it's properly formatted
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If 10 digits, assume US number
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  }

  // If 11 digits starting with 1, assume US number
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }

  // Otherwise, just add + prefix
  return '+' + cleaned;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: + followed by 10-15 digits
  return /^\+\d{10,15}$/.test(formatted);
}

/**
 * Send an SMS message
 */
export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  const client = getTwilioClient();

  if (!client) {
    console.log('[SMS] Twilio not configured - simulating send');
    return {
      success: true,
      simulated: true,
      messageId: 'simulated-' + Date.now(),
    };
  }

  const formattedTo = formatPhoneNumber(payload.to);

  if (!isValidPhoneNumber(formattedTo)) {
    return {
      success: false,
      error: `Invalid phone number format: ${payload.to}`,
    };
  }

  try {
    const message = await client.messages.create({
      body: payload.body,
      from: fromNumber,
      to: formattedTo,
    });

    console.log(`[SMS] Sent to ${formattedTo}: ${message.sid}`);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS] Failed to send:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate invoice SMS message
 */
export function generateInvoiceSmsMessage(params: {
  invoiceNumber: string;
  totalAmount: number;
  viewUrl: string;
  orgName?: string;
}): string {
  const { invoiceNumber, totalAmount, viewUrl, orgName } = params;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalAmount);

  const from = orgName ? ` from ${orgName}` : '';

  return `Invoice ${invoiceNumber}${from} for ${formattedAmount} is ready. View & pay: ${viewUrl}`;
}

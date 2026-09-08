/**
 * paymentService.ts
 *
 * Single entry point your screens call, regardless of payment method.
 * Card payments go through Paynow's hosted web checkout (opened in a WebView).
 * EcoCash goes through Paynow's mobile money API (direct USSD prompt, no redirect).
 * Both are proxied through Supabase Edge Functions.
 */

const SUPABASE_URL = 'https://vdhypfeplqtsvdddshee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaHlwZmVwbHF0c3ZkZGRzaGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODcyNjcsImV4cCI6MjA5ODI2MzI2N30.yiUaSGFBSokmx4EOEVaYVY72R-hG72EkTirmXVl8Ec8';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

const defaultHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

// ---------- Types ----------

export type PaymentMethod = 'card' | 'ecocash';

export interface ChargeRequest {
  amount: number;          // in cents/smallest currency unit
  currency: string;        // e.g. 'usd'
  method: PaymentMethod;
  ecocashPhoneNumber?: string; // required if method === 'ecocash'
  idempotencyKey: string;      // generate a UUID per attempt, prevents double charges
  description?: string;
}

export interface ChargeResult {
  success: boolean;
  status: 'succeeded' | 'pending' | 'failed';
  reference: string;   // transaction id to store / poll on
  message?: string;
}

export interface CardPaymentInitResult {
  success: boolean;
  status: 'pending' | 'failed';
  reference: string;
  redirectUrl?: string; // open this in a WebView
  message?: string;
}

// ---------- Card payments (via Paynow's hosted web checkout, opened in a WebView) ----------

/**
 * Initiates a card payment via Paynow. Returns a redirectUrl —
 * open this in a WebView so the user can enter their Visa/Mastercard
 * details on Paynow's hosted checkout page.
 */
export async function initiateCardPayment(
  amount: number,
  idempotencyKey: string,
  description?: string,
  userId?: string
): Promise<CardPaymentInitResult> {
  const res = await fetch(`${FUNCTIONS_URL}/card-payment-initiate`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ amount, idempotencyKey, description, userId }),
  });

  if (!res.ok) {
    throw new Error(`Card payment initiation failed: ${res.status}`);
  }

  return res.json();
}

// ---------- EcoCash (direct mobile money request via Paynow) ----------

/**
 * Initiates an EcoCash mobile money charge.
 * Triggers a USSD prompt on the user's phone asking them to enter their PIN.
 * Returns quickly with a "pending" status — poll or listen for a webhook update.
 */
export async function initiateEcoCashPayment(
  request: ChargeRequest
): Promise<ChargeResult> {
  const res = await fetch(`${FUNCTIONS_URL}/ecocash-initiate`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`EcoCash initiation failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Poll for status until the user confirms (or it times out).
 * Works for BOTH EcoCash and card references, since both write to the
 * same `transactions` table via the same ecocash-status function.
 */
export async function pollPaymentStatus(
  reference: string,
  { intervalMs = 3000, timeoutMs = 90000 } = {}
): Promise<ChargeResult> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(
      `${FUNCTIONS_URL}/ecocash-status?reference=${encodeURIComponent(reference)}`,
      { headers: defaultHeaders }
    );
    const result: ChargeResult = await res.json();

    if (result.status !== 'pending') {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    success: false,
    status: 'failed',
    reference,
    message: 'Payment confirmation timed out. Ask the user to check their phone.',
  };
}

// Kept as an alias so existing EcoCash component code doesn't need changes
export const pollEcoCashStatus = pollPaymentStatus;

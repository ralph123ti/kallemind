// supabase/functions/card-payment-initiate/index.ts
//
// Deploy: supabase functions deploy card-payment-initiate
// Uses the SAME secrets as ecocash-initiate:
//   PAYNOW_INTEGRATION_ID, PAYNOW_INTEGRATION_KEY
//
// Unlike EcoCash (which sends a USSD prompt directly), card payments in Paynow
// work via redirect: the user is sent to a Paynow-hosted page to enter their
// card details (Visa/Mastercard), and Paynow's page may also show Apple Pay /
// Google Pay buttons if enabled on their end. We open that page in an in-app
// WebView rather than the native platform wallet UI.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const PAYNOW_ID = Deno.env.get('PAYNOW_INTEGRATION_ID')!;
const PAYNOW_KEY = Deno.env.get('PAYNOW_INTEGRATION_KEY')!;
const PAYNOW_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateHash(values: Record<string, string>, key: string): Promise<string> {
  const message = Object.values(values).join('') + key;
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, idempotencyKey, description, userId, authEmail } = await req.json();

    if (!amount || !idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'amount and idempotencyKey are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/paynow-webhook`;
    const returnUrl = 'https://your-app.example.com/payment-return'; // shown briefly after payment; can be a simple "you can close this" page

    const fields: Record<string, string> = {
      id: PAYNOW_ID,
      reference: idempotencyKey,
      amount: (amount / 100).toFixed(2),
      additionalinfo: description ?? 'Payment',
      returnurl: returnUrl,
      resulturl: resultUrl,
      authemail: authEmail ?? '',
      status: 'Message',
    };

    const hash = await generateHash(fields, PAYNOW_KEY);
    const body = new URLSearchParams({ ...fields, hash }).toString();

    const paynowRes = await fetch(PAYNOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const text = await paynowRes.text();
    const parsed = Object.fromEntries(new URLSearchParams(text));

    if (parsed.status?.toLowerCase() !== 'ok') {
      await supabase.from('transactions').insert({
        reference: idempotencyKey,
        user_id: userId ?? null,
        method: 'card',
        amount,
        currency: 'usd',
        status: 'failed',
        description,
      });

      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          reference: idempotencyKey,
          message: parsed.error ?? 'Paynow rejected the request',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('transactions').insert({
      reference: parsed.pollurl ?? idempotencyKey,
      user_id: userId ?? null,
      method: 'card',
      amount,
      currency: 'usd',
      status: 'pending',
      description,
    });

    // The app opens this URL in a WebView — this is the Paynow-hosted checkout page
    return new Response(
      JSON.stringify({
        success: true,
        status: 'pending',
        reference: parsed.pollurl ?? idempotencyKey,
        redirectUrl: parsed.browserurl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

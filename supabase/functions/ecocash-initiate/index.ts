// Deploy: supabase functions deploy ecocash-initiate
// Secrets needed:
//   supabase secrets set PAYNOW_INTEGRATION_ID=your_id
//   supabase secrets set PAYNOW_INTEGRATION_KEY=your_key

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const PAYNOW_ID = Deno.env.get('PAYNOW_INTEGRATION_ID')!;
const PAYNOW_KEY = Deno.env.get('PAYNOW_INTEGRATION_KEY')!;
const PAYNOW_URL = 'https://www.paynow.co.zw/interface/remotetransaction';

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
    const { amount, ecocashPhoneNumber, idempotencyKey, description, userId } = await req.json();

    if (!amount || !ecocashPhoneNumber || !idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'amount, ecocashPhoneNumber and idempotencyKey are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resultUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/paynow-webhook`;
    const returnUrl = 'https://your-app.example.com/payment-return';

    const fields: Record<string, string> = {
      id: PAYNOW_ID,
      reference: idempotencyKey,
      amount: (amount / 100).toFixed(2),
      additionalinfo: description ?? 'Payment',
      returnurl: returnUrl,
      resulturl: resultUrl,
      authemail: '',
      phone: ecocashPhoneNumber,
      method: 'ecocash',
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
        method: 'ecocash',
        amount,
        currency: 'usd',
        status: 'failed',
        ecocash_phone: ecocashPhoneNumber,
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
      method: 'ecocash',
      amount,
      currency: 'usd',
      status: 'pending',
      ecocash_phone: ecocashPhoneNumber,
      description,
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: 'pending',
        reference: parsed.pollurl ?? idempotencyKey,
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
// Deploy: supabase functions deploy create-payment-intent
// Secrets needed (set once): supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//
// Called from the app as:
//   POST https://<project-ref>.supabase.co/functions/v1/create-payment-intent

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency, idempotencyKey, userId } = await req.json();

    if (!amount || !currency || !idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'amount, currency and idempotencyKey are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const intent = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey }
    );

    await supabase.from('transactions').insert({
      reference: intent.id,
      user_id: userId ?? null,
      method: 'card',
      amount,
      currency,
      status: 'pending',
    });

    return new Response(JSON.stringify({ clientSecret: intent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
// Deploy: supabase functions deploy paynow-webhook --no-verify-jwt
//   (--no-verify-jwt is required — Paynow calls this directly, with no Supabase auth token)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const PAYNOW_KEY = Deno.env.get('PAYNOW_INTEGRATION_KEY')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function generateHash(values: Record<string, string>, key: string): Promise<string> {
  const message = Object.values(values).join('') + key;
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

serve(async (req) => {
  try {
    const bodyText = await req.text();
    const params = Object.fromEntries(new URLSearchParams(bodyText));
    const { hash, pollurl, reference, status } = params;

    const { hash: _omit, ...fieldsToVerify } = params;
    const expectedHash = await generateHash(fieldsToVerify, PAYNOW_KEY);

    if (hash !== expectedHash) {
      console.error('Paynow webhook hash mismatch — possible spoofed request');
      return new Response('Invalid hash', { status: 400 });
    }

    const newStatus =
      status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'confirmed'
        ? 'succeeded'
        : status?.toLowerCase() === 'cancelled' || status?.toLowerCase() === 'failed'
        ? 'failed'
        : 'pending';

    await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('reference', pollurl ?? reference);

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Error', { status: 500 });
  }
});
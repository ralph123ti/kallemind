// Deploy: supabase functions deploy ecocash-status
//
// Called from the app as:
//   GET https://<project-ref>.supabase.co/functions/v1/ecocash-status?reference=...

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  const url = new URL(req.url);
  const reference = url.searchParams.get('reference');

  if (!reference) {
    return new Response(JSON.stringify({ error: 'reference is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('status, reference')
    .eq('reference', reference)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ success: false, status: 'failed', reference, message: 'Transaction not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: data.status === 'succeeded',
      status: data.status,
      reference: data.reference,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
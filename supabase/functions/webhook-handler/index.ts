import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'HEAD') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Ping/Verification support
    if (req.method === 'GET' || req.method === 'HEAD') {
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const webhookSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing environment variables');
        }

        // 0. Validate Secret (Security Check)
        const signature = req.headers.get('x-abacatepay-signature') || req.headers.get('x-webhook-signature');
        const isSecretValid = !webhookSecret || signature === webhookSecret;

        if (webhookSecret && !isSecretValid) {
            console.warn(`[Webhook] Signature mismatch. Received: ${signature}`);
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.json();

        const eventId = body.eventId || body.id;
        const eventType = body.event;
        const data = body.data;

        if (!eventId || !eventType || !data) {
            return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
        }

        // 1. Idempotency Check
        const { data: existingEvent } = await supabase
            .from('processed_webhooks')
            .select('id')
            .eq('event_id', eventId)
            .maybeSingle();

        if (existingEvent) {
            return new Response(JSON.stringify({ success: true, message: 'Already processed' }), { status: 200 });
        }

        // 2. Handle Payment
        if (eventType === 'billing.paid') {
            // Security check for real payment events
            if (!isSecretValid) {
                console.error('[Security] Blocking billing.paid due to invalid secret signature.');
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            const billingId = data.id;

            // Find transaction
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('provider_session_id', billingId)
                .maybeSingle();

            if (txError || !transaction) {
                console.error('Transaction not found for billing:', billingId);
                return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 });
            }

            if (transaction.status !== 'completed') {
                // Update transaction
                await supabase
                    .from('transactions')
                    .update({ status: 'completed', updated_at: new Date().toISOString() })
                    .eq('id', transaction.id);

                // Add credits to profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', transaction.user_id)
                    .single();

                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({ credits: profile.credits + transaction.credits })
                        .eq('id', transaction.user_id);
                }

                console.log(`Successfully processed payment for ${transaction.user_id}: ${transaction.credits} credits added.`);
            }
        }

        // 3. Mark as Processed
        await supabase.from('processed_webhooks').insert({
            event_id: eventId,
            event_type: eventType,
            provider: 'abacatepay',
            payload: body
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

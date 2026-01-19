import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;
const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMercadoPagoSignature(
    xSignature: string,
    requestId: string,
    payload: string
): Promise<boolean> {
    try {
        const parts = xSignature.split(',');
        let ts = '';
        let v1 = '';

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key.trim() === 'ts') ts = value.trim();
            if (key.trim() === 'v1') v1 = value.trim();
        });

        if (!ts || !v1) {
            console.error('Invalid signature format');
            return false;
        }

        const now = Math.floor(Date.now() / 1000);
        const maxAge = 300;
        if (Math.abs(now - parseInt(ts)) > maxAge) {
            console.error('Signature expired');
            return false;
        }

        const data = `${requestId}${payload}${ts}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhookSecret);
        const dataToHash = encoder.encode(data);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, dataToHash);
        const expectedV1 = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return v1 === expectedV1;
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
}

serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const xRequestId = req.headers.get('x-request-id');
        const xSignature = req.headers.get('x-signature');
        
        if (!xRequestId || !xSignature) {
            console.error('Missing required headers');
            return new Response(JSON.stringify({ error: 'Missing required headers' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const rawBody = await req.text();

        const isValid = await verifyMercadoPagoSignature(xSignature, xRequestId, rawBody);
        if (!isValid) {
            console.error('Invalid signature');
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const payload = JSON.parse(rawBody);
        const { type, data } = payload;

        if (type === 'payment' && data.status === 'approved') {
            const paymentId = data.id;
            
            const paymentResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${mercadoPagoAccessToken}`
                    }
                }
            );

            if (!paymentResponse.ok) {
                console.error('Failed to fetch payment details');
                return new Response(JSON.stringify({ error: 'Failed to fetch payment' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const paymentData = await paymentResponse.json();
            const userId = paymentData.external_reference;
            const preferenceId = paymentData.preference_id;
            const metadata = paymentData.metadata || {};
            const creditsToAdd = parseInt(metadata.credits) || 0;
            const packageType = metadata.package_type || 'single';

            if (!userId) {
                console.error('No user_id in payment');
                return new Response(JSON.stringify({ error: 'No user_id found' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!preferenceId) {
                console.error('No preference_id in payment');
                return new Response(JSON.stringify({ error: 'No preference_id found' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const { data: transaction, error: transactionError } = await supabase
                .from('transactions')
                .select('*')
                .eq('provider_id', preferenceId)
                .eq('user_id', userId)
                .maybeSingle();

            if (transactionError || !transaction) {
                console.error('Transaction not found');
                return new Response(JSON.stringify({ error: 'Transaction not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (transaction.status === 'completed') {
                console.log('Transaction already processed');
                return new Response(JSON.stringify({ message: 'Already processed' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const { error: updateTransactionError } = await supabase
                .from('transactions')
                .update({ status: 'completed' })
                .eq('id', transaction.id);

            if (updateTransactionError) {
                console.error('Failed to update transaction:', updateTransactionError);
                return new Response(JSON.stringify({ error: 'Failed to update transaction' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (profileError || !profile) {
                console.error('Profile not found');
                return new Response(JSON.stringify({ error: 'Profile not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits + creditsToAdd })
                .eq('id', userId);

            if (updateProfileError) {
                console.error('Failed to update profile credits:', updateProfileError);
                return new Response(JSON.stringify({ error: 'Failed to update credits' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`);
            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Payment processed successfully' 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Event received' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in webhook handler:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
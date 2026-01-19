import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { CreateCheckoutRequest, CreateCheckoutResponse } from '../types/index.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PACKAGES = {
    single: { credits: 1, amount: 9.90 },
    pack5: { credits: 5, amount: 39.90 },
    pack10: { credits: 10, amount: 69.90 }
};

serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { user_id, package_type }: CreateCheckoutRequest = await req.json();

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (user.id !== user_id) {
            return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const selectedPackage = PACKAGES[package_type];
        if (!selectedPackage) {
            return new Response(JSON.stringify({ error: 'Invalid package type' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mercadoPagoAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [{
                    title: `${selectedPackage.credits} Credits - FinGlow`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: selectedPackage.amount
                }],
                back_urls: {
                    success: `${req.headers.get('origin')}/payment/success`,
                    failure: `${req.headers.get('origin')}/payment/failure`,
                    pending: `${req.headers.get('origin')}/payment/pending`
                },
                auto_return: 'approved',
                external_reference: user_id,
                metadata: {
                    user_id,
                    package_type,
                    credits: selectedPackage.credits
                }
            })
        });

        if (!preferenceResponse.ok) {
            const errorText = await preferenceResponse.text();
            console.error('Mercado Pago API error:', errorText);
            return new Response(JSON.stringify({ error: 'Failed to create checkout' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const preferenceData = await preferenceResponse.json();

        const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .insert({
                user_id,
                amount: selectedPackage.amount,
                status: 'pending',
                provider_id: preferenceData.id,
                package_type
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Failed to create transaction:', transactionError);
            return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const responseBody: CreateCheckoutResponse = {
            success: true,
            checkout_url: preferenceData.init_point,
            transaction_id: transaction.id
        };

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in create-checkout:', error);
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
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PACKAGES = {
    single: { credits: 1, amount: 9.90, name: '1 Crédito' },
    pack5: { credits: 5, amount: 39.90, name: '5 Créditos' },
    pack10: { credits: 10, amount: 69.90, name: '10 Créditos' }
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const abacatepayApiKey = Deno.env.get('ABACATEPAY_API_KEY')!;

        if (!supabaseUrl || !supabaseServiceKey || !abacatepayApiKey) {
            throw new Error('Missing environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2. Parse Body
        const { package_type, success_url } = await req.json();
        const selectedPackage = PACKAGES[package_type as keyof typeof PACKAGES];

        if (!selectedPackage) {
            return new Response(JSON.stringify({ error: 'Invalid package type' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Create AbacatePay Billing
        const origin = req.headers.get('origin') || 'https://finglow-ai.vercel.app';
        const finalSuccessUrl = success_url || `${origin}/#/dashboard?payment=success`;

        const billingPayload = {
            frequency: "ONE_TIME",
            methods: ["PIX", "CREDIT_CARD"],
            products: [
                {
                    externalId: package_type,
                    name: `FinGlow - ${selectedPackage.name}`,
                    quantity: 1,
                    price: Math.round(selectedPackage.amount * 100), // in cents
                    description: `Pacote com ${selectedPackage.credits} crédito${selectedPackage.credits > 1 ? 's' : ''} para análise de IA`
                }
            ],
            returnUrl: finalSuccessUrl,
            completionUrl: finalSuccessUrl,
            customer: {
                name: user.user_metadata?.full_name || user.user_metadata?.name || 'FinGlow User',
                email: user.email,
            }
        };

        const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${abacatepayApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billingPayload)
        });

        const abacateData = await abacateResponse.json();
        const { url: checkoutUrl, id: billingId } = abacateData.data || {};

        if (!abacateResponse.ok || !checkoutUrl) {
            const errorMsg = abacateData.message || abacateData.error || 'Failed to create billing';
            console.error('AbacatePay error:', abacateData);
            return new Response(JSON.stringify({
                success: false,
                error: errorMsg,
                details: abacateData
            }), {
                status: abacateResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Save Transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                amount: selectedPackage.amount,
                credits: selectedPackage.credits,
                package_type,
                status: 'pending',
                provider: 'abacatepay',
                provider_session_id: billingId
            })
            .select()
            .single();

        if (txError) {
            console.error('Database error:', txError);
            throw new Error('Failed to save transaction');
        }

        return new Response(JSON.stringify({
            success: true,
            checkout_url: checkoutUrl,
            session_id: billingId,
            transaction_id: transaction.id
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Create checkout error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal server error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

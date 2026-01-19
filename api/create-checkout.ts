import { CreateCheckoutRequest, CreateCheckoutResponse, PACKAGES } from '../types';
import { verifyToken, createTransaction, logAudit } from '../lib/supabase';

// ============================================================================
// Configuration
// ============================================================================

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v1';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// Vercel API Route Handler
// ============================================================================

export const config = {
    runtime: 'edge',
    maxDuration: 30,
};

export default async function handler(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // ========================================================================
        // 1. Authenticate User
        // ========================================================================
        const authHeader = request.headers.get('Authorization');
        const auth = await verifyToken(authHeader);

        if (!auth) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing authentication token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[create-checkout] User ${auth.userId} authenticated`);

        // ========================================================================
        // 2. Parse Request Body
        // ========================================================================
        const body: CreateCheckoutRequest = await request.json();
        const { package_type, success_url, cancel_url } = body;

        // Validate package type
        if (!package_type || !PACKAGES[package_type]) {
            return new Response(
                JSON.stringify({
                    error: 'Bad Request',
                    message: 'Invalid package type. Valid options: single, pack5, pack10'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const selectedPackage = PACKAGES[package_type];

        console.log(`[create-checkout] Creating AbacatePay billing for ${package_type}: R$${selectedPackage.amount}`);

        // ========================================================================
        // 3. Initialize AbacatePay
        // ========================================================================
        if (!ABACATEPAY_API_KEY) {
            throw new Error('ABACATEPAY_API_KEY is not configured');
        }

        // ========================================================================
        // 4. Get Origin for Redirect URLs
        // ========================================================================
        const origin = request.headers.get('origin') || 'http://localhost:5173';
        // AbacatePay uses completionUrl for success
        const finalSuccessUrl = success_url || `${origin}/#/dashboard?payment=success`;
        // const finalCancelUrl = cancel_url || `${origin}/#/dashboard?payment=cancelled`;

        // ========================================================================
        // 5. Create Billing via AbacatePay API
        // ========================================================================

        // Prepare payload
        // Note: AbacatePay requires customer details. We'll use the user's email.
        // Ideally we would let them fill it in, or try to get from profile.

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
                email: auth.email,
                // Since we don't have name/taxId enforced in auth, we might send partial info
                // or let AbacatePay ask the user if their checkout supports it.
                // If AbacatePay strict API requires name/taxId, we might fail here if not provided.
                // Assuming minimal requirement is email or that AbacatePay collects data on checkout.
            }
        };

        console.log('[create-checkout] Sending request to AbacatePay...');

        const response = await fetch(`${ABACATEPAY_API_URL}/billing/create`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ABACATEPAY_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(billingPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[create-checkout] AbacatePay error:', JSON.stringify(data));
            throw new Error(data.message || data.error || 'Failed to create billing at AbacatePay');
        }

        const billingUrl = data.data?.url;
        const billingId = data.data?.id;

        if (!billingUrl || !billingId) {
            throw new Error('Invalid response from AbacatePay: missing url or id');
        }

        console.log(`[create-checkout] Billing created: ${billingId}`);

        // ========================================================================
        // 6. Save Transaction to Database
        // ========================================================================
        const transactionId = await createTransaction(
            auth.userId,
            package_type,
            selectedPackage.amount,
            selectedPackage.credits,
            billingId
        );

        // ========================================================================
        // 7. Log Audit
        // ========================================================================
        await logAudit(auth.userId, 'checkout_created', 'transaction', transactionId || undefined, {
            provider: 'abacatepay',
            package_type,
            amount: selectedPackage.amount,
            billing_id: billingId,
        }, request);

        // ========================================================================
        // 8. Return Response
        // ========================================================================
        const responseBody: CreateCheckoutResponse = {
            success: true,
            checkout_url: billingUrl,
            session_id: billingId,
        };

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('[create-checkout] Error:', error.message);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'Failed to create checkout session'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

import {
    isWebhookProcessed,
    markWebhookProcessed,
    completeTransaction,
    addCredits,
    logAudit
} from '../lib/supabase';
import { PACKAGES, PackageType } from '../types';

// CORS headers
const headers = {
    'Content-Type': 'application/json',
};

export const config = {
    runtime: 'edge',
    maxDuration: 30,
};

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers }
        );
    }

    const startTime = Date.now();

    try {
        const body = await request.json();
        console.log('[webhook] Received event:', JSON.stringify(body));

        // AbacatePay payload structure check
        const eventId = body.eventId || body.id; // Fallback
        const eventType = body.event;
        const data = body.data;

        if (!eventId || !eventType || !data) {
            console.error('[webhook] Invalid payload structure');
            return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers });
        }

        // ========================================================================
        // 1. Check Idempotency
        // ========================================================================
        const alreadyProcessed = await isWebhookProcessed(eventId);
        if (alreadyProcessed) {
            console.log(`[webhook] Event ${eventId} already processed, skipping`);
            return new Response(
                JSON.stringify({ received: true, message: 'Already processed' }),
                { status: 200, headers }
            );
        }

        // ========================================================================
        // 2. Handle Event Types
        // ========================================================================
        if (eventType === 'billing.paid') {
            const billingId = data.id;
            const amountCents = data.amount; // AbacatePay sends in cents usually? Or full? Checking... assumes cents as per standard.
            // Actually, let's verify amount if possible, but trust the billingId match first.

            console.log(`[webhook] Processing billing.paid: ${billingId}`);

            // We need to find the transaction by provider_session_id (which corresponds to billingId)
            // Note: completeTransaction in lib/supabase looks up by provider_session_id

            // Complete the transaction
            const transactionResult = await completeTransaction(billingId, billingId);
            // passing billingId as paymentIntentId too since Abacate doesn't distinguish nicely like Stripe

            if (transactionResult) {
                // Find how many credits to add
                // We can re-fetch transaction or trust the result if I updated completeTransaction to return it? 
                // Checking lib/supabase.ts... completeTransaction returns { userId, credits }

                const { userId, credits } = transactionResult;

                if (userId && credits > 0) {
                    const creditsAdded = await addCredits(userId, credits);

                    if (creditsAdded) {
                        console.log(`[webhook] Added ${credits} credits to user ${userId}`);
                        await logAudit(userId, 'credits_purchased', 'transaction', undefined, {
                            provider: 'abacatepay',
                            billing_id: billingId,
                            credits_added: credits
                        });
                    } else {
                        console.error(`[webhook] Failed to add credits to user ${userId}`);
                    }
                }
            } else {
                console.log(`[webhook] Transaction not found or already completed for billing ${billingId}`);
            }
        } else {
            console.log(`[webhook] Ignoring event type: ${eventType}`);
        }

        // ========================================================================
        // 3. Mark as Processed
        // ========================================================================
        await markWebhookProcessed(eventId, eventType, data);

        return new Response(JSON.stringify({ received: true }), { status: 200, headers });

    } catch (error: any) {
        console.error('[webhook] Error:', error.message);
        return new Response(
            JSON.stringify({ error: 'Webhook handler failed' }),
            { status: 500, headers }
        );
    }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Supabase Client Configuration for API Routes
// ============================================================================

// Service role client (bypasses RLS - use only in API routes)
export function createServiceClient(): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// Client for verifying user tokens
export function createAuthClient(): SupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

// ============================================================================
// Auth Helpers
// ============================================================================

export async function verifyToken(authHeader: string | null): Promise<{ userId: string; email: string } | null> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createAuthClient();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('Token verification failed:', error?.message);
        return null;
    }

    return {
        userId: user.id,
        email: user.email || '',
    };
}

// ============================================================================
// Profile Helpers
// ============================================================================

export async function getProfileCredits(userId: string): Promise<number | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching credits:', error);
        return null;
    }

    return data?.credits ?? null;
}

export async function deductCredit(userId: string): Promise<boolean> {
    const supabase = createServiceClient();

    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (fetchError || !profile || profile.credits <= 0) {
        return false;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', userId);

    if (updateError) {
        console.error('Error deducting credit:', updateError);
        return false;
    }

    return true;
}

export async function addCredits(userId: string, amount: number): Promise<boolean> {
    const supabase = createServiceClient();

    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (fetchError || !profile) {
        console.error('Error fetching profile:', fetchError);
        return false;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits + amount })
        .eq('id', userId);

    if (updateError) {
        console.error('Error adding credits:', updateError);
        return false;
    }

    return true;
}

// ============================================================================
// Report Helpers
// ============================================================================

export async function saveReport(
    userId: string,
    rawData: any[],
    aiAnalysis: any,
    fileName?: string
): Promise<string | null> {
    const supabase = createServiceClient();

    // Extract metrics from analysis
    const healthScore = aiAnalysis?.financial_health_score;
    const totalIncome = aiAnalysis?.metrics?.total_income;
    const totalExpenses = aiAnalysis?.metrics?.total_expense;

    const { data, error } = await supabase
        .from('reports')
        .insert({
            user_id: userId,
            raw_data: rawData,
            ai_analysis: aiAnalysis,
            file_name: fileName,
            transactions_count: rawData.length,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            health_score: healthScore,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error saving report:', error);
        return null;
    }

    return data?.id ?? null;
}

// ============================================================================
// Transaction Helpers
// ============================================================================

export async function createTransaction(
    userId: string,
    packageType: string,
    amount: number,
    credits: number,
    sessionId: string
): Promise<string | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: userId,
            package_type: packageType,
            amount,
            credits,
            provider: 'abacatepay',
            provider_session_id: sessionId,
            status: 'pending',
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating transaction:', error);
        return null;
    }

    return data?.id ?? null;
}

export async function completeTransaction(sessionId: string, paymentIntentId: string): Promise<{ userId: string; credits: number } | null> {
    const supabase = createServiceClient();

    // Find the transaction
    const { data: transaction, error: findError } = await supabase
        .from('transactions')
        .select('*')
        .eq('provider_session_id', sessionId)
        .single();

    if (findError || !transaction) {
        console.error('Transaction not found:', findError);
        return null;
    }

    // Check if already completed
    if (transaction.status === 'completed') {
        console.log('Transaction already completed');
        return null;
    }

    // Update transaction status
    const { error: updateError } = await supabase
        .from('transactions')
        .update({
            status: 'completed',
            provider_id: paymentIntentId,
        })
        .eq('id', transaction.id);

    if (updateError) {
        console.error('Error updating transaction:', updateError);
        return null;
    }

    return {
        userId: transaction.user_id,
        credits: transaction.credits,
    };
}

// ============================================================================
// Webhook Idempotency
// ============================================================================

export async function isWebhookProcessed(eventId: string): Promise<boolean> {
    const supabase = createServiceClient();

    const { data } = await supabase
        .from('processed_webhooks')
        .select('id')
        .eq('event_id', eventId)
        .single();

    return !!data;
}

export async function markWebhookProcessed(
    eventId: string,
    eventType: string,
    payload: any
): Promise<void> {
    const supabase = createServiceClient();

    await supabase
        .from('processed_webhooks')
        .insert({
            event_id: eventId,
            event_type: eventType,
            provider: 'abacatepay',
            payload,
        });
}

// ============================================================================
// Audit Logging
// ============================================================================

export async function logAudit(
    userId: string | null,
    action: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    request?: Request
): Promise<void> {
    const supabase = createServiceClient();

    await supabase
        .from('audit_logs')
        .insert({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            ip_address: request?.headers.get('x-forwarded-for')?.split(',')[0] || null,
            user_agent: request?.headers.get('user-agent') || null,
            metadata,
        });
}

export interface Profile {
    id: string;
    email: string;
    credits: number;
    created_at: string;
}

export interface Report {
    id: string;
    user_id: string;
    raw_data: Record<string, any>[];
    ai_analysis: AIAnalysis;
    created_at: string;
}

export interface AIAnalysis {
    health_score: number;
    savings_rate: number;
    subscriptions_found: Array<{
        name: string;
        amount: number;
        frequency: string;
    }>;
    advice_text: string;
    insights: Array<{
        category: string;
        total: number;
        percentage: number;
        recommendations: string[];
    }>;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    provider_id: string | null;
    package_type: string;
    created_at: string;
}

export interface AnalyzeCSVRequest {
    csv_data: Record<string, any>[];
    user_id: string;
}

export interface AnalyzeCSVResponse {
    success: boolean;
    report_id?: string;
    analysis?: AIAnalysis;
    error?: string;
    message?: string;
}

export interface CreateCheckoutRequest {
    user_id: string;
    package_type: 'single' | 'pack5' | 'pack10';
}

export interface CreateCheckoutResponse {
    success: boolean;
    checkout_url?: string;
    qr_code?: string;
    transaction_id?: string;
    error?: string;
}

export interface WebhookPayload {
    event_type: string;
    transaction_id?: string;
    provider_id?: string;
    status?: string;
    amount?: number;
    signature?: string;
}
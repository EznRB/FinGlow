// ============================================================================
// FinGlow API Types
// Shared types between frontend and backend API
// ============================================================================

// ============================================================================
// Database Types
// ============================================================================

export interface Profile {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    credits: number;
    created_at: string;
    updated_at: string;
}

export interface Report {
    id: string;
    user_id: string;
    raw_data: CSVRow[];
    ai_analysis: AIAnalysisResult | null;
    file_name: string | null;
    transactions_count: number | null;
    total_income: number | null;
    total_expenses: number | null;
    health_score: number | null;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    credits: number;
    status: TransactionStatus;
    provider: PaymentProvider;
    provider_id: string | null;
    provider_session_id: string | null;
    package_type: PackageType;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
}

// ============================================================================
// Enums
// ============================================================================

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentProvider = 'abacatepay';
export type PackageType = 'single' | 'pack5' | 'pack10';

// ============================================================================
// CSV & Analysis Types
// ============================================================================

export interface CSVRow {
    date: string;
    description: string;
    amount: number;
    category?: string;
    [key: string]: any;
}

export interface AIAnalysisResult {
    financial_health_score: number;
    metrics: {
        total_income: number;
        total_expense: number;
        savings_rate_percentage: number;
        discretionary_spending_percentage: number;
        runway_days_estimate: number;
    };
    breakdown_50_30_20: {
        needs: number;
        wants: number;
        savings: number;
    };
    subscriptions: Array<{
        name: string;
        cost: number;
        frequency: string;
    }>;
    categories: Array<{
        name: string;
        value: number;
    }>;
    daily_burn_rate: Array<{
        date: string;
        amount: number;
        cumulative: number;
    }>;
    insights: {
        advice_text: string;
        wasteful_expenses: string[];
        largest_category: string;
        anomaly_detected?: string | null;
        immediate_actions?: Array<{
            title: string;
            description: string;
            type: 'danger' | 'warning' | 'success';
        }>;
        market_comparison?: string;
    };
    transactions: Array<{
        id: string;
        description: string;
        category: string;
        date: string;
        amount: number;
    }>;
}

export interface AnamnesisData {
    age: number;
    occupation: string;
    totalInvested: number;
    financialGoals: string[];
    familyStatus: 'single' | 'married' | 'married_kids' | 'single_parent';
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Analyze CSV
export interface AnalyzeCSVRequest {
    csv_data: CSVRow[];
    anamnesis?: AnamnesisData;
}

export interface AnalyzeCSVResponse {
    success: boolean;
    report_id?: string;
    analysis?: AIAnalysisResult;
    remaining_credits?: number;
    error?: string;
    message?: string;
}

// Create Checkout
export interface CreateCheckoutRequest {
    package_type: PackageType;
    success_url?: string;
    cancel_url?: string;
}

export interface CreateCheckoutResponse {
    success: boolean;
    checkout_url?: string;
    session_id?: string;
    error?: string;
}

// Webhook
export interface WebhookEvent {
    id: string;
    type: string;
    data: Record<string, any>;
}

// ============================================================================
// Package Configuration
// ============================================================================

export const PACKAGES: Record<PackageType, { credits: number; amount: number; name: string }> = {
    single: { credits: 1, amount: 9.90, name: '1 Crédito' },
    pack5: { credits: 5, amount: 39.90, name: '5 Créditos' },
    pack10: { credits: 10, amount: 69.90, name: '10 Créditos' },
};

// ============================================================================
// API Error Types
// ============================================================================

export interface APIError {
    error: string;
    message?: string;
    code?: string;
    status?: number;
}

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

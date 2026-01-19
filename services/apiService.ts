import { supabase, getAccessToken } from './supabaseClient';
import { FinancialReportData, AnamnesisData } from '../types';

// ============================================================================
// API Configuration
// ============================================================================

// In development, use relative path (Vite proxy or local API)
// In production (Vercel), API routes are at /api/*
// Use Supabase Functions URL directly
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '/api';

// ============================================================================
// Types
// ============================================================================

export interface AnalyzeCSVResponse {
  success: boolean;
  report_id?: string;
  analysis?: FinancialReportData;
  remaining_credits?: number;
  error?: string;
  message?: string;
}

export interface CreateCheckoutResponse {
  success: boolean;
  checkout_url?: string;
  session_id?: string;
  error?: string;
}

// ============================================================================
// Package Configuration
// ============================================================================

export const PACKAGES = {
  single: { credits: 1, amount: 9.90, name: '1 Crédito' },
  pack5: { credits: 5, amount: 39.90, name: '5 Créditos' },
  pack10: { credits: 10, amount: 69.90, name: '10 Créditos' },
} as const;

export type PackageType = keyof typeof PACKAGES;

// ============================================================================
// API Helper
// ============================================================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('API Parse Error:', e);
    throw new Error(`API Response was not valid JSON: ${response.status} ${response.statusText}`);
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'API request failed');
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data;
}

// ============================================================================
// Analyze CSV
// ============================================================================

export interface AnalyzeCSVInput {
  csvData: Record<string, any>[];
  anamnesis?: AnamnesisData;
  fileName?: string;
}

export async function analyzeCSV(input: AnalyzeCSVInput): Promise<AnalyzeCSVResponse> {
  const { csvData, anamnesis } = input;

  return apiRequest<AnalyzeCSVResponse>('/analyze-csv', {
    method: 'POST',
    body: JSON.stringify({
      csv_data: csvData,
      anamnesis,
    }),
  });
}

// ============================================================================
// Create Checkout
// ============================================================================

export async function createCheckout(packageType: PackageType): Promise<CreateCheckoutResponse> {
  return apiRequest<CreateCheckoutResponse>('/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      package_type: packageType,
      success_url: `${window.location.origin}/#/dashboard?payment=success`,
      cancel_url: `${window.location.origin}/#/dashboard?payment=cancelled`,
    }),
  });
}

// ============================================================================
// Redirect to Checkout
// ============================================================================

export async function redirectToCheckout(packageType: PackageType): Promise<void> {
  const response = await createCheckout(packageType);

  if (!response.success || !response.checkout_url) {
    throw new Error(response.error || 'Failed to create checkout session');
  }

  // Redirect to Stripe Checkout
  window.location.href = response.checkout_url;
}

// ============================================================================
// Legacy Support - Direct Supabase Calls (for reports/history)
// ============================================================================

export async function getUserCredits(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching credits:', error);
    return 0;
  }

  return data?.credits ?? 0;
}
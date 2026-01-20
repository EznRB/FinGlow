import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// ============================================================================
// Supabase Client Configuration
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Some features may not work.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// ============================================================================
// Types
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
  raw_data: Record<string, any>[];
  ai_analysis: any;
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
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  provider: string;
  provider_id: string | null;
  package_type: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Profile Functions
// ============================================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

// ============================================================================
// Reports Functions
// ============================================================================

export async function getReports(userId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  return data || [];
}

export async function getReport(reportId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching report:', error);
    return null;
  }

  return data;
}

export async function deleteReport(reportId: string): Promise<boolean> {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting report:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Transactions Functions
// ============================================================================

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// Auth Helpers
// ============================================================================

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// ============================================================================
// Realtime Subscriptions
// ============================================================================

export function subscribeToProfileChanges(
  userId: string,
  callback: (profile: Profile) => void
) {
  return supabase
    .channel(`profile:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Profile);
      }
    )
    .subscribe();
}
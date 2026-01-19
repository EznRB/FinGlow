import { supabase } from './supabaseClient';

export async function analyzeCSV(csvData: Record<string, any>[], userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-csv`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csv_data: csvData,
        user_id: userId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze CSV');
  }

  return response.json();
}

export async function createCheckout(userId: string, packageType: 'single' | 'pack5' | 'pack10') {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        package_type: packageType,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout');
  }

  return response.json();
}

export const PACKAGES = {
  single: { credits: 1, amount: 9.90 },
  pack5: { credits: 5, amount: 39.90 },
  pack10: { credits: 10, amount: 69.90 },
};
# Frontend Integration Guide

This guide explains how to integrate the FinGlow frontend with the Supabase backend.

## Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Initialize Supabase Client

The `supabaseClient.ts` file is already set up in `services/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4. Authentication

To authenticate users, use Supabase Auth:

```typescript
import { supabase } from './services/supabaseClient';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### 5. API Calls

Use the `apiService.ts` to call backend functions:

```typescript
import { analyzeCSV, createCheckout, PACKAGES } from './services/apiService';

// Analyze CSV
const result = await analyzeCSV(csvData, userId);

// Create checkout
const checkout = await createCheckout(userId, 'single');

// Package options
console.log(PACKAGES.single);   // 1 credit - R$9.90
console.log(PACKAGES.pack5);    // 5 credits - R$39.90
console.log(PACKAGES.pack10);   // 10 credits - R$69.90
```

### 6. Database Queries

Use the Supabase client to query the database:

```typescript
import { getProfile, getReports, getTransactions } from './services/supabaseClient';

// Get user profile
const profile = await getProfile(userId);

// Get user reports
const reports = await getReports(userId);

// Get user transactions
const transactions = await getTransactions(userId);
```

## Integration Example

Here's how to integrate the UploadPage with the backend:

```typescript
import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { analyzeCSV } from '../services/apiService';

export const UploadPage = () => {
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    // Fetch user credits on mount
    const fetchCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await getProfile(user.id);
        setCredits(profile?.credits || 0);
      }
    };
    fetchCredits();
  }, []);

  const handleFileUpload = async (csvData: Record<string, any>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await analyzeCSV(csvData, user.id);
      
      // Update credits
      setCredits(prev => prev - 1);
      
      // Display results
      console.log(result.analysis);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePurchase = async (packageType: 'single' | 'pack5' | 'pack10') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const checkout = await createCheckout(user.id, packageType);
      
      // Redirect to Mercado Pago checkout
      window.location.href = checkout.checkout_url;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <p>Credits: {credits}</p>
      <button onClick={() => handlePurchase('single')}>Buy 1 Credit</button>
      <button onClick={() => handlePurchase('pack5')}>Buy 5 Credits</button>
      <button onClick={() => handlePurchase('pack10')}>Buy 10 Credits</button>
    </div>
  );
};
```

## Data Flow

```
Frontend → Supabase Auth → Edge Functions → Database
     ↓            ↓                ↓             ↓
  Upload       JWT Token      analyze-csv    profiles
  CSV          Session        create-checkout reports
  File         User ID        webhook-handler transactions
     ↓            ↓                ↓             ↓
  Display    Protected API    Mercado Pago   Credits
  Results     (RLS)          Integration    Update
```

## Security

- All API calls are protected by JWT tokens
- Row Level Security (RLS) ensures users can only access their own data
- Environment variables are never exposed to the client
- Supabase Anon Key is safe for client-side use

## Troubleshooting

### "Not authenticated" error

Make sure the user is signed in before making API calls:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

### "No credits available" error

Check the user's profile:

```typescript
const profile = await getProfile(userId);
console.log('Credits:', profile?.credits);
```

### "Failed to create checkout" error

Verify Mercado Pago integration:
- Check `MERCADO_PAGO_ACCESS_TOKEN` in Edge Functions
- Verify webhook URL is configured in Mercado Pago

## Next Steps

1. Update `UploadPage.tsx` to use the backend API
2. Update `CheckoutModal.tsx` to use `createCheckout`
3. Add authentication to `App.tsx` using Supabase Auth
4. Update `Dashboard.tsx` to display real credit counts
5. Add transaction history to `History.tsx`
6. Display reports in `Reports.tsx`

## Migration Guide

If you're migrating from the mock implementation:

1. Replace `localStorage` auth with Supabase Auth
2. Replace `geminiService` with `apiService.analyzeCSV`
3. Replace mock credit logic with real database queries
4. Replace checkout mock with `apiService.createCheckout`
5. Remove `localStorage` data storage (use Supabase instead)
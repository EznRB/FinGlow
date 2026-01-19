# Quick Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Mercado Pago developer account
- Google Gemini API key

## Setup (5 minutes)

### 1. Supabase Setup

```bash
# 1. Create account at https://supabase.com/dashboard
# 2. Create a new project
# 3. Go to Settings > API
# 4. Copy:
#    - Project URL (SUPABASE_URL)
#    - service_role secret (SUPABASE_SERVICE_ROLE_KEY)
```

### 2. Apply Database Migrations

```bash
# Go to Supabase Dashboard > SQL Editor
# Run these files in order:

# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
# 3. supabase/migrations/003_auto_create_profile.sql
```

### 3. Mercado Pago Setup

```bash
# 1. Create account at https://www.mercadopago.com.br/developers
# 2. Create a new application
# 3. Get your ACCESS_TOKEN
# 4. Create a webhook pointing to your function URL:
#    https://your-project.supabase.co/functions/v1/webhook-handler
# 5. Copy the Webhook Secret
```

### 4. Configure Environment Variables

```bash
# In Supabase Dashboard, go to Edge Functions > Settings
# Add these secrets:

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
MERCADO_PAGO_ACCESS_TOKEN=your_mercado_pago_token
MERCADO_PAGO_WEBHOOK_SECRET=your_webhook_secret
```

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Deploy all functions
supabase functions deploy analyze-csv
supabase functions deploy create-checkout
supabase functions deploy webhook-handler
```

## Test

### Test analyze-csv

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/analyze-csv \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "csv_data": [
      {"date": "2024-01-01", "amount": 100, "description": "Test"}
    ],
    "user_id": "your-user-id"
  }'
```

### Test create-checkout

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "package_type": "single"
  }'
```

## Pricing

- **Single**: 1 crédito - R$ 9,90
- **Pack 5**: 5 créditos - R$ 39,90
- **Pack 10**: 10 créditos - R$ 69,90

## Support

For issues, check:
- Supabase Edge Functions logs
- Mercado Pago dashboard
- Database tables for debugging

## Next Steps

1. Connect your frontend to these endpoints
2. Implement UI for credit display
3. Add payment success/redirect pages
4. Set up error handling
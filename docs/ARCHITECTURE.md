# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  - User Authentication (Supabase Auth)                          │
│  - CSV Upload & Parsing                                         │
│  - Credit Display                                                │
│  - Analysis Results Visualization                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTPS/REST
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Supabase Edge Functions                       │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │  analyze-csv    │  │ create-checkout │  │webhook-handler│   │
│  │                 │  │                 │  │              │   │
│  │ • Auth check    │  │ • Auth check    │  │ • Signature  │   │
│  │ • Credit check  │  │ • Mercado Pago  │  │   validation │   │
│  │ • Data sanitize │  │   integration   │  │ • Payment    │   │
│  │ • AI analysis   │  │ • Transaction   │  │   processing │   │
│  │ • Credit deduct │  │   creation      │  │ • Credit add │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ PostgreSQL
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                   Supabase PostgreSQL                           │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │     profiles    │  │     reports     │  │ transactions │   │
│  │                 │  │                 │  │              │   │
│  │ • id (uuid)     │  │ • id (uuid)     │  │ • id (uuid) │   │
│  │ • email         │  │ • user_id       │  │ • user_id    │   │
│  │ • credits       │  │ • raw_data      │  │ • amount     │   │
│  │ • created_at    │  │ • ai_analysis   │  │ • status     │   │
│  └─────────────────┘  │ • created_at    │  │ • provider_id│   │
│                       └─────────────────┘  │ • package_type│   │
│                                             └──────────────┘   │
│                                             ┌──────────────┐   │
│                                             │ auth.users   │   │
│                                             │              │   │
│                                             │ • id (uuid)  │   │
│                                             │ • email      │   │
│                                             └──────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                     │
                     │ HTTP
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    External Services                             │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐                        │
│  │ Google Gemini   │  │  Mercado Pago   │                        │
│  │                 │  │                 │                        │
│  │ • AI Analysis   │  │ • Payment       │                        │
│  │ • GPT-4o        │  │ • Checkout      │                        │
│  │ • Financial     │  │ • Webhooks      │                        │
│  │   Insights      │  │ • PIX/QR Code   │                        │
│  └─────────────────┘  └─────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow: Analysis

```
1. User Uploads CSV
   Frontend → parse CSV → validate structure

2. Request Analysis
   Frontend → POST /analyze-csv
   ├── JWT Token
   ├── CSV Data
   └── User ID

3. Edge Function: analyze-csv
   ├── 3.1 Verify JWT & User ID
   ├── 3.2 Validate CSV Structure
   ├── 3.3 Check User Credits
   │    └── Query: SELECT credits FROM profiles WHERE id = user_id
   ├── 3.4 Sanitize Data (remove sensitive info)
   ├── 3.5 Send to Google Gemini
   │    └── AI returns: health_score, savings_rate, subscriptions, advice
   ├── 3.6 Save Report
   │    └── INSERT INTO reports (user_id, raw_data, ai_analysis)
   ├── 3.7 Deduct Credit
   │    └── UPDATE profiles SET credits = credits - 1
   └── 3.8 Return Analysis to Frontend

4. Display Results
   Frontend renders analysis with charts and insights
```

## Data Flow: Purchase Credits

```
1. User Chooses Package
   Frontend → display packages (single/pack5/pack10)

2. Create Checkout
   Frontend → POST /create-checkout
   ├── JWT Token
   ├── User ID
   └── Package Type

3. Edge Function: create-checkout
   ├── 3.1 Verify JWT & User ID
   ├── 3.2 Validate Package Type
   ├── 3.3 Create Mercado Pago Preference
   │    └── POST https://api.mercadopago.com/checkout/preferences
   ├── 3.4 Save Transaction
   │    └── INSERT INTO transactions (user_id, amount, status='pending')
   └── 3.5 Return Checkout URL

4. User Completes Payment
   User → Mercado Pago checkout → Payment approved

5. Webhook Notification
   Mercado Pago → POST /webhook-handler
   ├── x-signature (HMAC)
   ├── x-request-id
   └── Payment Data

6. Edge Function: webhook-handler
   ├── 6.1 Verify Signature
   ├── 6.2 Validate Payment Status
   ├── 6.3 Find Transaction by provider_id
   ├── 6.4 Update Transaction Status to 'completed'
   ├── 6.5 Add Credits to User Profile
   │    └── UPDATE profiles SET credits = credits + package_credits
   └── 6.6 Return Success
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Authentication                                      │
│ • Supabase Auth with JWT                                     │
│ • Token validation on every request                         │
│ • User ID matching check                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Row Level Security (RLS)                             │
│ • PostgreSQL RLS policies                                    │
│ • Users can only access their own data                      │
│ • Automatic enforcement at database level                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Data Sanitization                                   │
│ • Remove personal information before AI processing           │
│ • Mask names, emails, CPF, RG, etc.                         │
│ • Keep only: date, amount, description                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Webhook Security                                   │
│ • HMAC-SHA256 signature validation                           │
│ • Timestamp verification (prevent replay)                    │
│ • Request ID matching                                        │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
auth.users (Supabase Auth)
    │
    │ 1:1
    │
    └── profiles
         │
         │ 1:N
         │
         ├── reports (user_id → profiles.id)
         │
         └── transactions (user_id → profiles.id)

Foreign Keys:
- profiles.id → auth.users.id
- reports.user_id → profiles.id
- transactions.user_id → profiles.id

Indexes:
- idx_reports_user_id (reports.user_id)
- idx_transactions_user_id (transactions.user_id)
- idx_transactions_status (transactions.status)
- idx_transactions_provider_id (transactions.provider_id)
```

## Credit System

```
Initial Credits:
├── New user signs up
├── Trigger creates profile
└── credits = 1 (free trial)

Deduct Credits:
├── User requests CSV analysis
├── Check: credits > 0
├── Process analysis
└── credits = credits - 1

Add Credits:
├── User purchases package
├── Payment succeeds via webhook
└── credits = credits + package_credits

Error Handling:
├── credits = 0 → 402 Payment Required
├── Invalid transaction → Error
└── Duplicate webhook → Skip
```

## Error Handling Strategy

```
Client Errors (4xx):
├── 400 Bad Request
│   ├── Invalid CSV structure
│   ├── Invalid package type
│   └── Missing required fields
├── 401 Unauthorized
│   ├── Missing/invalid JWT
│   └── Token expired
├── 403 Forbidden
│   ├── User ID mismatch
│   └── RLS violation
└── 402 Payment Required
    └── No credits available

Server Errors (5xx):
├── 500 Internal Server Error
│   ├── Database errors
│   ├── External service failures
│   └── Unexpected errors
└── 503 Service Unavailable
    └── AI rate limits
```
# Backend Implementation - FinGlow

Backend completo implementado com Supabase, Edge Functions e integração com Mercado Pago.

## Estrutura

```
supabase/migrations/
├── 001_initial_schema.sql      # Schema do banco (profiles, reports, transactions)
├── 002_rls_policies.sql         # Row Level Security policies
└── 003_auto_create_profile.sql  # Trigger para auto-criar profile

edge-functions/
├── analyze-csv/                 # Análise de CSV com IA
├── create-checkout/             # Criação de checkout Mercado Pago
└── webhook-handler/             # Webhook para processar pagamentos

backend/
├── types/
│   └── index.ts                 # TypeScript types
└── utils/
    └── dataSanitizer.ts        # Limpeza de dados sensíveis
```

## Configuração

### 1. Setup do Supabase

1. Crie um projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Copie as credenciais: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
3. Vá em Settings > API para obter as chaves

### 2. Aplicar Migrations

Execute as migrations em ordem:

```bash
# No Supabase Dashboard, SQL Editor:
# 1. Execute 001_initial_schema.sql
# 2. Execute 002_rls_policies.sql
# 3. Execute 003_auto_create_profile.sql
```

Ou use o CLI do Supabase:

```bash
npm install -g supabase
supabase link
supabase db push
```

### 3. Configurar Mercado Pago

1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação e obtenha o `ACCESS_TOKEN`
3. Configure as URLs de webhook
4. Copie o `WEBHOOK_SECRET` (chave secreta do webhook)

### 4. Variáveis de Ambiente

Configure no Supabase Dashboard (Edge Functions > Settings):

```
SUPABASE_URL=seu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
GEMINI_API_KEY=sua_chave_gemini
MERCADO_PAGO_ACCESS_TOKEN=seu_token_mercado_pago
MERCADO_PAGO_WEBHOOK_SECRET=sua_chave_secreta_webhook
```

### 5. Deploy das Edge Functions

```bash
# Instale o Supabase CLI
npm install -g supabase

# Link com seu projeto
supabase link --project-ref seu-projeto-id

# Deploy das funções
supabase functions deploy analyze-csv
supabase functions deploy create-checkout
supabase functions deploy webhook-handler
```

## Endpoints

### 1. analyze-csv

**POST** `/functions/v1/analyze-csv`

Analisa dados CSV usando IA e consome 1 crédito.

**Headers:**
```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "csv_data": [
    {
      "date": "2024-01-01",
      "amount": 100.00,
      "description": "Supermercado X"
    }
  ],
  "user_id": "user-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "report_id": "report-uuid",
  "analysis": {
    "health_score": 75,
    "savings_rate": 20,
    "subscriptions_found": [
      {
        "name": "Netflix",
        "amount": 39.90,
        "frequency": "monthly"
      }
    ],
    "advice_text": "Sua saúde financeira é boa...",
    "insights": [...]
  }
}
```

**Response (402 Payment Required):**
```json
{
  "success": false,
  "error": "No credits available",
  "message": "Please purchase credits to continue"
}
```

### 2. create-checkout

**POST** `/functions/v1/create-checkout`

Cria um checkout no Mercado Pago para comprar créditos.

**Headers:**
```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "user_id": "user-uuid",
  "package_type": "single"
}
```

**Package Types:**
- `single`: 1 crédito por R$ 9,90
- `pack5`: 5 créditos por R$ 39,90
- `pack10`: 10 créditos por R$ 69,90

**Response (200 OK):**
```json
{
  "success": true,
  "checkout_url": "https://www.mercadopago.com.br/checkout/...",
  "transaction_id": "transaction-uuid"
}
```

### 3. webhook-handler

**POST** `/functions/v1/webhook-handler`

Recebe notificações do Mercado Pago e processa pagamentos.

**Headers:**
```
x-request-id: <request_id>
x-signature: <hmac_signature>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment processed successfully"
}
```

## Segurança

### Row Level Security (RLS)

Todos os dados são protegidos por RLS:
- Usuários só podem acessar seus próprios dados
- Transações e reports são isolados por user_id
- Tokens JWT do Supabase Auth são validados em cada request

### Webhook Security

- Assinatura HMAC-SHA256 valida a origem do webhook
- Timestamp para prevenir replay attacks
- Verificação de duplicatas para evitar processamento múltiplo

### Data Sanitization

- Nomes e CPFs são removidos/dados mascarados antes de enviar para IA
- E-mails são parcialmente mascarados
- Apenas dados relevantes (data, valor, descrição) são enviados

## Fluxo de Pagamento

1. Usuário chama `create-checkout` com package_type
2. Sistema cria preferência no Mercado Pago
3. Usuário é redirecionado para página de pagamento
4. Mercado Pago envia webhook ao `webhook-handler`
5. Webhook valida assinatura e processa pagamento
6. Créditos são adicionados ao perfil do usuário

## Fluxo de Análise

1. Usuário faz upload de CSV
2. Front-end chama `analyze-csv` com dados
3. Sistema valida créditos do usuário
4. Dados sensíveis são removidos
5. IA analisa os dados financeiros
6. Resultado é salvo em `reports`
7. 1 crédito é deduzido do perfil
8. Análise é retornada ao front-end

## Troubleshooting

### Créditos não são adicionados após pagamento

Verifique:
1. Webhook está recebendo notificações (ver logs do Supabase)
2. Assinatura do webhook está configurada corretamente
3. Transaction existe no banco de dados
4. User ID está correto

### Erro 401 Unauthorized

Verifique:
1. Token JWT é válido e não expirou
2. User ID corresponde ao token
3. Header Authorization está no formato correto

### Erro 402 Payment Required

Verifique:
1. Usuário tem créditos disponíveis
2. Profile foi criado corretamente
3. Não há problemas na tabela profiles

## Monitoramento

### Logs do Supabase

Acesse os logs das Edge Functions no Supabase Dashboard:
1. Vá em Edge Functions
2. Clique na função desejada
3. Abra a aba "Logs"

### Database Monitoring

Monitore as tabelas:
- `profiles`: créditos dos usuários
- `reports`: análises geradas
- `transactions`: pagamentos

## Próximos Passos

1. [ ] Implementar testes unitários para edge functions
2. [ ] Adicionar retry mechanism para chamadas de IA
3. [ ] Implementar cache de análises
4. [ ] Adicionar analytics e métricas
5. [ ] Criar admin dashboard
6. [ ] Implementar feature flags
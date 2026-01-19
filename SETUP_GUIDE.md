# FinGlow - Guia de Configuração e Deploy

Este guia explica como configurar o projeto FinGlow completo, incluindo banco de dados, autenticação, IA e pagamentos via AbacatePay.

---

## 📋 Pré-requisitos

Antes de começar, você precisará:

1. **Conta Supabase** (já criada) - [supabase.com](https://supabase.com)
2. **Conta AbacatePay** (para pagamentos) - [abacatepay.com](https://abacatepay.com)
3. **Conta Google AI Studio** (para Gemini) - [aistudio.google.com](https://aistudio.google.com)
4. **Conta Vercel** (para deploy) - [vercel.com](https://vercel.com)
5. **Node.js 18+** instalado

---

## 🗄️ Passo 1: Configurar Banco de Dados (Supabase)

### 1.1 Executar Migrations

No painel do Supabase, vá em **SQL Editor** e execute os seguintes scripts na ordem:

1. **001_initial_schema.sql** - Cria as tabelas
2. **002_rls_policies.sql** - Configura segurança RLS
3. **003_auto_create_profile.sql** - Cria trigger de perfil automático

Os arquivos estão em `supabase/migrations/`.

### 1.2 Obter Chaves

No Supabase Dashboard, vá em **Settings > API** e copie:

- **Project URL** → `VITE_SUPABASE_URL` e `SUPABASE_URL`
- **anon public** → `VITE_SUPABASE_ANON_KEY` e `SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ NUNCA exponha esta chave!)

---

## 🤖 Passo 2: Configurar Google Gemini AI

1. Acesse [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Clique em **Create API Key**
3. Copie a chave → `GEMINI_API_KEY`

---

## 🥑 Passo 3: Configurar AbacatePay

### 3.1 Obter Chaves

No Dashboard da AbacatePay (modo Dev ou Produção):

1. Vá em **Integrações** ou **Chaves de API**.
2. Copie a chave (começa com `abc_...`) → `ABACATEPAY_API_KEY`

### 3.2 Configurar Webhook (IMPORTANTE)

Para que os créditos caiam automaticamente após o pagamento:

1. Acesse o painel da AbacatePay.
2. Vá no menu **Webhooks**.
3. Clique em **Criar Webhook**.
4. **URL do Endpoint**: `https://seu-projeto-finglow.vercel.app/api/webhook`
   - *Substitua 'seu-projeto-finglow.vercel.app' pela URL real do seu deploy na Vercel.*
5. **Eventos**: Selecione `billing.paid` (Cobrança Paga).
6. Salve o webhook.

---

## 🔧 Passo 4: Configurar Variáveis de Ambiente

### Desenvolvimento Local

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Frontend (Vite)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Backend (API Routes)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# AI
GEMINI_API_KEY=sua-gemini-api-key

# Pagamentos
ABACATEPAY_API_KEY=abc_dev_...
```

### Vercel (Produção)

No painel da Vercel, vá em **Settings > Environment Variables**:

| Variável | Ambiente |
|----------|----------|
| VITE_SUPABASE_URL | Production, Preview |
| VITE_SUPABASE_ANON_KEY | Production, Preview |
| SUPABASE_URL | Production, Preview |
| SUPABASE_ANON_KEY | Production, Preview |
| SUPABASE_SERVICE_ROLE_KEY | Production (apenas) |
| GEMINI_API_KEY | Production (apenas) |
| ABACATEPAY_API_KEY | Production (apenas) |

---

## 🚀 Passo 5: Deploy na Vercel

1. Faça push do código para o GitHub.
2. Importe o projeto na Vercel.
3. Adicione as variáveis de ambiente.
4. Faça o Deploy.
5. **Pegue a URL final** (ex: `https://finglow.vercel.app`) e atualize o Webhook na AbacatePay.

---

## 🧪 Testando Pagamentos

1. Vá em "Comprar Créditos".
2. Escolha um pacote.
3. Você será redirecionado para a página da AbacatePay.
4. Faça o pagamento (PIX ou cartão teste).
5. Aguarde o redirecionamento de volta.
6. Verifique se os créditos foram adicionados (pode levar alguns segundos para o webhook processar).

# 🔧 ContaAzul Integration - Implementação Completa v2.1

> **Baseado em:** Milestone 1.1 (Database) + 1.2 (OAuth) + 1.3 (Sync Engine) + 1.4 (Observability)  
> **Data:** 2026-03-26  
> **Status:** ✅ Production-Ready (4 entidades sincronizando)

---

## 📦 O Que Este Repositório Contém

Este repositório contém a **integração completa e production-ready** com ContaAzul API v2, incluindo:

### ✅ **Milestone 1.1: Database Schema (19 tabelas)**

1. `supabase/migrations/001_contaazul_schema.sql` - Schema completo (700 linhas)
   - Tabelas de configuração e controle (5)
   - Tabelas raw de dados sincronizados (12)
   - Tabelas de auditoria e health (2)
   - 40+ indexes otimizados
   - RLS policies
   - Triggers auto-update
   - Campo `data_alteracao` em todas as raw_* para incremental sync

### ✅ **Milestone 1.2: OAuth 2.0 Flow**

2. `supabase/functions/contaazul-oauth-callback/index.ts` - OAuth callback handler
   - Token exchange (code → access_token + refresh_token)
   - Token encryption (AES-GCM)
   - CSRF protection (state validation)
   - Busca conta conectada (CNPJ + nome)
   - Audit logging

3. `src/hooks/useContaAzulAuth.ts` - React Hook para autenticação
   - `isAuthenticated()`, `login()`, `logout()`
   - `processCallback()`, token validation
   - CSRF state management

4. `src/pages/ContaAzulCallback.tsx` - Página de callback OAuth
   - Loading states
   - Error handling
   - Auto-redirect após sucesso

5. `src/components/contaazul/ConnectionStatus.tsx` - UI de status da conexão
   - Exibe status atual (conectado/desconectado)
   - Token expiry countdown
   - CNPJ + nome da empresa
   - Botão de reconexão

6. `src/lib/contaazul/tokenHelpers.ts` - Helpers para tokens
   - Token metadata extraction
   - Formatting utilities
   - Validation helpers

7. `docs/OAUTH_SETUP.md` - Guia de setup OAuth
8. `docs/ARCHITECTURE.md` - Documentação técnica completa (950 linhas)

### ✅ **Milestone 1.3: Token Refresh & Auto-Renewal**

9. `supabase/migrations/002_improve_connection_status.sql` - Status expandido + helpers
   - Novos status: disconnected, connecting, connected, expired, refresh_in_progress, refresh_failed, revoked
   - Helper functions (6):
     - `pg_try_advisory_lock(key)` - Tenta adquirir lock
     - `pg_advisory_unlock(key)` - Libera lock
     - `get_active_contaazul_connection()` - Retorna conexão ativa
     - `is_token_expiring_soon(connection_id, minutes)` - Verifica expiração
     - `get_expiring_connections(minutes)` - Lista conexões expirando
     - `update_connection_status(connection_id, status)` - Atualiza status
   - View: `contaazul_connection_health` - Status de saúde
   - Trigger: `auto_expire_token()` - Auto-atualiza status quando expira

10. `supabase/functions/contaazul-token-refresh/index.ts` - Token refresh com lock
    - PostgreSQL advisory lock (previne refresh concorrente)
    - Decrypta refresh_token
    - Exchange com ContaAzul
    - Encrypta + salva novo access_token
    - Atualiza status (refresh_in_progress → connected/refresh_failed)
    - Audit logging
    - Always releases lock (finally block)

11. `supabase/functions/contaazul-auto-refresh/index.ts` - Auto-refresh background job
    - Scheduled via pg_cron (cada 2 minutos)
    - Busca conexões com tokens expirando < 5 minutos
    - Chama contaazul-token-refresh para cada uma
    - Retorna summary: total_checked, refreshed, skipped, failed
    - Logs no audit_log

### ✅ **Milestone 1.4: Sync Engine (4 Entidades)**

12. `supabase/functions/sync-produtos/index.ts` - Worker de sincronização de produtos
    - Full sync + Incremental sync
    - Endpoint: `GET /v1/produtos`
    - Filtro incremental: `data_alteracao_de`
    - Paginação: 100 itens por página
    - Hash-based change detection (SHA-256)
    - Job tracking com status updates
    - Error handling por registro

13. `supabase/functions/sync-pessoas/index.ts` - Worker de sincronização de pessoas
    - Full sync + Incremental sync
    - Endpoint: `GET /v1/pessoas`
    - Filtro incremental: `data_atualizacao_inicial`
    - Paginação: 100 itens por página
    - Suporta: Clientes, Fornecedores, Transportadoras
    - Hash-based change detection
    - Job tracking

14. `supabase/functions/sync-vendas/index.ts` - Worker de sincronização de vendas
    - Full sync + Incremental sync
    - Endpoint: `GET /v1/venda/busca`
    - Filtro incremental: `data_alteracao_de` (timezone São Paulo/GMT-3)
    - Paginação: 100 itens por página
    - Ordenação: descendente por data
    - Hash-based change detection
    - Job tracking

15. `supabase/functions/sync-financeiro/index.ts` - Worker de sincronização financeira
    - Full sync + Incremental sync
    - Endpoints:
      - `GET /v1/financeiro/contas-a-receber`
      - `GET /v1/financeiro/contas-a-pagar`
    - Filtro incremental: `data_alteracao_de`
    - Suporta sync de: receber, pagar, ou both
    - Hash-based change detection
    - Job tracking

16. `src/hooks/useSyncJobs.ts` - React Hook para gerenciar sync jobs
    - `useSyncJobs(filters)` - Lista jobs com filtros
    - `useSyncJob(id)` - Detalhes de job específico (auto-refetch se running)
    - `useTriggerSync()` - Trigger manual de sync
    - `useSyncStatistics()` - Estatísticas agregadas
    - `useJobsByEntity()` - Jobs agrupados por entidade

### ✅ **Milestone 1.5: Observability & Health Dashboard**

17. `src/components/contaazul/HealthDashboard.tsx` - Dashboard de saúde
    - 4 metric cards:
      - Connection status (ativa/inativa)
      - Success rate (% de jobs bem-sucedidos)
      - Total records (registros processados)
      - Avg duration (tempo médio de sync)
    - Current status summary:
      - Status da conexão
      - Token expiry
      - Jobs em execução
      - Jobs com erro
    - Latest sync per entity type
    - Warnings & alerts section

18. `src/components/contaazul/SyncHistory.tsx` - Histórico de sincronizações
    - Tabela dos últimos 50 jobs
    - Filtros: entity type, status
    - Expandable error details
    - Retry button para jobs falhados
    - Real-time updates (auto-refetch para jobs running)
    - Color-coded status badges

---

## 🚀 IMPLEMENTAÇÃO PASSO A PASSO

### **PRÉ-REQUISITOS**

Antes de começar, você precisa ter:

- [ ] Conta no Supabase (gratuita ou paga)
- [ ] Conta no ContaAzul com acesso Developer
- [ ] Node.js 18+ instalado
- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Git instalado

**Credenciais necessárias:**
- `SUPABASE_PROJECT_ID` (obtém no dashboard)
- `SUPABASE_URL` (https://[PROJECT_ID].supabase.co)
- `SUPABASE_ANON_KEY` (Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)
- `CONTAAZUL_CLIENT_ID` (criar app em developers.contaazul.com)
- `CONTAAZUL_CLIENT_SECRET` (criar app em developers.contaazul.com)

---

### **FASE 1: Backend - Database Schema (15 min)**

#### 1.1. Clone o Repositório

```bash
git clone https://github.com/megaclic/ContaAzul.git
cd ContaAzul
```

#### 1.2. Conectar ao Supabase

```bash
# Login no Supabase CLI
supabase login

# Link ao projeto
supabase link --project-ref <SEU_PROJECT_ID>
```

#### 1.3. Aplicar Migrations

```bash
# Método 1: Via CLI (recomendado)
supabase db push

# Método 2: Via SQL Editor (se preferir)
# 1. Abrir Supabase Dashboard → SQL Editor
# 2. Criar nova query
# 3. Copiar TODO o conteúdo de:
#    - supabase/migrations/001_contaazul_schema.sql
#    - supabase/migrations/002_improve_connection_status.sql
# 4. Executar (Run)
```

#### 1.4. Verificar Schema Criado

```sql
-- Verificar tabelas criadas (deve retornar 19)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'contaazul%'
ORDER BY table_name;

-- Verificar helper functions (deve retornar 6)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%contaazul%'
ORDER BY routine_name;

-- Verificar view contaazul_connection_health
SELECT * FROM contaazul_connection_health;
```

**✅ Checkpoint:** Deve ter 19 tabelas + 6 functions + 1 view

---

### **FASE 2: Backend - Edge Functions (30 min)**

#### 2.1. Gerar e Configurar ENCRYPTION_KEY

```bash
# Gerar chave de 256 bits (64 caracteres hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OU (se não tiver Node.js)
openssl rand -hex 32

# Copiar a chave gerada
```

No Supabase Dashboard:
1. Settings → Edge Functions
2. Aba "Secrets"
3. Adicionar novo secret:
   - Name: `ENCRYPTION_KEY`
   - Value: `<chave-gerada-acima>`
4. Save

#### 2.2. Deploy TODAS as Edge Functions

```bash
# 1. OAuth Callback
supabase functions deploy contaazul-oauth-callback

# 2. Token Refresh
supabase functions deploy contaazul-token-refresh

# 3. Auto-Refresh Background
supabase functions deploy contaazul-auto-refresh

# 4. Sync Produtos
supabase functions deploy sync-produtos

# 5. Sync Pessoas
supabase functions deploy sync-pessoas

# 6. Sync Vendas
supabase functions deploy sync-vendas

# 7. Sync Financeiro
supabase functions deploy sync-financeiro
```

#### 2.3. Verificar Deploy

```bash
# Listar funções deployadas
supabase functions list

# Deve mostrar 7 funções:
# - contaazul-oauth-callback
# - contaazul-token-refresh
# - contaazul-auto-refresh
# - sync-produtos
# - sync-pessoas
# - sync-vendas
# - sync-financeiro
```

#### 2.4. Testar Edge Functions

```bash
# Teste 1: Token Refresh (deve dar erro esperado - sem conexão ainda)
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-token-refresh \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Esperado: {"success":false,"error":"No active connection found"}
# ✅ Isso é CORRETO! Ainda não temos conexão OAuth.

# Teste 2: Auto-Refresh
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-auto-refresh \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
# Esperado: {"success":true,"result":{...},"message":"No tokens need refresh"}
# ✅ Isso é CORRETO!
```

**✅ Checkpoint:** 7 Edge Functions deployadas e respondendo

---

### **FASE 3: Frontend - React/Lovable (25 min)**

#### 3.1. Install Dependencies

```bash
npm install
```

#### 3.2. Configurar Variáveis de Ambiente

Criar `.env.local`:

```bash
VITE_SUPABASE_URL=https://<PROJECT_ID>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>

# IMPORTANTE: NUNCA adicionar CLIENT_SECRET aqui!
# CLIENT_SECRET fica APENAS no banco (contaazul_config)
```

#### 3.3. Verificar Estrutura de Arquivos

Certifique-se de que os seguintes arquivos existem:

```
src/
├── hooks/
│   ├── useContaAzulAuth.ts       ✅
│   └── useSyncJobs.ts             ✅
├── components/contaazul/
│   ├── ConnectionStatus.tsx       ✅
│   ├── HealthDashboard.tsx        ✅
│   └── SyncHistory.tsx            ✅
├── pages/
│   ├── ContaAzulCallback.tsx      ✅
│   └── Admin/ContaAzulAdmin.tsx   ✅ (criar se não existe)
└── lib/contaazul/
    └── tokenHelpers.ts            ✅
```

#### 3.4. Criar Página Admin (se não existe)

`src/pages/Admin/ContaAzulAdmin.tsx`:

```tsx
import { HealthDashboard } from '@/components/contaazul/HealthDashboard';
import { SyncHistory } from '@/components/contaazul/SyncHistory';
import { ConnectionStatus } from '@/components/contaazul/ConnectionStatus';

export default function ContaAzulAdmin() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Integração ContaAzul</h1>
      </div>

      {/* Status da Conexão OAuth */}
      <ConnectionStatus />

      {/* Dashboard de Saúde */}
      <HealthDashboard />

      {/* Histórico de Sincronizações */}
      <SyncHistory />
    </div>
  );
}
```

#### 3.5. Adicionar Rotas

No seu arquivo de rotas (`App.tsx` ou `routes.tsx`):

```tsx
import ContaAzulCallback from '@/pages/ContaAzulCallback';
import ContaAzulAdmin from '@/pages/Admin/ContaAzulAdmin';

// Adicionar rotas:
<Route path="/contaazul/callback" element={<ContaAzulCallback />} />
<Route path="/admin/contaazul" element={<ContaAzulAdmin />} />
```

#### 3.6. Run Dev Server

```bash
npm run dev
```

Abrir navegador em: `http://localhost:5173/admin/contaazul`

**✅ Checkpoint:** Página carrega, mostra "Desconectado" (esperado - ainda sem OAuth)

---

### **FASE 4: OAuth Configuration (20 min)**

#### 4.1. Criar App no ContaAzul

1. Acessar https://developers.contaazul.com
2. Login com sua conta ContaAzul
3. Menu → "Aplicações" → "Nova Aplicação"
4. Preencher:
   - **Nome:** "Integração [SUA_EMPRESA]"
   - **Redirect URI:** `https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-oauth-callback`
5. Salvar
6. Copiar:
   - `Client ID` (anotar)
   - `Client Secret` (anotar)

#### 4.2. Configurar no Banco de Dados

No Supabase SQL Editor:

```sql
UPDATE contaazul_config
SET 
  client_id = '<SEU_CLIENT_ID_AQUI>',
  client_secret = '<SEU_CLIENT_SECRET_AQUI>',
  redirect_uri = 'https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-oauth-callback'
WHERE id = 1;

-- Verificar
SELECT client_id, redirect_uri FROM contaazul_config;
-- NÃO mostrar client_secret por segurança
```

#### 4.3. Testar OAuth Flow Completo

1. Abrir `/admin/contaazul` no navegador
2. Clicar botão "Conectar ContaAzul"
3. Fazer login no ContaAzul (se necessário)
4. Autorizar a aplicação
5. Aguardar redirect automático
6. Verificar:
   - ✅ Status mostra "Conectado ✓"
   - ✅ CNPJ + Nome da empresa aparecem
   - ✅ Token expiry countdown iniciado

#### 4.4. Verificar no Banco

```sql
-- Ver conexão criada
SELECT 
  id, 
  company_id,
  conta_cnpj,
  conta_nome,
  status,
  token_expires_at,
  is_active
FROM contaazul_connections
WHERE is_active = true;

-- Ver evento de audit
SELECT * FROM contaazul_audit_log 
ORDER BY created_at DESC 
LIMIT 5;
```

**✅ Checkpoint:** OAuth flow completo, tokens salvos, conexão ativa

---

### **FASE 5: Sync Engine - Testar Manualmente (30 min)**

#### 5.1. Sync Produtos (Full)

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-produtos \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'

# Esperado:
# {
#   "success": true,
#   "job_id": "uuid...",
#   "operation": "full",
#   "total_fetched": 150,
#   "total_upserted": 150,
#   "total_errors": 0,
#   "duration_ms": 4523
# }
```

Verificar no banco:

```sql
-- Ver job criado
SELECT * FROM contaazul_sync_jobs 
WHERE entity_type = 'produtos' 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver produtos sincronizados
SELECT COUNT(*) FROM contaazul_raw_produtos;
SELECT * FROM contaazul_raw_produtos LIMIT 5;
```

#### 5.2. Sync Pessoas (Full)

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-pessoas \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

Verificar:

```sql
SELECT COUNT(*) FROM contaazul_raw_pessoas;
SELECT * FROM contaazul_raw_pessoas LIMIT 5;
```

#### 5.3. Sync Vendas (Full)

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-vendas \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

Verificar:

```sql
SELECT COUNT(*) FROM contaazul_raw_vendas;
SELECT * FROM contaazul_raw_vendas LIMIT 5;
```

#### 5.4. Sync Financeiro (Full - Both)

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full","type":"both"}'
```

Verificar:

```sql
SELECT COUNT(*) FROM contaazul_raw_contas_receber;
SELECT COUNT(*) FROM contaazul_raw_contas_pagar;
```

#### 5.5. Visualizar no Dashboard

1. Abrir `/admin/contaazul`
2. Verificar:
   - ✅ Connection: Ativa
   - ✅ Success Rate: 100%
   - ✅ Total Records: > 0
   - ✅ Jobs aparecem no histórico
   - ✅ Última sincronização exibida

**✅ Checkpoint:** 4 entidades sincronizadas manualmente, dados no banco, dashboard funcionando

---

### **FASE 6: Agendamentos Automáticos (20 min)**

#### 6.1. Habilitar pg_cron

```sql
-- No Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verificar
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

#### 6.2. Agendar Auto-Refresh (CRÍTICO - cada 2 min)

```sql
SELECT cron.schedule(
  'contaazul-auto-refresh',
  '*/2 * * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/contaazul-auto-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SEU_SERVICE_ROLE_KEY>'
    )
  )$$
);
```

#### 6.3. Agendar Sync Incremental - Produtos (cada 1h)

```sql
SELECT cron.schedule(
  'sync-produtos-incremental',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-produtos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SEU_ANON_KEY>'
    ),
    body := '{"operation": "incremental"}'::jsonb
  )$$
);
```

#### 6.4. Agendar Sync Incremental - Pessoas (cada 2h)

```sql
SELECT cron.schedule(
  'sync-pessoas-incremental',
  '0 */2 * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-pessoas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SEU_ANON_KEY>'
    ),
    body := '{"operation": "incremental"}'::jsonb
  )$$
);
```

#### 6.5. Agendar Sync Incremental - Vendas (cada 30 min)

```sql
SELECT cron.schedule(
  'sync-vendas-incremental',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-vendas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SEU_ANON_KEY>'
    ),
    body := '{"operation": "incremental"}'::jsonb
  )$$
);
```

#### 6.6. Agendar Sync Incremental - Financeiro (cada 1h)

```sql
SELECT cron.schedule(
  'sync-financeiro-incremental',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-financeiro',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SEU_ANON_KEY>'
    ),
    body := '{"operation": "incremental", "type": "both"}'::jsonb
  )$$
);
```

#### 6.7. Agendar Full Sync Diário (00:00)

```sql
SELECT cron.schedule(
  'sync-full-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-produtos', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-pessoas', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-vendas', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-financeiro', body := '{"operation": "full", "type": "both"}'::jsonb);
  $$
);
```

#### 6.8. Verificar Jobs Agendados

```sql
-- Listar todos os jobs agendados
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
ORDER BY jobname;

-- Deve retornar 6 jobs:
-- 1. contaazul-auto-refresh (*/2 * * * *)
-- 2. sync-produtos-incremental (0 * * * *)
-- 3. sync-pessoas-incremental (0 */2 * * *)
-- 4. sync-vendas-incremental (*/30 * * * *)
-- 5. sync-financeiro-incremental (0 * * * *)
-- 6. sync-full-daily (0 0 * * *)
```

#### 6.9. Verificar Execuções (após alguns minutos)

```sql
-- Ver últimas execuções
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

**✅ Checkpoint:** 6 jobs agendados, execuções aparecendo no histórico

---

## 📋 CHECKLIST DE VALIDAÇÃO FINAL

### ✅ **Backend Completo**

- [ ] Migration 001 aplicada (19 tabelas)
- [ ] Migration 002 aplicada (6 helper functions + 1 view)
- [ ] 7 Edge Functions deployadas
- [ ] `ENCRYPTION_KEY` configurada no Supabase
- [ ] 6 pg_cron jobs agendados

### ✅ **OAuth Completo**

- [ ] App criado no ContaAzul Developers
- [ ] `client_id` + `client_secret` configurados no banco
- [ ] OAuth flow funcional (login → autorização → callback)
- [ ] Tokens salvos (encrypted) no banco
- [ ] Status "Conectado ✓" no dashboard
- [ ] CNPJ + Nome da empresa exibidos

### ✅ **Sync Engine Completo**

- [ ] Produtos sincronizados (manual testado)
- [ ] Pessoas sincronizadas (manual testado)
- [ ] Vendas sincronizadas (manual testado)
- [ ] Financeiro sincronizado (manual testado)
- [ ] Jobs aparecem em `contaazul_sync_jobs`
- [ ] Dados aparecem nas tabelas `raw_*`

### ✅ **Frontend Completo**

- [ ] Dashboard funcionando (`/admin/contaazul`)
- [ ] ConnectionStatus exibindo status
- [ ] HealthDashboard exibindo métricas
- [ ] SyncHistory exibindo jobs
- [ ] Filtros e botões funcionando
- [ ] Sem erros no console

### ✅ **Automação Completa**

- [ ] Auto-refresh executando (cada 2 min)
- [ ] Sync incremental produtos (cada 1h)
- [ ] Sync incremental pessoas (cada 2h)
- [ ] Sync incremental vendas (cada 30min)
- [ ] Sync incremental financeiro (cada 1h)
- [ ] Full sync diário (00:00)

---

## 🔍 TROUBLESHOOTING

### **Erro: "No active connection found"**

**Causa:** OAuth não concluído ou conexão expirada

**Solução:**
1. Ir em `/admin/contaazul`
2. Clicar "Conectar ContaAzul"
3. Refazer OAuth flow

---

### **Erro: "Token expired"**

**Causa:** Token expirou e auto-refresh ainda não executou

**Solução:**
```sql
-- Forçar refresh manual
SELECT net.http_post(
  url := 'https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-token-refresh',
  headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
);

-- OU aguardar até 2 minutos para auto-refresh
```

---

### **Sync não executa automaticamente**

**Causa:** pg_cron job não configurado ou com erro

**Solução:**
```sql
-- Verificar jobs
SELECT * FROM cron.job;

-- Verificar execuções
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Se vazio, recriar jobs (ver FASE 6)
```

---

### **Dashboard sem dados**

**Causa:** Nenhum sync foi executado ainda

**Solução:**
```bash
# Executar sync manual
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-produtos \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"operation":"full"}'

# Aguardar conclusão e recarregar dashboard
```

---

### **Erro: "pg_try_advisory_lock function does not exist"**

**Causa:** Migration 002 não foi aplicada

**Solução:**
```sql
-- Executar migration 002 novamente
-- (copiar e colar conteúdo de 002_improve_connection_status.sql)
```

---

## 📊 ARQUITETURA

### **Fluxo de Token Refresh Automático**

```
1. pg_cron (cada 2 min)
   ↓
2. contaazul-auto-refresh Edge Function
   ↓
3. get_expiring_connections(5) → tokens expirando < 5min
   ↓
4. Para cada conexão expirando:
   ├─ Chama contaazul-token-refresh
   ├─ pg_try_advisory_lock(connection_id) → previne refresh duplo
   ├─ Decrypta refresh_token
   ├─ POST https://api.contaazul.com/oauth2/token (grant_type=refresh_token)
   ├─ Recebe novo access_token + refresh_token
   ├─ Encrypta (AES-GCM) + Salva no banco
   ├─ Atualiza status: refresh_in_progress → connected
   ├─ Audit log
   └─ pg_advisory_unlock(connection_id) (always, no finally)
```

### **Fluxo de Sincronização (exemplo: Produtos)**

```
1. Trigger: Manual OU pg_cron (cada 1h incremental)
   ↓
2. sync-produtos Edge Function
   ↓
3. Create job → status: 'running'
   ↓
4. Get valid access_token
   ├─ Se expirando < 5min → refresh automático
   └─ Senão → usa token atual
   ↓
5. Fetch ContaAzul API (paginado)
   ├─ GET /v1/produtos?pagina=0&tamanho_pagina=100
   ├─ Se incremental: adiciona data_alteracao_de
   └─ Loop até buscar todos (paginação)
   ↓
6. Para cada produto:
   ├─ Compute hash (SHA-256 do payload)
   ├─ Compara com hash existente
   ├─ Se mudou → Upsert to contaazul_raw_produtos
   └─ Se erro → Track error
   ↓
7. Update job
   ├─ status: 'success' ou 'partial_success' ou 'error'
   ├─ records_processed, records_success, records_error
   ├─ duration_ms
   └─ error_details (array)
   ↓
8. Audit log
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitetura técnica completa (950 linhas)
- **[OAUTH_SETUP.md](docs/OAUTH_SETUP.md)** - Setup OAuth detalhado
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Referência das APIs
- **[IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)** - Guia resumido

---

## 🎯 MÉTRICAS DE SUCESSO

### **Após Implementação Completa:**

- ✅ Taxa de sucesso de sync: **> 95%**
- ✅ Uptime da integração: **> 99%**
- ✅ Token renewal automático: **100%**
- ✅ Tempo médio de sync: **< 5 minutos**
- ✅ Zero incidentes de segurança
- ✅ Zero tokens expirados não renovados

### **Dados Sincronizados:**

- ✅ Produtos (cada 1h incremental + 1x/dia full)
- ✅ Pessoas (cada 2h incremental + 1x/dia full)
- ✅ Vendas (cada 30min incremental + 1x/dia full)
- ✅ Financeiro (cada 1h incremental + 1x/dia full)

---

## 🔐 SEGURANÇA

### **Tokens Never Exposed**

- ✅ Encrypted at rest (AES-GCM 256-bit)
- ✅ Decrypted apenas em Edge Functions
- ✅ NUNCA enviados ao frontend
- ✅ `client_secret` NUNCA em variáveis de ambiente do frontend

### **Lock Concorrente**

- ✅ PostgreSQL advisory locks
- ✅ Previne refresh simultâneo do mesmo token
- ✅ Lock sempre released (finally block)

### **Audit Trail Completo**

- ✅ Todos os eventos logados em `contaazul_audit_log`
- ✅ Timestamps precisos
- ✅ Metadata estruturada (JSON)
- ✅ IP do request (onde disponível)

---

## 📞 PRÓXIMOS PASSOS

Após implementação bem-sucedida:

1. ✅ **Monitorar por 7 dias:**
   - Taxa de sucesso > 95%
   - Zero tokens expirados
   - Performance < 5min por sync

2. 📋 **Semana 4-5: Expansão (Futuro)**
   - Adicionar sync de Serviços
   - Adicionar sync de Contratos
   - Adicionar sync de Categorias Financeiras
   - Adicionar sync de Centros de Custo

3. 📋 **Semana 6: Testes (Futuro)**
   - Testes unitários (tokenHelpers, hash, OAuth)
   - Testes de integração (callback, refresh, sync)
   - Cobertura > 70%

4. 📋 **Semana 7: Hardening (Futuro)**
   - Runbook operacional
   - Performance tuning
   - Security audit final
   - Documentação final

---

**Versão:** 2.1.0  
**Data:** 2026-03-26  
**Status:** ✅ Production-Ready  
**Entidades Sincronizadas:** 4 (Produtos, Pessoas, Vendas, Financeiro)

---

## 📧 Suporte

- 📖 [Documentação Completa](https://github.com/megaclic/ContaAzul/tree/main/docs)
- 💬 [GitHub Issues](https://github.com/megaclic/ContaAzul/issues)

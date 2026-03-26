# 🏗️ Arquitetura Técnica — Integração ContaAzul

> **Versão:** 2.0  
> **Data:** 2026-03-26  
> **Foco:** Integração ContaAzul isolada e limpa (SEM lógicas ERP)

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Decisões Arquiteturais (ADRs)](#2-decisões-arquiteturais)
3. [Componentes do Sistema](#3-componentes-do-sistema)
4. [Schema do Banco de Dados](#4-schema-do-banco-de-dados)
5. [Fluxos de Dados](#5-fluxos-de-dados)
6. [API Contracts](#6-api-contracts)
7. [Sync Strategies](#7-sync-strategies)
8. [Admin UI & Configuração](#8-admin-ui--configuração)
9. [Roadmap de Implementação](#9-roadmap-de-implementação)
10. [Testing & QA](#10-testing--qa)

---

## 1. Visão Geral

### 1.1 Propósito

**Módulo de integração ContaAzul** para o sistema Bali, responsável por:

- ✅ Autenticação OAuth 2.0 com ContaAzul
- ✅ Sincronização automática de dados (pull only)
- ✅ Armazenamento de dados brutos em tabelas `contaazul_raw_*`
- ✅ Polling inteligente (ContaAzul não tem webhooks)
- ✅ Job queue com retry automático
- ✅ Admin UI para gerenciar integração

**IMPORTANTE:** Este módulo é **isolado** e **não implementa lógicas de negócio do ERP**. Ele apenas sincroniza dados do ContaAzul para o banco local. O ERP Bali é uma camada separada que consome esses dados.

### 1.2 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Estado/Fetching | TanStack Query v5 |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Runtime Edge | Deno (Supabase Edge Functions) |
| Integração | API ContaAzul v2 |
| Criptografia | AES-GCM (Web Crypto API) |
| Job Queue | Supabase Edge Functions + pg_cron |

### 1.3 Escopo

**Single Tenant:**
- Sistema gerencia **1 empresa** (conexão ContaAzul única)
- Não há multi-tenancy nesta versão

**Entidades Sincronizadas:**
1. Produtos
2. Pessoas (Clientes, Fornecedores, Transportadoras)
3. Vendas
4. Serviços
5. Contratos
6. Categorias Financeiras
7. Centros de Custo
8. Contas a Receber
9. Contas a Pagar
10. Baixas
11. Cobranças
12. Notas Fiscais (NFe, NFS-e)

---

## 2. Decisões Arquiteturais

### ADR-001: Polling vs Webhooks

**Contexto:** ContaAzul não fornece webhooks para notificação de mudanças.

**Decisão:** Implementar polling inteligente com estratégias diferenciadas por entidade.

**Consequências:**
- ✅ Funciona sem depender de webhooks inexistentes
- ✅ Controle total sobre frequência de sync
- ⚠️ Maior uso de API (mitigado por rate limiting)
- ⚠️ Latência na detecção de mudanças (5min-1h)

**Estratégia de Polling:**
```typescript
// Produtos: Slow-changing data
- Full sync: 1x/dia (00:00)
- Incremental: 1x/hora (detecção via data_alteracao)

// Vendas: Fast-changing data
- Incremental: 5min (critical para faturamento)

// Clientes/Fornecedores: Medium-changing
- Incremental: 1x/hora

// Categorias/Centros Custo: Very slow
- Full sync: 1x/dia (dados raramente mudam)

// Notas Fiscais: Read-only
- On-demand (usuário solicita)
```

---

### ADR-002: Job Queue Strategy

**Contexto:** Precisamos de job queue com retry, deduplicação e observabilidade.

**Decisão:** Usar Supabase Edge Functions + tabela `contaazul_sync_jobs` + pg_cron.

**Alternativas Consideradas:**
- ❌ BullMQ: Requer Redis (infraestrutura extra)
- ❌ Celery: Requer Python backend (não temos)
- ✅ Supabase Edge Functions: Já temos, integrado, escalável

**Implementação:**
```sql
-- Job queue table
CREATE TABLE contaazul_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  operation text NOT NULL, -- 'full_sync' | 'incremental'
  status text NOT NULL, -- 'pending' | 'running' | 'success' | 'error'
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- pg_cron jobs
SELECT cron.schedule('sync-vendas-incremental', '*/5 * * * *', 'CALL schedule_sync_job(''vendas'', ''incremental'')');
SELECT cron.schedule('sync-produtos-incremental', '0 * * * *', 'CALL schedule_sync_job(''produtos'', ''incremental'')');
SELECT cron.schedule('sync-produtos-full', '0 0 * * *', 'CALL schedule_sync_job(''produtos'', ''full_sync'')');
```

**Consequências:**
- ✅ Sem infraestrutura extra
- ✅ Retry automático com exponential backoff
- ✅ Deduplicação nativa (via metadata)
- ✅ Observabilidade via logs da Edge Function
- ⚠️ Cold starts (mitigado por keep-alive pings)

---

### ADR-003: Conflict Resolution

**Contexto:** Dados podem ser alterados localmente e no ContaAzul simultaneamente.

**Decisão:** **ContaAzul Always Wins** (single source of truth).

**Justificativa:**
- ContaAzul é o ERP oficial da empresa
- Sistema Bali é **read-only** dos dados ContaAzul
- Criação de novos registros é sempre via ContaAzul (manual ou API)

**Implementação:**
```typescript
// Detecção de mudanças via hash
const currentHash = crypto.createHash('sha256')
  .update(JSON.stringify(contaAzulData))
  .digest('hex');

if (currentHash !== storedHash) {
  // ContaAzul mudou → sobrescreve local
  await updateLocalRecord(contaAzulData, currentHash);
}
```

**Exceção:** Se futuramente Bali precisar escrever no ContaAzul:
- Implementar fila de "push" separada
- Lock otimista (via version field)
- UI de resolução manual se conflito

---

### ADR-004: Data Mapping

**Contexto:** Dados ContaAzul precisam ser armazenados localmente.

**Decisão:** Armazenar **JSON completo** + **campos extraídos** importantes.

**Estrutura das Tabelas Raw:**
```sql
-- Padrão: contaazul_raw_[entidade]
CREATE TABLE contaazul_raw_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL, -- ID do ContaAzul
  dados jsonb NOT NULL, -- JSON completo da API
  hash text NOT NULL, -- SHA256 para detecção de mudanças
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Campos extraídos (query performance)
  codigo text,
  nome text,
  valor_venda numeric,
  status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Vantagens:**
- ✅ Preserva **todos os dados** (JSON completo)
- ✅ Query performance (campos indexados)
- ✅ Change detection (hash)
- ✅ Auditoria (synced_at, updated_at)
- ✅ Flexível (novos campos da API não quebram)

---

### ADR-005: Error Recovery

**Contexto:** Sync pode falhar por rate limiting, timeout, OAuth expirado, etc.

**Decisão:** Retry exponencial + dead letter queue + alertas.

**Estratégia de Retry:**
```typescript
interface RetryStrategy {
  maxRetries: 3;
  backoff: 'exponential'; // 1s, 2s, 4s, 8s
  retryableErrors: [
    'RATE_LIMIT_EXCEEDED',
    'TIMEOUT',
    'NETWORK_ERROR',
    'TEMPORARY_SERVER_ERROR' // 5xx
  ];
  nonRetryableErrors: [
    'UNAUTHORIZED', // 401 → requer reautenticação
    'NOT_FOUND', // 404 → registro deletado
    'VALIDATION_ERROR' // 400 → payload inválido
  ];
}
```

**Dead Letter Queue:**
```sql
-- Jobs que falharam após max_retries
CREATE TABLE contaazul_sync_dead_letter (
  id uuid PRIMARY KEY,
  job_data jsonb NOT NULL,
  error_message text,
  failed_at timestamptz DEFAULT now()
);
```

**Alertas:**
- Email/Slack quando job vai para dead letter
- Dashboard mostra jobs com erro

---

## 3. Componentes do Sistema

### 3.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Admin   │ │  Sync    │ │  Health  │ │   Logs     │ │
│  │   UI     │ │  Status  │ │  Monitor │ │  Viewer    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │             │            │              │        │
│  ┌────┴─────────────┴────────────┴──────────────┴─────┐ │
│  │       TanStack Query + Supabase SDK                 │ │
│  └─────────────────────────┬──────────────────────────┘  │
└────────────────────────────┼─────────────────────────────┘
                             │ HTTPS
┌────────────────────────────┼─────────────────────────────┐
│                   SUPABASE BACKEND                        │
│                            │                             │
│  ┌─────────────────────────┴──────────────────────────┐  │
│  │         Edge Functions (Deno) - Job Processors      │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │  sync-       │  │  sync-       │               │  │
│  │  │  produtos    │  │  vendas      │  ...          │  │
│  │  └──────────────┘  └──────────────┘               │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │  poll-       │  │  health-     │               │  │
│  │  │  changes     │  │  checker     │               │  │
│  │  └──────────────┘  └──────────────┘               │  │
│  └────────────────────────────────────────────────────┘  │
│                            │                             │
│  ┌─────────────────────────┴──────────────────────────┐  │
│  │           PostgreSQL (RLS habilitado)               │  │
│  │                                                      │  │
│  │  ┌──────────────────┐  ┌──────────────────┐        │  │
│  │  │ contaazul_config │  │ contaazul_       │        │  │
│  │  │ contaazul_       │  │ connections      │        │  │
│  │  │ connections      │  └──────────────────┘        │  │
│  │  └──────────────────┘                              │  │
│  │                                                      │  │
│  │  ┌──────────────────┐  ┌──────────────────┐        │  │
│  │  │ contaazul_raw_*  │  │ contaazul_sync_  │        │  │
│  │  │ (12 tabelas)     │  │ jobs             │        │  │
│  │  └──────────────────┘  └──────────────────┘        │  │
│  │                                                      │  │
│  │  ┌──────────────────┐  ┌──────────────────┐        │  │
│  │  │ contaazul_audit_ │  │ contaazul_health_│        │  │
│  │  │ log              │  │ checks           │        │  │
│  │  └──────────────────┘  └──────────────────┘        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                             │
                     ┌───────┴───────┐
                     │  API Conta    │
                     │  Azul v2      │
                     │               │
                     │ Rate Limit:   │
                     │ 600 req/min   │
                     │ 10 req/sec    │
                     └───────────────┘
```

### 3.2 Componentes Principais

#### 3.2.1 OAuth Manager
**Responsabilidade:** Gerenciar fluxo OAuth 2.0 completo.

**Funções:**
```typescript
class OAuthManager {
  async initiateFlow(): Promise<{ authUrl: string; state: string }>;
  async handleCallback(code: string, state: string): Promise<void>;
  async refreshToken(): Promise<void>;
  async isAuthenticated(): Promise<boolean>;
  async getValidToken(): Promise<string>;
}
```

**Edge Function:** `contaazul-oauth-callback`

---

#### 3.2.2 Sync Engine
**Responsabilidade:** Orquestrar sincronização de dados.

**Funções:**
```typescript
class SyncEngine {
  // Full sync (pega TUDO)
  async fullSync(entity: Entity): Promise<SyncResult>;
  
  // Incremental sync (apenas mudanças desde lastSync)
  async incrementalSync(entity: Entity, since: Date): Promise<SyncResult>;
  
  // Schedule sync job
  async scheduleSyncJob(config: SyncJobConfig): Promise<void>;
  
  // Process pending jobs
  async processPendingJobs(): Promise<void>;
}
```

**Edge Functions:**
- `sync-produtos`
- `sync-vendas`
- `sync-pessoas`
- `sync-servicos`
- `sync-contratos`
- `sync-financeiro` (categorias, centros custo, contas)
- `sync-notas-fiscais`

---

#### 3.2.3 Polling Service
**Responsabilidade:** Detectar mudanças via polling.

**Funções:**
```typescript
class PollingService {
  // Poll entity changes
  async pollChanges(entity: Entity, since: Date): Promise<Change[]>;
  
  // Detect changes via hash comparison
  async detectChanges(entity: Entity): Promise<ChangeSet>;
  
  // Schedule next poll
  async scheduleNextPoll(entity: Entity): Promise<void>;
}
```

**Edge Function:** `poll-changes`

---

#### 3.2.4 Health Checker
**Responsabilidade:** Monitorar saúde da integração.

**Funções:**
```typescript
class HealthChecker {
  async checkOAuthStatus(): Promise<HealthStatus>;
  async checkAPIReachability(): Promise<HealthStatus>;
  async checkLastSyncTime(): Promise<HealthStatus>;
  async checkRateLimits(): Promise<HealthStatus>;
  async getOverallHealth(): Promise<OverallHealth>;
}
```

**Edge Function:** `health-check`

---

#### 3.2.5 Audit Logger
**Responsabilidade:** Registrar todas as operações.

**Funções:**
```typescript
class AuditLogger {
  async logOAuthEvent(event: OAuthEvent): Promise<void>;
  async logSyncEvent(event: SyncEvent): Promise<void>;
  async logError(error: Error, context: Context): Promise<void>;
  async queryLogs(filters: LogFilters): Promise<Log[]>;
}
```

---

## 4. Schema do Banco de Dados

### 4.1 Tabelas de Configuração

```sql
-- OAuth Configuration (single row)
CREATE TABLE contaazul_config (
  id integer PRIMARY KEY DEFAULT 1,
  client_id text,
  client_secret text,
  redirect_uri text,
  auth_base_url text DEFAULT 'https://auth.contaazul.com/login',
  token_url text DEFAULT 'https://auth.contaazul.com/oauth2/token',
  api_base_url text DEFAULT 'https://api-v2.contaazul.com/v1',
  scope text DEFAULT 'openid+profile+aws.cognito.signin.user.admin',
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT single_config CHECK (id = 1)
);

-- OAuth Connections (encrypted tokens)
CREATE TABLE contaazul_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'ContaAzul Connection',
  access_token_enc text, -- AES-GCM encrypted
  refresh_token_enc text, -- AES-GCM encrypted
  token_expires_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  is_active boolean DEFAULT true,
  
  -- Metadata
  conta_conectada_cnpj text,
  conta_conectada_nome text,
  last_used_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4.2 Tabelas de Sync Jobs

```sql
-- Sync Jobs Queue
CREATE TABLE contaazul_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'produtos', 'vendas', etc
  operation text NOT NULL, -- 'full_sync' | 'incremental'
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'success' | 'error'
  
  -- Execution
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  
  -- Error handling
  error_message text,
  error_stack text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  
  -- Metadata
  metadata jsonb, -- { since: ISO date, records_synced: 123, ... }
  
  created_at timestamptz DEFAULT now(),
  
  -- Index for job processor
  INDEX idx_pending_jobs ON contaazul_sync_jobs(status, next_retry_at) 
    WHERE status IN ('pending', 'error')
);

-- Dead Letter Queue
CREATE TABLE contaazul_sync_dead_letter (
  id uuid PRIMARY KEY,
  job_data jsonb NOT NULL,
  error_message text,
  error_stack text,
  failed_at timestamptz DEFAULT now()
);
```

### 4.3 Tabelas Raw (Data Lake)

**Padrão:** `contaazul_raw_[entidade]`

```sql
-- Produtos
CREATE TABLE contaazul_raw_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  codigo text,
  nome text,
  valor_venda numeric,
  status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Indexes
  INDEX idx_produtos_codigo ON contaazul_raw_produtos(codigo),
  INDEX idx_produtos_status ON contaazul_raw_produtos(status),
  INDEX idx_produtos_synced ON contaazul_raw_produtos(synced_at DESC)
);

-- Pessoas (Clientes, Fornecedores, Transportadoras)
CREATE TABLE contaazul_raw_pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  nome text,
  documento text,
  tipo_perfil text, -- 'Cliente' | 'Fornecedor' | 'Transportadora'
  status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  INDEX idx_pessoas_documento ON contaazul_raw_pessoas(documento),
  INDEX idx_pessoas_tipo ON contaazul_raw_pessoas(tipo_perfil)
);

-- Vendas
CREATE TABLE contaazul_raw_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero integer,
  data_venda date,
  situacao text,
  valor_total numeric,
  id_cliente_contaazul text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  INDEX idx_vendas_numero ON contaazul_raw_vendas(numero),
  INDEX idx_vendas_data ON contaazul_raw_vendas(data_venda DESC),
  INDEX idx_vendas_cliente ON contaazul_raw_vendas(id_cliente_contaazul)
);

-- Serviços
CREATE TABLE contaazul_raw_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  codigo text,
  nome text,
  valor numeric,
  status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contratos (Vendas Recorrentes)
CREATE TABLE contaazul_raw_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero integer,
  data_inicio date,
  periodo text, -- 'MENSAL', 'TRIMESTRAL', etc
  valor_total numeric,
  id_cliente_contaazul text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categorias Financeiras
CREATE TABLE contaazul_raw_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  nome text,
  tipo text, -- 'RECEITA' | 'DESPESA'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Centros de Custo
CREATE TABLE contaazul_raw_centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  nome text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contas a Receber
CREATE TABLE contaazul_raw_contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  descricao text,
  data_competencia date,
  valor numeric,
  status text,
  id_cliente_contaazul text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  INDEX idx_contas_receber_data ON contaazul_raw_contas_receber(data_competencia DESC),
  INDEX idx_contas_receber_status ON contaazul_raw_contas_receber(status)
);

-- Contas a Pagar
CREATE TABLE contaazul_raw_contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  descricao text,
  data_competencia date,
  valor numeric,
  status text,
  id_fornecedor_contaazul text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  INDEX idx_contas_pagar_data ON contaazul_raw_contas_pagar(data_competencia DESC),
  INDEX idx_contas_pagar_status ON contaazul_raw_contas_pagar(status)
);

-- Baixas (Pagamentos)
CREATE TABLE contaazul_raw_baixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  id_parcela_contaazul text,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  data_pagamento date,
  valor numeric,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cobranças
CREATE TABLE contaazul_raw_cobrancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  data_vencimento date,
  valor_bruto numeric,
  status text,
  tipo text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notas Fiscais Eletrônicas (NFe)
CREATE TABLE contaazul_raw_nfe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave_acesso text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero text,
  data_emissao date,
  valor_total numeric,
  status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notas Fiscais de Serviço (NFS-e)
CREATE TABLE contaazul_raw_nfse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero text,
  data_emissao date,
  valor_servicos numeric,
  status text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4.4 Tabelas de Auditoria e Monitoring

```sql
-- Audit Log
CREATE TABLE contaazul_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'oauth_login', 'sync_started', 'sync_completed', 'error'
  entity_type text, -- 'produtos', 'vendas', etc
  entity_id text, -- ID do registro afetado
  
  -- Event details
  action text, -- 'create', 'update', 'delete', 'sync'
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  
  -- Context
  user_id uuid,
  ip_address inet,
  user_agent text,
  
  created_at timestamptz DEFAULT now(),
  
  INDEX idx_audit_event ON contaazul_audit_log(event_type, created_at DESC),
  INDEX idx_audit_entity ON contaazul_audit_log(entity_type, entity_id)
);

-- Health Checks Log
CREATE TABLE contaazul_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type text NOT NULL, -- 'oauth', 'api_reachability', 'sync_freshness'
  status text NOT NULL, -- 'healthy', 'degraded', 'down'
  message text,
  response_time_ms integer,
  metadata jsonb,
  
  checked_at timestamptz DEFAULT now(),
  
  INDEX idx_health_recent ON contaazul_health_checks(check_type, checked_at DESC)
);
```

### 4.5 RLS Policies

```sql
-- Enable RLS
ALTER TABLE contaazul_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contaazul_config ENABLE ROW LEVEL SECURITY;

-- Policies (admin users only)
CREATE POLICY "Admin users can read config"
  ON contaazul_config FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Admin users can update config"
  ON contaazul_config FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- Connections: read/write for service role only
CREATE POLICY "Service role can manage connections"
  ON contaazul_connections
  USING (auth.jwt()->>'role' = 'service_role');
```

---

## 5. Fluxos de Dados

### 5.1 Fluxo OAuth 2.0

```
┌─────────────────────────────────────────────────────────┐
│                    OAuth Flow                            │
└─────────────────────────────────────────────────────────┘

1. User clicks "Conectar ContaAzul" (Admin UI)
   ↓
2. Frontend gera authUrl via contaazul_config
   GET /auth/authorize?response_type=code&client_id=...
   ↓
3. User autoriza no ContaAzul (externa)
   ↓
4. ContaAzul redireciona para callback
   https://[project].supabase.co/functions/v1/contaazul-oauth-callback?code=...
   ↓
5. Edge Function: contaazul-oauth-callback
   - Exchange code for tokens
   - Encrypt tokens (AES-GCM)
   - Save to contaazul_connections
   - Return success
   ↓
6. Frontend recebe confirmação
   - Atualiza UI "Conectado ✓"
   - Inicia primeiro full sync
```

### 5.2 Fluxo Full Sync (Exemplo: Produtos)

```
┌─────────────────────────────────────────────────────────┐
│                 Full Sync Flow                           │
└─────────────────────────────────────────────────────────┘

1. pg_cron trigger (ou manual via UI)
   ↓
2. INSERT INTO contaazul_sync_jobs
   { entity_type: 'produtos', operation: 'full_sync', status: 'pending' }
   ↓
3. Edge Function: sync-produtos (invoked by pg_cron)
   - Get valid OAuth token
   - Fetch produtos from ContaAzul (paginated)
   - For each produto:
     * Compute hash (SHA256 of JSON)
     * UPSERT into contaazul_raw_produtos
       - If hash changed → update
       - If new → insert
   - Update job status: 'success'
   ↓
4. Return sync result
   { records_synced: 245, records_updated: 12, records_new: 3 }
   ↓
5. Audit log: logSyncEvent({ entity: 'produtos', ... })
```

### 5.3 Fluxo Incremental Sync (Exemplo: Vendas)

```
┌─────────────────────────────────────────────────────────┐
│              Incremental Sync Flow                       │
└─────────────────────────────────────────────────────────┘

1. pg_cron trigger (every 5 minutes)
   ↓
2. Get last_sync_time from contaazul_sync_jobs
   WHERE entity_type = 'vendas' AND status = 'success'
   ORDER BY completed_at DESC LIMIT 1
   ↓
3. Edge Function: sync-vendas
   - Get valid OAuth token
   - Fetch vendas since last_sync_time
     GET /vendas?data_alteracao_maior_que={last_sync_time}
   - For each venda:
     * Compute hash
     * UPSERT into contaazul_raw_vendas
   ↓
4. Update job status: 'success'
   ↓
5. Schedule next incremental (5 minutes)
```

### 5.4 Fluxo Polling (Detecção de Mudanças)

```
┌─────────────────────────────────────────────────────────┐
│                 Polling Flow                             │
└─────────────────────────────────────────────────────────┘

1. Edge Function: poll-changes (triggered by pg_cron)
   ↓
2. For each entity (produtos, vendas, pessoas):
   - Get last_sync_time
   - Fetch records since last_sync_time
   - Compare hashes with local
   ↓
3. If changes detected:
   - Schedule sync job
   INSERT INTO contaazul_sync_jobs
   { entity_type: '...', operation: 'incremental', status: 'pending' }
   ↓
4. Job processor picks up and syncs
```

### 5.5 Fluxo Error Recovery

```
┌─────────────────────────────────────────────────────────┐
│                Error Recovery Flow                       │
└─────────────────────────────────────────────────────────┘

1. Job fails (e.g., rate limit, timeout)
   ↓
2. Check retry_count < max_retries (3)
   ↓
3. If retry_count < 3:
   - Increment retry_count
   - Set next_retry_at = now() + (2^retry_count) seconds
   - Status = 'error'
   ↓
4. Job processor picks up after next_retry_at
   ↓
5. Retry job
   ↓
6. If success:
   - Status = 'success'
   
   If fail again and retry_count >= 3:
   - Move to dead_letter queue
   - Send alert (email/Slack)
   - Admin intervention required
```

---

## 6. API Contracts

### 6.1 Frontend → Supabase

**React Hooks (TanStack Query):**

```typescript
// OAuth
const { data: config } = useContaAzulConfig();
const { mutate: saveConfig } = useSaveContaAzulConfig();
const { data: connection } = useContaAzulConnection();
const { mutate: initiateOAuth } = useInitiateOAuth();

// Sync Management
const { data: syncJobs } = useSyncJobs({ entity_type: 'produtos' });
const { mutate: triggerSync } = useTriggerSync();
const { data: syncStatus } = useSyncStatus();

// Raw Data
const { data: produtos } = useContaAzulRawProdutos();
const { data: vendas } = useContaAzulRawVendas({ since: '2025-01-01' });

// Health & Audit
const { data: health } = useHealthStatus();
const { data: auditLogs } = useAuditLogs({ entity_type: 'vendas' });
```

### 6.2 Edge Functions Contracts

**Function: sync-produtos**
```typescript
interface SyncProdutosRequest {
  operation: 'full_sync' | 'incremental';
  since?: string; // ISO date (para incremental)
}

interface SyncProdutosResponse {
  success: boolean;
  records_synced: number;
  records_updated: number;
  records_new: number;
  duration_ms: number;
  errors?: string[];
}
```

**Function: health-check**
```typescript
interface HealthCheckResponse {
  overall_status: 'healthy' | 'degraded' | 'down';
  checks: {
    oauth: { status: string; message: string };
    api_reachability: { status: string; response_time_ms: number };
    last_sync: { status: string; last_sync_time: string; age_minutes: number };
    rate_limits: { status: string; remaining: number };
  };
}
```

---

## 7. Sync Strategies

### 7.1 Produtos

**Frequência:**
- Full sync: 1x/dia (00:00)
- Incremental: 1x/hora

**Justificativa:**
- Produtos mudam raramente
- Full sync garante consistência diária
- Incremental captura mudanças pontuais

**Implementação:**
```sql
-- pg_cron jobs
SELECT cron.schedule('sync-produtos-full', '0 0 * * *', 
  $$SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/sync-produtos',
    headers := '{"Authorization": "Bearer [key]"}'::jsonb,
    body := '{"operation": "full_sync"}'::jsonb
  )$$
);

SELECT cron.schedule('sync-produtos-incremental', '0 * * * *', 
  $$SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/sync-produtos',
    headers := '{"Authorization": "Bearer [key]"}'::jsonb,
    body := '{"operation": "incremental"}'::jsonb
  )$$
);
```

### 7.2 Vendas

**Frequência:**
- Incremental: 5min

**Justificativa:**
- Vendas são críticas (faturamento)
- Mudanças frequentes
- Near real-time é desejável

**Implementação:**
```sql
SELECT cron.schedule('sync-vendas-incremental', '*/5 * * * *', 
  $$SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/sync-vendas',
    headers := '{"Authorization": "Bearer [key]"}'::jsonb,
    body := '{"operation": "incremental"}'::jsonb
  )$$
);
```

### 7.3 Pessoas (Clientes, Fornecedores)

**Frequência:**
- Incremental: 1x/hora

**Justificativa:**
- Mudanças moderadas
- Não tão crítico quanto vendas

### 7.4 Categorias, Centros de Custo

**Frequência:**
- Full sync: 1x/dia

**Justificativa:**
- Dados de configuração
- Raramente mudam

### 7.5 Notas Fiscais

**Frequência:**
- On-demand (usuário solicita)

**Justificativa:**
- API é read-only
- Emissão é via UI do ContaAzul
- Consulta apenas quando necessário

---

## 8. Admin UI & Configuração

### 8.1 Telas da Admin UI

#### 8.1.1 OAuth Configuration
**Caminho:** `/admin/contaazul/config`

**Componente:** `ContaAzulConfigForm.tsx` (reaproveitar existente)

**Funcionalidades:**
- Configurar client_id, client_secret
- Visualizar authUrl gerado
- Botão "Conectar ContaAzul" (inicia OAuth flow)
- Status da conexão (Conectado ✓ / Desconectado ✗)

#### 8.1.2 Sync Management
**Caminho:** `/admin/contaazul/sync`

**Componente:** `SyncManagement.tsx` (novo)

**Funcionalidades:**
- Lista de entidades sincronizadas
- Status de cada entidade (última sync, próxima sync)
- Botão "Sincronizar Agora" (trigger manual)
- Configuração de frequência de sync (parametrizável)
- Histórico de syncs (últimas 50)

**Exemplo UI:**
```
┌─────────────────────────────────────────────────────────┐
│  Sincronização ContaAzul                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Entidade      | Última Sync  | Próxima | Registros    │
│  ────────────────────────────────────────────────────── │
│  Produtos      | 10:00 (há 2h)| 12:00   | 1.245  [▶️]  │
│  Vendas        | 11:55 (há 5m)| 12:00   | 3.891  [▶️]  │
│  Clientes      | 11:00 (há 1h)| 12:00   | 456    [▶️]  │
│  Serviços      | 10:00 (há 2h)| 12:00   | 89     [▶️]  │
│  ────────────────────────────────────────────────────── │
│                                                          │
│  [⚙️ Configurar Frequências]                            │
└─────────────────────────────────────────────────────────┘
```

#### 8.1.3 Health Monitor
**Caminho:** `/admin/contaazul/health`

**Componente:** `HealthMonitor.tsx` (novo)

**Funcionalidades:**
- Status geral (🟢 Healthy / 🟡 Degraded / 🔴 Down)
- Detalhes de cada check:
  * OAuth (token válido?)
  * API reachability (ping ContaAzul)
  * Sync freshness (última sync < 2h?)
  * Rate limits (requests restantes)
- Gráfico de uptime (últimos 7 dias)

#### 8.1.4 Audit Logs
**Caminho:** `/admin/contaazul/logs`

**Componente:** `AuditLogs.tsx` (novo)

**Funcionalidades:**
- Filtros (event_type, entity_type, date range)
- Paginação
- Export CSV
- Detalhes de cada evento (modal)

#### 8.1.5 Error Dashboard
**Caminho:** `/admin/contaazul/errors`

**Componente:** `ErrorDashboard.tsx` (novo)

**Funcionalidades:**
- Lista de jobs com erro
- Dead letter queue
- Retry manual
- Delete job

---

### 8.2 Configuração de Sync (Parametrizável)

**Tabela:** `contaazul_sync_config`

```sql
CREATE TABLE contaazul_sync_config (
  id integer PRIMARY KEY DEFAULT 1,
  
  -- Global settings
  auto_sync_enabled boolean DEFAULT true,
  
  -- Per-entity settings
  produtos_sync_enabled boolean DEFAULT true,
  produtos_sync_frequency text DEFAULT '1h', -- '5m', '15m', '1h', '6h', '1d'
  
  vendas_sync_enabled boolean DEFAULT true,
  vendas_sync_frequency text DEFAULT '5m',
  
  pessoas_sync_enabled boolean DEFAULT true,
  pessoas_sync_frequency text DEFAULT '1h',
  
  servicos_sync_enabled boolean DEFAULT true,
  servicos_sync_frequency text DEFAULT '1h',
  
  contratos_sync_enabled boolean DEFAULT true,
  contratos_sync_frequency text DEFAULT '1h',
  
  categorias_sync_enabled boolean DEFAULT true,
  categorias_sync_frequency text DEFAULT '1d',
  
  centros_custo_sync_enabled boolean DEFAULT true,
  centros_custo_sync_frequency text DEFAULT '1d',
  
  contas_receber_sync_enabled boolean DEFAULT true,
  contas_receber_sync_frequency text DEFAULT '15m',
  
  contas_pagar_sync_enabled boolean DEFAULT true,
  contas_pagar_sync_frequency text DEFAULT '15m',
  
  baixas_sync_enabled boolean DEFAULT true,
  baixas_sync_frequency text DEFAULT '15m',
  
  cobrancas_sync_enabled boolean DEFAULT true,
  cobrancas_sync_frequency text DEFAULT '15m',
  
  nfe_sync_enabled boolean DEFAULT false, -- On-demand
  nfse_sync_enabled boolean DEFAULT false, -- On-demand
  
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT single_config CHECK (id = 1)
);
```

**UI Component:** `SyncConfigForm.tsx`

```tsx
export function SyncConfigForm() {
  const { data: config } = useSyncConfig();
  const { mutate: updateConfig } = useUpdateSyncConfig();
  
  const entities = [
    { name: 'Produtos', key: 'produtos' },
    { name: 'Vendas', key: 'vendas' },
    { name: 'Clientes/Fornecedores', key: 'pessoas' },
    // ...
  ];
  
  const frequencies = [
    { label: '5 minutos', value: '5m' },
    { label: '15 minutos', value: '15m' },
    { label: '1 hora', value: '1h' },
    { label: '6 horas', value: '6h' },
    { label: '1 dia', value: '1d' },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Sincronização</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entities.map(entity => (
            <div key={entity.key} className="flex items-center gap-4">
              <Switch
                checked={config?.[`${entity.key}_sync_enabled`]}
                onCheckedChange={(checked) => 
                  updateConfig({ [`${entity.key}_sync_enabled`]: checked })
                }
              />
              <span className="flex-1">{entity.name}</span>
              <Select
                value={config?.[`${entity.key}_sync_frequency`]}
                onValueChange={(value) =>
                  updateConfig({ [`${entity.key}_sync_frequency`]: value })
                }
              >
                {frequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 9. Roadmap de Implementação

### 9.1 FASE 1: Foundation (Semana 1-2)

**Objetivo:** Base sólida para sincronização.

#### Milestone 1.1: Database Schema (2 dias)
- [ ] Criar migration SQL completa
- [ ] Tabelas: config, connections, sync_jobs, audit_log
- [ ] Tabelas raw_* (12 entidades)
- [ ] RLS policies
- [ ] Indexes otimizados

#### Milestone 1.2: OAuth Flow (3 dias)
- [ ] Edge Function: `contaazul-oauth-callback`
- [ ] Token encryption (AES-GCM)
- [ ] Token refresh automático
- [ ] React Hook: `useContaAzulAuth`
- [ ] UI: Reaproveitar `ContaAzulConfigForm.tsx`

#### Milestone 1.3: Sync Engine Core (5 dias)
- [ ] Edge Function: `sync-produtos` (referência)
- [ ] Hash-based change detection
- [ ] UPSERT logic
- [ ] Error handling + retry
- [ ] Audit logging

---

### 9.2 FASE 2: Entidades & Polling (Semana 3-4)

**Objetivo:** Sincronizar todas as 12 entidades.

#### Milestone 2.1: Sync Functions (10 dias)
- [ ] Edge Function: `sync-vendas`
- [ ] Edge Function: `sync-pessoas`
- [ ] Edge Function: `sync-servicos`
- [ ] Edge Function: `sync-contratos`
- [ ] Edge Function: `sync-categorias`
- [ ] Edge Function: `sync-centros-custo`
- [ ] Edge Function: `sync-contas-receber`
- [ ] Edge Function: `sync-contas-pagar`
- [ ] Edge Function: `sync-baixas`
- [ ] Edge Function: `sync-cobrancas`
- [ ] Edge Function: `sync-nfe`
- [ ] Edge Function: `sync-nfse`

#### Milestone 2.2: Polling Service (2 dias)
- [ ] Edge Function: `poll-changes`
- [ ] Detecção de mudanças via `data_alteracao`
- [ ] Schedule sync jobs automático

#### Milestone 2.3: Job Queue (2 dias)
- [ ] Job processor (picks pending jobs)
- [ ] Retry logic com exponential backoff
- [ ] Dead letter queue
- [ ] pg_cron setup

---

### 9.3 FASE 3: Admin UI & Monitoring (Semana 5-6)

**Objetivo:** Interface de gerenciamento completa.

#### Milestone 3.1: Sync Management UI (3 dias)
- [ ] Componente: `SyncManagement.tsx`
- [ ] Lista de entidades + status
- [ ] Trigger manual sync
- [ ] Histórico de syncs
- [ ] Configuração de frequências

#### Milestone 3.2: Health Monitor (2 dias)
- [ ] Edge Function: `health-check`
- [ ] Componente: `HealthMonitor.tsx`
- [ ] Checks: OAuth, API, sync freshness, rate limits
- [ ] Gráfico de uptime

#### Milestone 3.3: Audit Logs Viewer (2 dias)
- [ ] Componente: `AuditLogs.tsx`
- [ ] Filtros + paginação
- [ ] Export CSV
- [ ] Modal de detalhes

#### Milestone 3.4: Error Dashboard (2 dias)
- [ ] Componente: `ErrorDashboard.tsx`
- [ ] Lista de jobs com erro
- [ ] Dead letter queue viewer
- [ ] Retry manual

#### Milestone 3.5: Documentação (2 dias)
- [ ] Atualizar README.md
- [ ] Guia de deploy
- [ ] Troubleshooting guide
- [ ] API documentation

---

### 9.4 FASE 4: Testes & Refinamento (Semana 7)

#### Milestone 4.1: Testing (5 dias)
- [ ] Unit tests (Edge Functions)
- [ ] Integration tests (OAuth flow)
- [ ] E2E tests (sync completo)
- [ ] Load testing (rate limits)
- [ ] Error scenarios

#### Milestone 4.2: Performance (2 dias)
- [ ] Otimizar queries SQL
- [ ] Cache de tokens
- [ ] Batch processing
- [ ] Index tuning

---

## 10. Testing & QA

### 10.1 Unit Tests

**Edge Functions:**
```typescript
// sync-produtos.test.ts
describe('sync-produtos', () => {
  it('should sync produtos successfully', async () => {
    const result = await syncProdutos({ operation: 'full_sync' });
    expect(result.success).toBe(true);
    expect(result.records_synced).toBeGreaterThan(0);
  });
  
  it('should handle rate limit error', async () => {
    // Mock ContaAzul API returning 429
    const result = await syncProdutos({ operation: 'full_sync' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('RATE_LIMIT_EXCEEDED');
  });
  
  it('should detect changes via hash', async () => {
    const produto = { id: '123', nome: 'Produto A', valor: 100 };
    const hash1 = computeHash(produto);
    produto.valor = 150;
    const hash2 = computeHash(produto);
    expect(hash1).not.toBe(hash2);
  });
});
```

### 10.2 Integration Tests

**OAuth Flow:**
```typescript
describe('OAuth Flow', () => {
  it('should complete OAuth flow successfully', async () => {
    // 1. Initiate flow
    const { authUrl, state } = await initiateOAuth();
    expect(authUrl).toContain('auth.contaazul.com');
    
    // 2. Simulate callback
    const code = 'mock_code_123';
    await handleCallback(code, state);
    
    // 3. Verify token saved
    const connection = await getConnection();
    expect(connection.access_token_enc).toBeDefined();
    expect(connection.status).toBe('active');
  });
});
```

### 10.3 E2E Tests

**Full Sync:**
```typescript
describe('Full Sync E2E', () => {
  it('should sync all entities', async () => {
    const entities = [
      'produtos', 'vendas', 'pessoas', 'servicos', 
      'contratos', 'categorias', 'centros_custo'
    ];
    
    for (const entity of entities) {
      const result = await triggerSync({ entity, operation: 'full_sync' });
      expect(result.success).toBe(true);
      expect(result.records_synced).toBeGreaterThan(0);
    }
  });
});
```

### 10.4 Load Testing

**Rate Limit Compliance:**
```typescript
describe('Rate Limit Compliance', () => {
  it('should not exceed 600 req/min', async () => {
    const startTime = Date.now();
    const requests = [];
    
    for (let i = 0; i < 650; i++) {
      requests.push(callContaAzulAPI());
    }
    
    await Promise.all(requests);
    const duration = Date.now() - startTime;
    
    // Should take at least 60 seconds (due to rate limiting)
    expect(duration).toBeGreaterThanOrEqual(60000);
  });
});
```

---

## 11. Anexos

### 11.1 Referências Externas

- [Documentação ContaAzul API](https://developers.contaazul.com)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)

### 11.2 Glossário

- **Full Sync:** Sincronização completa de todos os registros
- **Incremental Sync:** Sincronização apenas de registros alterados desde último sync
- **Polling:** Consulta periódica para detectar mudanças
- **Hash:** SHA256 do JSON completo para detecção de mudanças
- **Dead Letter Queue:** Fila de jobs que falharam após max_retries
- **Edge Function:** Função serverless no Supabase (runtime Deno)
- **RLS:** Row Level Security (políticas de acesso no PostgreSQL)

---

## 12. Conclusão

Esta arquitetura fornece uma base sólida para integração com ContaAzul, focada em:

1. **Isolamento:** Módulo separado do ERP Bali
2. **Confiabilidade:** Retry automático, error recovery, audit log
3. **Observabilidade:** Health checks, logs, monitoring
4. **Flexibilidade:** Sync parametrizável, on-demand, incremental
5. **Performance:** Hash-based change detection, indexes, cache

**Próximos Passos:**
1. Revisar e aprovar esta arquitetura
2. Implementar FASE 1 (Foundation)
3. Iterar com feedback do time

---

**Pronto para Implementação? Bora codar! 🚀**

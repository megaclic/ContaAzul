# 🔧 ContaAzul Integration - Arquivos de Correção v2.0

> **Baseado em:** Análise de Gaps + PLANO_EXECUCAO_ATUALIZADO_v2.md  
> **Data:** 2026-03-26  
> **Objetivo:** Corrigir gaps críticos identificados na análise técnica

---

## 📦 O Que Este Pacote Contém

Este pacote contém **7 arquivos** para corrigir os gaps críticos identificados na análise:

### ✅ **Robustez OAuth (Bloco B)**
1. `supabase/functions/contaazul-token-refresh/index.ts` - Refresh com lock PostgreSQL
2. `supabase/functions/contaazul-auto-refresh/index.ts` - Auto-refresh background
3. `supabase/migrations/002_improve_connection_status.sql` - Status + helpers

### ✅ **Sync Engine Core (Bloco C)**
4. `supabase/functions/sync-produtos/index.ts` - Primeiro worker real
5. `src/hooks/useSyncJobs.ts` - React Hook para gerenciar jobs

### ✅ **Observabilidade (Bloco D)**
6. `src/components/contaazul/HealthDashboard.tsx` - Dashboard de saúde
7. `src/components/contaazul/SyncHistory.tsx` - Visualizador de histórico

---

## 🚀 IMPLEMENTAÇÃO PASSO A PASSO

### **FASE 1: Backend (Supabase) - 30 minutos**

#### 1.1. Aplicar Migration SQL

```bash
# No Supabase SQL Editor, executar:
supabase/migrations/002_improve_connection_status.sql
```

**O que faz:**
- ✅ Expande status de conexão (7 estados)
- ✅ Adiciona helpers de lock (`pg_try_advisory_lock`, `pg_advisory_unlock`)
- ✅ Funções auxiliares (get active connection, check expiring tokens)
- ✅ View `contaazul_connection_health`
- ✅ Trigger auto-expire de tokens

**Verificar:**
```sql
SELECT * FROM contaazul_connection_health;
SELECT * FROM get_expiring_connections(5); -- tokens expirando em < 5min
```

---

#### 1.2. Deploy Edge Functions

```bash
# 1. Token Refresh
supabase functions deploy contaazul-token-refresh

# 2. Auto-Refresh Background
supabase functions deploy contaazul-auto-refresh

# 3. Sync Produtos
supabase functions deploy sync-produtos
```

**Verificar:**
```bash
# Testar token refresh
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/contaazul-token-refresh \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'

# Testar auto-refresh
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/contaazul-auto-refresh \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"

# Testar sync produtos
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/sync-produtos \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"operation": "full"}'
```

---

#### 1.3. Configurar pg_cron (Auto-Refresh)

```sql
-- Habilitar extensão (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar auto-refresh (cada 2 minutos)
SELECT cron.schedule(
  'contaazul-auto-refresh',
  '*/2 * * * *',
  $$SELECT net.http_post(
    url := 'https://[SEU_PROJECT_ID].supabase.co/functions/v1/contaazul-auto-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [SEU_SERVICE_ROLE_KEY]'
    )
  )$$
);

-- Agendar sync incremental produtos (cada hora)
SELECT cron.schedule(
  'sync-produtos-incremental',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://[SEU_PROJECT_ID].supabase.co/functions/v1/sync-produtos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [SEU_ANON_KEY]'
    ),
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- Agendar sync full produtos (1x/dia às 00:00)
SELECT cron.schedule(
  'sync-produtos-full',
  '0 0 * * *',
  $$SELECT net.http_post(
    url := 'https://[SEU_PROJECT_ID].supabase.co/functions/v1/sync-produtos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [SEU_ANON_KEY]'
    ),
    body := '{"operation": "full"}'::jsonb
  )$$
);

-- Verificar jobs agendados
SELECT * FROM cron.job;
```

---

### **FASE 2: Frontend (Lovable/Vite) - 20 minutos**

#### 2.1. Copiar Arquivos React

```
src/
├── hooks/
│   └── useSyncJobs.ts         ← COPIAR
└── components/contaazul/
    ├── HealthDashboard.tsx    ← COPIAR
    └── SyncHistory.tsx        ← COPIAR
```

---

#### 2.2. Adicionar ao Admin

```tsx
// src/pages/Admin/ContaAzul.tsx
import { HealthDashboard } from '@/components/contaazul/HealthDashboard';
import { SyncHistory } from '@/components/contaazul/SyncHistory';
import { ConnectionStatus } from '@/components/contaazul/ConnectionStatus';

export default function ContaAzulAdmin() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Integração ContaAzul</h1>
      
      {/* Status da Conexão */}
      <ConnectionStatus />
      
      {/* Dashboard de Saúde */}
      <HealthDashboard />
      
      {/* Histórico de Sincronizações */}
      <SyncHistory />
    </div>
  );
}
```

---

### **FASE 3: Testes - 15 minutos**

#### 3.1. Testar Token Refresh

```sql
-- Forçar token para expirar em 2 minutos
UPDATE contaazul_connections
SET token_expires_at = now() + interval '2 minutes'
WHERE is_active = true;

-- Aguardar 3 minutos e verificar
-- O auto-refresh deve ter renovado automaticamente
SELECT status, token_expires_at FROM contaazul_connections WHERE is_active = true;
```

---

#### 3.2. Testar Sync Manual

```bash
# No frontend, chamar:
const { mutate } = useTriggerSync();

mutate({
  entity_type: 'produtos',
  operation: 'full',
});
```

**Verificar:**
```sql
-- Verificar job criado
SELECT * FROM contaazul_sync_jobs ORDER BY created_at DESC LIMIT 1;

-- Verificar produtos sincronizados
SELECT COUNT(*) FROM contaazul_raw_produtos;
```

---

#### 3.3. Testar Health Dashboard

1. Abrir `/admin/contaazul`
2. Verificar:
   - ✅ Conexão: Ativa
   - ✅ Taxa de Sucesso: > 90%
   - ✅ Registros Processados: > 0
   - ✅ Última Sincronização exibida

---

## 📋 CHECKLIST DE VALIDAÇÃO

### ✅ **Backend**
- [ ] Migration `002_improve_connection_status.sql` executada
- [ ] Helper functions criadas (7 funções)
- [ ] View `contaazul_connection_health` existe
- [ ] Edge Function `contaazul-token-refresh` deployada
- [ ] Edge Function `contaazul-auto-refresh` deployada
- [ ] Edge Function `sync-produtos` deployada
- [ ] pg_cron jobs agendados (3 jobs)

### ✅ **Frontend**
- [ ] Hook `useSyncJobs` copiado
- [ ] Componente `HealthDashboard` copiado
- [ ] Componente `SyncHistory` copiado
- [ ] Admin page atualizada

### ✅ **Funcional**
- [ ] Token refresh manual funciona
- [ ] Auto-refresh automático funciona (aguardar 2 min)
- [ ] Sync produtos manual funciona
- [ ] Sync produtos agendado funciona (aguardar 1h)
- [ ] Dashboard exibe métricas corretas
- [ ] Histórico exibe jobs

---

## 🔍 TROUBLESHOOTING

### **Erro: "pg_try_advisory_lock function does not exist"**

**Causa:** Helper functions não foram criadas

**Solução:**
```sql
-- Executar a migration 002 novamente
\i supabase/migrations/002_improve_connection_status.sql
```

---

### **Erro: "Token refresh failed: 401"**

**Causa:** Token já expirou completamente

**Solução:**
```sql
-- Forçar reconexão OAuth
UPDATE contaazul_connections
SET status = 'expired', is_active = false
WHERE is_active = true;

-- Usuário deve fazer login novamente
```

---

### **Erro: "Sync job stuck in 'running' status"**

**Causa:** Edge Function crashou sem atualizar status

**Solução:**
```sql
-- Marcar job como erro manualmente
UPDATE contaazul_sync_jobs
SET status = 'error', completed_at = now()
WHERE id = '[JOB_ID]' AND status = 'running';
```

---

### **pg_cron não está executando**

**Causa:** Extensão não habilitada ou job mal configurado

**Solução:**
```sql
-- 1. Verificar extensão
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. Verificar jobs
SELECT * FROM cron.job;

-- 3. Verificar logs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 🎯 MÉTRICAS DE SUCESSO

Após implementação, você deve ver:

### **Imediato (< 5 min)**
- ✅ Migration aplicada
- ✅ Edge Functions deployadas
- ✅ Dashboard exibindo status

### **Curto Prazo (< 1h)**
- ✅ Auto-refresh executou pelo menos 1x
- ✅ Sync produtos executou (manual ou agendado)
- ✅ Jobs aparecem no histórico

### **Médio Prazo (< 1 dia)**
- ✅ Token renovado automaticamente
- ✅ Sync incremental funcionando
- ✅ Taxa de sucesso > 95%
- ✅ Zero tokens expirados não renovados

---

## 📚 ARQUITETURA

### **Fluxo de Token Refresh**

```
1. pg_cron (cada 2 min)
   ↓
2. contaazul-auto-refresh Edge Function
   ↓
3. get_expiring_connections(5) → tokens expirando < 5min
   ↓
4. Para cada conexão:
   ├─ contaazul-token-refresh Edge Function
   ├─ pg_try_advisory_lock(connection_id)
   ├─ Exchange refresh_token → new access_token
   ├─ Encrypt + Save
   └─ pg_advisory_unlock(connection_id)
```

### **Fluxo de Sync**

```
1. Trigger manual OU pg_cron (cada 1h)
   ↓
2. sync-produtos Edge Function
   ↓
3. Create job (status: running)
   ↓
4. Get valid token (refresh se necessário)
   ↓
5. Fetch ContaAzul API (paginado)
   ↓
6. Para cada produto:
   ├─ Compute hash (SHA-256)
   ├─ Upsert to contaazul_raw_produtos
   └─ Track success/error
   ↓
7. Update job (status: success/error)
```

---

## 🔐 SEGURANÇA

### **Tokens Nunca Expostos**
- ✅ Encrypted at rest (AES-GCM)
- ✅ Decrypted apenas em Edge Functions
- ✅ NUNCA enviados ao frontend

### **Lock Concorrente**
- ✅ PostgreSQL advisory locks
- ✅ Evita refresh simultâneo
- ✅ Lock sempre released (finally block)

### **Audit Trail**
- ✅ Todos os eventos logados
- ✅ Timestamps precisos
- ✅ Metadata estruturada

---

## 📞 PRÓXIMOS PASSOS

Após implementar este pacote:

1. ✅ **Semana 3 (Atual):** Stabilization — COMPLETO
2. 📋 **Semana 4-5:** Implementar mais workers (vendas, pessoas, financeiro)
3. 📋 **Semana 6:** Testes automatizados
4. 📋 **Semana 7:** Hardening + Runbook

---

**Versão:** 2.0  
**Data:** 2026-03-26  
**Status:** Ready to Deploy  

---

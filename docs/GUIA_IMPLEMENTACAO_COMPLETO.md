# 🚀 GUIA DE IMPLEMENTAÇÃO - ContaAzul Integration v2.1

> **Status:** Pronto para Implementação  
> **Tempo Estimado:** 2-3 horas  
> **Pré-requisitos:** Acesso ao Supabase + ContaAzul Developer Account  

---

## 📋 CHECKLIST GERAL

- [ ] **FASE 1:** Preparação (15 min)
- [ ] **FASE 2:** Backend - Supabase (45 min)
- [ ] **FASE 3:** Frontend - Lovable (30 min)
- [ ] **FASE 4:** Configuração OAuth (15 min)
- [ ] **FASE 5:** Testes e Validação (30 min)
- [ ] **FASE 6:** Agendamentos (15 min)

---

## 🎯 FASE 1: PREPARAÇÃO (15 min)

### ✅ **1.1. Baixar Arquivos**

- [ ] Download: `contaazul-corrections-v2.1-FINAL.zip`
- [ ] Download: `PLANO_EXECUCAO_ATUALIZADO_v2.md`
- [ ] Extrair ZIP em local de trabalho

### ✅ **1.2. Verificar Acessos**

- [ ] Acesso ao Supabase Dashboard
- [ ] Acesso ao Supabase CLI (`supabase --version`)
- [ ] Acesso ao ContaAzul Developers
- [ ] Acesso ao projeto Lovable (se aplicável)

### ✅ **1.3. Anotar Informações**

```bash
# Anotar em um bloco de notas:
SUPABASE_PROJECT_ID=_______________
SUPABASE_URL=https://____________.supabase.co
SUPABASE_ANON_KEY=_______________
SUPABASE_SERVICE_ROLE_KEY=_______________

CONTAAZUL_CLIENT_ID=_______________
CONTAAZUL_CLIENT_SECRET=_______________ (aguardar criação do app)
```

---

## 🔧 FASE 2: BACKEND - SUPABASE (45 min)

### ✅ **2.1. Aplicar Migration SQL (5 min)**

**Passos:**
1. Abrir Supabase Dashboard → SQL Editor
2. Criar nova query
3. Copiar TODO o conteúdo de `supabase/migrations/002_improve_connection_status.sql`
4. Colar e executar (Run)

**Verificar:**
```sql
-- Deve retornar as novas funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%contaazul%'
ORDER BY routine_name;

-- Deve retornar: 
-- - get_active_contaazul_connection
-- - get_expiring_connections
-- - is_token_expiring_soon
-- - pg_advisory_unlock
-- - pg_try_advisory_lock
-- - update_connection_status
```

**✅ Marcar como concluído:**
- [ ] Migration executada sem erros
- [ ] 6 funções criadas
- [ ] View `contaazul_connection_health` existe

---

### ✅ **2.2. Gerar e Configurar ENCRYPTION_KEY (5 min)**

**Gerar chave:**
```bash
# No terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OU (se não tiver Node.js)
openssl rand -hex 32
```

**Configurar no Supabase:**
1. Supabase Dashboard → Settings → Edge Functions
2. Aba "Secrets"
3. Adicionar novo secret:
   - Name: `ENCRYPTION_KEY`
   - Value: `<chave-gerada-acima>`
4. Save

**✅ Marcar como concluído:**
- [ ] Chave gerada (64 caracteres hex)
- [ ] Secret `ENCRYPTION_KEY` configurado no Supabase

---

### ✅ **2.3. Deploy Edge Functions (20 min)**

**Conectar ao projeto:**
```bash
# No terminal, dentro da pasta extraída do ZIP
cd contaazul-v2-corrections

# Login no Supabase (se ainda não logou)
supabase login

# Link ao projeto
supabase link --project-ref <SEU_PROJECT_ID>
```

**Deploy das 6 Edge Functions:**
```bash
# 1. Token Refresh
supabase functions deploy contaazul-token-refresh

# 2. Auto-Refresh
supabase functions deploy contaazul-auto-refresh

# 3. Sync Produtos
supabase functions deploy sync-produtos

# 4. Sync Pessoas
supabase functions deploy sync-pessoas

# 5. Sync Vendas
supabase functions deploy sync-vendas

# 6. Sync Financeiro
supabase functions deploy sync-financeiro
```

**Verificar:**
```bash
# Listar funções deployadas
supabase functions list

# Deve mostrar:
# - contaazul-token-refresh
# - contaazul-auto-refresh
# - sync-produtos
# - sync-pessoas
# - sync-vendas
# - sync-financeiro
```

**✅ Marcar como concluído:**
- [ ] 6 Edge Functions deployadas
- [ ] Todas aparecem em `supabase functions list`
- [ ] Sem erros no deploy

---

### ✅ **2.4. Testar Edge Functions (15 min)**

**Teste 1: Token Refresh (deve dar erro esperado - sem conexão ativa ainda)**
```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-token-refresh \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'

# Esperado: {"success":false,"error":"No active connection found"}
# ✅ Isso é CORRETO! Ainda não temos conexão OAuth.
```

**Teste 2: Auto-Refresh**
```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-auto-refresh \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"

# Esperado: {"success":true,"result":{...},"message":"No tokens need refresh"}
# ✅ Isso é CORRETO!
```

**✅ Marcar como concluído:**
- [ ] Edge Functions respondem
- [ ] Erros esperados confirmados (sem OAuth ainda)

---

## 🎨 FASE 3: FRONTEND - LOVABLE (30 min)

### ✅ **3.1. Copiar Arquivos React (10 min)**

**Estrutura no Lovable:**
```
src/
├── hooks/
│   └── useSyncJobs.ts          ← COPIAR DAQUI
└── components/
    └── contaazul/
        ├── HealthDashboard.tsx ← COPIAR DAQUI
        └── SyncHistory.tsx     ← COPIAR DAQUI
```

**Passos:**
1. Abrir projeto Lovable
2. Criar pasta `src/hooks/` (se não existe)
3. Criar pasta `src/components/contaazul/` (se não existe)
4. Copiar os 3 arquivos do ZIP para as respectivas pastas

**✅ Marcar como concluído:**
- [ ] `useSyncJobs.ts` copiado
- [ ] `HealthDashboard.tsx` copiado
- [ ] `SyncHistory.tsx` copiado

---

### ✅ **3.2. Criar Página Admin (10 min)**

**Criar:** `src/pages/Admin/ContaAzulAdmin.tsx`

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

**✅ Marcar como concluído:**
- [ ] Página criada
- [ ] Imports corretos
- [ ] Sem erros de TypeScript

---

### ✅ **3.3. Adicionar Rota (5 min)**

**No arquivo de rotas (App.tsx ou routes.tsx):**

```tsx
import ContaAzulAdmin from '@/pages/Admin/ContaAzulAdmin';

// Adicionar rota:
<Route path="/admin/contaazul" element={<ContaAzulAdmin />} />
```

**✅ Marcar como concluído:**
- [ ] Rota adicionada
- [ ] Página acessível em `/admin/contaazul`

---

### ✅ **3.4. Testar Frontend (5 min)**

1. Abrir navegador em `http://localhost:5173/admin/contaazul`
2. Verificar se página carrega
3. Verificar se mostra "Desconectado" (esperado - ainda sem OAuth)

**✅ Marcar como concluído:**
- [ ] Página carrega sem erros
- [ ] Componentes renderizam
- [ ] Status mostra "Desconectado"

---

## 🔐 FASE 4: CONFIGURAÇÃO OAUTH (15 min)

### ✅ **4.1. Criar App no ContaAzul (5 min)**

1. Acesse https://developers.contaazul.com
2. Login com sua conta
3. Menu → "Aplicações" → "Nova Aplicação"
4. Preencher:
   - Nome: "Integração [SUA_EMPRESA]"
   - Redirect URI: `https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-oauth-callback`
5. Salvar
6. Copiar `Client ID` e `Client Secret`

**✅ Marcar como concluído:**
- [ ] App criado no ContaAzul
- [ ] Client ID copiado
- [ ] Client Secret copiado

---

### ✅ **4.2. Configurar no Banco (5 min)**

**No Supabase SQL Editor:**

```sql
UPDATE contaazul_config
SET 
  client_id = 'SEU_CLIENT_ID_AQUI',
  client_secret = 'SEU_CLIENT_SECRET_AQUI',
  redirect_uri = 'https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-oauth-callback'
WHERE id = 1;

-- Verificar
SELECT * FROM contaazul_config;
```

**✅ Marcar como concluído:**
- [ ] Config atualizada
- [ ] `client_id` preenchido
- [ ] `client_secret` preenchido

---

### ✅ **4.3. Testar OAuth Flow (5 min)**

1. Abrir `/admin/contaazul`
2. Clicar em "Conectar ContaAzul"
3. Fazer login no ContaAzul
4. Autorizar aplicação
5. Verificar redirect + status "Conectado ✓"

**✅ Marcar como concluído:**
- [ ] OAuth flow completo
- [ ] Tokens salvos no banco
- [ ] Status mostra "Conectado"
- [ ] CNPJ + Nome da empresa aparecem

---

## 🧪 FASE 5: TESTES E VALIDAÇÃO (30 min)

### ✅ **5.1. Testar Token Refresh Manual (5 min)**

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-token-refresh \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'

# Esperado: {"success":true,"connection_id":"...","token_expires_at":"..."}
```

**✅ Marcar como concluído:**
- [ ] Token refresh funciona
- [ ] Resposta de sucesso

---

### ✅ **5.2. Testar Sync Manual - Produtos (10 min)**

**No frontend:**
```tsx
// Via UI ou DevTools Console:
const response = await fetch('https://<PROJECT_ID>.supabase.co/functions/v1/sync-produtos', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <ANON_KEY>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ operation: 'full' }),
});
const result = await response.json();
console.log(result);
```

**Verificar no banco:**
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

**✅ Marcar como concluído:**
- [ ] Sync executado sem erros
- [ ] Job criado com status `success`
- [ ] Produtos apareceram no banco

---

### ✅ **5.3. Testar Outras Entidades (10 min)**

**Pessoas:**
```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-pessoas \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

**Vendas:**
```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-vendas \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

**Financeiro:**
```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full","type":"both"}'
```

**Verificar:**
```sql
-- Ver todos os jobs
SELECT entity_type, status, records_processed, duration_ms 
FROM contaazul_sync_jobs 
ORDER BY created_at DESC;

-- Contar registros por tabela
SELECT 'produtos' as tabela, COUNT(*) FROM contaazul_raw_produtos
UNION ALL
SELECT 'pessoas', COUNT(*) FROM contaazul_raw_pessoas
UNION ALL
SELECT 'vendas', COUNT(*) FROM contaazul_raw_vendas
UNION ALL
SELECT 'contas_receber', COUNT(*) FROM contaazul_raw_contas_receber
UNION ALL
SELECT 'contas_pagar', COUNT(*) FROM contaazul_raw_contas_pagar;
```

**✅ Marcar como concluído:**
- [ ] Sync pessoas funcionou
- [ ] Sync vendas funcionou
- [ ] Sync financeiro funcionou
- [ ] Todos os registros no banco

---

### ✅ **5.4. Validar Dashboard (5 min)**

1. Abrir `/admin/contaazul`
2. Verificar:
   - ✅ Conexão: Ativa
   - ✅ Taxa de Sucesso: 100%
   - ✅ Registros Processados: > 0
   - ✅ Última Sincronização: Exibida
   - ✅ Jobs aparecem no histórico

**✅ Marcar como concluído:**
- [ ] Dashboard exibe métricas
- [ ] Histórico mostra jobs
- [ ] Sem erros visuais

---

## ⏰ FASE 6: AGENDAMENTOS (15 min)

### ✅ **6.1. Habilitar pg_cron (2 min)**

```sql
-- No Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

**✅ Marcar como concluído:**
- [ ] Extensão habilitada

---

### ✅ **6.2. Agendar Jobs (10 min)**

**Copiar e ajustar (substituir placeholders):**

```sql
-- 1. Auto-refresh tokens (cada 2 min)
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

-- 2. Sync Produtos (incremental - cada 1h)
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

-- 3. Sync Pessoas (incremental - cada 2h)
SELECT cron.schedule(
  'sync-pessoas-incremental',
  '0 */2 * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-pessoas',
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- 4. Sync Vendas (incremental - cada 30 min)
SELECT cron.schedule(
  'sync-vendas-incremental',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-vendas',
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- 5. Sync Financeiro (incremental - cada 1h)
SELECT cron.schedule(
  'sync-financeiro-incremental',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://<SEU_PROJECT_ID>.supabase.co/functions/v1/sync-financeiro',
    body := '{"operation": "incremental", "type": "both"}'::jsonb
  )$$
);

-- 6. Full sync diário (00:00)
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

**✅ Marcar como concluído:**
- [ ] 6 cron jobs agendados
- [ ] Placeholders substituídos

---

### ✅ **6.3. Verificar Agendamentos (3 min)**

```sql
-- Listar jobs agendados
SELECT * FROM cron.job;

-- Deve retornar 6 jobs:
-- - contaazul-auto-refresh (*/2 * * * *)
-- - sync-produtos-incremental (0 * * * *)
-- - sync-pessoas-incremental (0 */2 * * *)
-- - sync-vendas-incremental (*/30 * * * *)
-- - sync-financeiro-incremental (0 * * * *)
-- - sync-full-daily (0 0 * * *)
```

**✅ Marcar como concluído:**
- [ ] 6 jobs listados
- [ ] Schedules corretos

---

## ✅ VALIDAÇÃO FINAL (10 min)

### ✅ **Checklist Completo**

**Backend:**
- [ ] Migration 002 aplicada
- [ ] 6 Edge Functions deployadas
- [ ] `ENCRYPTION_KEY` configurada
- [ ] 6 pg_cron jobs agendados

**OAuth:**
- [ ] App criado no ContaAzul
- [ ] OAuth flow funcional
- [ ] Token válido e renovando automaticamente

**Sync:**
- [ ] Produtos sincronizados
- [ ] Pessoas sincronizadas
- [ ] Vendas sincronizadas
- [ ] Financeiro sincronizado

**Frontend:**
- [ ] Dashboard funcionando
- [ ] Histórico exibindo jobs
- [ ] Métricas corretas

---

## 🎯 PRÓXIMOS 7 DIAS

### **Dia 1 (Hoje):**
- [x] Implementação completa
- [ ] Monitorar primeiras sincronizações

### **Dia 2-3:**
- [ ] Verificar taxa de sucesso (> 95%)
- [ ] Ajustar schedules se necessário
- [ ] Validar dados sincronizados

### **Dia 4-7:**
- [ ] Monitorar auto-refresh
- [ ] Verificar zero tokens expirados
- [ ] Documentar aprendizados

---

## 📞 TROUBLESHOOTING RÁPIDO

### **Erro: "No active connection found"**
→ OAuth não concluído. Refazer login em `/admin/contaazul`

### **Erro: "Token expired"**
→ Aguardar 2 min para auto-refresh ou chamar manualmente

### **Sync não executa**
→ Verificar pg_cron jobs: `SELECT * FROM cron.job`

### **Dashboard sem dados**
→ Verificar jobs: `SELECT * FROM contaazul_sync_jobs ORDER BY created_at DESC`

---

**SUCESSO! Integração 100% Funcional! 🎉**


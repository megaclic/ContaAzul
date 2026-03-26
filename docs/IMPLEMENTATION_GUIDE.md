# 🚀 Implementation Guide - ContaAzul Integration

> **Guia prático de implementação em 6 fases**  
> **Tempo Total:** 2-3 horas  
> **Dificuldade:** Intermediária

---

## 📋 Pré-requisitos

- [ ] Conta no Supabase (gratuita)
- [ ] Conta no ContaAzul com acesso Developer
- [ ] Node.js 18+ instalado
- [ ] Supabase CLI instalado
- [ ] Git instalado

---

## 🎯 FASE 1: Preparação (15 min)

### **1.1. Clone o Repositório**

```bash
git clone https://github.com/megaclic/ContaAzul.git
cd ContaAzul
npm install
```

### **1.2. Anote Credenciais**

Você precisará de:
- ✅ `SUPABASE_PROJECT_ID`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

Obtenha em: Supabase Dashboard → Settings → API

---

## 🔧 FASE 2: Backend - Supabase (45 min)

### **2.1. Aplicar Migrations**

```bash
# Conectar ao projeto
supabase link --project-ref <SEU_PROJECT_ID>

# Aplicar todas as migrations
supabase db push

# Verificar
supabase db remote list
```

**Deve criar:**
- 19 tabelas
- 6 helper functions
- 1 view (contaazul_connection_health)

### **2.2. Gerar ENCRYPTION_KEY**

```bash
# Gerar chave de 256 bits
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Configurar no Supabase
supabase secrets set ENCRYPTION_KEY=<chave-gerada>
```

### **2.3. Deploy Edge Functions**

```bash
# Deploy todas as 6 funções
supabase functions deploy contaazul-oauth-callback
supabase functions deploy contaazul-token-refresh
supabase functions deploy contaazul-auto-refresh
supabase functions deploy sync-produtos
supabase functions deploy sync-pessoas
supabase functions deploy sync-vendas
supabase functions deploy sync-financeiro

# Verificar
supabase functions list
```

---

## 🎨 FASE 3: Frontend (30 min)

### **3.1. Configurar Variáveis de Ambiente**

Criar `.env.local`:

```bash
VITE_SUPABASE_URL=https://<PROJECT_ID>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

### **3.2. Estrutura de Arquivos**

Certifique-se de que tem:

```
src/
├── hooks/
│   ├── useContaAzulAuth.ts
│   └── useSyncJobs.ts
├── components/contaazul/
│   ├── ConnectionStatus.tsx
│   ├── HealthDashboard.tsx
│   └── SyncHistory.tsx
└── pages/
    ├── ContaAzulCallback.tsx
    └── Admin/ContaAzulAdmin.tsx
```

### **3.3. Adicionar Rota**

No `App.tsx` ou arquivo de rotas:

```tsx
import ContaAzulCallback from '@/pages/ContaAzulCallback';
import ContaAzulAdmin from '@/pages/Admin/ContaAzulAdmin';

// Adicionar rotas:
<Route path="/contaazul/callback" element={<ContaAzulCallback />} />
<Route path="/admin/contaazul" element={<ContaAzulAdmin />} />
```

### **3.4. Run Dev Server**

```bash
npm run dev
```

Acesse: `http://localhost:5173/admin/contaazul`

---

## 🔐 FASE 4: OAuth Configuration (15 min)

### **4.1. Criar App no ContaAzul**

1. Acesse https://developers.contaazul.com
2. Login → Aplicações → Nova Aplicação
3. Configurar:
   - **Nome:** "Integração [Sua Empresa]"
   - **Redirect URI:** `https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-oauth-callback`
4. Copiar `Client ID` e `Client Secret`

### **4.2. Configurar no Banco**

No Supabase SQL Editor:

```sql
UPDATE contaazul_config
SET 
  client_id = 'SEU_CLIENT_ID',
  client_secret = 'SEU_CLIENT_SECRET',
  redirect_uri = 'https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-oauth-callback'
WHERE id = 1;
```

### **4.3. Testar OAuth**

1. Abrir `/admin/contaazul`
2. Clicar "Conectar ContaAzul"
3. Autorizar no ContaAzul
4. Verificar status "Conectado ✓"

---

## 🧪 FASE 5: Testar Sync (30 min)

### **5.1. Sync Manual - Produtos**

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-produtos \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

### **5.2. Verificar Dados**

```sql
-- Ver job
SELECT * FROM contaazul_sync_jobs ORDER BY created_at DESC LIMIT 1;

-- Ver produtos
SELECT COUNT(*) FROM contaazul_raw_produtos;
SELECT * FROM contaazul_raw_produtos LIMIT 5;
```

### **5.3. Testar Outras Entidades**

```bash
# Pessoas
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-pessoas \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"operation":"full"}'

# Vendas
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-vendas \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"operation":"full"}'

# Financeiro
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"operation":"full","type":"both"}'
```

---

## ⏰ FASE 6: Agendamentos (15 min)

### **6.1. Habilitar pg_cron**

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### **6.2. Agendar Jobs**

```sql
-- Auto-refresh (cada 2 min)
SELECT cron.schedule(
  'contaazul-auto-refresh',
  '*/2 * * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-auto-refresh',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  )$$
);

-- Sync Produtos (cada 1h)
SELECT cron.schedule(
  'sync-produtos-incremental',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-produtos',
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- Sync Pessoas (cada 2h)
SELECT cron.schedule(
  'sync-pessoas-incremental',
  '0 */2 * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-pessoas',
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- Sync Vendas (cada 30min)
SELECT cron.schedule(
  'sync-vendas-incremental',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-vendas',
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- Sync Financeiro (cada 1h)
SELECT cron.schedule(
  'sync-financeiro-incremental',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro',
    body := '{"operation": "incremental", "type": "both"}'::jsonb
  )$$
);

-- Full sync diário (00:00)
SELECT cron.schedule('sync-full-daily', '0 0 * * *',
  $$
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-produtos', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-pessoas', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-vendas', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro', body := '{"operation": "full", "type": "both"}'::jsonb);
  $$
);
```

### **6.3. Verificar**

```sql
SELECT * FROM cron.job;
```

Deve listar 6 jobs agendados.

---

## ✅ Validação Final

### **Checklist:**

**Backend:**
- [ ] 19 tabelas criadas
- [ ] 6 Edge Functions deployadas
- [ ] `ENCRYPTION_KEY` configurada
- [ ] 6 pg_cron jobs agendados

**OAuth:**
- [ ] App criado no ContaAzul
- [ ] OAuth flow funcional
- [ ] Status "Conectado ✓"

**Sync:**
- [ ] Produtos sincronizados
- [ ] Pessoas sincronizadas
- [ ] Vendas sincronizadas
- [ ] Financeiro sincronizado

**Frontend:**
- [ ] Dashboard funcionando
- [ ] Métricas exibindo
- [ ] Histórico com jobs

---

## 🐛 Troubleshooting

### **Erro: "No active connection found"**
→ OAuth não concluído. Fazer login em `/admin/contaazul`

### **Erro: "Token expired"**
→ Aguardar 2min para auto-refresh ou chamar manualmente

### **Sync não executa**
→ Verificar: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC`

### **Dashboard sem dados**
→ Verificar: `SELECT * FROM contaazul_sync_jobs ORDER BY created_at DESC`

---

## 📚 Próximos Passos

Após implementação bem-sucedida:

1. ✅ Monitorar primeiras sincronizações
2. ✅ Validar taxa de sucesso > 95%
3. ✅ Ajustar schedules conforme necessidade
4. ✅ Implementar camada normalizada (raw → domain)
5. ✅ Adicionar testes automatizados

---

## 📞 Suporte

- 📖 [Documentação Completa](https://github.com/megaclic/ContaAzul/tree/main/docs)
- 💬 [GitHub Issues](https://github.com/megaclic/ContaAzul/issues)
- 📧 Email: [seu-email@exemplo.com]

---

**Sucesso na Implementação! 🚀**

**Versão:** 2.1.0  
**Última Atualização:** 2026-03-26

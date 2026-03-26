# 🚀 ContaAzul Integration - Workers Expansion Pack v2.2

> **Adiciona:** 3 novos workers + 3 novas tabelas  
> **Data:** 2026-03-26  
> **Status:** Production-Ready

---

## 📦 O Que Este Pacote Adiciona

Este pacote **expande** a integração ContaAzul v2.1 com **3 novas entidades**:

### ✅ **Novas Entidades (3 workers)**

1. **Serviços** - Cadastro e gestão de serviços
   - `supabase/functions/sync-servicos/index.ts`
   - `contaazul_raw_servicos` (nova tabela)

2. **Contratos** - Vendas recorrentes e assinaturas
   - `supabase/functions/sync-contratos/index.ts`
   - `contaazul_raw_contratos` (nova tabela)

3. **Categorias Financeiras** - Plano de contas
   - `supabase/functions/sync-categorias-financeiras/index.ts`
   - `contaazul_raw_categorias_financeiras` (nova tabela)

---

## 🎯 PRÉ-REQUISITOS

Antes de instalar este pacote:

- ✅ Deve ter a **v2.1** já implementada e funcionando
- ✅ OAuth conectado e tokens renovando
- ✅ 4 workers básicos funcionando (produtos, pessoas, vendas, financeiro)
- ✅ Database schema 001 e 002 aplicados

---

## 🚀 INSTALAÇÃO PASSO A PASSO

### **PASSO 1: Aplicar Migration SQL (5 min)**

No Supabase SQL Editor:

```sql
-- Executar todo o conteúdo de:
supabase/migrations/003_add_servicos_contratos_categorias.sql
```

**Verificar:**

```sql
-- Deve retornar 3 novas tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'contaazul_raw_servicos',
    'contaazul_raw_contratos',
    'contaazul_raw_categorias_financeiras'
  );
```

---

### **PASSO 2: Deploy Edge Functions (10 min)**

```bash
# 1. Serviços
supabase functions deploy sync-servicos

# 2. Contratos
supabase functions deploy sync-contratos

# 3. Categorias Financeiras
supabase functions deploy sync-categorias-financeiras
```

**Verificar:**

```bash
supabase functions list

# Deve mostrar agora 10 funções:
# - contaazul-oauth-callback
# - contaazul-token-refresh
# - contaazul-auto-refresh
# - sync-produtos
# - sync-pessoas
# - sync-vendas
# - sync-financeiro
# - sync-servicos             ← NOVO
# - sync-contratos            ← NOVO
# - sync-categorias-financeiras ← NOVO
```

---

### **PASSO 3: Testar Sync Manual (15 min)**

#### 3.1. Sync Serviços

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-servicos \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

Verificar:

```sql
SELECT COUNT(*) FROM contaazul_raw_servicos;
SELECT * FROM contaazul_raw_servicos LIMIT 5;
```

#### 3.2. Sync Contratos

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-contratos \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

Verificar:

```sql
SELECT COUNT(*) FROM contaazul_raw_contratos;
SELECT * FROM contaazul_raw_contratos LIMIT 5;
```

#### 3.3. Sync Categorias Financeiras

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-categorias-financeiras \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

Verificar:

```sql
SELECT COUNT(*) FROM contaazul_raw_categorias_financeiras;
SELECT * FROM contaazul_raw_categorias_financeiras LIMIT 5;

-- Ver hierarquia de categorias
SELECT 
  id,
  nome,
  tipo,
  nivel,
  id_pai
FROM contaazul_raw_categorias_financeiras
ORDER BY tipo, nivel, nome;
```

---

### **PASSO 4: Configurar Agendamentos (10 min)**

```sql
-- Sync Serviços (incremental - cada 2h)
SELECT cron.schedule(
  'sync-servicos-incremental',
  '0 */2 * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-servicos',
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- Sync Contratos (incremental - cada 2h)
SELECT cron.schedule(
  'sync-contratos-incremental',
  '0 */2 * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-contratos',
    body := '{"operation": "incremental"}'::jsonb
  )$$
);

-- Sync Categorias (full - cada 6h, pois muda pouco)
SELECT cron.schedule(
  'sync-categorias-full',
  '0 */6 * * *',
  $$SELECT net.http_post(
    url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-categorias-financeiras',
    body := '{"operation": "full"}'::jsonb
  )$$
);

-- Atualizar Full Sync Diário (adicionar as 3 novas entidades)
SELECT cron.unschedule('sync-full-daily');

SELECT cron.schedule('sync-full-daily', '0 0 * * *',
  $$
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-produtos', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-pessoas', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-vendas', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro', body := '{"operation": "full", "type": "both"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-servicos', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-contratos', body := '{"operation": "full"}'::jsonb);
  SELECT net.http_post(url := 'https://<PROJECT_ID>.supabase.co/functions/v1/sync-categorias-financeiras', body := '{"operation": "full"}'::jsonb);
  $$
);
```

Verificar:

```sql
SELECT * FROM cron.job ORDER BY jobname;

-- Deve ter agora 9 jobs:
-- 1. contaazul-auto-refresh
-- 2. sync-produtos-incremental
-- 3. sync-pessoas-incremental
-- 4. sync-vendas-incremental
-- 5. sync-financeiro-incremental
-- 6. sync-servicos-incremental      ← NOVO
-- 7. sync-contratos-incremental     ← NOVO
-- 8. sync-categorias-full           ← NOVO
-- 9. sync-full-daily (atualizado)
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Database:**
- [ ] Tabela `contaazul_raw_servicos` criada
- [ ] Tabela `contaazul_raw_contratos` criada
- [ ] Tabela `contaazul_raw_categorias_financeiras` criada
- [ ] Indexes criados em todas as tabelas
- [ ] Triggers de `updated_at` funcionando
- [ ] RLS habilitado

### **Edge Functions:**
- [ ] `sync-servicos` deployada
- [ ] `sync-contratos` deployada
- [ ] `sync-categorias-financeiras` deployada
- [ ] Todas aparecem em `supabase functions list`

### **Sync Manual:**
- [ ] Serviços sincronizados (dados no banco)
- [ ] Contratos sincronizados (dados no banco)
- [ ] Categorias sincronizadas (dados no banco)
- [ ] Jobs aparecem em `contaazul_sync_jobs`

### **Agendamentos:**
- [ ] 3 novos jobs criados no pg_cron
- [ ] Full sync diário atualizado
- [ ] Total de 9 jobs agendados

---

## 📊 ESTRUTURA DE DADOS

### **Serviços**

```typescript
{
  id: UUID,
  codigo: string,
  nome: string,
  descricao: string,
  valor_venda: number,
  tipo: string,
  status: string,
  id_categoria: UUID,
  nome_categoria: string,
  unidade_medida: string,
  data_cadastro: timestamp,
  data_alteracao: timestamp
}
```

### **Contratos**

```typescript
{
  id: UUID,
  numero: number,
  id_cliente: UUID,
  nome_cliente: string,
  data_inicio: date,
  data_fim: date,
  status: string,
  periodicidade: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
  valor_total: number,
  valor_parcela: number,
  quantidade_parcelas: number,
  dia_vencimento: number,
  descricao: string
}
```

### **Categorias Financeiras**

```typescript
{
  id: UUID,
  nome: string,
  tipo: 'RECEITA' | 'DESPESA',
  id_pai: UUID | null,    // Para hierarquia
  nivel: number,          // 1 = raiz, 2 = filho, etc
  codigo: string,
  ativa: boolean,
  sistema: boolean        // Se é categoria padrão do sistema
}
```

---

## 🎯 RESUMO FINAL

### **Antes (v2.1):**
- 7 Edge Functions
- 4 Entidades sincronizando
- 6 pg_cron jobs

### **Depois (v2.2):**
- ✅ **10 Edge Functions** (+3)
- ✅ **7 Entidades sincronizando** (+3)
- ✅ **9 pg_cron jobs** (+3)

### **Entidades Completas:**
1. ✅ Produtos
2. ✅ Pessoas
3. ✅ Vendas
4. ✅ Financeiro (contas a pagar/receber)
5. ✅ Serviços ← NOVO
6. ✅ Contratos ← NOVO
7. ✅ Categorias Financeiras ← NOVO

---

## 🔧 TROUBLESHOOTING

### **Erro: "Table does not exist"**

**Causa:** Migration 003 não foi aplicada

**Solução:**
```sql
-- Executar migration 003 novamente
```

### **Erro: "Function already exists"**

**Causa:** Deploy duplicado

**Solução:**
```bash
# É seguro ignorar - função já está deployada
supabase functions list
```

### **Categorias vazias após sync**

**Causa:** Conta ContaAzul pode não ter categorias customizadas

**Solução:**
```sql
-- Verificar se pelo menos categorias do sistema vieram
SELECT COUNT(*) FROM contaazul_raw_categorias_financeiras WHERE sistema = true;
```

---

## 📞 PRÓXIMOS PASSOS

Após instalar este pacote:

1. ✅ Monitorar sincronizações por 24h
2. ✅ Validar dados de todas as 7 entidades
3. ✅ Confirmar agendamentos funcionando
4. 📋 Expandir para mais 2 entidades:
   - Centros de Custo
   - Cobranças
5. 📋 Criar camada normalizada (raw → domain)

---

**Versão:** 2.2.0  
**Data:** 2026-03-26  
**Status:** ✅ Ready to Deploy

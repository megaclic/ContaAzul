# ✅ CHECKLIST DE HOMOLOGAÇÃO - ContaAzul Integration (REVISADO)

> **Tempo estimado:** 20-30 minutos  
> **Objetivo:** Validar se o projeto está pronto para HOMOLOGAÇÃO (não produção ainda)  
> **Método:** Testes REAIS (não inspeção de código)

---

## 🎯 CRITÉRIOS DE APROVAÇÃO

**PASS:** Todos os testes críticos passam → **Aprovado para HOMOLOGAÇÃO**  
**FAIL:** Qualquer teste crítico falha → NÃO SUBIR  
**REVISAR:** Críticos passam, importantes falham → Subir com ressalvas

⚠️ **IMPORTANTE:** Mesmo aprovando para homologação, ainda faltará:
- Validação completa de OAuth ponta a ponta (manual)
- Inspeção de logs em produção (primeiras 24h)
- Verificação de dados reais no banco
- Testes de edge cases e cenários complexos

---

## 🔴 TESTES CRÍTICOS (Bloqueia Homologação)

### **1. OAUTH - CALLBACK EXISTE** ⏱️ 2 min

#### **1.1. Verificar se Function Existe**

```bash
curl -I https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-oauth-callback
```

**Esperado:**
- [ ] Status: 302, 400, 401, 403, ou 405 (qualquer coisa MENOS 404)
- [ ] NÃO deve retornar 404 (function não deployada)

**Se retornou 404:** ❌ PARAR - Function não deployada

**Nota:** Este teste NÃO valida OAuth completo, apenas verifica que a function existe. Validação ponta a ponta deve ser feita manualmente.

---

### **2. AUTO-REFRESH DE TOKEN** ⏱️ 3 min

#### **2.1. Chamar Function**

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/contaazul-auto-refresh \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Esperado (se NÃO tem OAuth ativo):**
```json
{
  "success": false,
  "error": "No active connection found"
}
```
- [ ] Responde com JSON válido
- [ ] Mensagem clara sobre falta de conexão

**Esperado (se TEM OAuth ativo):**
```json
{
  "success": true,
  "result": {...}
}
```

**Se retornou 404:** ❌ PARAR - Function não deployada  
**Se erro de JSON:** ❌ PARAR - Function quebrada  
**Se "No active connection":** ⚠️ OK - Function funciona, só não tem OAuth ainda

---

### **3. SYNC CATEGORIAS FINANCEIRAS** ⏱️ 3 min

#### **3.1. Trigger Manual**

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-categorias-financeiras \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

**Esperado:**
```json
{
  "success": true,
  "job_id": "uuid",
  "total_fetched": 50,
  "total_upserted": 50,
  "total_errors": 0
}
```

**Checklist:**
- [ ] `success: true`
- [ ] `total_fetched > 0` (se sua empresa tem categorias)
- [ ] `total_errors: 0` (ou muito baixo)
- [ ] NÃO retorna 404

**Se falhou:** ❌ CRÍTICO - Endpoint `/v1/categorias` pode estar errado ou OAuth não configurado

---

#### **3.2. Verificar Banco**

```sql
SELECT COUNT(*) as total FROM contaazul_raw_categorias_financeiras;

SELECT 
  nome,
  tipo,
  ativa
FROM contaazul_raw_categorias_financeiras
LIMIT 5;
```

**Esperado:**
- [ ] `total > 0`
- [ ] Dados reais (nomes de categorias do ContaAzul)
- [ ] Campos preenchidos

**Se vazio:** ❌ CRÍTICO - Dados não sincronizaram

---

### **4. SYNC FINANCEIRO - CONTAS A RECEBER** ⏱️ 3 min

#### **4.1. Trigger Manual**

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full","type":"receber"}'
```

**Esperado:**
```json
{
  "success": true,
  "total_fetched": 100,
  "total_upserted": 100
}
```

**Checklist:**
- [ ] `success: true`
- [ ] NÃO retorna 404
- [ ] `total_fetched` faz sentido (pode ser 0 se não tem contas)

**Se 404:** ❌ CRÍTICO - Endpoint `/v1/financeiro/eventos-financeiros/contas-a-receber/buscar` errado

---

#### **4.2. Verificar Banco**

```sql
SELECT COUNT(*) as total FROM contaazul_raw_contas_receber;

SELECT 
  numero,
  nome_cliente,
  valor,
  status
FROM contaazul_raw_contas_receber
LIMIT 5;
```

**Esperado:**
- [ ] Dados reais (se sua empresa tem contas a receber)
- [ ] Valores numéricos corretos

**Se vazio e empresa TEM contas:** ❌ REVISAR - Pode ter filtro ou erro

---

### **5. SYNC FINANCEIRO - CONTAS A PAGAR** ⏱️ 3 min

#### **5.1. Trigger Manual**

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-financeiro \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full","type":"pagar"}'
```

**Esperado:**
```json
{
  "success": true,
  "total_fetched": 50,
  "total_upserted": 50
}
```

**Checklist:**
- [ ] `success: true`
- [ ] NÃO retorna 404

**Se 404:** ❌ CRÍTICO - Endpoint `/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar` errado

---

### **6. SYNC VENDAS** ⏱️ 3 min

#### **6.1. Trigger Manual**

```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/sync-vendas \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"operation":"full"}'
```

**Esperado:**
```json
{
  "success": true,
  "total_fetched": 200
}
```

**Checklist:**
- [ ] `success: true`
- [ ] NÃO retorna 404

---

## 🟡 TESTES IMPORTANTES (Não Bloqueia Homologação)

### **7. API FRONTEND - VENDEDORES** ⏱️ 2 min

⚠️ **Este teste é OPCIONAL** - Valida API frontend, não crítico para backend.

#### **7.1. Testar no Console**

```javascript
// No DevTools do navegador (F12)
const response = await fetch('https://api-v2.contaazul.com/v1/venda/vendedores', {
  headers: {
    'Authorization': 'Bearer <SEU_TOKEN>',
    'Accept': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

**Esperado:**
- [ ] Status 200
- [ ] Array de vendedores
- [ ] NÃO retorna 404

**Se 404:** ⚠️ Endpoint `/v1/venda/vendedores` pode estar errado

---

### **8. API FRONTEND - IMPRIMIR VENDA** ⏱️ 2 min

⚠️ **OPCIONAL** - Requer ter vendas criadas.

```javascript
// Substitua ID_VENDA por um ID real
const response = await fetch('https://api-v2.contaazul.com/v1/venda/ID_VENDA/imprimir', {
  headers: {
    'Authorization': 'Bearer <SEU_TOKEN>',
    'Accept': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

**Esperado:**
- [ ] Status 200
- [ ] URL do PDF retornada
- [ ] NÃO retorna 404

**Se 404:** ⚠️ Endpoint `/v1/venda/{id}/imprimir` pode estar errado

---

### **9. API FRONTEND - EXCLUSÃO EM LOTE** ⏱️ 2 min

⚠️ **CUIDADO:** Este teste DELETA vendas! NÃO executar em produção sem vendas de teste.

**Recomendação:** Apenas verificar se o código usa `POST /v1/venda/exclusao-lote`. Não executar.

---

## 📊 VALIDAÇÃO DE LOGS

### **10. SHAPE DE RESPOSTA** ⏱️ 2 min

#### **10.1. Verificar Raw Payload**

```sql
-- Categorias
SELECT raw_payload FROM contaazul_raw_categorias_financeiras LIMIT 1;

-- Contas a Receber
SELECT raw_payload FROM contaazul_raw_contas_receber LIMIT 1;
```

**Esperado:**
- [ ] JSON válido
- [ ] Campos esperados (id, nome, etc)
- [ ] Estrutura bate com types TypeScript

**Se diverge:** ⚠️ Types podem estar desatualizados

---

## 🎯 CRITÉRIOS FINAIS DE APROVAÇÃO

### **PASS (Aprovado para HOMOLOGAÇÃO):**
✅ Todos os 6 testes críticos passaram  
✅ Functions respondem (não 404)  
✅ Syncs retornam `success: true`  
✅ Dados aparecem no banco  

**MAS ainda falta antes de PRODUÇÃO:**
- ⚠️ OAuth ponta a ponta manual
- ⚠️ Monitoramento de logs 24h
- ⚠️ Testes de edge cases
- ⚠️ Validação completa de dados

---

### **FAIL (NÃO Aprovar para Homologação):**
❌ Qualquer teste crítico (1-6) falhou  
❌ Functions retornam 404  
❌ Syncs retornam erro  
❌ Dados não aparecem no banco  

**Ação:** Corrigir problemas e re-executar checklist

---

### **REVISAR (Aprovar com Ressalvas):**
⚠️ Testes críticos passaram  
⚠️ Mas testes importantes (7-9) falharam  
⚠️ Funcionalidades secundárias podem ter problemas  

**Ação:** Subir para homologação, mas documentar problemas conhecidos

---

## 📝 TEMPLATE DE RELATÓRIO

```markdown
## RESULTADO DA HOMOLOGAÇÃO

**Data:** ___________
**Executor:** ___________

### TESTES CRÍTICOS
- [ ] 1. OAuth callback existe
- [ ] 2. Auto-refresh responde
- [ ] 3. Sync categorias
- [ ] 4. Sync contas a receber
- [ ] 5. Sync contas a pagar
- [ ] 6. Sync vendas

### TESTES IMPORTANTES (OPCIONAL)
- [ ] 7. API vendedores
- [ ] 8. API imprimir PDF
- [ ] 9. API exclusão lote (só verificação)

### VALIDAÇÕES
- [ ] 10. Shape de resposta

**VEREDICTO:**
- [ ] ✅ PASS - Aprovado para HOMOLOGAÇÃO
- [ ] ❌ FAIL - NÃO aprovar
- [ ] ⚠️ REVISAR - Aprovar com ressalvas

**AINDA FALTA ANTES DE PRODUÇÃO:**
- [ ] OAuth ponta a ponta manual
- [ ] Monitoramento 24h
- [ ] Testes de edge cases
- [ ] Validação completa de dados reais

**Observações:**
_________________________________________________
_________________________________________________
```

---

## 🚀 PRÓXIMOS PASSOS

### **Se PASSOU (Homologação):**
1. ✅ Commit versão atual
2. ✅ Tag de release (v1.0.0-beta)
3. ✅ Deploy em STAGING/HOMOLOGAÇÃO
4. ⚠️ Executar OAuth manual completo
5. ⚠️ Monitorar logs por 24-48h
6. ⚠️ Validar dados reais no banco
7. ⚠️ Testar edge cases
8. ✅ Só então → TAG v1.0.0 e PRODUÇÃO

### **Se FALHOU:**
1. ❌ Identificar qual teste falhou
2. ❌ Corrigir endpoint/código
3. ❌ Re-executar checklist completo
4. ❌ Repetir até passar

---

## ⚠️ LEMBRETES IMPORTANTES

**HOMOLOGAÇÃO ≠ PRODUÇÃO**

Este checklist aprova para **HOMOLOGAÇÃO**, que significa:
- ✅ Código está estruturalmente correto
- ✅ Endpoints principais respondem
- ✅ Syncs básicos funcionam
- ✅ Dados aparecem no banco

**MAS NÃO garante:**
- ❌ OAuth completo funciona em todos cenários
- ❌ Todos edge cases cobertos
- ❌ Performance em escala
- ❌ Logs estão limpos
- ❌ Dados 100% corretos

**Próxima fase:** Homologação manual intensiva (24-48h) antes de produção.

---

**TEMPO TOTAL:** 20-30 minutos  
**RESULTADO:** Aprovação para HOMOLOGAÇÃO (não produção ainda)  
**CONFIANÇA:** Média-Alta (testes básicos passaram)  
**PRÓXIMO NÍVEL:** Validação manual completa + monitoramento

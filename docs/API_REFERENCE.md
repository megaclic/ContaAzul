# 📚 API Reference - ContaAzul Integration

> **Referência completa das APIs implementadas**  
> **Versão:** 2.1.0  
> **Base URL:** `https://api-v2.contaazul.com/v1`

---

## 🔑 Autenticação

Todas as APIs requerem OAuth 2.0 Bearer token.

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Accept': 'application/json',
}
```

---

## 🛍️ Produtos

### **GET /v1/produtos**

Lista produtos com filtros e paginação.

**Query Parameters:**
- `pagina` (integer) - Número da página
- `tamanho_pagina` (integer) - Tamanho da página (10, 20, 50, 100, 200, 500, 1000)
- `campo_ordenacao` (string) - Campo para ordenação (NOME, CODIGO, VALOR_VENDA)
- `direcao_ordenacao` (string) - Direção (ASC, DESC)
- `busca` (string) - Busca por nome, EAN ou SKU
- `status` (string) - Status (ATIVO, INATIVO)
- `data_alteracao_de` (string) - Data inicial de alteração (ISO 8601)
- `data_alteracao_ate` (string) - Data final de alteração (ISO 8601)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "codigo": "PROD01",
      "nome": "Produto Exemplo",
      "valor_venda": 100.00,
      "status": "ATIVO",
      "estoque_minimo": 10,
      "estoque_maximo": 1000,
      "saldo": 500,
      "ultima_atualizacao": "2026-03-26T10:00:00Z"
    }
  ],
  "totalItems": 100
}
```

**Campos Sincronizados:**
- `id`, `codigo`, `nome`, `valor_venda`, `status`
- `tipo`, `situacao`, `formato`
- `categoria_id`, `categoria_descricao`
- `estoque_minimo`, `estoque_maximo`, `estoque_atual`
- `data_cadastro`, `data_alteracao`

---

## 👥 Pessoas

### **GET /v1/pessoas**

Lista pessoas (clientes, fornecedores, transportadoras) com filtros.

**Query Parameters:**
- `pagina` (integer) - Número da página (0-indexed)
- `tamanho_pagina` (integer) - Tamanho da página (máx 100)
- `ordem` (string) - Campo para ordenação
- `busca` (string) - Busca por nome, documento ou email
- `tipo_pessoa` (string) - Tipo (FISICA, JURIDICA, ESTRANGEIRA)
- `tipo_perfil` (string) - Perfil (Cliente, Fornecedor, Transportadora)
- `data_atualizacao_inicial` (string) - Data inicial de atualização

**Response:**
```json
{
  "pessoas": [
    {
      "id": "uuid",
      "nome": "João da Silva",
      "tipo_pessoa": "FISICA",
      "documento": "12345678900",
      "email": "joao@exemplo.com",
      "telefone": "11999999999",
      "tipo_perfil": ["Cliente"],
      "endereco": {
        "cep": "01234-567",
        "logradouro": "Rua Exemplo",
        "numero": "123",
        "cidade": "São Paulo",
        "uf": "SP"
      },
      "data_cadastro": "2026-01-01T00:00:00Z",
      "data_atualizacao": "2026-03-26T10:00:00Z"
    }
  ]
}
```

**Campos Sincronizados:**
- `id`, `nome`, `tipo_pessoa`, `documento`
- `email`, `telefone`, `celular`, `tipo_perfil`
- `cep`, `logradouro`, `numero`, `complemento`
- `bairro`, `cidade`, `uf`
- `data_cadastro`, `data_atualizacao`

---

## 💰 Vendas

### **GET /v1/venda/busca**

Busca vendas com filtros avançados.

**Query Parameters:**
- `pagina` (integer) - Número da página
- `tamanho_pagina` (integer) - Tamanho (10, 20, 50, 100, 200, 500, 1000)
- `campo_ordenado_descendente` (string) - Ordenação (NUMERO, CLIENTE, DATA)
- `data_inicio` (string) - Data inicial da venda (YYYY-MM-DD)
- `data_fim` (string) - Data final da venda (YYYY-MM-DD)
- `data_alteracao_de` (string) - Data inicial de alteração (ISO 8601 São Paulo/GMT-3)
- `data_alteracao_ate` (string) - Data final de alteração (ISO 8601 São Paulo/GMT-3)
- `situacoes` (array) - Situações das vendas
- `ids_clientes` (array) - IDs dos clientes
- `termo_busca` (string) - Busca por nome, email do cliente ou número da venda

**Response:**
```json
{
  "totais": {
    "total": 10000.00,
    "aprovado": 8000.00,
    "cancelado": 2000.00
  },
  "total_itens": 50,
  "itens": [
    {
      "id": "uuid",
      "numero": 1001,
      "data": "2026-03-26",
      "total": 1500.00,
      "tipo": "PRODUTO",
      "cliente": {
        "id": "uuid",
        "nome": "João da Silva",
        "email": "joao@exemplo.com"
      },
      "situacao": {
        "nome": "Aprovado",
        "descricao": "Venda aprovada"
      },
      "origem": "API",
      "data_alteracao": "2026-03-26T15:30:00",
      "id_contrato": "uuid-ou-null"
    }
  ]
}
```

**Campos Sincronizados:**
- `id`, `numero`, `id_legado`
- `data_venda`, `data_criacao`, `data_alteracao`
- `tipo`, `total`
- `id_cliente`, `nome_cliente`, `email_cliente`
- `situacao`, `origem`, `id_contrato`, `versao`

---

## 💵 Financeiro

### **GET /v1/financeiro/contas-a-receber**

Lista contas a receber.

**Query Parameters:**
- `data_alteracao_de` (string) - Data inicial de alteração

**Response:**
```json
[
  {
    "id": "uuid",
    "numero_documento": "001",
    "valor": 1000.00,
    "data_competencia": "2026-03-01",
    "data_vencimento": "2026-03-30",
    "data_emissao": "2026-03-01",
    "descricao": "Venda produtos",
    "situacao": "ABERTO",
    "id_pessoa": "uuid",
    "nome_pessoa": "João da Silva",
    "categoria": {
      "id": "uuid",
      "nome": "Receita Vendas"
    },
    "forma_pagamento": "BOLETO",
    "data_alteracao": "2026-03-26T10:00:00Z"
  }
]
```

### **GET /v1/financeiro/contas-a-pagar**

Lista contas a pagar.

**Query Parameters:**
- `data_alteracao_de` (string) - Data inicial de alteração

**Response:** (mesmo formato de contas a receber)

**Campos Sincronizados (ambas):**
- `id`, `numero_documento`, `valor`
- `data_competencia`, `data_vencimento`, `data_emissao`
- `descricao`, `situacao`
- `id_pessoa`, `nome_pessoa`
- `id_categoria`, `nome_categoria`
- `forma_pagamento`, `data_alteracao`

---

## 🔄 Sync Workers (Edge Functions)

### **POST /functions/v1/sync-produtos**

Sincroniza produtos do ContaAzul.

**Body:**
```json
{
  "operation": "full" | "incremental",
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "uuid",
  "operation": "incremental",
  "total_fetched": 150,
  "total_upserted": 150,
  "total_errors": 0,
  "duration_ms": 4523
}
```

### **POST /functions/v1/sync-pessoas**

Sincroniza pessoas do ContaAzul.

**Body:**
```json
{
  "operation": "full" | "incremental"
}
```

**Response:** (mesmo formato de sync-produtos)

### **POST /functions/v1/sync-vendas**

Sincroniza vendas do ContaAzul.

**Body:**
```json
{
  "operation": "full" | "incremental"
}
```

**Response:** (mesmo formato de sync-produtos)

### **POST /functions/v1/sync-financeiro**

Sincroniza contas a pagar e receber.

**Body:**
```json
{
  "operation": "full" | "incremental",
  "type": "receber" | "pagar" | "both"
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "uuid",
  "operation": "incremental",
  "type": "both",
  "total_fetched_receber": 50,
  "total_fetched_pagar": 30,
  "total_upserted": 80,
  "total_errors": 0,
  "duration_ms": 3200
}
```

---

## 🔐 Auth & Token Management

### **POST /functions/v1/contaazul-oauth-callback**

Callback OAuth (chamado automaticamente pelo ContaAzul).

**Query Parameters:**
- `code` (string) - Authorization code
- `state` (string) - CSRF protection state

**Response:**
```json
{
  "success": true,
  "connection_id": "uuid",
  "conta_conectada": {
    "cnpj": "12345678000190",
    "nome": "Empresa Exemplo Ltda"
  }
}
```

### **POST /functions/v1/contaazul-token-refresh**

Renova access token usando refresh token.

**Body:**
```json
{
  "connection_id": "uuid" // opcional - usa conexão ativa se omitido
}
```

**Response:**
```json
{
  "success": true,
  "connection_id": "uuid",
  "token_expires_at": "2026-03-26T16:00:00Z"
}
```

### **POST /functions/v1/contaazul-auto-refresh**

Background job que verifica e renova tokens expirando.

**Body:** (vazio)

**Response:**
```json
{
  "success": true,
  "result": {
    "total_checked": 1,
    "refreshed": 0,
    "skipped": 1,
    "failed": 0,
    "errors": []
  }
}
```

---

## 📊 Database Schema

### **Tabelas Raw (Dados Sincronizados)**

- `contaazul_raw_produtos`
- `contaazul_raw_pessoas`
- `contaazul_raw_vendas`
- `contaazul_raw_contas_receber`
- `contaazul_raw_contas_pagar`

### **Tabelas de Controle**

- `contaazul_config` - Configuração OAuth
- `contaazul_connections` - Conexões OAuth ativas
- `contaazul_sync_config` - Configuração de sync
- `contaazul_sync_jobs` - Histórico de jobs
- `contaazul_audit_log` - Audit trail

### **Helper Functions SQL**

- `pg_try_advisory_lock(key)` - Tenta adquirir lock
- `pg_advisory_unlock(key)` - Libera lock
- `get_active_contaazul_connection()` - Retorna conexão ativa
- `is_token_expiring_soon(connection_id, minutes)` - Verifica expiração
- `get_expiring_connections(minutes)` - Lista conexões expirando
- `update_connection_status(connection_id, status)` - Atualiza status

### **Views**

- `contaazul_connection_health` - Status de saúde da conexão

---

## 🔄 Sync Schedules (pg_cron)

```
Auto-refresh:        */2 * * * *  (cada 2 minutos)
Produtos:            0 * * * *    (cada 1 hora)
Pessoas:             0 */2 * * *  (cada 2 horas)
Vendas:              */30 * * * * (cada 30 minutos)
Financeiro:          0 * * * *    (cada 1 hora)
Full sync (todos):   0 0 * * *    (00:00 diariamente)
```

---

## ⚠️ Rate Limits (ContaAzul API)

- **600 requisições por minuto** (por conta conectada)
- **10 requisições por segundo** (por conta conectada)

A integração implementa **automatic retry com exponential backoff** quando recebe `429 Too Many Requests`.

---

## 🛡️ Error Codes

### **Edge Functions**

- `200` - Success
- `400` - Bad Request (parâmetros inválidos)
- `401` - Unauthorized (token inválido/expirado)
- `409` - Conflict (refresh já em progresso)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

### **ContaAzul API**

- `200` - OK
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Recurso não encontrado
- `429` - Rate limit excedido
- `500` - Erro interno do ContaAzul

---

## 📝 Changelog

### **v2.1.0** (2026-03-26)
- ✅ Adicionado sync de 4 entidades (produtos, pessoas, vendas, financeiro)
- ✅ Token refresh com PostgreSQL lock
- ✅ Auto-refresh background job
- ✅ Health Dashboard
- ✅ Sync History Viewer

### **v2.0.0** (2026-03-20)
- ✅ OAuth 2.0 completo
- ✅ Database schema (19 tabelas)
- ✅ Edge Functions base

---

**Versão:** 2.1.0  
**Última Atualização:** 2026-03-26

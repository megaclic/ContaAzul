# 🚀 ContaAzul Integration

Integração completa e type-safe com a API ContaAzul v2 para projetos **React + Vite + TypeScript + TanStack Query + Supabase**.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154)](https://tanstack.com/query)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E)](https://supabase.com/)

---

## ✨ Diferenciais

- ✅ **100% TypeScript Strict** — Zero `any`, types gerados da OpenAPI oficial
- ✅ **OAuth 2.0 Completo** — Authorization Code flow + auto-refresh de tokens
- ✅ **12 APIs Cobertas** — Financeiro, Produtos, Pessoas, Vendas, Contratos, Serviços, etc
- ✅ **React Hooks** — TanStack Query com cache inteligente e invalidação automática
- ✅ **Rate Limiting** — 600 req/min, 10 req/seg com exponential backoff automático
- ✅ **Supabase Ready** — Tokens criptografados + RLS + migrations prontas
- ✅ **Error Handling** — Tipos específicos de erro por endpoint

---

## 📦 Instalação

```bash
npm install axios @tanstack/react-query
```

**Ou copie os arquivos** desta integração para o seu projeto Lovable/Vite.

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```env
# OAuth 2.0 Credentials
VITE_CONTAAZUL_CLIENT_ID=your_client_id
VITE_CONTAAZUL_CLIENT_SECRET=your_client_secret
VITE_CONTAAZUL_REDIRECT_URI=http://localhost:5173/contaazul/callback

# API URLs (opcional - usa valores padrão)
VITE_CONTAAZUL_API_BASE_URL=https://api-v2.contaazul.com
VITE_CONTAAZUL_AUTH_URL=https://api.contaazul.com/auth/authorize
VITE_CONTAAZUL_TOKEN_URL=https://api.contaazul.com/oauth2/token
```

### 2. Supabase Migration

Execute a migration para criar a tabela de tokens:

```bash
supabase migration up
```

Ou copie o conteúdo de `supabase/migrations/001_contaazul_integration.sql` e execute no SQL Editor do Supabase.

### 3. React Query Provider

Envolva sua aplicação com o `QueryClientProvider`:

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

---

## 🎯 Uso Rápido

### Autenticação OAuth 2.0

```tsx
import { useContaAzulAuth } from './hooks/contaazul/useContaAzulAuth';

function LoginButton() {
  const { isAuthenticated, login, logout, isLoading, error } = useContaAzulAuth();

  if (isAuthenticated) {
    return <button onClick={logout}>Desconectar ContaAzul</button>;
  }

  return (
    <button onClick={login} disabled={isLoading}>
      {isLoading ? 'Conectando...' : 'Conectar ContaAzul'}
    </button>
  );
}
```

### Callback OAuth (rota `/contaazul/callback`)

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContaAzulAuth } from './hooks/contaazul/useContaAzulAuth';

function ContaAzulCallback() {
  const { processCallback } = useContaAzulAuth();
  const navigate = useNavigate();

  useEffect(() => {
    processCallback()
      .then(() => navigate('/dashboard'))
      .catch((error) => {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
      });
  }, []);

  return <div>Conectando com ContaAzul...</div>;
}
```

### Listar Produtos

```tsx
import { useProdutos } from './hooks/contaazul/useProdutos';

function ProductList() {
  const { data, isLoading, error } = useProdutos({
    status: 'ATIVO',
    tamanho_pagina: 20,
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <ul>
      {data?.items.map((produto) => (
        <li key={produto.id}>
          {produto.nome} - R$ {produto.valor_venda}
        </li>
      ))}
    </ul>
  );
}
```

### Criar Conta a Receber

```tsx
import { useCreateContaReceber } from './hooks/contaazul/useFinanceiro';

function CreateReceivable() {
  const mutation = useCreateContaReceber();

  const handleCreate = () => {
    mutation.mutate({
      valor: 1000,
      data_competencia: '2025-01-15',
      descricao: 'Venda de produto X',
      id_cliente: 'uuid-do-cliente',
      conta_financeira: 'uuid-conta-financeira',
      rateio: [
        {
          id_categoria: 'uuid-categoria',
          valor: 1000,
        },
      ],
      condicao_pagamento: {
        parcelas: [
          {
            conta_financeira: 'uuid-conta',
            data_vencimento: '2025-02-15',
            descricao: 'Parcela única',
            detalhe_valor: {
              valor_bruto: 1000,
            },
          },
        ],
      },
    });
  };

  return (
    <button onClick={handleCreate} disabled={mutation.isPending}>
      {mutation.isPending ? 'Criando...' : 'Criar Conta a Receber'}
    </button>
  );
}
```

### Criar Venda

```tsx
import { useCreateVenda, useVendedores } from './hooks/contaazul/useVendas';

function CreateSale() {
  const { data: vendedores } = useVendedores();
  const mutation = useCreateVenda();

  const handleCreate = () => {
    mutation.mutate({
      numero: 1001,
      id_cliente: 'uuid-cliente',
      situacao: 'APROVADO',
      data_venda: '2025-01-15',
      id_vendedor: vendedores?.[0]?.id,
      itens: [
        {
          id: 'uuid-produto',
          quantidade: 2,
          valor: 50.0,
        },
      ],
      condicao_pagamento: {
        opcao_condicao_pagamento: 'À vista',
        parcelas: [
          {
            data_vencimento: '2025-01-15',
            valor: 100.0,
          },
        ],
      },
    });
  };

  return (
    <button onClick={handleCreate} disabled={mutation.isPending}>
      {mutation.isPending ? 'Criando...' : 'Criar Venda'}
    </button>
  );
}
```

### Criar Contrato Recorrente

```tsx
import { useCreateContrato, useProximoNumeroContrato } from './hooks/contaazul/useContratos';

function CreateContract() {
  const { data: proximoNumero } = useProximoNumeroContrato();
  const mutation = useCreateContrato();

  const handleCreate = () => {
    if (!proximoNumero) return;

    mutation.mutate({
      numero: proximoNumero,
      id_cliente: 'uuid-cliente',
      data_inicio: '2025-01-01',
      periodo: 'MENSAL',
      dia_vencimento: 10,
      itens: [
        {
          id: 'uuid-produto-ou-servico',
          quantidade: 1,
          valor: 199.90,
        },
      ],
      condicao_pagamento: {
        tipo_pagamento: 'BOLETO_BANCARIO',
        opcao_condicao_pagamento: 'À vista',
        dia_vencimento: 10,
      },
    });
  };

  return (
    <button onClick={handleCreate} disabled={mutation.isPending || !proximoNumero}>
      {mutation.isPending ? 'Criando...' : 'Criar Contrato Recorrente'}
    </button>
  );
}
```

### Listar Clientes

```tsx
import { usePessoas } from './hooks/contaazul/usePessoas';

function CustomerList() {
  const { data, isLoading } = usePessoas({
    tipo_perfil: 'Cliente',
    tamanho_pagina: 50,
  });

  if (isLoading) return <div>Carregando clientes...</div>;

  return (
    <ul>
      {data?.items.map((pessoa) => (
        <li key={pessoa.id}>
          {pessoa.nome} - {pessoa.documento}
        </li>
      ))}
    </ul>
  );
}
```

---

## 📚 Estrutura do Projeto

```
contaazul-integration/
├── src/
│   ├── types/ (9 arquivos - ~2.500 linhas)
│   │   ├── core.ts              # Types base (OAuth, paginação, erros)
│   │   ├── financeiro.ts        # ~800 linhas de types financeiros
│   │   ├── produtos.ts          # ~600 linhas de types de produtos
│   │   ├── pessoas.ts           # ~400 linhas de types de pessoas
│   │   ├── vendas.ts            # ~300 linhas de types de vendas
│   │   ├── servicos.ts          # ~150 linhas de types de serviços
│   │   ├── contratos.ts         # ~180 linhas de types de contratos
│   │   ├── notas-fiscais.ts     # ~120 linhas de types de notas fiscais
│   │   └── protocolos.ts        # ~50 linhas de types de protocolos
│   ├── lib/contaazul/
│   │   ├── client.ts            # Axios + interceptors + rate limiting
│   │   ├── auth.ts              # OAuth 2.0 flow
│   │   └── api/ (9 arquivos)
│   │       ├── financeiro.ts    # API Financeiro
│   │       ├── produtos.ts      # API Produtos
│   │       ├── pessoas.ts       # API Pessoas
│   │       ├── vendas.ts        # API Vendas
│   │       ├── servicos.ts      # API Serviços
│   │       ├── contratos.ts     # API Contratos
│   │       ├── notas-fiscais.ts # API Notas Fiscais
│   │       ├── protocolos.ts    # API Protocolos
│   │       └── index.ts         # Exports centralizados
│   └── hooks/contaazul/ (9 arquivos)
│       ├── useContaAzulAuth.ts  # Hook OAuth
│       ├── useFinanceiro.ts     # Hooks TanStack Query Financeiro
│       ├── useProdutos.ts       # Hooks TanStack Query Produtos
│       ├── usePessoas.ts        # Hooks TanStack Query Pessoas
│       ├── useVendas.ts         # Hooks TanStack Query Vendas
│       ├── useServicos.ts       # Hooks TanStack Query Serviços
│       ├── useContratos.ts      # Hooks TanStack Query Contratos
│       ├── useNotasFiscais.ts   # Hooks TanStack Query Notas Fiscais
│       └── useProtocolos.ts     # Hooks TanStack Query Protocolos
├── supabase/migrations/
│   └── 001_contaazul_integration.sql  # Tabela tokens + RLS
├── examples/
│   └── ContaAzulDashboard.tsx   # Componente exemplo completo
├── docs/
│   └── LOVABLE_MIGRATION.md     # Guia passo a passo para Lovable
├── package.json
├── tsconfig.json
├── .env.example
├── CHANGELOG.md
└── README.md
```

---

## 🔑 APIs Disponíveis

### ✅ TODAS IMPLEMENTADAS (12/12 APIs - 100%)

| Módulo | Endpoints | Hooks |
|--------|-----------|-------|
| **Financeiro** | Categorias, Centros Custo, Contas Pagar/Receber, Baixas, Cobranças, Contas Financeiras | `useFinanceiro` |
| **Produtos** | CRUD, Categorias, NCM, CEST, Unidades, Variações, Kits, E-commerce | `useProdutos` |
| **Pessoas** | CRUD, Batch ops, Empresa conectada | `usePessoas` |
| **Vendas** | CRUD, Busca avançada, Vendedores, PDF, Itens, Deletar lote | `useVendas` |
| **Serviços** | CRUD, Parâmetros fiscais, Deletar lote | `useServicos` |
| **Contratos** | CRUD, Próximo número, Vendas recorrentes | `useContratos` |
| **Notas Fiscais** | NFe, NFS-e (read-only), Vínculo MDF-e | `useNotasFiscais` |
| **Protocolos** | Tracking eventos assíncronos, Polling automático | `useProtocolos` |
| **Baixas** | Já integrado no módulo Financeiro | - |
| **Cobranças** | Já integrado no módulo Financeiro | - |

---

## 🛡️ Rate Limiting

A API ContaAzul possui os seguintes limites **por conta conectada**:

- **600 requisições por minuto**
- **10 requisições por segundo**

A integração implementa **automatic retry com exponential backoff** (1s → 2s → 4s) quando recebe `429 Too Many Requests`.

---

## 🔐 Segurança

- ✅ Tokens armazenados em Supabase com **encryption at rest**
- ✅ **Row Level Security (RLS)** habilitado
- ✅ Tokens auto-refresh com margem de 5 minutos
- ✅ CSRF protection no OAuth flow (state parameter)
- ✅ Tokens expirados limpos automaticamente após 30 dias

---

## 📖 Documentação

### Hooks Disponíveis

#### `useContaAzulAuth()`
Gerencia autenticação OAuth 2.0.

**Returns:**
```ts
{
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenInfo: { hasToken, expiresAt, isExpired };
  login: () => void;
  logout: () => void;
  processCallback: () => Promise<void>;
}
```

#### `useFinanceiro()`
- `useCategorias(params?)` — Lista categorias financeiras
- `useCentrosCusto(params?)` — Lista centros de custo
- `useContasReceber(params)` — Lista contas a receber
- `useContasPagar(params)` — Lista contas a pagar
- `useCreateContaReceber()` — Cria receita (mutation)
- `useCreateContaPagar()` — Cria despesa (mutation)

#### `useProdutos()`
- `useProdutos(params?)` — Lista produtos
- `useProduto(id)` — Busca produto por ID
- `useCreateProduto()` — Cria produto (mutation)
- `useUpdateProduto()` — Atualiza produto (mutation)
- `useDeleteProduto()` — Deleta produto (mutation)

#### `usePessoas()`
- `usePessoas(params?)` — Lista pessoas
- `usePessoa(id)` — Busca pessoa por ID
- `useCreatePessoa()` — Cria pessoa (mutation)
- `useUpdatePessoa()` — Atualiza pessoa (mutation)
- `useAtivarPessoas()` — Ativa pessoas em lote (mutation)
- `useInativarPessoas()` — Inativa pessoas em lote (mutation)

#### `useVendas()`
- `useVendas(params?)` — Lista vendas com filtros avançados
- `useVenda(id)` — Busca venda por ID
- `useCreateVenda()` — Cria venda (mutation)
- `useUpdateVenda()` — Atualiza venda (mutation)
- `useDeleteVendas()` — Deleta vendas em lote (mutation)
- `useVendedores()` — Lista vendedores
- `useItensVenda(idVenda)` — Lista itens de uma venda
- `usePdfVenda(idVenda)` — Retorna URL do PDF da venda

#### `useServicos()`
- `useServicos(params?)` — Lista serviços
- `useServico(id)` — Busca serviço por ID
- `useCreateServico()` — Cria serviço (mutation)
- `useUpdateServico()` — Atualiza serviço (mutation)
- `useDeleteServicos()` — Deleta serviços em lote (mutation)

#### `useContratos()`
- `useContratos(params?)` — Lista contratos recorrentes
- `useCreateContrato()` — Cria contrato (mutation)
- `useProximoNumeroContrato()` — Retorna próximo número disponível

#### `useNotasFiscais()`
- `useNFe(params?)` — Lista NFe (Notas Fiscais Eletrônicas)
- `useNFeByChave(chave)` — Busca NFe por chave de acesso
- `useNFSe(params?)` — Lista NFS-e (Notas Fiscais de Serviço)
- `useVincularNotasMDFe()` — Vincula notas a MDF-e (mutation)

#### `useProtocolos()`
- `useProtocolo(id)` — Busca protocolo por ID (tracking assíncrono)
- `useProtocoloComPolling(id)` — Busca com polling automático até finalizar

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para adicionar novas APIs:

1. Crie os types em `src/types/[modulo].ts`
2. Implemente a API em `src/lib/contaazul/api/[modulo].ts`
3. Crie hooks em `src/hooks/contaazul/use[Modulo].ts`
4. Adicione exports em `src/lib/contaazul/api/index.ts`

---

## 📝 Licença

MIT

---

## 🔗 Links Úteis

- [Documentação Oficial ContaAzul](https://developers.contaazul.com)
- [OpenAPI Specification](https://developers.contaazul.com/open-api-docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Desenvolvido com ❤️ para a comunidade React + ContaAzul**

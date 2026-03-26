# 🚀 Guia de Migração para Lovable

Este guia mostra como integrar o ContaAzul Integration em um projeto **Lovable** (React + Vite + TypeScript + Supabase).

---

## 📋 Pré-requisitos

- Projeto Lovable criado
- Conta ContaAzul Developer (obtenha em [developers.contaazul.com](https://developers.contaazul.com))
- Supabase configurado no projeto

---

## 🔧 Passo 1: Adicionar Dependências

No Lovable, edite o `package.json` para adicionar:

```json
{
  "dependencies": {
    "axios": "^1.6.5",
    "@tanstack/react-query": "^5.17.19"
  }
}
```

O Lovable instalará automaticamente quando você salvar.

---

## 📁 Passo 2: Copiar Arquivos

### Estrutura a ser copiada para o Lovable:

```
src/
├── types/ (9 arquivos)
│   ├── core.ts
│   ├── financeiro.ts
│   ├── produtos.ts
│   ├── pessoas.ts
│   ├── vendas.ts
│   ├── servicos.ts
│   ├── contratos.ts
│   ├── notas-fiscais.ts
│   └── protocolos.ts
├── lib/contaazul/
│   ├── client.ts
│   ├── auth.ts
│   └── api/ (9 arquivos)
│       ├── financeiro.ts
│       ├── produtos.ts
│       ├── pessoas.ts
│       ├── vendas.ts
│       ├── servicos.ts
│       ├── contratos.ts
│       ├── notas-fiscais.ts
│       ├── protocolos.ts
│       └── index.ts
└── hooks/contaazul/ (9 arquivos)
    ├── useContaAzulAuth.ts
    ├── useFinanceiro.ts
    ├── useProdutos.ts
    ├── usePessoas.ts
    ├── useVendas.ts
    ├── useServicos.ts
    ├── useContratos.ts
    ├── useNotasFiscais.ts
    └── useProtocolos.ts
```

**Copie todos os 28 arquivos TypeScript** desta estrutura para o seu projeto Lovable.

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

No Lovable, configure as variáveis de ambiente:

1. Vá em **Settings** → **Environment Variables**
2. Adicione:

```
VITE_CONTAAZUL_CLIENT_ID=seu_client_id
VITE_CONTAAZUL_CLIENT_SECRET=seu_client_secret
VITE_CONTAAZUL_REDIRECT_URI=https://seu-projeto.lovable.app/contaazul/callback
```

---

## 🗄️ Passo 4: Executar Migration Supabase

1. No Lovable, vá em **Supabase** → **SQL Editor**
2. Copie o conteúdo de `supabase/migrations/001_contaazul_integration.sql`
3. Execute o script

Isso criará a tabela `contaazul_tokens` com RLS habilitado.

---

## 🎨 Passo 5: Adicionar React Query Provider

Edite o arquivo principal da aplicação (geralmente `src/App.tsx` ou `src/main.tsx`):

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Seu app aqui */}
    </QueryClientProvider>
  );
}
```

---

## 🛣️ Passo 6: Criar Rota de Callback OAuth

Crie um arquivo `src/pages/ContaAzulCallback.tsx`:

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContaAzulAuth } from '../hooks/contaazul/useContaAzulAuth';

export default function ContaAzulCallback() {
  const { processCallback } = useContaAzulAuth();
  const navigate = useNavigate();

  useEffect(() => {
    processCallback()
      .then(() => {
        console.log('OAuth successful!');
        navigate('/dashboard');
      })
      .catch((error) => {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
      });
  }, [processCallback, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Conectando com ContaAzul...</p>
      </div>
    </div>
  );
}
```

Adicione a rota no seu router:

```tsx
<Route path="/contaazul/callback" element={<ContaAzulCallback />} />
```

---

## 🎯 Passo 7: Usar nos Componentes

### Exemplo: Botão de Login

```tsx
import { useContaAzulAuth } from '../hooks/contaazul/useContaAzulAuth';

function LoginButton() {
  const { isAuthenticated, login, logout } = useContaAzulAuth();

  if (isAuthenticated) {
    return (
      <button onClick={logout} className="btn btn-secondary">
        Desconectar ContaAzul
      </button>
    );
  }

  return (
    <button onClick={login} className="btn btn-primary">
      Conectar ContaAzul
    </button>
  );
}
```

### Exemplo: Listar Produtos

```tsx
import { useProdutos } from '../hooks/contaazul/useProdutos';

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

### Exemplo: Criar Venda

```tsx
import { useCreateVenda } from '../hooks/contaazul/useVendas';

function CreateSale() {
  const mutation = useCreateVenda();

  const handleCreate = () => {
    mutation.mutate({
      numero: 1001,
      id_cliente: 'uuid-cliente',
      situacao: 'APROVADO',
      data_venda: '2025-01-15',
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

### Exemplo: Criar Contrato Recorrente

```tsx
import { useCreateContrato, useProximoNumeroContrato } from '../hooks/contaazul/useContratos';

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
          id: 'uuid-servico',
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
      {mutation.isPending ? 'Criando...' : 'Criar Contrato'}
    </button>
  );
}
```

---

## 🔐 Passo 8: Armazenar Tokens no Supabase (Opcional)

Para persistir os tokens no Supabase em vez de memória, edite `src/lib/contaazul/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Substituir tokenStorage por funções Supabase
export const setTokens = async (tokens: ContaAzulOAuthTokenResponse): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  await supabase.rpc('upsert_contaazul_token', {
    p_user_id: user.id,
    p_access_token: tokens.access_token,
    p_refresh_token: tokens.refresh_token,
    p_expires_in: tokens.expires_in,
  });
};

export const getTokens = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data } = await supabase.rpc('get_valid_contaazul_token', {
    p_user_id: user.id,
  });

  return data;
};
```

---

## ✅ Checklist de Validação

- [ ] Dependências instaladas (`axios`, `@tanstack/react-query`)
- [ ] 28 arquivos TypeScript copiados para estrutura correta
- [ ] Variáveis de ambiente configuradas
- [ ] Migration Supabase executada
- [ ] React Query Provider adicionado
- [ ] Rota `/contaazul/callback` criada
- [ ] Botão de login testado
- [ ] Callback OAuth funcional
- [ ] Teste de listagem (produtos/clientes) funcionando

---

## 🐛 Troubleshooting

### Erro: "OAuth configuration is invalid"

**Solução:** Verifique se todas as variáveis `VITE_CONTAAZUL_*` estão configuradas corretamente no Lovable.

### Erro: "429 Too Many Requests"

**Solução:** A integração implementa retry automático. Se persistir, aguarde 1 minuto antes de novas requisições.

### Erro: "Failed to refresh token"

**Solução:** O refresh token expirou. O usuário precisa fazer login novamente.

### Tokens não persistem após refresh

**Solução:** Implemente armazenamento no Supabase (Passo 8).

---

## 📚 Recursos Adicionais

- [Documentação ContaAzul](https://developers.contaazul.com)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Lovable Docs](https://docs.lovable.app)
- [Supabase Functions](https://supabase.com/docs/guides/database/functions)

---

## 🎉 Pronto!

Sua integração ContaAzul **100% COMPLETA** está configurada no Lovable. Agora você pode:

✅ Autenticar usuários via OAuth 2.0  
✅ Gerenciar **Produtos** (CRUD, categorias, NCM, CEST, variações, kits)  
✅ Gerenciar **Pessoas** (clientes, fornecedores, transportadoras)  
✅ Criar e gerenciar **Vendas** (incluindo PDF, itens, vendedores)  
✅ Cadastrar **Serviços** (CRUD, parâmetros fiscais)  
✅ Criar **Contratos Recorrentes** (vendas automáticas)  
✅ Gerenciar **Financeiro** (contas pagar/receber, categorias, centros custo)  
✅ Consultar **Notas Fiscais** (NFe e NFS-e)  
✅ Tracking de **Protocolos** (eventos assíncronos)  

**12 APIs completas prontas para usar! 🚀**

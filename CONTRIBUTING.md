# 🤝 Contribuindo para ContaAzul Integration

Obrigado por considerar contribuir com este projeto! 🎉

Este guia mostrará como você pode ajudar a melhorar a integração ContaAzul.

---

## 📋 Índice

- [Como Contribuir](#como-contribuir)
- [Padrão de Commits](#padrão-de-commits)
- [Adicionando Novas APIs](#adicionando-novas-apis)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Features](#sugerindo-features)
- [Code Review](#code-review)

---

## 🚀 Como Contribuir

### 1. Fork do Repositório

```bash
# Clique em "Fork" no GitHub
# Depois clone seu fork
git clone https://github.com/seu-usuario/ContaAzul.git
cd ContaAzul
```

### 2. Crie uma Branch

```bash
# Para nova feature
git checkout -b feature/minha-feature

# Para correção de bug
git checkout -b fix/corrige-bug

# Para documentação
git checkout -b docs/melhora-docs
```

### 3. Faça suas Mudanças

- Siga o estilo de código TypeScript do projeto
- Mantenha 100% type-safe (zero `any`)
- Adicione testes se aplicável
- Atualize a documentação

### 4. Commit suas Mudanças

```bash
git add .
git commit -m "feat: adiciona suporte para API de Pedidos"
```

### 5. Push para seu Fork

```bash
git push origin feature/minha-feature
```

### 6. Abra um Pull Request

- Vá para o repositório original no GitHub
- Clique em "New Pull Request"
- Selecione sua branch
- Descreva suas mudanças detalhadamente

---

## 📝 Padrão de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

### Tipos de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Tarefas de build, CI/CD, dependências
- `style:` Formatação de código (não afeta lógica)
- `perf:` Melhoria de performance

### Exemplos

```bash
feat: adiciona hook useNotasFiscais
fix: corrige auto-refresh de tokens OAuth
docs: atualiza README com exemplos de vendas
refactor: simplifica lógica de rate limiting
test: adiciona testes para useProdutos
chore: atualiza dependências do projeto
```

---

## 🔧 Adicionando Novas APIs

Para adicionar uma nova API do ContaAzul, siga estes passos:

### 1. Criar Types

Crie `src/types/[modulo].ts`:

```typescript
import { PaginatedResponse } from './core';

export interface MeuModulo {
  id: string;
  nome: string;
  // ... outros campos
}

export interface CriarMeuModulo {
  nome: string;
  // ... campos obrigatórios
}

export type RespostaMeuModulo = PaginatedResponse<MeuModulo>;
```

### 2. Implementar API Module

Crie `src/lib/contaazul/api/meu-modulo.ts`:

```typescript
import contaAzulClient from '../client';
import { MeuModulo, CriarMeuModulo, RespostaMeuModulo } from '../../types/meu-modulo';

export const meuModulo = {
  list: async (params?: any): Promise<RespostaMeuModulo> => {
    const { data } = await contaAzulClient.get('/v1/meu-modulo', { params });
    return data;
  },

  getById: async (id: string): Promise<MeuModulo> => {
    const { data } = await contaAzulClient.get(`/v1/meu-modulo/${id}`);
    return data;
  },

  create: async (payload: CriarMeuModulo): Promise<MeuModulo> => {
    const { data } = await contaAzulClient.post('/v1/meu-modulo', payload);
    return data;
  },
};

const meuModuloAPI = { meuModulo };
export default meuModuloAPI;
```

### 3. Criar React Hooks

Crie `src/hooks/contaazul/useMeuModulo.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import meuModuloAPI from '../../lib/contaazul/api/meu-modulo';

export const meuModuloKeys = {
  all: ['contaazul', 'meu-modulo'] as const,
  modulos: () => [...meuModuloKeys.all, 'lista'] as const,
  modulo: (id: string) => [...meuModuloKeys.modulos(), id] as const,
};

export const useMeuModulo = (params?: any) => {
  return useQuery({
    queryKey: [...meuModuloKeys.modulos(), params],
    queryFn: () => meuModuloAPI.meuModulo.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useCreateMeuModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarMeuModulo) => meuModuloAPI.meuModulo.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meuModuloKeys.modulos() });
    },
  });
};
```

### 4. Atualizar Exports

Adicione em `src/lib/contaazul/api/index.ts`:

```typescript
export { default as meuModulo } from './meu-modulo';
export * from '../../types/meu-modulo';
```

### 5. Atualizar Documentação

- Adicione exemplos no `README.md`
- Documente os hooks
- Atualize `CHANGELOG.md`

---

## 🐛 Reportando Bugs

Encontrou um bug? Abra uma [Issue](https://github.com/megaclic/ContaAzul/issues/new) com:

1. **Título claro**: "Bug: falha ao criar venda com desconto"
2. **Descrição**: O que aconteceu vs. o que deveria acontecer
3. **Passos para reproduzir**:
   ```
   1. Faça login via OAuth
   2. Tente criar venda com desconto
   3. Observe o erro
   ```
4. **Ambiente**:
   - Node version: 18.x
   - React version: 18.2.0
   - Browser: Chrome 120
5. **Código relevante** (se possível):
   ```typescript
   const mutation = useCreateVenda();
   mutation.mutate({ /* ... */ });
   ```

---

## 💡 Sugerindo Features

Quer uma nova funcionalidade? Abra uma [Issue](https://github.com/megaclic/ContaAzul/issues/new) com:

1. **Título**: "Feature: adicionar suporte para Notas de Débito"
2. **Problema**: Qual problema isso resolve?
3. **Solução proposta**: Como você imagina que funcione?
4. **Alternativas**: Outras abordagens consideradas
5. **Contexto adicional**: Screenshots, links, exemplos

---

## 👀 Code Review

Todos os PRs passam por code review. Esperamos:

- ✅ Código type-safe (100% TypeScript strict)
- ✅ Testes (quando aplicável)
- ✅ Documentação atualizada
- ✅ Commits seguindo Conventional Commits
- ✅ PR description clara e objetiva

### Checklist antes do PR

- [ ] Código compila sem erros (`npm run type-check`)
- [ ] Lint passa (`npm run lint`)
- [ ] Testes passam (se houver)
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado (para features/fixes)

---

## 📚 Recursos Úteis

- [Documentação ContaAzul](https://developers.contaazul.com)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/)

---

## ❓ Dúvidas?

Abra uma [Discussion](https://github.com/megaclic/ContaAzul/discussions) ou uma [Issue](https://github.com/megaclic/ContaAzul/issues) e vamos te ajudar!

---

**Obrigado por contribuir! 🚀**

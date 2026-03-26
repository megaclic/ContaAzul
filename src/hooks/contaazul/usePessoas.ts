/**
 * ContaAzul Integration - usePessoas Hook
 * 
 * Hook React Query para operações de pessoas
 * 
 * Features:
 * - CRUD Pessoas (queries + mutations)
 * - Batch operations (ativar/inativar/excluir em lote)
 * - Empresa conectada (query)
 * - Cache automático
 * - Refetch inteligente
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import pessoasAPI from '../../lib/contaazul/api/pessoas';
import {
  // Pessoas
  ResumoPessoasResponse,
  Pessoa,
  CriarPessoa,
  AtualizarPessoa,
  AtualizacaoParcialPessoa,
  PessoasQueryParams,
  ResumoCriacaoPessoa,
  ResumoAtualizacaoPessoa,
  // Batch
  ResultadoAtualizacaoStatusLote,
  // Empresa
  Empresa,
} from '../../types/pessoas';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const pessoasKeys = {
  all: ['contaazul', 'pessoas'] as const,
  pessoas: () => [...pessoasKeys.all, 'lista'] as const,
  pessoa: (id: string) => [...pessoasKeys.pessoas(), id] as const,
  pessoaLegacy: (legacyId: number) => [...pessoasKeys.pessoas(), 'legacy', legacyId] as const,
  empresa: () => [...pessoasKeys.all, 'empresa'] as const,
};

// ============================================================================
// PESSOAS - CRUD
// ============================================================================

export const usePessoas = (
  params?: PessoasQueryParams,
  options?: Omit<UseQueryOptions<ResumoPessoasResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...pessoasKeys.pessoas(), params],
    queryFn: () => pessoasAPI.pessoas.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });
};

export const usePessoa = (
  id: string,
  options?: Omit<UseQueryOptions<Pessoa>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: pessoasKeys.pessoa(id),
    queryFn: () => pessoasAPI.pessoas.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!id,
    ...options,
  });
};

export const usePessoaLegacy = (
  legacyId: number,
  options?: Omit<UseQueryOptions<Pessoa>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: pessoasKeys.pessoaLegacy(legacyId),
    queryFn: () => pessoasAPI.pessoas.getByLegacyId(legacyId),
    staleTime: 5 * 60 * 1000,
    enabled: !!legacyId,
    ...options,
  });
};

export const useCreatePessoa = (
  options?: UseMutationOptions<ResumoCriacaoPessoa, Error, CriarPessoa>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarPessoa) => pessoasAPI.pessoas.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoas() });
    },
    ...options,
  });
};

export const useUpdatePessoa = (
  options?: UseMutationOptions<ResumoAtualizacaoPessoa, Error, { id: string; payload: AtualizarPessoa }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => pessoasAPI.pessoas.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoas() });
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoa(id) });
    },
    ...options,
  });
};

export const usePartialUpdatePessoa = (
  options?: UseMutationOptions<void, Error, { id: string; payload: AtualizacaoParcialPessoa }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => pessoasAPI.pessoas.partialUpdate(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoas() });
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoa(id) });
    },
    ...options,
  });
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const useAtivarPessoas = (
  options?: UseMutationOptions<ResultadoAtualizacaoStatusLote[], Error, string[]>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuids: string[]) => pessoasAPI.batch.ativar(uuids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoas() });
    },
    ...options,
  });
};

export const useInativarPessoas = (
  options?: UseMutationOptions<ResultadoAtualizacaoStatusLote[], Error, string[]>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuids: string[]) => pessoasAPI.batch.inativar(uuids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoas() });
    },
    ...options,
  });
};

export const useExcluirPessoas = (
  options?: UseMutationOptions<void, Error, string[]>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuids: string[]) => pessoasAPI.batch.excluir(uuids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoasKeys.pessoas() });
    },
    ...options,
  });
};

// ============================================================================
// EMPRESA CONECTADA
// ============================================================================

export const useEmpresaConectada = (
  options?: Omit<UseQueryOptions<Empresa>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: pessoasKeys.empresa(),
    queryFn: () => pessoasAPI.empresa.getContaConectada(),
    staleTime: 30 * 60 * 1000, // 30 minutos (empresa muda pouco)
    ...options,
  });
};

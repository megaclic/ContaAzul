/**
 * ContaAzul Integration - useServicos Hook
 * 
 * Hook React Query para operações de serviços
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import servicosAPI from '../../lib/contaazul/api/servicos';
import {
  Servico,
  CriarServico,
  AtualizacaoParcialServico,
  ServicosQueryParams,
  RespostaServicos,
} from '../../types/servicos';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const servicosKeys = {
  all: ['contaazul', 'servicos'] as const,
  servicos: () => [...servicosKeys.all, 'lista'] as const,
  servico: (id: string) => [...servicosKeys.servicos(), id] as const,
};

// ============================================================================
// SERVIÇOS - CRUD
// ============================================================================

export const useServicos = (
  params?: ServicosQueryParams,
  options?: Omit<UseQueryOptions<RespostaServicos>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...servicosKeys.servicos(), params],
    queryFn: () => servicosAPI.servicos.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });
};

export const useServico = (
  id: string,
  options?: Omit<UseQueryOptions<Servico>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: servicosKeys.servico(id),
    queryFn: () => servicosAPI.servicos.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!id,
    ...options,
  });
};

export const useCreateServico = (
  options?: UseMutationOptions<Servico, Error, CriarServico>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarServico) => servicosAPI.servicos.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicosKeys.servicos() });
    },
    ...options,
  });
};

export const useUpdateServico = (
  options?: UseMutationOptions<void, Error, { id: string; payload: AtualizacaoParcialServico }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => servicosAPI.servicos.partialUpdate(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: servicosKeys.servicos() });
      queryClient.invalidateQueries({ queryKey: servicosKeys.servico(id) });
    },
    ...options,
  });
};

export const useDeleteServicos = (
  options?: UseMutationOptions<void, Error, string[]>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => servicosAPI.servicos.deleteMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicosKeys.servicos() });
    },
    ...options,
  });
};

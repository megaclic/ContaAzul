/**
 * ContaAzul Integration - useContratos Hook
 * 
 * Hook React Query para operações de contratos recorrentes
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import contratosAPI from '../../lib/contaazul/api/contratos';
import {
  Contrato,
  CriarContrato,
  ContratosQueryParams,
  RespostaContratos,
} from '../../types/contratos';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const contratosKeys = {
  all: ['contaazul', 'contratos'] as const,
  contratos: () => [...contratosKeys.all, 'lista'] as const,
  proximoNumero: () => [...contratosKeys.all, 'proximo-numero'] as const,
};

// ============================================================================
// CONTRATOS
// ============================================================================

export const useContratos = (
  params?: ContratosQueryParams,
  options?: Omit<UseQueryOptions<RespostaContratos>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...contratosKeys.contratos(), params],
    queryFn: () => contratosAPI.contratos.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });
};

export const useCreateContrato = (
  options?: UseMutationOptions<Contrato, Error, CriarContrato>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarContrato) => contratosAPI.contratos.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contratosKeys.contratos() });
      queryClient.invalidateQueries({ queryKey: contratosKeys.proximoNumero() });
    },
    ...options,
  });
};

/**
 * Hook para buscar próximo número disponível de contrato
 * 
 * Use antes de criar um novo contrato para garantir número sequencial único
 * 
 * @example
 * ```tsx
 * const { data: proximoNumero } = useProximoNumeroContrato();
 * 
 * const handleCreate = () => {
 *   createContrato.mutate({
 *     numero: proximoNumero,
 *     // ... resto dos dados
 *   });
 * };
 * ```
 */
export const useProximoNumeroContrato = (
  options?: Omit<UseQueryOptions<number>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: contratosKeys.proximoNumero(),
    queryFn: () => contratosAPI.contratos.getProximoNumero(),
    staleTime: 30 * 1000, // 30 segundos (pode mudar rápido)
    ...options,
  });
};

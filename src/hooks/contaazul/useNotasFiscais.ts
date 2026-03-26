/**
 * ContaAzul Integration - useNotasFiscais Hook
 * 
 * Hook React Query para consulta de notas fiscais (READ-ONLY)
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import notasFiscaisAPI from '../../lib/contaazul/api/notas-fiscais';
import {
  NotaFiscalProduto,
  NotaFiscalServico,
  NotasFiscaisQueryParams,
  NotasFiscaisServicoQueryParams,
  RespostaNotasFiscais,
  RespostaNotasFiscaisServico,
  VincularNotaMDFe,
} from '../../types/notas-fiscais';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const notasFiscaisKeys = {
  all: ['contaazul', 'notas-fiscais'] as const,
  nfe: () => [...notasFiscaisKeys.all, 'nfe'] as const,
  nfeByChave: (chave: string) => [...notasFiscaisKeys.nfe(), chave] as const,
  nfse: () => [...notasFiscaisKeys.all, 'nfse'] as const,
};

// ============================================================================
// NFe (NOTAS FISCAIS PRODUTO)
// ============================================================================

/**
 * Lista NFe emitidas
 * 
 * READ-ONLY: retorna apenas notas com status EMITIDA ou CORRIGIDA_COM_SUCESSO
 */
export const useNFe = (
  params?: NotasFiscaisQueryParams,
  options?: Omit<UseQueryOptions<RespostaNotasFiscais>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...notasFiscaisKeys.nfe(), params],
    queryFn: () => notasFiscaisAPI.nfe.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutos (notas fiscais não mudam)
    ...options,
  });
};

/**
 * Busca NFe por chave de acesso
 */
export const useNFeByChave = (
  chave: string,
  options?: Omit<UseQueryOptions<NotaFiscalProduto>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: notasFiscaisKeys.nfeByChave(chave),
    queryFn: () => notasFiscaisAPI.nfe.getByChave(chave),
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!chave && chave.length === 44, // chave tem 44 dígitos
    ...options,
  });
};

// ============================================================================
// NFS-e (NOTAS FISCAIS SERVIÇO)
// ============================================================================

/**
 * Lista NFS-e emitidas
 * 
 * READ-ONLY: consulta apenas
 */
export const useNFSe = (
  params?: NotasFiscaisServicoQueryParams,
  options?: Omit<UseQueryOptions<RespostaNotasFiscaisServico>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...notasFiscaisKeys.nfse(), params],
    queryFn: () => notasFiscaisAPI.nfse.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
};

// ============================================================================
// MDF-e (MANIFESTO ELETRÔNICO)
// ============================================================================

/**
 * Vincula notas fiscais a um MDF-e
 * 
 * Para controle logístico e fiscal de transporte
 */
export const useVincularNotasMDFe = (
  options?: UseMutationOptions<void, Error, VincularNotaMDFe>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VincularNotaMDFe) => notasFiscaisAPI.mdfe.vincularNotas(payload),
    onSuccess: () => {
      // Invalida cache de NFe para refletir vínculo
      queryClient.invalidateQueries({ queryKey: notasFiscaisKeys.nfe() });
    },
    ...options,
  });
};

/**
 * ContaAzul Integration - useFinanceiro Hook
 * 
 * Hook React Query para operações financeiras
 * 
 * Features:
 * - Categorias Financeiras (queries)
 * - Centros de Custo (queries + mutations)
 * - Contas a Pagar/Receber (queries + mutations)
 * - Contas Financeiras (queries)
 * - Cache automático
 * - Refetch inteligente
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import financeiro from '../../lib/contaazul/api/financeiro';
import {
  // Categorias
  CategoriasFinanceirasResponse,
  CategoriasFinanceirasQueryParams,
  CategoriaFinanceira,
  // Centros Custo
  ListagemCentroCusto,
  CentrosCustoQueryParams,
  CriacaoCentroCusto,
  AtualizacaoCentroCusto,
  // Contas Receber/Pagar
  ListaParcelasContasReceberPagar,
  ParcelaContasReceberPagarQueryParams,
  CriacaoEventoFinanceiroContasReceber,
  CriacaoEventoFinanceiroContasPagar,
  EventoFinanceiroCriado,
  // Contas Financeiras
  ListaContasFinanceiras,
  ContasFinanceirasQueryParams,
} from '../../types/financeiro';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const financeiroKeys = {
  all: ['contaazul', 'financeiro'] as const,
  categorias: () => [...financeiroKeys.all, 'categorias'] as const,
  categoria: (id: string) => [...financeiroKeys.categorias(), id] as const,
  centrosCusto: () => [...financeiroKeys.all, 'centros-custo'] as const,
  contasReceber: () => [...financeiroKeys.all, 'contas-receber'] as const,
  contasPagar: () => [...financeiroKeys.all, 'contas-pagar'] as const,
  contasFinanceiras: () => [...financeiroKeys.all, 'contas-financeiras'] as const,
};

// ============================================================================
// CATEGORIAS FINANCEIRAS
// ============================================================================

export const useCategorias = (
  params?: CategoriasFinanceirasQueryParams,
  options?: Omit<UseQueryOptions<CategoriasFinanceirasResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...financeiroKeys.categorias(), params],
    queryFn: () => financeiro.categorias.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutos (categorias mudam pouco)
    ...options,
  });
};

export const useCategoria = (
  id: string,
  options?: Omit<UseQueryOptions<CategoriaFinanceira>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: financeiroKeys.categoria(id),
    queryFn: () => financeiro.categorias.getById(id),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

// ============================================================================
// CENTROS DE CUSTO
// ============================================================================

export const useCentrosCusto = (
  params?: CentrosCustoQueryParams,
  options?: Omit<UseQueryOptions<ListagemCentroCusto>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...financeiroKeys.centrosCusto(), params],
    queryFn: () => financeiro.centrosCusto.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
};

export const useCreateCentroCusto = (
  options?: UseMutationOptions<any, Error, CriacaoCentroCusto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriacaoCentroCusto) => financeiro.centrosCusto.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeiroKeys.centrosCusto() });
    },
    ...options,
  });
};

export const useUpdateCentroCusto = (
  options?: UseMutationOptions<void, Error, { id: string; payload: AtualizacaoCentroCusto }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => financeiro.centrosCusto.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeiroKeys.centrosCusto() });
    },
    ...options,
  });
};

// ============================================================================
// CONTAS A RECEBER (Receitas)
// ============================================================================

export const useContasReceber = (
  params: ParcelaContasReceberPagarQueryParams,
  options?: Omit<UseQueryOptions<ListaParcelasContasReceberPagar>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...financeiroKeys.contasReceber(), params],
    queryFn: () => financeiro.contasReceber.list(params),
    enabled: !!(params.data_vencimento_de && params.data_vencimento_ate),
    staleTime: 60 * 1000, // 1 minuto
    ...options,
  });
};

export const useCreateContaReceber = (
  options?: UseMutationOptions<EventoFinanceiroCriado, Error, CriacaoEventoFinanceiroContasReceber>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriacaoEventoFinanceiroContasReceber) =>
      financeiro.contasReceber.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeiroKeys.contasReceber() });
    },
    ...options,
  });
};

// ============================================================================
// CONTAS A PAGAR (Despesas)
// ============================================================================

export const useContasPagar = (
  params: ParcelaContasReceberPagarQueryParams,
  options?: Omit<UseQueryOptions<ListaParcelasContasReceberPagar>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...financeiroKeys.contasPagar(), params],
    queryFn: () => financeiro.contasPagar.list(params),
    enabled: !!(params.data_vencimento_de && params.data_vencimento_ate),
    staleTime: 60 * 1000, // 1 minuto
    ...options,
  });
};

export const useCreateContaPagar = (
  options?: UseMutationOptions<EventoFinanceiroCriado, Error, CriacaoEventoFinanceiroContasPagar>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriacaoEventoFinanceiroContasPagar) =>
      financeiro.contasPagar.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeiroKeys.contasPagar() });
    },
    ...options,
  });
};

// ============================================================================
// CONTAS FINANCEIRAS
// ============================================================================

export const useContasFinanceiras = (
  params?: ContasFinanceirasQueryParams,
  options?: Omit<UseQueryOptions<ListaContasFinanceiras>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...financeiroKeys.contasFinanceiras(), params],
    queryFn: () => financeiro.contasFinanceiras.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutos
    ...options,
  });
};

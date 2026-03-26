/**
 * ContaAzul Integration - useVendas Hook
 * 
 * Hook React Query para operações de vendas
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import vendasAPI from '../../lib/contaazul/api/vendas';
import {
  Venda,
  CriarVenda,
  AtualizarVenda,
  VendasQueryParams,
  RespostaVendasBusca,
  Vendedor,
  ItemVenda,
} from '../../types/vendas';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const vendasKeys = {
  all: ['contaazul', 'vendas'] as const,
  vendas: () => [...vendasKeys.all, 'lista'] as const,
  venda: (id: string) => [...vendasKeys.vendas(), id] as const,
  vendedores: () => [...vendasKeys.all, 'vendedores'] as const,
  itens: (idVenda: string) => [...vendasKeys.venda(idVenda), 'itens'] as const,
  pdf: (idVenda: string) => [...vendasKeys.venda(idVenda), 'pdf'] as const,
};

// ============================================================================
// VENDAS - CRUD
// ============================================================================

export const useVendas = (
  params?: VendasQueryParams,
  options?: Omit<UseQueryOptions<RespostaVendasBusca>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...vendasKeys.vendas(), params],
    queryFn: () => vendasAPI.vendas.buscar(params),
    staleTime: 60 * 1000, // 1 minuto
    ...options,
  });
};

export const useVenda = (
  id: string,
  options?: Omit<UseQueryOptions<Venda>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: vendasKeys.venda(id),
    queryFn: () => vendasAPI.vendas.getById(id),
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!id,
    ...options,
  });
};

export const useCreateVenda = (
  options?: UseMutationOptions<Venda, Error, CriarVenda>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarVenda) => vendasAPI.vendas.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendasKeys.vendas() });
    },
    ...options,
  });
};

export const useUpdateVenda = (
  options?: UseMutationOptions<Venda, Error, { id: string; payload: AtualizarVenda }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => vendasAPI.vendas.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: vendasKeys.vendas() });
      queryClient.invalidateQueries({ queryKey: vendasKeys.venda(id) });
    },
    ...options,
  });
};

export const useDeleteVendas = (
  options?: UseMutationOptions<void, Error, string[]>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => vendasAPI.vendas.deleteMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendasKeys.vendas() });
    },
    ...options,
  });
};

// ============================================================================
// VENDEDORES
// ============================================================================

export const useVendedores = (
  options?: Omit<UseQueryOptions<Vendedor[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: vendasKeys.vendedores(),
    queryFn: () => vendasAPI.vendedores.list(),
    staleTime: 30 * 60 * 1000, // 30 minutos (vendedores mudam pouco)
    ...options,
  });
};

// ============================================================================
// ITENS DE VENDA
// ============================================================================

export const useItensVenda = (
  idVenda: string,
  options?: Omit<UseQueryOptions<ItemVenda[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: vendasKeys.itens(idVenda),
    queryFn: () => vendasAPI.itensVenda.listByVendaId(idVenda),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!idVenda,
    ...options,
  });
};

// ============================================================================
// PDF DA VENDA
// ============================================================================

export const usePdfVenda = (
  idVenda: string,
  options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: vendasKeys.pdf(idVenda),
    queryFn: () => vendasAPI.pdfVenda.getUrl(idVenda),
    staleTime: 60 * 60 * 1000, // 1 hora (URL é estável)
    enabled: !!idVenda,
    ...options,
  });
};

/**
 * ContaAzul Integration - useProdutos Hook
 * 
 * Hook React Query para operações de produtos
 * 
 * Features:
 * - CRUD Produtos (queries + mutations)
 * - Categorias, NCM, CEST (queries)
 * - Unidades de Medida (queries)
 * - E-commerce (marcas, categorias)
 * - Cache automático
 * - Refetch inteligente
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import produtosAPI from '../../lib/contaazul/api/produtos';
import {
  // Produtos
  ResumoProdutosResponse,
  Produto,
  CriacaoProduto,
  AtualizacaoParcialProduto,
  ProdutosQueryParams,
  // Categorias
  CategoriasResponse,
  // NCM / CEST
  NCMsResponse,
  CESTsResponse,
  // Unidades
  UnidadesMedidaResponse,
  // E-commerce
  MarcasEcommerceResponse,
  CategoriaEcommerceResponse,
} from '../../types/produtos';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const produtosKeys = {
  all: ['contaazul', 'produtos'] as const,
  produtos: () => [...produtosKeys.all, 'lista'] as const,
  produto: (id: string) => [...produtosKeys.produtos(), id] as const,
  categorias: () => [...produtosKeys.all, 'categorias'] as const,
  ncm: () => [...produtosKeys.all, 'ncm'] as const,
  cest: () => [...produtosKeys.all, 'cest'] as const,
  unidadesMedida: () => [...produtosKeys.all, 'unidades-medida'] as const,
  marcasEcommerce: () => [...produtosKeys.all, 'marcas-ecommerce'] as const,
  categoriasEcommerce: () => [...produtosKeys.all, 'categorias-ecommerce'] as const,
};

// ============================================================================
// PRODUTOS - CRUD
// ============================================================================

export const useProdutos = (
  params?: ProdutosQueryParams,
  options?: Omit<UseQueryOptions<ResumoProdutosResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...produtosKeys.produtos(), params],
    queryFn: () => produtosAPI.produtos.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });
};

export const useProduto = (
  id: string,
  options?: Omit<UseQueryOptions<Produto>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: produtosKeys.produto(id),
    queryFn: () => produtosAPI.produtos.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!id,
    ...options,
  });
};

export const useCreateProduto = (
  options?: UseMutationOptions<Produto, Error, CriacaoProduto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriacaoProduto) => produtosAPI.produtos.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produtosKeys.produtos() });
    },
    ...options,
  });
};

export const useUpdateProduto = (
  options?: UseMutationOptions<void, Error, { id: string; payload: AtualizacaoParcialProduto }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => produtosAPI.produtos.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: produtosKeys.produtos() });
      queryClient.invalidateQueries({ queryKey: produtosKeys.produto(id) });
    },
    ...options,
  });
};

export const useDeleteProduto = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => produtosAPI.produtos.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produtosKeys.produtos() });
    },
    ...options,
  });
};

// ============================================================================
// CATEGORIAS
// ============================================================================

export const useCategorias = (
  params?: { pagina?: number; tamanho_pagina?: number; busca_textual?: string },
  options?: Omit<UseQueryOptions<CategoriasResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...produtosKeys.categorias(), params],
    queryFn: () => produtosAPI.categorias.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutos (categorias mudam pouco)
    ...options,
  });
};

// ============================================================================
// NCM (Nomenclatura Comum do Mercosul)
// ============================================================================

export const useNCM = (
  params?: { pagina?: number; tamanho_pagina?: number; busca_textual?: string },
  options?: Omit<UseQueryOptions<NCMsResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...produtosKeys.ncm(), params],
    queryFn: () => produtosAPI.ncm.list(params),
    staleTime: 30 * 60 * 1000, // 30 minutos (NCM é muito estável)
    ...options,
  });
};

// ============================================================================
// CEST (Código Especificador da Substituição Tributária)
// ============================================================================

export const useCEST = (
  params?: { pagina?: number; tamanho_pagina?: number; busca_textual?: string },
  options?: Omit<UseQueryOptions<CESTsResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...produtosKeys.cest(), params],
    queryFn: () => produtosAPI.cest.list(params),
    staleTime: 30 * 60 * 1000, // 30 minutos (CEST é muito estável)
    ...options,
  });
};

// ============================================================================
// UNIDADES DE MEDIDA
// ============================================================================

export const useUnidadesMedida = (
  params?: { pagina?: number; tamanho_pagina?: number; busca_textual?: string },
  options?: Omit<UseQueryOptions<UnidadesMedidaResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...produtosKeys.unidadesMedida(), params],
    queryFn: () => produtosAPI.unidadesMedida.list(params),
    staleTime: 30 * 60 * 1000, // 30 minutos
    ...options,
  });
};

// ============================================================================
// E-COMMERCE - MARCAS
// ============================================================================

export const useMarcasEcommerce = (
  params?: { pagina?: number; tamanho_pagina?: number; direcao?: 'ASC' | 'DESC'; busca_textual?: string },
  options?: Omit<UseQueryOptions<MarcasEcommerceResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...produtosKeys.marcasEcommerce(), params],
    queryFn: () => produtosAPI.marcasEcommerce.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutos
    ...options,
  });
};

// ============================================================================
// E-COMMERCE - CATEGORIAS
// ============================================================================

export const useCategoriasEcommerce = (
  params?: { busca_textual?: string },
  options?: Omit<UseQueryOptions<CategoriaEcommerceResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...produtosKeys.categoriasEcommerce(), params],
    queryFn: () => produtosAPI.categoriasEcommerce.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutos
    ...options,
  });
};

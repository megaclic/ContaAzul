/**
 * ContaAzul Integration - API Produtos
 * 
 * Módulo completo para gerenciamento de produtos:
 * - CRUD Produtos (simples, variações, kits)
 * - Categorias
 * - NCM / CEST
 * - Unidades de Medida
 * - E-commerce (marcas, categorias)
 */

import contaAzulClient from '../client';
import {
  // Produtos
  ResumoProdutosResponse,
  Produto,
  CriacaoProduto,
  AtualizacaoParcialProduto,
  ProdutosQueryParams,
  // Categorias
  CategoriasResponse,
  // NCM
  NCMsResponse,
  // CEST
  CESTsResponse,
  // Unidades de Medida
  UnidadesMedidaResponse,
  // E-commerce
  MarcasEcommerceResponse,
  CategoriaEcommerceResponse,
} from '../../types/produtos';
import { PaginatedResponse } from '../../types/core';

// ============================================================================
// PRODUTOS - CRUD
// ============================================================================

export const produtos = {
  /**
   * Lista produtos com filtros avançados
   */
  list: async (params?: ProdutosQueryParams): Promise<ResumoProdutosResponse> => {
    const { data } = await contaAzulClient.get<ResumoProdutosResponse>('/v1/produtos', {
      params,
    });
    return data;
  },

  /**
   * Busca produto completo por ID (com fiscal, estoque, variações, etc)
   */
  getById: async (id: string): Promise<Produto> => {
    const { data } = await contaAzulClient.get<Produto>(`/v1/produtos/${id}`);
    return data;
  },

  /**
   * Cria novo produto
   * 
   * @param payload - Dados do produto (simples, variação ou kit)
   * @returns Produto criado com ID gerado
   */
  create: async (payload: CriacaoProduto): Promise<Produto> => {
    const { data } = await contaAzulClient.post<Produto>('/v1/produtos', payload);
    return data;
  },

  /**
   * Atualiza produto parcialmente
   * 
   * @param id - ID do produto
   * @param payload - Campos a atualizar (apenas os fornecidos serão alterados)
   */
  update: async (id: string, payload: AtualizacaoParcialProduto): Promise<void> => {
    await contaAzulClient.patch(`/v1/produtos/${id}`, payload);
  },

  /**
   * Deleta produto por ID
   */
  delete: async (id: string): Promise<void> => {
    await contaAzulClient.delete(`/v1/produtos/${id}`);
  },
};

// ============================================================================
// CATEGORIAS DE PRODUTOS
// ============================================================================

export const categorias = {
  /**
   * Lista categorias de produtos
   */
  list: async (params?: {
    pagina?: number;
    tamanho_pagina?: number;
    busca_textual?: string;
  }): Promise<CategoriasResponse> => {
    const { data } = await contaAzulClient.get<CategoriasResponse>(
      '/v1/produtos/categorias',
      { params }
    );
    return data;
  },
};

// ============================================================================
// NCM (Nomenclatura Comum do Mercosul)
// ============================================================================

export const ncm = {
  /**
   * Lista códigos NCM
   */
  list: async (params?: {
    pagina?: number;
    tamanho_pagina?: number;
    busca_textual?: string;
  }): Promise<NCMsResponse> => {
    const { data } = await contaAzulClient.get<NCMsResponse>('/v1/produtos/ncm', { params });
    return data;
  },
};

// ============================================================================
// CEST (Código Especificador da Substituição Tributária)
// ============================================================================

export const cest = {
  /**
   * Lista códigos CEST
   */
  list: async (params?: {
    pagina?: number;
    tamanho_pagina?: number;
    busca_textual?: string;
  }): Promise<CESTsResponse> => {
    const { data } = await contaAzulClient.get<CESTsResponse>('/v1/produtos/cest', { params });
    return data;
  },
};

// ============================================================================
// UNIDADES DE MEDIDA
// ============================================================================

export const unidadesMedida = {
  /**
   * Lista unidades de medida disponíveis
   */
  list: async (params?: {
    pagina?: number;
    tamanho_pagina?: number;
    busca_textual?: string;
  }): Promise<UnidadesMedidaResponse> => {
    const { data } = await contaAzulClient.get<UnidadesMedidaResponse>(
      '/v1/produtos/unidades-medida',
      { params }
    );
    return data;
  },
};

// ============================================================================
// E-COMMERCE - MARCAS
// ============================================================================

export const marcasEcommerce = {
  /**
   * Lista marcas de e-commerce
   */
  list: async (params?: {
    pagina?: number;
    tamanho_pagina?: number;
    direcao?: 'ASC' | 'DESC';
    busca_textual?: string;
  }): Promise<MarcasEcommerceResponse> => {
    const { data } = await contaAzulClient.get<MarcasEcommerceResponse>(
      '/v1/produtos/ecommerce-marcas',
      { params }
    );
    return data;
  },
};

// ============================================================================
// E-COMMERCE - CATEGORIAS
// ============================================================================

export const categoriasEcommerce = {
  /**
   * Lista categorias de e-commerce (hierárquicas)
   */
  list: async (params?: { busca_textual?: string }): Promise<CategoriaEcommerceResponse> => {
    const { data } = await contaAzulClient.get<CategoriaEcommerceResponse>(
      '/v1/produtos/ecommerce-categorias',
      { params }
    );
    return data;
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const produtosAPI = {
  produtos,
  categorias,
  ncm,
  cest,
  unidadesMedida,
  marcasEcommerce,
  categoriasEcommerce,
};

export default produtosAPI;

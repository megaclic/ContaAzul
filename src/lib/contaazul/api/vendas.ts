/**
 * ContaAzul Integration - API Vendas
 * 
 * Módulo completo para operações de vendas:
 * - CRUD Vendas
 * - Busca avançada com filtros
 * - Vendedores
 * - PDF de vendas
 * - Itens de vendas
 * - Deletar em lote
 */

import contaAzulClient from '../client';
import {
  Venda,
  CriarVenda,
  AtualizarVenda,
  VendasQueryParams,
  RespostaVendasBusca,
  Vendedor,
  DeletarVendasEmLote,
  ItemVenda,
} from '../../types/vendas';

// ============================================================================
// VENDAS - CRUD
// ============================================================================

export const vendas = {
  /**
   * Lista vendas com filtros avançados
   * 
   * Retorna totalizadores (aprovado, cancelado, esperando aprovação) + lista paginada
   */
  buscar: async (params?: VendasQueryParams): Promise<RespostaVendasBusca> => {
    const { data } = await contaAzulClient.get<RespostaVendasBusca>(
      '/v1/venda/busca',
      { params }
    );
    return data;
  },

  /**
   * Busca venda completa por ID
   */
  getById: async (id: string): Promise<Venda> => {
    const { data } = await contaAzulClient.get<Venda>(`/v1/venda/${id}`);
    return data;
  },

  /**
   * Cria nova venda
   * 
   * IMPORTANTE: número da venda deve ser único e sequencial
   */
  create: async (payload: CriarVenda): Promise<Venda> => {
    const { data } = await contaAzulClient.post<Venda>('/v1/venda', payload);
    return data;
  },

  /**
   * Atualiza venda por ID
   * 
   * Requer versão para controle de concorrência
   */
  update: async (id: string, payload: AtualizarVenda): Promise<Venda> => {
    const { data } = await contaAzulClient.put<Venda>(`/v1/venda/${id}`, payload);
    return data;
  },

  /**
   * Deleta vendas em lote
   */
  deleteMany: async (ids: string[]): Promise<void> => {
    const payload: DeletarVendasEmLote = { ids };
    await contaAzulClient.post('/v1/venda/exclusao-lote', payload);
  },
};

// ============================================================================
// VENDEDORES
// ============================================================================

export const vendedores = {
  /**
   * Lista vendedores disponíveis
   */
  list: async (): Promise<Vendedor[]> => {
    const { data } = await contaAzulClient.get<Vendedor[]>('/v1/venda/vendedores');
    return data;
  },
};

// ============================================================================
// ITENS DE VENDA
// ============================================================================

export const itensVenda = {
  /**
   * Lista itens de uma venda específica
   */
  listByVendaId: async (idVenda: string): Promise<ItemVenda[]> => {
    const { data } = await contaAzulClient.get<ItemVenda[]>(
      `/v1/venda/${idVenda}/itens`
    );
    return data;
  },
};

// ============================================================================
// PDF DA VENDA
// ============================================================================

export const pdfVenda = {
  /**
   * Retorna URL do PDF da venda
   */
  getUrl: async (idVenda: string): Promise<string> => {
    const { data } = await contaAzulClient.get<{ url: string }>(
      `/v1/venda/${idVenda}/imprimir`
    );
    return data.url;
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const vendasAPI = {
  vendas,
  vendedores,
  itensVenda,
  pdfVenda,
};

export default vendasAPI;

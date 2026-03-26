/**
 * ContaAzul Integration - API Serviços
 * 
 * Módulo completo para gerenciamento de serviços:
 * - CRUD Serviços
 * - Deletar em lote
 */

import contaAzulClient from '../client';
import {
  Servico,
  CriarServico,
  AtualizacaoParcialServico,
  ServicosQueryParams,
  RespostaServicos,
  DeletarServicosEmLote,
} from '../../types/servicos';

// ============================================================================
// SERVIÇOS - CRUD
// ============================================================================

export const servicos = {
  /**
   * Lista serviços com filtros
   */
  list: async (params?: ServicosQueryParams): Promise<RespostaServicos> => {
    const { data } = await contaAzulClient.get<RespostaServicos>('/v1/servicos', {
      params,
    });
    return data;
  },

  /**
   * Busca serviço por ID
   */
  getById: async (id: string): Promise<Servico> => {
    const { data } = await contaAzulClient.get<Servico>(`/v1/servicos/${id}`);
    return data;
  },

  /**
   * Cria novo serviço
   */
  create: async (payload: CriarServico): Promise<Servico> => {
    const { data } = await contaAzulClient.post<Servico>('/v1/servicos', payload);
    return data;
  },

  /**
   * Atualiza serviço parcialmente
   */
  partialUpdate: async (
    id: string,
    payload: AtualizacaoParcialServico
  ): Promise<void> => {
    await contaAzulClient.patch(`/v1/servicos/${id}`, payload);
  },

  /**
   * Deleta serviços em lote
   */
  deleteMany: async (ids: string[]): Promise<void> => {
    const payload: DeletarServicosEmLote = { ids };
    await contaAzulClient.delete('/v1/servicos', { data: payload });
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const servicosAPI = {
  servicos,
};

export default servicosAPI;

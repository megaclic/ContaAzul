/**
 * ContaAzul Integration - API Contratos
 * 
 * Módulo para gerenciamento de contratos recorrentes:
 * - Criar contratos
 * - Listar contratos
 * - Próximo número disponível
 */

import contaAzulClient from '../client';
import {
  Contrato,
  CriarContrato,
  ContratosQueryParams,
  RespostaContratos,
  ProximoNumeroContrato,
} from '../../types/contratos';

// ============================================================================
// CONTRATOS
// ============================================================================

export const contratos = {
  /**
   * Lista contratos com filtros
   */
  list: async (params?: ContratosQueryParams): Promise<RespostaContratos> => {
    const { data } = await contaAzulClient.get<RespostaContratos>('/v1/contratos', {
      params,
    });
    return data;
  },

  /**
   * Cria novo contrato recorrente
   * 
   * IMPORTANTE: contratos geram vendas automaticamente na periodicidade configurada
   */
  create: async (payload: CriarContrato): Promise<Contrato> => {
    const { data } = await contaAzulClient.post<Contrato>('/v1/contratos', payload);
    return data;
  },

  /**
   * Retorna próximo número disponível para criar contrato
   * 
   * Use antes de criar para garantir número sequencial único
   */
  getProximoNumero: async (): Promise<number> => {
    const { data } = await contaAzulClient.get<ProximoNumeroContrato>(
      '/v1/contratos/proximo-numero'
    );
    return data.proximo_numero;
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const contratosAPI = {
  contratos,
};

export default contratosAPI;

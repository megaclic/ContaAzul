/**
 * ContaAzul Integration - API Notas Fiscais
 * 
 * Módulo READ-ONLY para consulta de notas fiscais:
 * - NFe (Nota Fiscal Eletrônica - Produtos)
 * - NFS-e (Nota Fiscal de Serviço Eletrônica)
 * - Vínculo MDF-e
 * 
 * IMPORTANTE: Emissão é feita via UI do ERP, não via API
 */

import contaAzulClient from '../client';
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
// NOTAS FISCAIS PRODUTO (NFe)
// ============================================================================

export const nfe = {
  /**
   * Lista NFe emitidas com filtros
   * 
   * Retorna apenas notas com status EMITIDA ou CORRIGIDA_COM_SUCESSO
   */
  list: async (params?: NotasFiscaisQueryParams): Promise<RespostaNotasFiscais> => {
    const { data } = await contaAzulClient.get<RespostaNotasFiscais>(
      '/v1/notas-fiscais',
      { params }
    );
    return data;
  },

  /**
   * Busca NFe por chave de acesso
   */
  getByChave: async (chave: string): Promise<NotaFiscalProduto> => {
    const { data } = await contaAzulClient.get<NotaFiscalProduto>(
      `/v1/notas-fiscais/${chave}`
    );
    return data;
  },
};

// ============================================================================
// NOTAS FISCAIS SERVIÇO (NFS-e)
// ============================================================================

export const nfse = {
  /**
   * Lista NFS-e emitidas com filtros
   */
  list: async (
    params?: NotasFiscaisServicoQueryParams
  ): Promise<RespostaNotasFiscaisServico> => {
    const { data } = await contaAzulClient.get<RespostaNotasFiscaisServico>(
      '/v1/notas-fiscais-servico',
      { params }
    );
    return data;
  },
};

// ============================================================================
// MDF-e (Manifesto Eletrônico de Documentos Fiscais)
// ============================================================================

export const mdfe = {
  /**
   * Vincula notas fiscais a um MDF-e
   * 
   * Para controle logístico e fiscal de transporte
   */
  vincularNotas: async (payload: VincularNotaMDFe): Promise<void> => {
    await contaAzulClient.post('/v1/notas-fiscais/vinculo-mdfe', payload);
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const notasFiscaisAPI = {
  nfe,
  nfse,
  mdfe,
};

export default notasFiscaisAPI;

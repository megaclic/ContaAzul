/**
 * ContaAzul Integration - API Protocolos
 * 
 * Módulo para tracking de eventos assíncronos:
 * - Consultar status de processamento
 * - Acompanhar erros
 */

import contaAzulClient from '../client';
import { Protocolo } from '../../types/protocolos';

// ============================================================================
// PROTOCOLOS
// ============================================================================

export const protocolos = {
  /**
   * Busca protocolo por ID
   * 
   * Use para acompanhar processamento de eventos assíncronos
   * 
   * @example
   * ```ts
   * // Após criar evento que retorna protocolo_id
   * const protocolo = await api.protocolos.getById(protocolo_id);
   * 
   * if (protocolo.status === 'PROCESSADO') {
   *   console.log('Evento processado com sucesso!');
   *   console.log('ID do evento:', protocolo.id_evento_referencia);
   * } else if (protocolo.status === 'ERRO') {
   *   console.error('Erro:', protocolo.mensagem_erro);
   * }
   * ```
   */
  getById: async (id: string): Promise<Protocolo> => {
    const { data } = await contaAzulClient.get<Protocolo>(`/v1/protocolo/${id}`);
    return data;
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const protocolosAPI = {
  protocolos,
};

export default protocolosAPI;

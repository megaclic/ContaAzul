/**
 * ContaAzul Integration - Protocolos Types
 * 
 * Types para tracking de eventos assíncronos
 * Quando um evento financeiro é enviado, retorna um protocolo
 * para acompanhar o status do processamento
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum StatusProtocolo {
  PENDENTE = 'PENDENTE',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  PROCESSADO = 'PROCESSADO',
  ERRO = 'ERRO',
  CANCELADO = 'CANCELADO',
}

export enum TipoEventoProtocolo {
  VENDA = 'VENDA',
  CONTA_RECEBER = 'CONTA_RECEBER',
  CONTA_PAGAR = 'CONTA_PAGAR',
  PRODUTO = 'PRODUTO',
  PESSOA = 'PESSOA',
  BAIXA = 'BAIXA',
  NOTA_FISCAL = 'NOTA_FISCAL',
}

// ============================================================================
// PROTOCOLO
// ============================================================================

export interface Protocolo {
  id: string;
  tipo_evento: TipoEventoProtocolo;
  status: StatusProtocolo;
  data_criacao: string; // ISO 8601
  data_atualizacao?: string; // ISO 8601
  data_processamento?: string; // ISO 8601
  tentativas: number;
  mensagem_erro?: string;
  detalhes_erro?: string;
  id_evento_referencia?: string; // ID do evento criado (se sucesso)
  payload_original?: Record<string, unknown>; // dados enviados
}

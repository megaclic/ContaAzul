/**
 * ContaAzul Integration - Contratos Types
 * 
 * Types completos para o módulo Contratos da API ContaAzul v2
 * Contratos = vendas recorrentes automáticas
 */

import { PaginatedResponse } from './core';
import { TipoPagamentoVenda, ItemVenda, DescontoVenda } from './vendas';

// ============================================================================
// ENUMS
// ============================================================================

export enum PeriodoContrato {
  MENSAL = 'MENSAL',
  SEMANAL = 'SEMANAL',
  QUINZENAL = 'QUINZENAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
}

export enum StatusContrato {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  CANCELADO = 'CANCELADO',
}

// ============================================================================
// CONDIÇÃO DE PAGAMENTO DO CONTRATO
// ============================================================================

export interface CondicaoPagamentoContrato {
  tipo_pagamento: TipoPagamentoVenda;
  id_conta_financeira?: string;
  opcao_condicao_pagamento: string; // Ex: "À vista", "3x"
  dia_vencimento: number; // dia do mês (1-31)
}

// ============================================================================
// CONTRATO COMPLETO
// ============================================================================

export interface Contrato {
  uuid: string;
  numero: number;
  id_cliente: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
  periodo: PeriodoContrato;
  dia_vencimento: number;
  status: StatusContrato;
  valor_total: number;
  itens: ItemVenda[];
  condicao_pagamento: CondicaoPagamentoContrato;
  frete?: number;
  desconto?: DescontoVenda;
  observacoes?: string;
  id_categoria?: string;
  id_centro_custo?: string;
  id_vendedor?: string;
}

// ============================================================================
// CRIAÇÃO DE CONTRATO
// ============================================================================

export interface CriarContrato {
  numero: number;
  id_cliente: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD (opcional - contrato indefinido)
  periodo: PeriodoContrato;
  dia_vencimento: number; // dia do mês
  itens: ItemVenda[];
  condicao_pagamento: CondicaoPagamentoContrato;
  frete?: number;
  desconto?: DescontoVenda;
  observacoes?: string;
  id_categoria?: string;
  id_centro_custo?: string;
  id_vendedor?: string;
}

// ============================================================================
// QUERY PARAMS E LISTAGEM
// ============================================================================

export interface ContratosQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  id_cliente?: string;
  status?: StatusContrato;
  data_inicio_de?: string; // YYYY-MM-DD
  data_inicio_ate?: string; // YYYY-MM-DD
}

export type RespostaContratos = PaginatedResponse<Contrato>;

// ============================================================================
// PRÓXIMO NÚMERO
// ============================================================================

export interface ProximoNumeroContrato {
  proximo_numero: number;
}

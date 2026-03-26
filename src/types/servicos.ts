/**
 * ContaAzul Integration - Serviços Types
 * 
 * Types completos para o módulo Serviços da API ContaAzul v2
 * 
 * Módulos cobertos:
 * - CRUD Serviços
 * - Parâmetros fiscais de serviços
 */

import { PaginatedResponse, Versionable } from './core';

// ============================================================================
// ENUMS
// ============================================================================

export enum StatusServico {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export enum TipoServico {
  SERVICO = 'SERVICO',
  COMISSAO = 'COMISSAO',
  TAXA = 'TAXA',
  OUTROS = 'OUTROS',
}

// ============================================================================
// PARÂMETROS FISCAIS
// ============================================================================

export interface ParametrosServico {
  codigo_iss?: string;
  aliquota_iss?: number;
  codigo_servico_municipal?: string;
  item_lista_servico?: string;
}

// ============================================================================
// SERVICO COMPLETO
// ============================================================================

export interface Servico extends Versionable {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  tipo: TipoServico;
  preco: number;
  status: StatusServico;
  parametros?: ParametrosServico;
  id_centro_custo?: string;
  ultima_atualizacao?: string; // ISO 8601
}

// ============================================================================
// CRIAÇÃO DE SERVIÇO
// ============================================================================

export interface CriarServico {
  codigo: string;
  nome: string;
  descricao?: string;
  tipo: TipoServico;
  preco: number;
  status?: StatusServico;
  parametros?: ParametrosServico;
  id_centro_custo?: string;
}

// ============================================================================
// ATUALIZAÇÃO PARCIAL DE SERVIÇO
// ============================================================================

export interface AtualizacaoParcialServico {
  codigo?: string;
  nome?: string;
  descricao?: string;
  tipo?: TipoServico;
  preco?: number;
  status?: StatusServico;
  parametros?: ParametrosServico;
  id_centro_custo?: string;
}

// ============================================================================
// QUERY PARAMS E LISTAGEM
// ============================================================================

export interface ServicosQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  busca?: string; // busca por nome ou código
  status?: StatusServico;
}

export type RespostaServicos = PaginatedResponse<Servico>;

// ============================================================================
// DELETAR EM LOTE
// ============================================================================

export interface DeletarServicosEmLote {
  ids: string[];
}

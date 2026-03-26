/**
 * ContaAzul Integration - Notas Fiscais Types
 * 
 * Types completos para o módulo Notas Fiscais da API ContaAzul v2
 * READ-ONLY: consulta apenas (emissão é feita via UI do ERP)
 */

import { PaginatedResponse } from './core';

// ============================================================================
// ENUMS
// ============================================================================

export enum TipoNotaFiscal {
  NFE = 'NFE', // Nota Fiscal Eletrônica (produto)
  NFSE = 'NFSE', // Nota Fiscal de Serviço Eletrônica
}

export enum StatusNotaFiscal {
  EMITIDA = 'EMITIDA',
  CORRIGIDA_COM_SUCESSO = 'CORRIGIDA_COM_SUCESSO',
  CANCELADA = 'CANCELADA',
  DENEGADA = 'DENEGADA',
  REJEITADA = 'REJEITADA',
}

export enum StatusVinculoMDFe {
  AUTORIZADO = 'AUTORIZADO',
  ENCERRADO = 'ENCERRADO',
  CANCELADO = 'CANCELADO',
}

// ============================================================================
// NOTA FISCAL PRODUTO (NFe)
// ============================================================================

export interface NotaFiscalProduto {
  chave_acesso: string;
  numero: number;
  serie: number;
  data_emissao: string; // ISO 8601
  status: StatusNotaFiscal;
  id_venda?: string;
  valor_total: number;
  valor_produtos: number;
  valor_servicos?: number;
  valor_desconto?: number;
  valor_frete?: number;
  valor_seguro?: number;
  valor_outras_despesas?: number;
  valor_tributos?: number;
  xml_url?: string;
  pdf_url?: string;
  protocolo_autorizacao?: string;
  data_autorizacao?: string;
}

// ============================================================================
// NOTA FISCAL SERVIÇO (NFS-e)
// ============================================================================

export interface NotaFiscalServico {
  numero: string;
  codigo_verificacao?: string;
  data_emissao: string; // ISO 8601
  status: StatusNotaFiscal;
  id_venda?: string;
  valor_total: number;
  valor_servicos: number;
  valor_deducoes?: number;
  valor_iss?: number;
  valor_liquido?: number;
  pdf_url?: string;
  xml_url?: string;
  link_visualizacao?: string;
}

// ============================================================================
// QUERY PARAMS - NFe
// ============================================================================

export interface NotasFiscaisQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  data_emissao_de?: string; // YYYY-MM-DD
  data_emissao_ate?: string; // YYYY-MM-DD
  numero?: number;
  id_venda?: string;
  chave_acesso?: string;
}

export type RespostaNotasFiscais = PaginatedResponse<NotaFiscalProduto>;

// ============================================================================
// QUERY PARAMS - NFS-e
// ============================================================================

export interface NotasFiscaisServicoQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  data_emissao_de?: string; // YYYY-MM-DD
  data_emissao_ate?: string; // YYYY-MM-DD
  numero?: string;
  id_venda?: string;
}

export type RespostaNotasFiscaisServico = PaginatedResponse<NotaFiscalServico>;

// ============================================================================
// VÍNCULO MDF-e
// ============================================================================

export interface VincularNotaMDFe {
  chaves_acesso: string[]; // chaves das NFes
  status_vinculo?: StatusVinculoMDFe;
}

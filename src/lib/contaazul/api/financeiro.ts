/**
 * ContaAzul Integration - API Financeiro
 * 
 * Módulo completo para operações financeiras:
 * - Categorias Financeiras
 * - Centros de Custo
 * - Contas a Pagar/Receber
 * - Baixas
 * - Cobranças
 * - Contas Financeiras
 */

import contaAzulClient from './client';
import {
  // Categorias
  CategoriasFinanceirasResponse,
  CategoriasFinanceirasQueryParams,
  CategoriaFinanceira,
  // Centros de Custo
  ListagemCentroCusto,
  CentrosCustoQueryParams,
  CriacaoCentroCusto,
  AtualizacaoCentroCusto,
  CentroCusto,
  // Eventos Financeiros
  CriacaoEventoFinanceiroContasReceber,
  CriacaoEventoFinanceiroContasPagar,
  EventoFinanceiroCriado,
  // Parcelas
  ListaParcelasContasReceberPagar,
  ParcelaContasReceberPagarQueryParams,
  // Baixas
  Baixa,
  // Cobranças
  Cobranca,
  // Contas Financeiras
  ListaContasFinanceiras,
  ContasFinanceirasQueryParams,
} from '../types/financeiro';

// ============================================================================
// CATEGORIAS FINANCEIRAS
// ============================================================================

export const categorias = {
  /**
   * Lista categorias financeiras com filtros
   */
  list: async (params?: CategoriasFinanceirasQueryParams): Promise<CategoriasFinanceirasResponse> => {
    const { data } = await contaAzulClient.get<CategoriasFinanceirasResponse>(
      '/v1/financeiro/categorias',
      { params }
    );
    return data;
  },

  /**
   * Busca categoria financeira por ID
   */
  getById: async (id: string): Promise<CategoriaFinanceira> => {
    const { data } = await contaAzulClient.get<CategoriaFinanceira>(
      `/v1/financeiro/categorias/${id}`
    );
    return data;
  },
};

// ============================================================================
// CENTROS DE CUSTO
// ============================================================================

export const centrosCusto = {
  /**
   * Lista centros de custo com filtros e totalizadores
   */
  list: async (params?: CentrosCustoQueryParams): Promise<ListagemCentroCusto> => {
    const { data } = await contaAzulClient.get<ListagemCentroCusto>(
      '/v1/financeiro/centros-de-custo',
      { params }
    );
    return data;
  },

  /**
   * Cria novo centro de custo
   */
  create: async (payload: CriacaoCentroCusto): Promise<CentroCusto> => {
    const { data } = await contaAzulClient.post<CentroCusto>(
      '/v1/financeiro/centros-de-custo',
      payload
    );
    return data;
  },

  /**
   * Atualiza centro de custo por ID
   */
  update: async (id: string, payload: AtualizacaoCentroCusto): Promise<void> => {
    await contaAzulClient.patch(`/v1/financeiro/centros-de-custo/${id}`, payload);
  },
};

// ============================================================================
// CONTAS A RECEBER (Receitas)
// ============================================================================

export const contasReceber = {
  /**
   * Lista parcelas de contas a receber por período
   * 
   * @param params - Obrigatório: data_vencimento_de e data_vencimento_ate
   */
  list: async (
    params: ParcelaContasReceberPagarQueryParams
  ): Promise<ListaParcelasContasReceberPagar> => {
    const { data } = await contaAzulClient.get<ListaParcelasContasReceberPagar>(
      '/v1/financeiro/contas-a-receber',
      { params }
    );
    return data;
  },

  /**
   * Cria novo evento financeiro de receita (contas a receber)
   * 
   * @returns Evento criado com parcelas geradas
   */
  create: async (
    payload: CriacaoEventoFinanceiroContasReceber
  ): Promise<EventoFinanceiroCriado> => {
    const { data } = await contaAzulClient.post<EventoFinanceiroCriado>(
      '/v1/financeiro/contas-a-receber',
      payload
    );
    return data;
  },
};

// ============================================================================
// CONTAS A PAGAR (Despesas)
// ============================================================================

export const contasPagar = {
  /**
   * Lista parcelas de contas a pagar por período
   * 
   * @param params - Obrigatório: data_vencimento_de e data_vencimento_ate
   */
  list: async (
    params: ParcelaContasReceberPagarQueryParams
  ): Promise<ListaParcelasContasReceberPagar> => {
    const { data } = await contaAzulClient.get<ListaParcelasContasReceberPagar>(
      '/v1/financeiro/contas-a-pagar',
      { params }
    );
    return data;
  },

  /**
   * Cria novo evento financeiro de despesa (contas a pagar)
   * 
   * @returns Evento criado com parcelas geradas
   */
  create: async (
    payload: CriacaoEventoFinanceiroContasPagar
  ): Promise<EventoFinanceiroCriado> => {
    const { data } = await contaAzulClient.post<EventoFinanceiroCriado>(
      '/v1/financeiro/contas-a-pagar',
      payload
    );
    return data;
  },
};

// ============================================================================
// BAIXAS
// ============================================================================

export const baixas = {
  /**
   * Busca baixa por ID
   */
  getById: async (id: string): Promise<Baixa> => {
    const { data } = await contaAzulClient.get<Baixa>(`/v1/financeiro/baixas/${id}`);
    return data;
  },
};

// ============================================================================
// COBRANÇAS
// ============================================================================

export const cobrancas = {
  /**
   * Busca cobrança por ID
   */
  getById: async (id: string): Promise<Cobranca> => {
    const { data } = await contaAzulClient.get<Cobranca>(`/v1/financeiro/cobrancas/${id}`);
    return data;
  },

  /**
   * Cancela cobrança por ID
   */
  delete: async (id: string): Promise<void> => {
    await contaAzulClient.delete(`/v1/financeiro/cobrancas/${id}`);
  },
};

// ============================================================================
// CONTAS FINANCEIRAS
// ============================================================================

export const contasFinanceiras = {
  /**
   * Lista contas financeiras (bancos, cartões, etc)
   */
  list: async (params?: ContasFinanceirasQueryParams): Promise<ListaContasFinanceiras> => {
    const { data } = await contaAzulClient.get<ListaContasFinanceiras>(
      '/v1/financeiro/contas-financeiras',
      { params }
    );
    return data;
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const financeiro = {
  categorias,
  centrosCusto,
  contasReceber,
  contasPagar,
  baixas,
  cobrancas,
  contasFinanceiras,
};

export default financeiro;

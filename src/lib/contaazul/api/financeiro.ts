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
  CategoriasFinanceirasResponse,
  CategoriasFinanceirasQueryParams,
  CategoriaFinanceira,
  ListagemCentroCusto,
  CentrosCustoQueryParams,
  CriacaoCentroCusto,
  AtualizacaoCentroCusto,
  CentroCusto,
  CriacaoEventoFinanceiroContasReceber,
  CriacaoEventoFinanceiroContasPagar,
  EventoFinanceiroCriado,
  ListaParcelasContasReceberPagar,
  ParcelaContasReceberPagarQueryParams,
  Baixa,
  Cobranca,
  ListaContasFinanceiras,
  ContasFinanceirasQueryParams,
} from '../types/financeiro';

const validarPeriodoObrigatorio = (params: ParcelaContasReceberPagarQueryParams): void => {
  if (!params?.data_vencimento_de || !params?.data_vencimento_ate) {
    throw new Error('Os parâmetros data_vencimento_de e data_vencimento_ate são obrigatórios.');
  }
};

export const categorias = {
  list: async (params?: CategoriasFinanceirasQueryParams): Promise<CategoriasFinanceirasResponse> => {
    const { data } = await contaAzulClient.get<CategoriasFinanceirasResponse>(
      '/v1/categorias',
      { params }
    );
    return data;
  },

  getById: async (id: string): Promise<CategoriaFinanceira> => {
    const { data } = await contaAzulClient.get<CategoriaFinanceira>(`/v1/categorias/${id}`);
    return data;
  },
};

export const centrosCusto = {
  list: async (params?: CentrosCustoQueryParams): Promise<ListagemCentroCusto> => {
    const { data } = await contaAzulClient.get<ListagemCentroCusto>(
      '/v1/centro-de-custo',
      { params }
    );
    return data;
  },

  create: async (payload: CriacaoCentroCusto): Promise<CentroCusto> => {
    const { data } = await contaAzulClient.post<CentroCusto>('/v1/centro-de-custo', payload);
    return data;
  },

  update: async (id: string, payload: AtualizacaoCentroCusto): Promise<void> => {
    await contaAzulClient.patch(`/v1/centro-de-custo/${id}`, payload);
  },
};

export const contasReceber = {
  list: async (
    params: ParcelaContasReceberPagarQueryParams
  ): Promise<ListaParcelasContasReceberPagar> => {
    validarPeriodoObrigatorio(params);
    const { data } = await contaAzulClient.get<ListaParcelasContasReceberPagar>(
      '/v1/financeiro/eventos-financeiros/contas-a-receber/buscar',
      { params }
    );
    return data;
  },

  create: async (
    payload: CriacaoEventoFinanceiroContasReceber
  ): Promise<EventoFinanceiroCriado> => {
    const { data } = await contaAzulClient.post<EventoFinanceiroCriado>(
      '/v1/financeiro/eventos-financeiros/contas-a-receber',
      payload
    );
    return data;
  },
};

export const contasPagar = {
  list: async (
    params: ParcelaContasReceberPagarQueryParams
  ): Promise<ListaParcelasContasReceberPagar> => {
    validarPeriodoObrigatorio(params);
    const { data } = await contaAzulClient.get<ListaParcelasContasReceberPagar>(
      '/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar',
      { params }
    );
    return data;
  },

  create: async (
    payload: CriacaoEventoFinanceiroContasPagar
  ): Promise<EventoFinanceiroCriado> => {
    const { data } = await contaAzulClient.post<EventoFinanceiroCriado>(
      '/v1/financeiro/eventos-financeiros/contas-a-pagar',
      payload
    );
    return data;
  },
};

export const baixas = {
  getById: async (id: string): Promise<Baixa> => {
    const { data } = await contaAzulClient.get<Baixa>(
      `/v1/financeiro/eventos-financeiros/parcelas/baixa/${id}`
    );
    return data;
  },
};

export const cobrancas = {
  getById: async (id: string): Promise<Cobranca> => {
    const { data } = await contaAzulClient.get<Cobranca>(
      `/v1/financeiro/eventos-financeiros/contas-a-receber/cobranca/${id}`
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await contaAzulClient.delete(
      `/v1/financeiro/eventos-financeiros/contas-a-receber/cobranca/${id}`
    );
  },
};

export const contasFinanceiras = {
  list: async (params?: ContasFinanceirasQueryParams): Promise<ListaContasFinanceiras> => {
    const { data } = await contaAzulClient.get<ListaContasFinanceiras>('/v1/conta-financeira', {
      params,
    });
    return data;
  },
};

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

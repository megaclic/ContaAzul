/**
 * ContaAzul Integration - API Pessoas
 * 
 * Módulo completo para gerenciamento de pessoas:
 * - CRUD Pessoas (Clientes, Fornecedores, Transportadoras)
 * - Batch operations (ativar/inativar/excluir em lote)
 * - Empresa conectada
 */

import contaAzulClient from '../client';
import {
  // Pessoas
  ResumoPessoasResponse,
  Pessoa,
  CriarPessoa,
  AtualizarPessoa,
  AtualizacaoParcialPessoa,
  PessoasQueryParams,
  ResumoCriacaoPessoa,
  ResumoAtualizacaoPessoa,
  // Batch
  AtualizarStatusPessoasEmLote,
  ResultadoAtualizacaoStatusLote,
  DeletarPessoasEmLote,
  // Empresa
  Empresa,
} from '../../types/pessoas';

// ============================================================================
// PESSOAS - CRUD
// ============================================================================

export const pessoas = {
  /**
   * Lista pessoas com filtros avançados
   */
  list: async (params?: PessoasQueryParams): Promise<ResumoPessoasResponse> => {
    const { data } = await contaAzulClient.get<ResumoPessoasResponse>('/v1/pessoas', {
      params,
    });
    return data;
  },

  /**
   * Busca pessoa completa por ID (UUID)
   */
  getById: async (id: string): Promise<Pessoa> => {
    const { data } = await contaAzulClient.get<Pessoa>(`/v1/pessoas/${id}`);
    return data;
  },

  /**
   * Busca pessoa por ID legado (compatibilidade API v1)
   */
  getByLegacyId: async (legacyId: number): Promise<Pessoa> => {
    const { data } = await contaAzulClient.get<Pessoa>(`/v1/pessoas/legado/${legacyId}`);
    return data;
  },

  /**
   * Cria nova pessoa
   * 
   * @param payload - Dados da pessoa (cliente/fornecedor/transportadora)
   * @returns Pessoa criada com ID gerado
   */
  create: async (payload: CriarPessoa): Promise<ResumoCriacaoPessoa> => {
    const { data } = await contaAzulClient.post<ResumoCriacaoPessoa>('/v1/pessoas', payload);
    return data;
  },

  /**
   * Atualiza pessoa completa
   * 
   * @param id - ID da pessoa
   * @param payload - Dados completos da pessoa
   */
  update: async (id: string, payload: AtualizarPessoa): Promise<ResumoAtualizacaoPessoa> => {
    const { data } = await contaAzulClient.put<ResumoAtualizacaoPessoa>(
      `/v1/pessoas/${id}`,
      payload
    );
    return data;
  },

  /**
   * Atualiza pessoa parcialmente
   * 
   * @param id - ID da pessoa
   * @param payload - Campos a atualizar (apenas os fornecidos serão alterados)
   */
  partialUpdate: async (id: string, payload: AtualizacaoParcialPessoa): Promise<void> => {
    await contaAzulClient.patch(`/v1/pessoas/${id}`, payload);
  },
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const batch = {
  /**
   * Ativa pessoas em lote (máximo 10 por requisição)
   * 
   * @param uuids - Array de IDs das pessoas a ativar
   * @returns Resultado com IDs processados
   */
  ativar: async (
    uuids: string[]
  ): Promise<ResultadoAtualizacaoStatusLote[]> => {
    const payload: AtualizarStatusPessoasEmLote = { uuids };
    const { data } = await contaAzulClient.post<ResultadoAtualizacaoStatusLote[]>(
      '/v1/pessoas/ativar',
      payload
    );
    return data;
  },

  /**
   * Inativa pessoas em lote (máximo 10 por requisição)
   * 
   * @param uuids - Array de IDs das pessoas a inativar
   * @returns Resultado com IDs processados
   */
  inativar: async (
    uuids: string[]
  ): Promise<ResultadoAtualizacaoStatusLote[]> => {
    const payload: AtualizarStatusPessoasEmLote = { uuids };
    const { data } = await contaAzulClient.post<ResultadoAtualizacaoStatusLote[]>(
      '/v1/pessoas/inativar',
      payload
    );
    return data;
  },

  /**
   * Exclui pessoas em lote
   * 
   * @param uuids - Array de IDs das pessoas a excluir
   */
  excluir: async (uuids: string[]): Promise<void> => {
    const payload: DeletarPessoasEmLote = { uuids };
    await contaAzulClient.post('/v1/pessoas/excluir', payload);
  },
};

// ============================================================================
// EMPRESA CONECTADA
// ============================================================================

export const empresa = {
  /**
   * Retorna dados da empresa associada ao token OAuth
   * 
   * Útil para exibir razão social, CNPJ, etc da conta conectada
   */
  getContaConectada: async (): Promise<Empresa> => {
    const { data } = await contaAzulClient.get<Empresa>('/v1/pessoas/conta-conectada');
    return data;
  },
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const pessoasAPI = {
  pessoas,
  batch,
  empresa,
};

export default pessoasAPI;

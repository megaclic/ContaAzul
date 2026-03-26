/**
 * ContaAzul Integration - Pessoas Types
 * 
 * Types completos para o módulo Pessoas da API ContaAzul v2
 * Gerados a partir da OpenAPI 3.0 oficial
 * 
 * Módulos cobertos:
 * - CRUD Pessoas (Clientes, Fornecedores, Transportadoras)
 * - Endereços
 * - Inscrições Fiscais
 * - Contatos
 * - Batch Operations (ativar/inativar/excluir em lote)
 */

import { PaginatedResponse, Versionable } from './core';

// ============================================================================
// ENUMS
// ============================================================================

export enum TipoPessoa {
  FISICA = 'Física',
  JURIDICA = 'Jurídica',
  ESTRANGEIRA = 'Estrangeira',
}

export enum Perfil {
  CLIENTE = 'Cliente',
  FORNECEDOR = 'Fornecedor',
  TRANSPORTADORA = 'Transportadora',
}

export enum IndicadorInscricaoEstadual {
  NAO_CONTRIBUINTE = 'NAO CONTRIBUINTE',
  CONTRIBUINTE = 'CONTRIBUINTE',
  ISENTO = 'ISENTO',
}

export enum TipoOrdenacaoPessoa {
  NOME = 'NOME',
  EMAIL = 'EMAIL',
  DOCUMENTO = 'DOCUMENTO',
  ATIVO = 'ATIVO',
}

export enum OrdemOrdenacao {
  ASC = 'ASC',
  DESC = 'DESC',
}

// ============================================================================
// ENDEREÇO
// ============================================================================

export interface EnderecoPessoa {
  id?: string;
  id_cidade?: number;
  pais: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
}

export interface CriacaoEnderecoPessoa {
  pais?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
}

// ============================================================================
// INSCRIÇÕES FISCAIS
// ============================================================================

export interface InscricaoPessoa {
  id?: string;
  indicador_inscricao_estadual?: IndicadorInscricaoEstadual;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  inscricao_suframa?: string;
}

export interface CriacaoInscricaoPessoa {
  indicador_inscricao_estadual?: IndicadorInscricaoEstadual;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  inscricao_suframa?: string;
}

// ============================================================================
// CONTATOS
// ============================================================================

export interface OutroContatoPessoa {
  id?: string;
  nome: string;
  email?: string;
  telefone_comercial?: string;
  telefone_celular?: string;
  cargo?: string;
}

export interface CriacaoOutroContatoPessoa {
  nome: string;
  email?: string;
  telefone_comercial?: string;
  telefone_celular?: string;
  cargo?: string;
}

export interface ContatoCobrancaFaturamento {
  emails?: string[];
  whatsapp?: string;
}

// ============================================================================
// PERFIL DA PESSOA
// ============================================================================

export interface PerfilPessoa {
  id?: string;
  tipo_perfil: Perfil;
}

export interface CriacaoPerfilPessoa {
  tipo_perfil: Perfil;
}

// ============================================================================
// PESSOA LEGADA (compatibilidade API v1)
// ============================================================================

export interface PessoaLegada {
  id: number;
  uuid: string;
  perfil: string;
}

// ============================================================================
// LEMBRETES E MENSAGENS
// ============================================================================

export interface LembreteVencimento {
  id: string;
  ativo: boolean;
  email: string;
}

export interface MensagensPagamentosAbertos {
  numero: number;
  total: number;
}

// ============================================================================
// PESSOA COMPLETA
// ============================================================================

export interface Pessoa extends Versionable {
  id: string;
  codigo?: string;
  tipo_pessoa: string; // 'FISICA' | 'JURIDICA' | 'ESTRANGEIRA'
  nome: string;
  nome_empresa?: string;
  documento?: string; // CPF/CNPJ
  rg?: string;
  data_nascimento?: string; // YYYY-MM-DD
  email?: string;
  telefone_celular?: string;
  telefone_comercial?: string;
  ativo: boolean;
  orgao_publico?: boolean;
  optante_simples_nacional?: boolean;
  observacao?: string;
  criado_em?: string;
  data_alteracao?: string;
  perfis: Array<{ tipo_perfil: string }>;
  enderecos?: EnderecoPessoa[];
  inscricoes?: InscricaoPessoa[];
  outros_contatos?: OutroContatoPessoa[];
  contato_cobranca_faturamento?: ContatoCobrancaFaturamento;
  lembretes_vencimento?: LembreteVencimento[];
  mensagem_pagamentos_abertos?: MensagensPagamentosAbertos;
  pessoas_legado?: PessoaLegada[];
  // Campos financeiros
  atrasos_pagamentos?: number;
  atrasos_recebimentos?: number;
  pagamentos_mes_atual?: number;
  recebimentos_mes_atual?: number;
}

// ============================================================================
// CRIAÇÃO DE PESSOA
// ============================================================================

export interface CriarPessoa {
  nome: string;
  tipo_pessoa: TipoPessoa;
  codigo?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  data_nascimento?: string; // YYYY-MM-DD
  nome_fantasia?: string;
  email?: string;
  telefone_celular?: string;
  telefone_comercial?: string;
  ativo?: boolean;
  agencia_publica?: boolean;
  optante_simples?: boolean;
  observacao?: string;
  perfis?: CriacaoPerfilPessoa[];
  enderecos?: CriacaoEnderecoPessoa[];
  inscricoes?: CriacaoInscricaoPessoa[];
  outros_contatos?: CriacaoOutroContatoPessoa[];
  contato_cobranca_faturamento?: ContatoCobrancaFaturamento;
}

// ============================================================================
// ATUALIZAÇÃO DE PESSOA
// ============================================================================

export interface AtualizarPessoa {
  nome: string;
  tipo_pessoa: TipoPessoa;
  codigo: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  data_nascimento: string;
  nome_fantasia?: string;
  email: string;
  telefone_celular: string;
  telefone_comercial: string;
  ativo?: boolean;
  agencia_publica?: boolean;
  optante_simples?: boolean;
  observacao: string;
  perfis: Array<{ tipo_perfil: Perfil }>;
  enderecos: EnderecoPessoa[];
  inscricoes?: InscricaoPessoa[];
  outros_contatos: OutroContatoPessoa[];
  contato_cobranca_faturamento?: ContatoCobrancaFaturamento;
}

// ============================================================================
// ATUALIZAÇÃO PARCIAL DE PESSOA
// ============================================================================

export interface AtualizacaoParcialPessoa {
  nome?: string;
  tipo_pessoa?: TipoPessoa;
  codigo?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  data_nascimento?: string;
  nome_empresa?: string;
  email?: string;
  telefone_celular?: string;
  telefone_comercial?: string;
  ativo?: boolean;
  agencia_publica?: boolean;
  optante_simples_nacional?: boolean;
  observacao?: string;
  perfis?: Array<{ tipo_perfil: Perfil }>;
  enderecos?: Array<{
    id?: string;
    pais?: string;
    estado?: string;
    cidade?: string;
    bairro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    cep?: string;
  }>;
  inscricoes?: Array<{
    id?: string;
    indicador_inscricao_estadual?: IndicadorInscricaoEstadual;
    inscricao_estadual?: string;
    inscricao_municipal?: string;
    inscricao_suframa?: string;
  }>;
  contato_cobranca_faturamento?: ContatoCobrancaFaturamento;
}

// ============================================================================
// RESUMO DE PESSOA (listagem)
// ============================================================================

export interface ItemResumoPessoa {
  id: string;
  id_legado?: number;
  uuid_legado?: string;
  nome: string;
  tipo_pessoa: string;
  documento?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  perfis: string[]; // ['CLIENTE', 'FORNECEDOR', 'TRANSPORTADORA']
  observacoes_gerais?: string;
  endereco?: EnderecoPessoa;
  data_criacao?: string;
  data_alteracao?: string;
}

// ============================================================================
// QUERY PARAMS E LISTAGEM
// ============================================================================

export interface PessoasQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  tipo_ordenacao?: TipoOrdenacaoPessoa;
  ordem_ordenacao?: OrdemOrdenacao;
  busca?: string;
  ids?: string; // comma-separated
  documentos?: string; // comma-separated CPF/CNPJ
  paises?: string; // comma-separated
  cidades?: string; // comma-separated
  ufs?: string; // comma-separated (estados)
  codigos_pessoa?: string; // comma-separated
  emails?: string; // comma-separated
  tipos_pessoa?: TipoPessoa;
  nomes?: string; // comma-separated
  telefones?: string; // comma-separated
  data_criacao_inicio?: string; // YYYY-MM-DD
  data_criacao_fim?: string; // YYYY-MM-DD
  data_alteracao_de?: string; // ISO 8601
  data_alteracao_ate?: string; // ISO 8601
  tipo_perfil?: Perfil;
  com_endereco?: boolean;
}

export type ResumoPessoasResponse = PaginatedResponse<ItemResumoPessoa>;

// ============================================================================
// RESUMO DE CRIAÇÃO/ATUALIZAÇÃO
// ============================================================================

export interface ResumoCriacaoPessoa {
  id: string;
  nome: string;
  tipo_pessoa: string;
  codigo?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  data_nascimento?: string;
  nome_fantasia?: string;
  email?: string;
  telefone_celular?: string;
  telefone_comercial?: string;
  ativo: boolean;
  agencia_publica?: boolean;
  optante_simples?: boolean;
  estrangeiro?: boolean;
  observacao?: string;
  origem?: string;
  perfis: PerfilPessoa[];
  enderecos?: EnderecoPessoa[];
  inscricoes?: InscricaoPessoa[];
  outros_contatos?: OutroContatoPessoa[];
  contato_cobranca_faturamento?: ContatoCobrancaFaturamento;
}

export type ResumoAtualizacaoPessoa = ResumoCriacaoPessoa;

// ============================================================================
// BATCH OPERATIONS (ativar/inativar/excluir em lote)
// ============================================================================

export interface AtualizarStatusPessoasEmLote {
  uuids: string[]; // max 10
}

export interface ResultadoAtualizacaoStatusLote {
  todos: string[];
  ativos: string[];
  inativos: string[];
}

export interface DeletarPessoasEmLote {
  uuids: string[];
}

// ============================================================================
// EMPRESA (conta conectada)
// ============================================================================

export interface Empresa {
  razao_social: string;
  nome_fantasia: string;
  documento: string; // CNPJ
  email: string;
  data_fundacao?: string; // YYYY-MM-DD
}

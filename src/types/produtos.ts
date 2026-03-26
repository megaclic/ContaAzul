/**
 * ContaAzul Integration - Produtos Types
 * 
 * Types completos para o módulo Produtos (Inventário) da API ContaAzul v2
 * Gerados a partir da OpenAPI 3.0 oficial
 * 
 * Módulos cobertos:
 * - CRUD Produtos
 * - Categorias
 * - NCM (Nomenclatura Comum do Mercosul)
 * - CEST (Código Especificador da Substituição Tributária)
 * - Unidades de Medida
 * - Variações de Produtos
 * - Kits de Produtos
 * - E-commerce (marcas, categorias)
 */

import { PaginatedResponse, Versionable } from './core';

// ============================================================================
// ENUMS
// ============================================================================

export enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export enum FormatoProduto {
  SIMPLES = 'SIMPLES',
  VARIACAO = 'VARIACAO',
}

export enum TipoProduto {
  MERCADORIA_PARA_REVENDA = 'MERCADORIA_PARA_REVENDA',
  MATERIA_PRIMA = 'MATERIA_PRIMA',
  EMBALAGEM = 'EMBALAGEM',
  PRODUTO_EM_PROCESSO = 'PRODUTO_EM_PROCESSO',
  PRODUTO_ACABADO = 'PRODUTO_ACABADO',
  SUBPRODUTO = 'SUBPRODUTO',
  PRODUTO_INTERMEDIARIO = 'PRODUTO_INTERMEDIARIO',
  MATERIAL_DE_USO_E_CONSUMO = 'MATERIAL_DE_USO_E_CONSUMO',
  ATIVO_IMOBILIZADO = 'ATIVO_IMOBILIZADO',
  SERVICOS = 'SERVICOS',
  OUTROS_INSUMOS = 'OUTROS_INSUMOS',
  OUTRAS = 'OUTRAS',
}

export enum OrigemProduto {
  NACIONAL = 'NACIONAL',
  ESTRANGEIRA_IMPORTACAO_DIRETA = 'ESTRANGEIRA_IMPORTACAO_DIRETA',
  ESTRANGEIRA_ADQUIRIDA_INTERNAMENTE = 'ESTRANGEIRA_ADQUIRIDA_INTERNAMENTE',
  NACIONAL_IMPORTACAO_SUPERIOR_40 = 'NACIONAL_IMPORTACAO_SUPERIOR_40',
  NACIONAL_PRODUCAO_CONFORMIDADE = 'NACIONAL_PRODUCAO_CONFORMIDADE',
  NACIONAL_IMPORTACAO_INFERIOR_40 = 'NACIONAL_IMPORTACAO_INFERIOR_40',
  ESTRANGEIRA_IMPORTACAO_DIRETA_CAMEX = 'ESTRANGEIRA_IMPORTACAO_DIRETA_CAMEX',
  ESTRANGEIRA_ADQUIRIDA_INTERNAMENTE_CAMEX = 'ESTRANGEIRA_ADQUIRIDA_INTERNAMENTE_CAMEX',
  NACIONAL_MERCDORIA_BEM_IMPORTACAO_SUPERIOR_70 = 'NACIONAL_MERCDORIA_BEM_IMPORTACAO_SUPERIOR_70',
}

export enum CondicaoProdutoEcommerce {
  NOVO = 'NOVO',
  USADO = 'USADO',
}

export enum CampoOrdenacaoProduto {
  NOME = 'NOME',
  CODIGO = 'CODIGO',
  VALOR_VENDA = 'VALOR_VENDA',
}

export enum DirecaoOrdenacao {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum NivelEstoqueProduto {
  MINIMO = 'MINIMO',
  MAXIMO = 'MAXIMO',
  PADRAO = 'PADRAO',
}

// ============================================================================
// UNIDADES DE MEDIDA
// ============================================================================

export interface UnidadeMedida {
  id: number;
  descricao: string;
  abreviacao: string;
  em_uso: boolean;
}

export type UnidadesMedidaResponse = PaginatedResponse<UnidadeMedida>;

// ============================================================================
// NCM (Nomenclatura Comum do Mercosul)
// ============================================================================

export interface NCM {
  id: number;
  codigo: string;
  descricao: string;
}

export type NCMsResponse = PaginatedResponse<NCM>;

// ============================================================================
// CEST (Código Especificador da Substituição Tributária)
// ============================================================================

export interface CEST {
  id: number;
  codigo: string;
  descricao: string;
}

export type CESTsResponse = PaginatedResponse<CEST>;

// ============================================================================
// CATEGORIAS DE PRODUTOS
// ============================================================================

export interface CategoriaProduto {
  id: number;
  uuid: string;
  descricao: string;
}

export type CategoriasResponse = PaginatedResponse<CategoriaProduto>;

// ============================================================================
// E-COMMERCE - CATEGORIAS
// ============================================================================

export interface CategoriaEcommerce {
  id: string;
  descricao: string;
  subcategorias?: CategoriaEcommerce[];
}

export interface CategoriaEcommerceResponse {
  id: string;
  versao: number;
  items: CategoriaEcommerce[];
}

// ============================================================================
// E-COMMERCE - MARCAS
// ============================================================================

export interface MarcaEcommerce {
  id: string;
  nome: string;
}

export type MarcasEcommerceResponse = PaginatedResponse<MarcaEcommerce>;

// ============================================================================
// INFORMAÇÕES FISCAIS DO PRODUTO
// ============================================================================

export interface FiscalNCM {
  id: number;
  codigo: string;
  descricao: string;
}

export interface FiscalCEST {
  id: number;
  codigo: string;
  descricao: string;
}

export interface FiscalUnidadeMedida {
  id: number;
  descricao: string;
}

export interface FiscalProduto {
  tipo_produto?: TipoProduto;
  origem?: OrigemProduto;
  ncm?: FiscalNCM;
  cest?: FiscalCEST;
  unidade_medida?: FiscalUnidadeMedida;
}

export interface CriacaoFiscalProduto {
  tipo_produto?: TipoProduto;
  origem?: OrigemProduto;
  ncm?: { id: number };
  cest?: { id: number };
  unidade_medida?: { id: number };
}

// ============================================================================
// ESTOQUE DO PRODUTO
// ============================================================================

export interface EstoqueProduto {
  quantidade_disponivel?: number;
  quantidade_reservada?: number;
  quantidade_total?: number;
  minimumStock?: number;
  maximumStock?: number;
  custo_medio?: number;
  valor_venda?: number;
}

export interface CriacaoEstoqueProduto {
  estoque_disponivel?: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  custo_medio?: number;
  valor_venda?: number;
}

// ============================================================================
// DIMENSÕES E PESOS
// ============================================================================

export interface DimensoesProduto {
  peso_liquido?: number; // kg
  peso_bruto?: number; // kg
  largura?: number; // cm
  altura?: number; // cm
  profundidade?: number; // cm
  volumes?: number;
}

export interface CriacaoDimensoesProduto {
  peso_liquido?: number;
  peso_bruto?: number;
  largura?: number;
  altura?: number;
  profundidade?: number;
  volumes?: number;
}

// ============================================================================
// E-COMMERCE DO PRODUTO
// ============================================================================

export interface MarcaEcommerceProduto {
  id: string;
  nome: string;
}

export interface CategoriaEcommerceProduto {
  id: string;
  descricao: string;
}

export interface EcommerceProduto {
  integracao_ativa?: boolean;
  condicao?: CondicaoProdutoEcommerce;
  marca?: MarcaEcommerceProduto;
  categoria_ecommerce?: CategoriaEcommerceProduto;
  titulo_seo?: string;
  descricao_seo?: string;
  url_seo?: string;
  descricao_adicional?: string;
}

export interface CriacaoEcommerceProduto {
  integracao_ativa?: boolean;
  condicao?: CondicaoProdutoEcommerce;
  marca?: { id: string };
  categoria_ecommerce?: { id: string };
  titulo_seo?: string;
  descricao_seo?: string;
  url_seo?: string;
  descricao_adicional?: string;
}

// ============================================================================
// CONVERSÃO DE UNIDADE DE MEDIDA
// ============================================================================

export interface UnidadeMedidaConversao {
  id: number;
  descricao: string;
}

export interface ConversaoUnidadeMedida {
  id_unidade_conversao: string;
  unidade_medida: UnidadeMedidaConversao;
  fator: number;
  id_fornecedor?: string[];
}

export interface CriacaoConversaoUnidadeMedida {
  unidade_medida: { id: number };
  fator: number;
  id_fornecedor?: string[];
}

// ============================================================================
// VARIAÇÕES DE PRODUTO
// ============================================================================

export interface OpcaoVariacao {
  id: string;
  descricao: string;
}

export interface TipoVariacao {
  id: string;
  descricao: string;
  opcoes: OpcaoVariacao[];
}

export interface ProdutoVariacao extends Versionable {
  id: string;
  nome: string;
  codigo_sku: string;
  codigo_ean: string;
  saldo: number;
  valor_venda: number;
  opcoes: OpcaoVariacao[];
  relacionado_manualmente?: boolean;
  movido?: boolean;
}

export interface VariacaoProduto {
  tipos: TipoVariacao[];
  produtos: ProdutoVariacao[];
}

export interface CriacaoTipoVariacao {
  descricao: string;
  opcoes: Array<{
    id: string;
    descricao: string;
  }>;
}

export interface CriacaoProdutoVariacao {
  nome: string;
  codigo_sku: string;
  codigo_ean: string;
  saldo: number;
  valor_venda: number;
  opcoes: Array<{ id: string }>;
}

export interface CriacaoVariacaoProduto {
  tipos: CriacaoTipoVariacao[];
  produtos: CriacaoProdutoVariacao[];
}

// ============================================================================
// KIT DE PRODUTOS
// ============================================================================

export interface ItemKitProduto extends Versionable {
  id_item: string;
  id_produto: string;
  codigo: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  costCenterId?: string;
}

export interface DetalheKitProduto {
  valor_venda_kit: number;
  items: ItemKitProduto[];
}

export interface CriacaoItemDetalheKit {
  id_produto: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface CriacaoDetalheKit {
  valor_venda: number;
  itens: CriacaoItemDetalheKit[];
}

// ============================================================================
// IMAGENS DO PRODUTO
// ============================================================================

export interface ImagemProduto {
  id: string;
  nome: string;
  descricao?: string;
  url_imagem: string;
  tamanho: number; // bytes
}

// ============================================================================
// PRODUTO COMPLETO
// ============================================================================

export interface Produto extends Versionable {
  id: string;
  id_legado?: number;
  nome: string;
  codigo_sku?: string;
  codigo_ean?: string;
  descricao?: string;
  status: StatusProduto;
  ativo: boolean;
  formato: FormatoProduto;
  categoria?: {
    id: number;
    uuid: string;
    descricao: string;
  };
  id_centro_custo?: string;
  unidade_medida?: FiscalUnidadeMedida;
  fiscal?: FiscalProduto;
  estoque?: EstoqueProduto;
  pesos_dimensoes?: DimensoesProduto;
  ecommerce?: EcommerceProduto;
  conversao_unidade_medida?: ConversaoUnidadeMedida[];
  variacao?: VariacaoProduto;
  detalhe_kit?: DetalheKitProduto;
  imagens?: ImagemProduto[];
  ultima_atualizacao: string; // ISO 8601
}

// ============================================================================
// CRIAÇÃO DE PRODUTO
// ============================================================================

export interface CriacaoProduto {
  nome: string;
  tipo_pessoa?: 'Física' | 'Jurídica' | 'Estrangeira';
  codigo_sku?: string;
  codigo_ean?: string;
  descricao?: string;
  status?: StatusProduto;
  ativo?: boolean;
  formato?: FormatoProduto;
  categoria?: { id: number };
  id_centro_custo?: string;
  unidade_medida?: { id: number };
  fiscal?: CriacaoFiscalProduto;
  estoque?: CriacaoEstoqueProduto;
  pesos_dimensoes?: CriacaoDimensoesProduto;
  ecommerce?: CriacaoEcommerceProduto;
  conversoes_unidade_medida?: CriacaoConversaoUnidadeMedida[];
  variacao?: CriacaoVariacaoProduto;
  detalhe_kit?: CriacaoDetalheKit;
}

// ============================================================================
// ATUALIZAÇÃO PARCIAL DE PRODUTO
// ============================================================================

export interface AtualizacaoParcialProduto {
  nome?: string;
  codigo_sku?: string;
  codigo_ean?: string;
  valor_venda?: number;
  peso_liquido?: number;
  peso_bruto?: number;
  unidade_medida?: number;
  ncm?: number;
  cest?: number;
}

// ============================================================================
// QUERY PARAMS E LISTAGEM
// ============================================================================

export interface ProdutosQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  campo_ordenacao?: CampoOrdenacaoProduto;
  direcao_ordenacao?: DirecaoOrdenacao;
  busca?: string;
  status?: StatusProduto;
  integracao_ecommerce_ativo?: boolean;
  produtos_kit_ativo?: boolean;
  valor_venda_inicial?: number;
  valor_venda_final?: number;
  sku?: string;
  data_alteracao_de?: string; // ISO 8601
  data_alteracao_ate?: string; // ISO 8601
}

export interface ProdutoNaVariacao {
  id: string;
  id_legado?: number;
  id_produto_pai_variacao: string;
  codigo: string;
  ean: string;
  nome: string;
  tipo: 'PRODUTO' | 'KIT_PRODUTO' | 'VARIACAO_PRODUTO';
  status: StatusProduto;
  saldo: number;
  valor_venda: number;
  custo_medio: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  nivel_estoque: NivelEstoqueProduto;
  integracao_ecommerce_ativada: boolean;
  movido: boolean;
  aggregationCount: number;
}

export interface ItemResumoProdutos {
  id: string;
  id_legado?: number;
  nome: string;
  codigo: string;
  ean: string;
  tipo: string;
  status: StatusProduto;
  saldo: number;
  valor_venda: number;
  custo_medio: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  nivel_estoque: NivelEstoqueProduto;
  integracao_ecommerce_ativada: boolean;
  movido: boolean;
  contagem_agregacao: number;
  ultima_atualizacao: string;
  produtos_variacao?: ProdutoNaVariacao[];
}

export type ResumoProdutosResponse = PaginatedResponse<ItemResumoProdutos>;

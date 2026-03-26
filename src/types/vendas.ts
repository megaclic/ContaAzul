/**
 * ContaAzul Integration - Vendas Types
 * 
 * Types completos para o módulo Vendas da API ContaAzul v2
 * Gerados a partir da OpenAPI 3.0 oficial
 * 
 * Módulos cobertos:
 * - CRUD Vendas (criar, listar, atualizar, buscar, deletar)
 * - Itens de Venda (produtos, kits)
 * - Condições de Pagamento
 * - Vendedores
 * - PDF de Vendas
 */

import { PaginatedResponse, Versionable } from './core';

// ============================================================================
// ENUMS
// ============================================================================

export enum SituacaoVenda {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  APROVADO = 'APROVADO',
  FATURADO = 'FATURADO',
  CANCELADO = 'CANCELADO',
  ORCAMENTO = 'ORCAMENTO',
  ORCAMENTO_ACEITO = 'ORCAMENTO_ACEITO',
  ORCAMENTO_RECUSADO = 'ORCAMENTO_RECUSADO',
  CONTRATO = 'CONTRATO',
  VENDA = 'VENDA',
}

export enum TipoPagamentoVenda {
  BOLETO_BANCARIO = 'BOLETO_BANCARIO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  CARTEIRA_DIGITAL = 'CARTEIRA_DIGITAL',
  CASHBACK = 'CASHBACK',
  CHEQUE = 'CHEQUE',
  CREDITO_LOJA = 'CREDITO_LOJA',
  CREDITO_VIRTUAL = 'CREDITO_VIRTUAL',
  DEPOSITO_BANCARIO = 'DEPOSITO_BANCARIO',
  DINHEIRO = 'DINHEIRO',
  OUTRO = 'OUTRO',
  DEBITO_AUTOMATICO = 'DEBITO_AUTOMATICO',
  CARTAO_CREDITO_VIA_LINK = 'CARTAO_CREDITO_VIA_LINK',
  PIX_PAGAMENTO_INSTANTANEO = 'PIX_PAGAMENTO_INSTANTANEO',
  PIX_COBRANCA = 'PIX_COBRANCA',
  PROGRAMA_FIDELIDADE = 'PROGRAMA_FIDELIDADE',
  SEM_PAGAMENTO = 'SEM_PAGAMENTO',
  TRANSFERENCIA_BANCARIA = 'TRANSFERENCIA_BANCARIA',
  VALE_ALIMENTACAO = 'VALE_ALIMENTACAO',
  VALE_COMBUSTIVEL = 'VALE_COMBUSTIVEL',
  VALE_PRESENTE = 'VALE_PRESENTE',
  VALE_REFEICAO = 'VALE_REFEICAO',
}

export enum TipoDesconto {
  PORCENTAGEM = 'PORCENTAGEM',
  VALOR = 'VALOR',
}

export enum CampoOrdenacaoVenda {
  NUMERO = 'NUMERO',
  CLIENTE = 'CLIENTE',
  DATA = 'DATA',
}

export enum StatusEmail {
  ENVIADO = 'ENVIADO',
  LIDO = 'LIDO',
}

// ============================================================================
// ITENS DE VENDA
// ============================================================================

export interface ItemKitVenda {
  id_produto: string;
  id_kit: string;
  quantidade: number;
  valor: number;
}

export interface ItemVenda {
  id: string;
  descricao?: string;
  quantidade: number;
  valor: number;
  valor_custo?: number;
  itens_kit?: ItemKitVenda[];
}

export interface CriacaoItemVenda {
  id: string;
  descricao?: string;
  quantidade: number;
  valor: number;
  valor_custo?: number;
  itens_kit?: ItemKitVenda[];
}

// ============================================================================
// CONDIÇÃO DE PAGAMENTO
// ============================================================================

export interface ParcelaVenda {
  numero?: number;
  data_vencimento: string; // YYYY-MM-DD
  valor: number;
  descricao?: string;
}

export interface CondicaoPagamentoVenda {
  id_legado?: number;
  tipo_pagamento?: TipoPagamentoVenda;
  id_conta_financeira?: string;
  opcao_condicao_pagamento: string; // Ex: "À vista", "30, 60, 90", "3x"
  parcelas: ParcelaVenda[];
  observacoes_pagamento?: string;
  nsu?: string;
  troco_total?: number;
}

export interface CriacaoCondicaoPagamentoVenda {
  tipo_pagamento?: TipoPagamentoVenda;
  id_conta_financeira?: string;
  opcao_condicao_pagamento: string;
  parcelas: Omit<ParcelaVenda, 'numero'>[];
  nsu?: string;
}

// ============================================================================
// COMPOSIÇÃO DE VALOR
// ============================================================================

export interface DescontoVenda {
  tipo: TipoDesconto;
  valor: number;
}

export interface ComposicaoValorVenda {
  valor_bruto?: number;
  desconto?: DescontoVenda;
  frete?: number;
  valor_liquido?: number;
}

export interface CriacaoComposicaoValorVenda {
  frete?: number;
  desconto?: DescontoVenda;
}

// ============================================================================
// SITUAÇÃO E PENDÊNCIA
// ============================================================================

export interface SituacaoVendaObj {
  nome: string;
  descricao: string;
  ativado?: boolean;
}

export interface PendenciaVenda {
  nome: string;
  descricao: string;
}

// ============================================================================
// VENDEDOR
// ============================================================================

export interface Vendedor {
  id: string;
  nome: string;
  id_legado?: number;
}

// ============================================================================
// STATUS EMAIL
// ============================================================================

export interface StatusEmailVenda {
  status: StatusEmail;
  enviado_em?: string;
}

// ============================================================================
// CLIENTE (resumo na venda)
// ============================================================================

export interface ClienteVenda {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
}

// ============================================================================
// VENDA COMPLETA
// ============================================================================

export interface Venda extends Versionable {
  id: string;
  id_legado?: number;
  id_cliente: string;
  numero: number;
  origem?: string;
  id_categoria?: string;
  data_venda: string;
  criado_em?: string;
  data_alteracao?: string;
  situacao?: SituacaoVendaObj;
  pendencia?: PendenciaVenda;
  valor_composicao?: ComposicaoValorVenda;
  condicao_pagamento?: CondicaoPagamentoVenda;
  observacoes?: string;
  id_vendedor?: string;
  id_contrato?: string;
  id_centro_custo?: string;
  tipo?: string;
  itens?: string;
}

// ============================================================================
// CRIAÇÃO DE VENDA
// ============================================================================

export interface CriarVenda {
  id_cliente: string;
  numero: number;
  situacao: SituacaoVenda;
  data_venda: string; // YYYY-MM-DD
  id_categoria?: string;
  id_centro_custo?: string;
  id_vendedor?: string;
  observacoes?: string;
  observacoes_pagamento?: string;
  itens: CriacaoItemVenda[];
  composicao_de_valor?: CriacaoComposicaoValorVenda;
  condicao_pagamento: CriacaoCondicaoPagamentoVenda;
}

// ============================================================================
// ATUALIZAÇÃO DE VENDA
// ============================================================================

export interface AtualizarVenda extends CriarVenda {
  versao: number;
}

// ============================================================================
// QUERY PARAMS - BUSCA DE VENDAS
// ============================================================================

export interface VendasQueryParams {
  pagina?: number;
  tamanho_pagina?: 10 | 20 | 50 | 100 | 200 | 500 | 1000;
  campo_ordenado_ascendente?: CampoOrdenacaoVenda;
  campo_ordenado_descendente?: CampoOrdenacaoVenda;
  termo_busca?: string; // nome, email cliente ou número venda
  data_inicio?: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
  data_criacao_de?: string; // YYYY-MM-DD
  data_criacao_ate?: string; // YYYY-MM-DD
  data_alteracao_de?: string; // ISO 8601
  data_alteracao_ate?: string; // ISO 8601
  ids_vendedores?: string[];
  ids_clientes?: string[];
  ids_natureza_operacao?: string[];
  situacoes?: SituacaoVenda[];
  tipos?: string[];
  origens?: string[];
  numeros?: number[];
  ids_categorias?: string[];
  ids_produtos?: string[];
  pendente?: boolean;
  totais?: 'WAITING_APPROVED' | 'APPROVED' | 'CANCELED' | 'ALL';
  ids_legado_donos?: number[];
  ids_legado_clientes?: number[];
  ids_legado_produtos?: number[];
  ids_legado_categorias?: number[];
}

// ============================================================================
// RESUMO DE VENDA (na listagem)
// ============================================================================

export interface ItemResumoVenda {
  id: string;
  id_legado?: number;
  numero: number;
  data: string;
  criado_em?: string;
  data_alteracao?: string;
  tipo: string;
  itens: string;
  condicao_pagamento: boolean;
  total: number;
  cliente: ClienteVenda;
  situacao: SituacaoVendaObj;
  versao: number;
  status_email?: StatusEmailVenda;
  id_contrato?: string;
  origem?: string;
}

export interface TotaisVendas {
  total: number;
  aprovado: number;
  cancelado: number;
  esperando_aprovacao: number;
}

export interface QuantidadesVendas {
  total: number;
  aprovado: number;
  cancelado: number;
  esperando_aprovacao: number;
}

export interface RespostaVendasBusca extends PaginatedResponse<ItemResumoVenda> {
  totais: TotaisVendas;
  quantidades: QuantidadesVendas;
}

// ============================================================================
// DELETAR EM LOTE
// ============================================================================

export interface DeletarVendasEmLote {
  ids: string[]; // array de IDs de vendas
}

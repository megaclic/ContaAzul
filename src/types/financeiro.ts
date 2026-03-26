/**
 * ContaAzul Integration - Financeiro Types
 * 
 * Types completos para o módulo Financeiro da API ContaAzul v2
 * Gerados a partir da OpenAPI 3.0 oficial
 * 
 * Módulos cobertos:
 * - Categorias Financeiras
 * - Centros de Custo
 * - Contas a Pagar/Receber
 * - Baixas
 * - Cobranças
 * - Contas Financeiras
 */

import { PaginatedResponse, Versionable } from './core';

// ============================================================================
// ENUMS
// ============================================================================

export enum TipoCategoriaFinanceira {
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
}

export enum StatusCentroCusto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  TODOS = 'TODOS',
}

export enum CampoOrdenacaoCentroCusto {
  NOME = 'NOME',
  CODIGO = 'CODIGO',
}

export enum BankInstitution {
  BANCO_BRASIL = 'BANCO_DO_BRASIL',
  BRADESCO = 'BRADESCO',
  CAIXA_ECONOMICA = 'CAIXA_ECONOMICA',
  HSBC = 'HSBC',
  ITAU = 'ITAU',
  INTER = 'INTER',
  ORIGINAL = 'ORIGINAL',
  SANTANDER = 'SANTANDER',
  BANCOOB = 'BANCOOB',
  NUBANK = 'NUBANK',
  C6 = 'C6',
  NEON = 'NEON',
  STONE = 'STONE',
  PIX = 'PIX',
  OUTROS = 'OUTROS',
}

export enum FinancialAccountType {
  APLICACAO = 'APLICACAO',
  CAIXINHA = 'CAIXINHA',
  CONTA_CORRENTE = 'CONTA_CORRENTE',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  INVESTIMENTO = 'INVESTIMENTO',
  OUTROS = 'OUTROS',
  MEIOS_RECEBIMENTO = 'MEIOS_RECEBIMENTO',
  POUPANCA = 'POUPANCA',
  COBRANCAS_CONTA_AZUL = 'COBRANCAS_CONTA_AZUL',
  RECEBA_FACIL_CARTAO = 'RECEBA_FACIL_CARTAO',
}

export enum InstallmentPaymentMethod {
  BOLETO_BANCARIO = 'BOLETO_BANCARIO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  DINHEIRO = 'DINHEIRO',
  CHEQUE = 'CHEQUE',
  TRANSFERENCIA_BANCARIA = 'TRANSFERENCIA_BANCARIA',
  OUTROS = 'OUTROS',
  CARTEIRA_DIGITAL = 'CARTEIRA_DIGITAL',
  PIX = 'PIX',
  DEBITO_AUTOMATICO = 'DEBITO_AUTOMATICO',
  LINK_PAGAMENTO = 'LINK_PAGAMENTO',
  DEPOSITO_BANCARIO = 'DEPOSITO_BANCARIO',
  SEM_PAGAMENTO = 'SEM_PAGAMENTO',
}

export enum InstallmentStatus {
  EM_ABERTO = 'EM_ABERTO',
  RECEBIDO = 'RECEBIDO',
  RECEBIDO_PARCIAL = 'RECEBIDO_PARCIAL',
  CANCELADO = 'CANCELADO',
}

export enum InstallmentOrigin {
  VENDA = 'VENDA',
  LANCAMENTO_FINANCEIRO = 'LANCAMENTO_FINANCEIRO',
  CONTRATO = 'CONTRATO',
  RENEGOCIACAO = 'RENEGOCIACAO',
  DAS = 'DAS',
  FOLHA = 'FOLHA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  SALDO_CONTA_BANCARIA = 'SALDO_CONTA_BANCARIA',
  COMPRA = 'COMPRA',
  COMPRA_AGENDADA = 'COMPRA_AGENDADA',
  IMPORTACAO_DOCUMENTO = 'IMPORTACAO_DOCUMENTO',
  IMPOSTO_RETIDO = 'IMPOSTO_RETIDO',
  NOTA_COMPRA = 'NOTA_COMPRA',
  ANTECIPACAO = 'ANTECIPACAO',
  HONORARIOS_CONTABEIS = 'HONORARIOS_CONTABEIS',
  SIC = 'SIC',
}

export enum ChargeRequestStatus {
  AGUARDANDO_CONFIRMACAO = 'AGUARDANDO_CONFIRMACAO',
  EM_CANCELAMENTO = 'EM_CANCELAMENTO',
  REGISTRADO = 'REGISTRADO',
  QUITADO = 'QUITADO',
  CANCELADO = 'CANCELADO',
  INVALIDO = 'INVALIDO',
  EXPIRADO = 'EXPIRADO',
  FALHA_EMISSAO = 'FALHA_EMISSAO',
  FALHA_CANCELAR = 'FALHA_CANCELAR',
  PAGO = 'PAGO',
  EXTORNADO = 'EXTORNADO',
}

export enum ChargeRequestType {
  BOLETO = 'BOLETO',
  LINK_PAGAMENTO = 'LINK_PAGAMENTO',
  BOLETO_REGISTRADO = 'BOLETO_REGISTRADO',
  PIX_COBRANCA = 'PIX_COBRANCA',
}

// ============================================================================
// COMPOSIÇÃO DE VALOR (usado em múltiplos contextos)
// ============================================================================

export interface ComposicaoValor {
  valor_bruto: number;
  desconto?: number;
  juros?: number;
  multa?: number;
  taxa?: number;
}

export interface ComposicaoValorCompleta extends ComposicaoValor {
  valor_liquido: number;
}

// ============================================================================
// CATEGORIAS FINANCEIRAS
// ============================================================================

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: TipoCategoriaFinanceira;
  categoria_pai?: string;
  considera_custo_dre?: boolean;
  entrada_dre?: string;
  versao: number;
}

export interface CategoriasFinanceirasQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  apenas_filhos?: boolean;
  permite_apenas_filhos?: boolean;
  tipo?: TipoCategoriaFinanceira;
  nome?: string;
}

export type CategoriasFinanceirasResponse = PaginatedResponse<CategoriaFinanceira>;

// ============================================================================
// CENTROS DE CUSTO
// ============================================================================

export interface CentroCusto {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  versao?: number;
}

export interface CriacaoCentroCusto {
  nome: string;
  codigo?: string;
}

export interface AtualizacaoCentroCusto {
  nome?: string;
  ativo?: boolean;
  versao: number;
}

export interface CentroCustoTotais {
  ativos: number;
  inativos: number;
  todos: number;
}

export interface ListagemCentroCusto extends PaginatedResponse<CentroCusto> {
  totais: CentroCustoTotais;
}

export interface CentrosCustoQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  campo_ordenado_ascendente?: CampoOrdenacaoCentroCusto;
  campo_ordenado_descendente?: CampoOrdenacaoCentroCusto;
  busca_textual?: string;
  status?: StatusCentroCusto;
}

// ============================================================================
// RATEIO (usado em eventos financeiros)
// ============================================================================

export interface RateioCentroCusto {
  id_centro_custo?: string;
  valor: number;
}

export interface Rateio {
  id_categoria: string;
  valor: number;
  rateio_centro_custo?: RateioCentroCusto[];
}

// ============================================================================
// PARCELAS E CONDIÇÃO DE PAGAMENTO
// ============================================================================

export interface Parcela {
  conta_financeira: string;
  data_vencimento: string; // YYYY-MM-DD
  descricao: string;
  detalhe_valor: ComposicaoValor;
  metodo_pagamento?: InstallmentPaymentMethod;
  nota?: string;
}

export interface CondicaoPagamento {
  parcelas: Parcela[];
}

// ============================================================================
// EVENTOS FINANCEIROS (Contas a Pagar/Receber)
// ============================================================================

export interface CriacaoEventoFinanceiroContasReceber {
  valor: number;
  data_competencia: string; // YYYY-MM-DD
  descricao: string;
  id_cliente: string;
  conta_financeira: string;
  rateio: Rateio[];
  condicao_pagamento: CondicaoPagamento;
  observacao?: string;
  referencia_externa?: string;
}

export interface CriacaoEventoFinanceiroContasPagar {
  valor: number;
  data_competencia: string; // YYYY-MM-DD
  descricao: string;
  id_fornecedor: string;
  conta_financeira: string;
  rateio: Rateio[];
  condicao_pagamento: CondicaoPagamento;
  observacao?: string;
  referencia_externa?: string;
}

export interface EventoFinanceiroCriadoReferencia {
  id: string;
  origem: InstallmentOrigin;
  revisao: number;
}

export interface EventoFinanceiroCriadoParcelaEvento {
  id: string;
  agendado: boolean;
  data_competencia: string;
  tipo: TipoCategoriaFinanceira;
  referencia: EventoFinanceiroCriadoReferencia;
}

export interface EventoFinanceiroCriadoParcela extends Versionable {
  id: string;
  indice: number;
  agendado: boolean;
  conciliado: boolean;
  status: InstallmentStatus;
  data_vencimento: string;
  data_pagamento_esperado: string;
  descricao: string;
  nota?: string;
  nsu?: string;
  metodo_pagamento: InstallmentPaymentMethod;
  composicao_valor: ComposicaoValorCompleta;
  valor_liquido: number;
  pago: number;
  pendente: number;
  conta_financeira: {
    id: string;
  };
  evento: EventoFinanceiroCriadoParcelaEvento;
}

export interface EventoFinanceiroCriadoCondicaoPagamento {
  quantidade_parcelas: number;
  parcelas: EventoFinanceiroCriadoParcela[];
}

export interface RateioCategoriaEventoFinanceiro {
  id_categoria: string;
  valor: number;
  rateio_centros_custo?: RateioCentroCusto[];
}

export interface EventoFinanceiroCriado extends Versionable {
  id: string;
  tipo: TipoCategoriaFinanceira;
  agendado: boolean;
  valor: number;
  data_competencia: string;
  descricao: string;
  observacao?: string;
  referencia_externa?: string;
  id_cliente?: string;
  id_fornecedor?: string;
  id_recorrencia?: string;
  indice_recorrencia?: number;
  rateio: RateioCategoriaEventoFinanceiro[];
  condicao_pagamento: EventoFinanceiroCriadoCondicaoPagamento;
  referencia: EventoFinanceiroCriadoReferencia;
}

// ============================================================================
// PARCELAS (Listagem de Contas a Pagar/Receber)
// ============================================================================

export interface ParcelaContasReceberPagarQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  data_vencimento_de: string; // YYYY-MM-DD - obrigatório
  data_vencimento_ate: string; // YYYY-MM-DD - obrigatório
}

export interface PerdaParcela {
  data: string;
  valor: number;
}

export interface BaixaParcela extends Versionable {
  id: string;
  data_baixa: string;
  forma_pagamento: InstallmentPaymentMethod;
  id_cobranca?: string;
  id_conciliacao?: string;
  id_conta_financeira: string;
  id_recibo_digital?: string;
  observacao?: string;
  origem: InstallmentOrigin;
  composicao_valor: ComposicaoValorCompleta;
}

export interface RecorrenciaEventoFinanceiro {
  id: string;
  quantidade_ocorrencias_ate_fim: number;
}

export interface EventoFinanceiroParcela extends Versionable {
  id: string;
  agendado: boolean;
  data_competencia: string;
  descricao: string;
  id_cliente?: string;
  id_fornecedor?: string;
  indice_recorrencia?: number;
  numero_parcelas: number;
  observacao?: string;
  tipo: TipoCategoriaFinanceira;
  valor: number;
  referencia_externa?: string;
  rateio_categorias: RateioCategoriaEventoFinanceiro[];
  referencia?: {
    id: string;
    origem: InstallmentOrigin;
    revisao: string;
  };
  recorrencia?: RecorrenciaEventoFinanceiro;
}

export interface ParcelaContasReceberPagar extends Versionable {
  id: string;
  indice: number;
  baixa_agendada: boolean;
  conciliado: boolean;
  possui_cobranca: boolean;
  status: InstallmentStatus;
  data_vencimento: string;
  data_prevista_pagamento: string;
  descricao: string;
  forma_pagamento: InstallmentPaymentMethod;
  id_conta_financeira: string;
  nao_pago: number;
  pago: number;
  valor_liquido_total: number;
  composicao_valor: ComposicaoValorCompleta;
  baixas: BaixaParcela[];
  perda?: PerdaParcela;
  evento_financeiro: EventoFinanceiroParcela;
}

export type ListaParcelasContasReceberPagar = PaginatedResponse<ParcelaContasReceberPagar>;

// ============================================================================
// BAIXAS
// ============================================================================

export interface ContaFinanceiraBaixa extends Versionable {
  id: string;
  nome: string;
  tipo: FinancialAccountType;
  instituicao_bancaria?: BankInstitution;
  codigo_instituicao_bancaria?: number;
  agencia?: string;
  numero?: string;
  ativo: boolean;
  conta_padrao: boolean;
  conta_caixa: boolean;
  conta_azul_digital: boolean;
  tem_configuracao_boleto: boolean;
  id_pai?: string;
  id_legado?: number;
  referencia_externa?: string;
}

export interface AnexoBaixa {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'RECIBO' | 'RECIBO_DIGITAL';
  tipo_conteudo: 'ARQUIVO' | 'URL';
  url: string;
  referencia?: string;
  criado_em: string;
  criado_por: number;
  atualizado_em?: string;
  atualizado_por?: number;
  deletado_em?: string;
  deletado_por?: number;
}

export interface Baixa extends Versionable {
  id: string;
  tipo: TipoCategoriaFinanceira;
  id_parcela: string;
  id_cobranca?: string;
  id_conciliacao?: string;
  id_recibo_digital?: string;
  id_referencia: string;
  origem: InstallmentOrigin;
  data_baixa: string;
  forma_pagamento: InstallmentPaymentMethod;
  nsu?: string;
  observacao?: string;
  atualizado_em: string;
  composicao_valor: ComposicaoValorCompleta;
  conta_financeira: ContaFinanceiraBaixa;
  anexos?: AnexoBaixa[];
}

// ============================================================================
// COBRANÇAS
// ============================================================================

export interface Cobranca {
  id: string;
  tipo: ChargeRequestType;
  status: ChargeRequestStatus;
  id_cliente: string;
  data_vencimento: string;
  url?: string;
  composicao_valor: ComposicaoValorCompleta;
}

// ============================================================================
// CONTAS FINANCEIRAS
// ============================================================================

export interface ContaFinanceira {
  id: string;
  nome: string;
  tipo: FinancialAccountType;
  banco?: BankInstitution;
  codigo_banco?: number;
  agencia?: string;
  numero?: string;
  ativo: boolean;
  conta_padrao: boolean;
  possui_config_boleto_bancario: boolean;
}

export interface ContasFinanceirasQueryParams {
  pagina?: number;
  tamanho_pagina?: number;
  campo_ordenado_ascendente?: 'NOME';
  campo_ordenado_descendente?: 'NOME';
  tipos?: FinancialAccountType[];
  nome?: string;
  apenas_ativo?: boolean;
  esconde_conta_digital?: boolean;
  mostrar_caixinha?: boolean;
}

export type ListaContasFinanceiras = PaginatedResponse<ContaFinanceira>;

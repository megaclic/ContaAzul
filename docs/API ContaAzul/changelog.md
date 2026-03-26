# 📘 Change Log - API Conta Azul

Esta página documenta mudanças importantes na API da Conta Azul, como novos endpoints, atualizações de comportamento, alterações de contrato e descontinuações. Siga este changelog para manter suas integrações atualizadas e compatíveis.

## v2.1.2026.03.24 - [2026-03-24]

## 🚀Adicionado

[Endpoint] [Retornar dados da empresa conectada](https://developers.contaazul.com/open-api-docs/open-api-person/v1/retornaempresadacontaconectada)

[O que ?] Adicionado o endpoint '/v1/pessoas/conta-conectada'.

[Por que?] Permite consultar as informações cadastrais e de contato da empresa vinculada à sua integração.

[Exemplo]

image copy 32.png
## v2.1.2026.03.18 - [2026-03-18]

## 🚀Adicionado

[Endpoint]

* [Criar uma nova venda](https://developers.contaazul.com/docs/sales-apis-openapi/v1/createvenda)
* [Atualizar uma venda por id](https://developers.contaazul.com/docs/sales-apis-openapi/v1/editsale)


[O que ?] Adicionado a possibilidade de fazer cadastro e alteração de itens que sejam kits em uma venda.

[Por que?] Permitir que parceiros desenvolvedores possam cadastrar e alterar itens que sejam kits em uma venda.

[Exemplo]

Criar uma nova venda

image copy 30.png
Atualizar uma venda por id

image copy 31.png
## v2.1.2026.03.12 - [2026-03-12]

## 🚀Adicionado

[Endpoint]

* [Atualizar uma pessoa por id](https://developers.contaazul.com/open-api-docs/open-api-person/v1/atualizarpessoaporid)
* [Atualizar parcialmente uma pessoa por id](https://developers.contaazul.com/open-api-docs/open-api-person/v1/atualizarparcialmentepessoa)


[O que ?] Adicionado o campo contato_cobranca_faturamento na atualização de pessoa.

[Por que?] Permitir que parceiros desenvolvedores possam garantir melhor governança de dados e suportar fluxos de cobrança.

[Exemplo]

Atualizar uma pessoa por id

image copy 28.png
Atualizar parcialmente uma pessoa por id

image copy 29.png
## v2.1.2026.03.11 - [2026-03-11]

## 🚀Adicionado

[Endpoint]

* [Retornar a pessoa por id](https://developers.contaazul.com/open-api-docs/open-api-person/v1/retornapessoaporid)
* [Retornar a pessoa por legacyid](https://developers.contaazul.com/open-api-docs/open-api-person/v1/retornapessoaporlegacyid)


[O que ?] Adicionado o campo contato_cobranca_faturamento no retorno do endpoint.

[Por que?] Permitir que parceiros desenvolvedores possam garantir melhor governança de dados e suportar fluxos de cobrança.

[Exemplo]

Retornar a pessoa por id

image copy 26.png
Retornar a pessoa por legacyid

image copy 27.png
## v2.1.2026.03.10 - [2026-03-10]

## 🔄 Alterado

[Endpoint] [Retornar as pessoas por filtro](https://developers.contaazul.com/open-api-docs/open-api-person/v1/retornapessoasporfiltros)

[O que?]
Adicionado intervalo máximo de 365 dias para consulta com data_alteracao_de e data_alteracao_ate

[Por que?]

Garantir que as consultas sejam eficientes, seguras, performáticas e dentro dos padrões de uso da plataforma, evitando indisponibilidades ou lentidão.

[Exemplo]

image copy 25.png
## v2.1.2026.03.06 - [2026-03-06]

## 🚀Adicionado

[Endpoint] [Criar uma nova pessoa](https://developers.contaazul.com/open-api-docs/open-api-person/v1/criarpessoa)

[O que ?] Adicionado o campo contato_cobranca_faturamento para informar o contato responsável por cobrança e faturamento na criação de pessoa.

[Por que?] Permitir que parceiros desenvolvedores possam garantir melhor governança de dados e suportar fluxos de cobrança.

[Exemplo]

image copy 24.png
## v2.1.2026.03.06 - [2026-03-06]

## 🚀Adicionado

[Endpoint] [Retornar transferências por período](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchAccountingExportTransfers)

[O que ?] Adicionado novo endpoint de consulta de transferências por período.

[Por que?] Viabilizar a conciliação financeira automática e sincronizar corretamente as movimentações.

[Exemplo]

image copy 23.png
## v2.1.2026.03.05 - [2026-03-05]

## 🔄 Alterado

[Endpoint] [Retornar as receitas por filtro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchinstallmentstoreceivebyfilter)

[Endpoint] [Retornar as despesas por filtro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchinstallmentstopaybyfilter)

[Endpoint] [Retornar as vendas por filtro](https://developers.contaazul.com/docs/sales-apis-openapi/v1/searchvendas)

[O que?]
Adicionado intervalo máximo de 365 dias para consulta com data_alteracao_de e data_alteracao_ate

[Por que?]

Garantir que as consultas sejam eficientes, seguras, performáticas e dentro dos padrões de uso da plataforma, evitando indisponibilidades ou lentidão.

[Exemplo]

image copy 22.png
## v2.1.2026.02.23 - [2026-02-23]

## 🔄 Alterado

[Endpoint] [Retornar os itens de uma venda pelo id da venda](https://developers.contaazul.com/docs/sales-apis-openapi/v1/getvendaitens)

[O que?]

* Filtrar por tamanho da página deve ser um dos seguintes valores: 10, 20, 50, 100, 200, 500 ou 1000.
* Adicionado o campo id_centro_custo no retorno dos itens de uma venda pelo id da venda.


[Por que?]

* Manter padrão de paginação entre os endpoints.
* Permitir que parceiros desenvolvedores identifiquem facilmente o centro de custo vinculado a cada item da venda.


[Exemplo]

Filtrar por tamanho da página:

image copy 20.png
Campo id_centro_custo no retorno do endpoint:

image copy 21.png
## v2.1.2026.02.18 - [2026-02-18]

## 🚀Adicionado

[Endpoint] [Retornar o produto por id](https://developers.contaazul.com/open-api-docs/open-api-inventory/v1/retornarprodutoporid)

[O que ?] Adicionado o campo url_imagem no retorno de produto por id.

[Por que?] Permitir que parceiros desenvolvedores possam realizar o download das imagens do produto.

[Exemplo]

url_imagem.png
## v2.1.2026.02.13 - [2026-02-13]

## 🚀 Adicionado

[Endpoint] [Retornar as receitas por filtro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchinstallmentstoreceivebyfilter)

[O que?]  Adicionado o campo `ids_clientes` como filtro na requisição (aceita lista de IDs). Incluídos no retorno da API os campos `data_competencia`, `centros_de_custo` e `categorias`.

[Por que?] A inclusão do filtro `ids_clientes` permite correlacionar diretamente os lançamentos de receita ao cliente responsável. A disponibilização dos campos `data_competencia`, `centros_de_custo` e `categorias` no retorno possibilitará análises financeiras mais completas, automações contábeis, consolidações gerenciais e alinhamento entre critérios de filtro e dados retornados pela API.

[Exemplo]
Filtro por `ids_clientes` e os campos `data_competencia`, `centros_de_custo` e `categorias` mapeados na resposta:

image copy 18.png
[Endpoint] [Retornar as despesas por filtro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchinstallmentstopaybyfilter)

[O que?] Incluídos no retorno da API os campos `data_competencia`, `centros_de_custo` e `categorias`.

[Por que?] A disponibilização dos campos `data_competencia`, `centros_de_custo` e `categorias` no retorno possibilitará análises financeiras mais completas, automações contábeis, consolidações gerenciais e alinhamento entre critérios de filtro e dados retornados pela API.

[Exemplo]
Campos `data_competencia`, `centros_de_custo` e `categorias` mapeados na resposta:

image copy 19.png
## v2.1.2026.01.29 - [2026-01-29]

## 🔄 Alterado

[Endpoint] [Retornar notas fiscais de serviço por filtros](https://developers.contaazul.com/open-api-docs/open-api-invoice/v1/obternotasfiscaisservicoporfiltro)

[O que?]  Filtrar notas fiscais pelo ID (uuid) da NFS-e e receber esse identificador no retorno do endpoint.

[Por que?] Facilitar a conciliação, rastreabilidade e correlação das NFS-e entre sistemas internos e integrações externas.

[Exemplo]

Filtro por ids e id no retorno da request:

image copy 17.png
## 🔄 Alterado

[Endpoint] [Retornar a venda por id](https://developers.contaazul.com/docs/sales-apis-openapi/v1/getvendabyid)

[O que?]  Alterado na resposta da request o enum tipo_pagamento de PAGAMENTO_INSTANTANEO para PIX_PAGAMENTO_INSTANTANEO

[Por que?] Para o método de pagamento PIX seja retornado e aceito de forma padronizada entre criação de venda, consulta por ID e criação de baixa

[Exemplo]

Método de pagamento (PIX_PAGAMENTO_INSTANTANEO):

image copy 16.png
## v2.1.2026.01.14 - [2026-01-14]

## 🚀 Adicionado

[Endpoint] [Retornar as vendas por filtro](https://developers.contaazul.com/docs/sales-apis-openapi/v1/searchvendas)

[O que?]  Adicionado o campo id_contrato no retorno das vendas por filtro.

[Por que?] Permitir que parceiros desenvolvedores identifiquem facilmente a origem de cada venda recorrente (contrato), suportando processos de conciliação, análise de recorrência.

[Exemplo]

Vendas do tipo contrato (SCHEDULED_SALE):

image copy 15.png
## v2.1.2026.01.14 - [2026-01-14]

## 🚀 Adicionado

[Endpoint] [Retornar a venda por id](https://developers.contaazul.com/docs/sales-apis-openapi/v1/getvendabyid)

[O que?]  Adicionado objeto de contrato no retorno do endpoint.

[Por que?] Permitir que parceiros desenvolvedores identifiquem facilmente a origem de cada venda recorrente (contrato), suportando processos de conciliação, análise de recorrência.

[Exemplo]

Venda do tipo contrato (SCHEDULED_SALE):

image copy 13.png
Venda tipo venda avulsa (SALE) ou orçamento (SALE_PROPOSAL):

image copy 14.png
## V2.1.2025.12.18 - [2025-12-18]

### 🚀 Adicionado

[Endpoint] [Retornar as notas fiscais de serviço (NFS-e) por filtro](https://developers.contaazul.com/open-api-docs/open-api-invoice/v1/obternotasfiscaisservicoporfiltro)

[O que?]  Novo endpoint público para consulta e listagem de Notas Fiscais de Serviço (NFS-e).

[Por que?] Permitir que parceiros desenvolvedores realizem a listagem de NFS-e geradas no ERP, aplicando filtros para facilitar a busca, conciliação e acompanhamento fiscal.

[Exemplo]

181225.png
## V2.1.2025.12.02 – [2025-12-02]

## 🛠️ Mudança no canal de suporte aos desenvolvedores

### 🔄 O que mudou?

Estamos realizando uma transição do canal de suporte aos desenvolvedores.
O atendimento que antes ocorria pelo e-mail **api@contaazul.com** passará a ser feito **exclusivamente pelo Portal do Desenvolvedor**.

### 📆 Período de transição

O e-mail **api@contaazul.com** será **gradativamente descontinuado até meados de janeiro/2026**.
Durante esse período, o e-mail ainda poderá ser utilizado, mas **recomendamos fortemente** abrir chamados diretamente pelo novo canal.

Após a descontinuação, o e-mail deixará de ser monitorado.

### 💬 Como abrir chamados daqui pra frente?

1. Acesse o **Portal do Desenvolvedor**.
2. Clique no ícone de suporte no canto inferior direito.
3. Envie sua dúvida técnica ou abra um chamado diretamente pelo portal.


Screenshot 2025-12-02 at 12.38.34.png
### ⚠️ Importante

- A partir de meados de janeiro, **e-mails enviados para api@contaazul.com não serão mais atendidos**.
- O **Portal do Desenvolvedor** passa a ser o canal oficial e exclusivo para suporte técnico.


### 🎯 Por que fizemos isso?

- Melhor organização e rastreabilidade do atendimento.
- Centralização do histórico e mais agilidade na resolução.
- Experiência mais consistente para parceiros desenvolvedores.


## V2.1.2025.11.19 – [2025-11-19]

### 🔄  Alterado

[Configuração] Rate limit da API

[O que?]  O limite de requisições foi atualizado para **600 por minuto** e **10 por segundo**, agora aplicado por **conta conectada do ERP**, e não mais por aplicação.

[Por que?] Com as recentes liberações dos filtros por data de atualização (Pessoas, Vendas, Receitas e Despesas), é possível consultar apenas os dados que foram alterados, reduzindo o volume desnecessário de requisições.
Essa mudança torna o consumo mais eficiente e permite ampliar o limite de contas conectadas do ERP em uma mesma aplicação, **sem comprometer a estabilidade da API**.

## V2.1.2025.11.14 - [2025-11-14]

### 🚀 Adicionado

[Endpoint] [Retornar as notas fiscais por filtro](https://developers.contaazul.com/open-api-docs/open-api-invoice/v1/obternotasfiscaisporfiltro)

[O que?] Novo filtro

[Por que?] Permitir a busca de notas fiscais por meio do ID de uma venda.

[Exemplo]

image copy 12.png
## V2.1.2025.11.12 - [2025-11-12]

### 🔄 Alterado

[Endpoint] [Retornar os produtos por filtro](https://developers.contaazul.com/open-api-docs/open-api-inventory/v1/retornarlistagemdeprodutos)

[O que?] Foram adicionados novos filtros aos parâmetros de consulta:

- `sku`: permite busca exata por código de identificação do produto.
- `data_alteracao_de` e `data_alteracao_ate`: possibilitam filtrar produtos com base no período de alteração.


[Por que?] Esses filtros aumentam a precisão e a eficiência na consulta de produtos, facilitando a localização dos dados desejados conforme critérios específicos.

[Exemplo]

apiprodutos-skudata.png
## V2.1.2025.11.11 - [2025-11-11]

### 🚀 Adicionado

[Endpoint] [Retornar o próximo número do contrato disponível](https://developers.contaazul.com/docs/contracts-apis-openapi/v1/getnextcontractnumber)

[O que?] Novo endpoint

[Por que?] Este endpoint tem como objetivo disponibilizar o próximo número do contrato para ser possível criar contratos de forma automatizada

[Exemplo]

image copy 9.png
## V2.1.2025.11.07 - [2025-11-07]

### 🔄 Alterado

[Endpoint] [Retornar as parcelas pelo id do evento financeiro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/getinstallmentsbyeventid)

[O que?]

- Adicionado objeto de renegociação
- Mapeado novos status:
  - "RENEGOCIADO"
  - "RECEBIDO_PARCIAL"
  - "ATRASADO"
  - "PERDIDO"


[Por que?] Necessidade de disponibilizar a informações de renegociação dentro da parcela. Exibir outras opções de status da parcela

[Exemplo]

Adicionado objeto de renegociação

image copy 6.png
Mapeado novos status

image copy 10.png
### 🔄 Alterado

[Endpoint] [Retornar a parcela por id](https://developers.contaazul.com/docs/financial-apis-openapi/v1/getinstallmentbyid)

[O que?]

- Adicionado objeto de renegociação
- Mapeado novos status:
  - "RENEGOCIADO"
  - "RECEBIDO_PARCIAL"
  - "ATRASADO"
  - "PERDIDO"


[Por que?] Necessidade de disponibilizar a informações de renegociação dentro da parcela. Exibir outras opções de status da parcela

[Exemplo]

Adicionado objeto de renegociação

image copy 7.png
Mapeado novos status

image copy 11.png
### 🔄 Alterado

[Endpoint] [Retornar as receitas por filtro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchinstallmentstoreceivebyfilter)

[O que?] Adicionado objeto de renegociação

[Por que?] Necessidade de disponibilizar a informações de renegociação dentro da parcela

[Exemplo]

image copy 8.png
## V2.1.2025.11.05 - [2025-11-05]

### 🚀 Adicionado

[Endpoint] [Retornar as pessoas por filtro](https://developers.contaazul.com/open-api-docs/open-api-person/v1/retornapessoasporfiltros)

[O que?] Novo filtro e novos campos retornados

[Por que?] Possibilitar a busca de pessoas pela data de/até da alteração da pessoa

[Exemplo]

image copy 5.png
## V2.1.2025.11.04 – [2025-11-04]

### 🚀 Adicionado

[Endpoint] [Retornar as vendas por filtro](https://developers.contaazul.com/docs/sales-apis-openapi/v1/searchvendas)

[O que?] Novo filtro e novo campo retornado

[Por que?] Possibilitar a busca de vendas pela data de/até da alteração da venda

[Exemplo]

image copy 4.png
## V2.1.2025.10.23 – [2025-10-23]

### 🚀 Adicionado

[Endpoint] [Retorna receitas por filtro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchinstallmentstoreceivebyfilter) e [Retorna despesas por filtro](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchinstallmentstopaybyfilter)

[O que?] Novo filtro

[Por que?] Possibilitar a busca de receitas e despesas pela data de alteração da parcela

[Exemplo]

image copy 2.png
### 🚀 Adicionado

[Endpoint] [Retornar os itens de uma venda pelo id da venda](https://developers.contaazul.com/docs/sales-apis-openapi/v1/getvendaitens)

[O que?] Novo campo retornado

[Por que?] Retornar o valor do custo do item da venda

[Exemplo]

image copy 3.png
## V2.1.2025.10.10 – [2025-10-10]

### 🚀 Adicionado

[Endpoint] [Buscar saldo atual da conta financeira](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchbalancebyfinancialaccountid)

[O que?] Novo endpoint

[Por que?] Este endpoint tem como objetivo disponibilizar, de forma simples e direta, o saldo atual de uma conta financeira específica, identificada pelo id da conta financeira.

[Exemplo]

image.png
### 🚀 Adicionado

[Endpoint] [Retorna a estrutura completa de categorias DRE](https://developers.contaazul.com/docs/financial-apis-openapi/v1/searchdrecategories)

[O que?] Novo endpoint

[Por que?] Este endpoint tem como objetivo listar a estrutura completa de categorias da Demonstração do Resultado do Exercício (DRE), composta por categorias principais e subcategorias hierárquicas

[Exemplo]

image copy.png
## V2.1.2025.08.27 [2025-08-27] – Inclusão de informações sobre rateio, centros de custo e categoria financeira

### 🔄  Alterado

[Endpoint]  [Retornar parcela por id](https://developers.contaazul.com/docs/financial-apis-openapi/v1/getinstallmentbyid)

[O que?] Agora o endpoint passa a retornar também informações de **rateio**, **centros de custo** e **categoria financeira** associadas à parcela.

[Por que?] Para fornecer uma visão mais completa dos detalhamentos financeiros, permitindo análises mais precisas e integração mais rica por parte dos desenvolvedores.

[Exemplo]

Busca-parcela-por-ID.png
## [2025-06-11] – Adição da sessão de FAQ e Change Log

### 🚀 Adicionado

[O que?] Inclusão de duas novas sessões no Portal do Desenvolvedor:

- [**FAQ**](https://developers.contaazul.com/faq), consolidando as dúvidas mais comuns dos desenvolvedores.
- [**Change Log**](https://developers.contaazul.com/changelog), permitindo acompanhar facilmente todas as alterações, inclusões e evoluções das APIs e recursos da plataforma.


[Por que?] Para melhorar a navegação, facilitar a consulta e aumentar a autonomia dos desenvolvedores ao utilizar as APIs.
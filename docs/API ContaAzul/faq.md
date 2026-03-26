# FAQ - Perguntas Frequentes sobre a API da Conta Azul

Este FAQ reúne as principais dúvidas de desenvolvedores que integram seus sistemas com a API da Conta Azul.

## 🔐 Autenticação e Autorização

### Como faço a autenticação na API da Conta Azul?

A autenticação é feita via OAuth 2.0. Você deve:

1. Redirecionar o usuário para a URL de autorização.
2. Trocar o código de autorização por um token de acesso.
3. Usar o token de acesso para chamadas autenticadas.


Consulte o [guia de autenticação](https://developers.contaazul.com/auth).

### Qual o tempo de expiração do código de autorização obtido?

O código de autorização tem validade de 3 minutos.
Desta forma após obter o código você terá 3 minutos para realizar a troca por um token de acesso.

## 🔐 Como gerar o valor em Base64 para autenticação?

Para autenticar sua requisição ao endpoint `https://auth.contaazul.com/oauth2/token`, você precisa enviar o header:


```
Authorization: Basic BASE64(client_id:client_secret)
```

### 🔹 Como gerar o valor em Base64:

1. Junte o `client_id` e o `client_secret` com `:` no meio.
**Exemplo:**

```
abc123:xyz456
```
2. Codifique esse valor em Base64.
**Resultado (exemplo):**

```
YWJjMTIzOnh5ejQ1Ng==
```
3. Envie no header da requisição:



```
Authorization: Basic YWJjMTIzOnh5ejQ1Ng==
```

### 🔧 Formas de gerar o valor codificado:

- **Ferramenta online:**
[https://www.base64encode.org](https://www.base64encode.org)
- **Linux/macOS terminal:**



```bash
echo -n "client_id:client_secret" | base64
```

- **Windows PowerShell:**



```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("client_id:client_secret"))
```

### Como conectar meu aplicativo a múltiplos clientes (empresas Conta Azul)?

Você deve repetir o fluxo de autorização de OAuth para cada empresa que desejar integrar. Cada autorização gera um token exclusivo por empresa

### A API tem limite de requisições?

Sim. A Conta Azul aplica rate limits nas integrações. Os detalhes do limite devem ser tratados via headers da resposta HTTP.
Hoje nossos limites são: **600 chamadas por minuto e até 10 por segundo** aplicado por conta conectada do ERP.

### Existe webhook para receber eventos da Conta Azul?

Ainda não está disponível nativamente. Você pode simular esse comportamento criando um polling recorrente nos endpoints.

### Existe ambiente de sandbox?

Não. Atualmente, não oferecemos um ambiente (sandbox) dedicado.

Para realizar testes e validações, o desenvolvedor deve criar um **App de Desenvolvimento**, que dá acesso a uma **Conta de Desenvolvimento** com duração inicial de **30 dias** (com possibilidade de extensão, se necessário).

Essa conta gera dados ficticios que permite validar integrações em um ambiente realista , sem impacto em dados produtivos.
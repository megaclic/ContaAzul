# Erros Comuns na Integração com a API da Conta Azul

Ao integrar com a API da Conta Azul, você pode se deparar com alguns erros comuns. Entender o que eles significam e suas causas pode ajudar a depurar sua aplicação mais rapidamente. Aqui estão alguns dos erros mais frequentes que você pode encontrar:

### `invalid_grant`

Este erro geralmente ocorre durante o processo de autenticação **OAuth 2.0**. Ele indica que o `authorization_code` ou o `refresh_token` que você está tentando usar é inválido, já foi utilizado, expirou, ou não corresponde ao `redirect_uri` ou `client_id` fornecido.

**Possíveis causas:**

* Uso de um código de autorização que já foi trocado por tokens.
* Token de atualização (`refresh_token`) expirado ou revogado.
* Incompatibilidade entre o `redirect_uri` registrado e o usado na requisição.
* `client_id` incorreto.


### `401 Unauthorized`

Um status `401 Unauthorized` significa que sua requisição não foi autenticada ou as credenciais fornecidas são inválidas.

**Possíveis causas:**

* `access_token` ausente ou inválido no cabeçalho `Authorization: Bearer`.
* `access_token` expirado (neste caso, use o `refresh_token` para gerar um novo).
* Tentativa de acessar um recurso para o qual o `access_token` não tem permissão.


### `500 Internal Server Error`

Um erro `500 Internal Server Error` indica um problema genérico no servidor da API da Conta Azul. Isso significa que algo inesperado aconteceu no lado do servidor ao processar sua requisição.

**Possíveis causas:**

* Um erro inesperado no código da API.
* Problemas temporários de infraestrutura no lado da Conta Azul.
* Embora menos comum, pode ser um corpo de requisição com formato JSON inválido ou dados inconsistentes que o servidor não conseguiu processar (mesmo que a validação inicial tenha passado).


**O que fazer:**

1. Verifique se sua requisição está perfeitamente formatada e se os dados enviados estão corretos e completos conforme a documentação.
2.Tente repetir a requisição após alguns segundos. Se persistir, por favor, contate o suporte em **api@contaazul.com**
. Além disso, você também pode acessar o nosso **Chat** pelo Portal do Desenvolvedor para tirar dúvidas e obter orientações sobre o uso das APIs.


### `429 Too Many Requests`

Este erro ocorre quando você excede o limite de requisições imposto pela API (**Rate Limits**). Conforme a documentação, os limites são de 600 chamadas por minuto e até 10 por segundo aplicado por conta conectada do ERP.

**Possíveis causas:**

* Sua aplicação está enviando requisições em uma frequência maior do que o permitido.


**O que fazer:**

* Implemente um mecanismo de **backoff exponencial** em sua aplicação para experimentar requisições.
* Monitore os headers da resposta HTTP relacionados aos Rate Limits para ajustar a frequência de suas chamadas.
* Otimize sua aplicação para fazer menos chamadas, talvez armazenando dados em cache quando apropriado.


Ao entender esses erros comuns, você estará mais preparado para construir uma integração robusta e lidar eficientemente com quaisquer problemas que possam surgir.
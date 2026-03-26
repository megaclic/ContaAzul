# ContaAzul OAuth Setup

## 📋 Pré-requisitos

1. **Conta no ContaAzul** com acesso de desenvolvedor
2. **Projeto Supabase** configurado
3. **Lovable** ou **Vite + React** configurado

---

## 🔧 Setup Passo a Passo

### 1. Configurar Aplicação no ContaAzul

1. Acesse [developers.contaazul.com](https://developers.contaazul.com)
2. Crie uma nova aplicação
3. Configure a **Redirect URI**:
   ```
   https://[SEU_PROJECT_ID].supabase.co/functions/v1/contaazul-oauth-callback
   ```
4. Anote o **Client ID** e **Client Secret**

---

### 2. Configurar Variáveis de Ambiente no Supabase

No Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**:

```bash
ENCRYPTION_KEY=sua-chave-secreta-de-256-bits-aqui
```

⚠️ **IMPORTANTE:** Gere uma chave segura! Use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. Deploy da Edge Function

```bash
# No terminal
cd supabase/functions

# Deploy
supabase functions deploy contaazul-oauth-callback
```

---

### 4. Configurar no Frontend (Lovable)

#### 4.1. Adicionar Hook ao Projeto

Copie `src/hooks/useContaAzulAuth.ts` para o projeto Lovable.

#### 4.2. Adicionar Página de Callback

Copie `src/pages/ContaAzulCallback.tsx` para o projeto.

#### 4.3. Adicionar Rota

No `App.tsx` ou arquivo de rotas:

```tsx
import ContaAzulCallback from '@/pages/ContaAzulCallback';

// ...

<Route path="/contaazul/callback" element={<ContaAzulCallback />} />
```

#### 4.4. Usar o Hook

```tsx
import { useContaAzulAuth } from '@/hooks/useContaAzulAuth';

function MyComponent() {
  const { isAuthenticated, login, logout } = useContaAzulAuth();

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Desconectar</button>
      ) : (
        <button onClick={login}>Conectar ContaAzul</button>
      )}
    </div>
  );
}
```

---

### 5. Configurar OAuth no Banco de Dados

Via Supabase SQL Editor ou frontend:

```sql
UPDATE contaazul_config
SET 
  client_id = 'SEU_CLIENT_ID_AQUI',
  client_secret = 'SEU_CLIENT_SECRET_AQUI',
  redirect_uri = 'https://[SEU_PROJECT_ID].supabase.co/functions/v1/contaazul-oauth-callback'
WHERE id = 1;
```

Ou use o componente `ContaAzulConfigForm.tsx` existente.

---

## 🧪 Testar OAuth Flow

1. Clique em "Conectar ContaAzul" no frontend
2. Será redirecionado para login do ContaAzul
3. Autorize a aplicação
4. Será redirecionado de volta para `/contaazul/callback`
5. Tokens são salvos criptografados no banco
6. Redirecionamento automático para admin

---

## 🔐 Segurança

### ✅ O Que Está Implementado

- ✅ Tokens criptografados (AES-GCM)
- ✅ CSRF protection (state parameter)
- ✅ RLS policies no Supabase
- ✅ Service role para Edge Function
- ✅ Tokens nunca expostos no frontend

### ⚠️ Importante

- **NUNCA** commite `ENCRYPTION_KEY` no Git
- **NUNCA** exponha tokens no frontend
- Use **HTTPS** sempre (Supabase já faz isso)
- Gere chaves fortes (256 bits mínimo)

---

## 🐛 Troubleshooting

### Erro: "OAuth config not found"

**Solução:** Configure o `contaazul_config` no banco:
```sql
SELECT * FROM contaazul_config WHERE id = 1;
```

### Erro: "Invalid state parameter"

**Solução:** Limpe o `sessionStorage` e tente novamente:
```js
sessionStorage.removeItem('oauth_state');
```

### Erro: "Token exchange failed"

**Soluções:**
1. Verifique se `redirect_uri` está EXATAMENTE igual no ContaAzul
2. Verifique `client_id` e `client_secret`
3. Veja logs da Edge Function no Supabase

### Token expira muito rápido

**Solução:** Implemente refresh token (próxima fase)

---

## 📚 Referências

- [ContaAzul API Docs](https://developers.contaazul.com)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)

---

## ✅ Checklist de Setup

- [ ] Aplicação criada no ContaAzul
- [ ] Client ID e Secret anotados
- [ ] `ENCRYPTION_KEY` configurada no Supabase
- [ ] Edge Function deployed
- [ ] Rota `/contaazul/callback` adicionada
- [ ] `contaazul_config` preenchida no banco
- [ ] Testado OAuth flow completo
- [ ] Tokens salvos e criptografados
- [ ] Conexão ativa visível no admin

---

**Pronto! OAuth está funcionando! 🎉**

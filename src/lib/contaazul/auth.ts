/**
 * ContaAzul Integration - OAuth 2.0 Authentication
 * 
 * Implementação completa do fluxo OAuth 2.0 Authorization Code
 * 
 * Fluxo:
 * 1. getAuthorizationUrl() - Redireciona usuário para autorização
 * 2. exchangeCodeForToken() - Troca o code por access_token
 * 3. Auto-refresh é gerenciado pelo client.ts
 */

import axios from 'axios';
import { ContaAzulOAuthTokenResponse } from '../types/core';
import { setTokens } from './client';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CLIENT_ID = import.meta.env.VITE_CONTAAZUL_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_CONTAAZUL_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_CONTAAZUL_REDIRECT_URI;
const AUTH_URL = import.meta.env.VITE_CONTAAZUL_AUTH_URL || 'https://api.contaazul.com/auth/authorize';
const TOKEN_URL = import.meta.env.VITE_CONTAAZUL_TOKEN_URL || 'https://api.contaazul.com/oauth2/token';

// ============================================================================
// OAUTH 2.0 FLOW
// ============================================================================

/**
 * Gera URL de autorização para redirecionar o usuário
 * 
 * @param state - String aleatória para prevenir CSRF (recomendado)
 * @returns URL completa para redirecionamento
 * 
 * @example
 * ```ts
 * const state = crypto.randomUUID();
 * sessionStorage.setItem('oauth_state', state);
 * 
 * const authUrl = getAuthorizationUrl(state);
 * window.location.href = authUrl;
 * ```
 */
export const getAuthorizationUrl = (state?: string): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
  });

  if (state) {
    params.append('state', state);
  }

  return `${AUTH_URL}?${params.toString()}`;
};

/**
 * Troca o authorization code por access token
 * 
 * @param code - Authorization code recebido na callback URL
 * @returns Token response com access_token, refresh_token, expires_in
 * 
 * @example
 * ```ts
 * // Na rota de callback (/contaazul/callback)
 * const urlParams = new URLSearchParams(window.location.search);
 * const code = urlParams.get('code');
 * const state = urlParams.get('state');
 * 
 * // Validar state
 * if (state !== sessionStorage.getItem('oauth_state')) {
 *   throw new Error('Invalid state');
 * }
 * 
 * const tokens = await exchangeCodeForToken(code);
 * // Tokens são salvos automaticamente no client
 * ```
 */
export const exchangeCodeForToken = async (
  code: string
): Promise<ContaAzulOAuthTokenResponse> => {
  try {
    const response = await axios.post<ContaAzulOAuthTokenResponse>(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
      }
    );

    // Salva tokens automaticamente no client
    setTokens(response.data);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to exchange code for token: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
};

/**
 * Inicia o fluxo OAuth 2.0 completo
 * 
 * @returns Promessa que resolve quando a autenticação for concluída
 * 
 * @example
 * ```tsx
 * function LoginButton() {
 *   const handleLogin = async () => {
 *     try {
 *       await initiateOAuthFlow();
 *       // Usuário será redirecionado...
 *     } catch (error) {
 *       console.error('Login failed:', error);
 *     }
 *   };
 * 
 *   return <button onClick={handleLogin}>Conectar ContaAzul</button>;
 * }
 * ```
 */
export const initiateOAuthFlow = (): void => {
  // Gera state para CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem('contaazul_oauth_state', state);

  // Redireciona para autorização
  const authUrl = getAuthorizationUrl(state);
  window.location.href = authUrl;
};

/**
 * Processa callback OAuth 2.0
 * 
 * Deve ser chamado na rota de callback (ex: /contaazul/callback)
 * 
 * @returns Token response ou null se não houver code
 * 
 * @example
 * ```tsx
 * // src/pages/ContaAzulCallback.tsx
 * function ContaAzulCallback() {
 *   useEffect(() => {
 *     handleOAuthCallback()
 *       .then(() => {
 *         // Redireciona para dashboard
 *         navigate('/dashboard');
 *       })
 *       .catch((error) => {
 *         console.error('OAuth callback error:', error);
 *         navigate('/login?error=oauth_failed');
 *       });
 *   }, []);
 * 
 *   return <div>Conectando com ContaAzul...</div>;
 * }
 * ```
 */
export const handleOAuthCallback = async (): Promise<ContaAzulOAuthTokenResponse | null> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  // Erro retornado pelo servidor OAuth
  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  // Sem code = não é callback válido
  if (!code) {
    return null;
  }

  // Valida state (CSRF protection)
  const savedState = sessionStorage.getItem('contaazul_oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter (CSRF protection)');
  }

  // Limpa state
  sessionStorage.removeItem('contaazul_oauth_state');

  // Troca code por tokens
  return await exchangeCodeForToken(code);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valida se as credenciais OAuth estão configuradas
 */
export const validateOAuthConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!CLIENT_ID) errors.push('VITE_CONTAAZUL_CLIENT_ID not configured');
  if (!CLIENT_SECRET) errors.push('VITE_CONTAAZUL_CLIENT_SECRET not configured');
  if (!REDIRECT_URI) errors.push('VITE_CONTAAZUL_REDIRECT_URI not configured');

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Retorna configuração OAuth (sem expor secret)
 */
export const getOAuthConfig = () => ({
  clientId: CLIENT_ID,
  redirectUri: REDIRECT_URI,
  authUrl: AUTH_URL,
  tokenUrl: TOKEN_URL,
});

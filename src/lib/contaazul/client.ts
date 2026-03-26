/**
 * ContaAzul Integration - HTTP Client
 * 
 * Cliente Axios configurado com:
 * - OAuth 2.0 Bearer token automático
 * - Auto-refresh de tokens expirados
 * - Rate limiting handling (600/min, 10/seg)
 * - Exponential backoff retry
 * - Error handling consistente
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ContaAzulOAuthTokenResponse, ContaAzulAPIError } from '../types/core';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const BASE_URL = import.meta.env.VITE_CONTAAZUL_API_BASE_URL || 'https://api-v2.contaazul.com';

const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 600,
  MAX_REQUESTS_PER_SECOND: 10,
  RETRY_DELAY_MS: 1000, // 1 segundo
  MAX_RETRIES: 3,
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

interface TokenStorage {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // timestamp em ms
}

let tokenStorage: TokenStorage = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
};

/**
 * Salva tokens no storage (pode ser substituído por Supabase)
 */
export const setTokens = (tokens: ContaAzulOAuthTokenResponse): void => {
  tokenStorage = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
};

/**
 * Limpa tokens do storage
 */
export const clearTokens = (): void => {
  tokenStorage = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };
};

/**
 * Verifica se o token está expirado ou prestes a expirar (margem de 5min)
 */
const isTokenExpired = (): boolean => {
  if (!tokenStorage.expiresAt) return true;
  const MARGIN_MS = 5 * 60 * 1000; // 5 minutos
  return Date.now() >= tokenStorage.expiresAt - MARGIN_MS;
};

/**
 * Refresh do token OAuth 2.0
 */
const refreshAccessToken = async (): Promise<string> => {
  if (!tokenStorage.refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post<ContaAzulOAuthTokenResponse>(
      import.meta.env.VITE_CONTAAZUL_TOKEN_URL,
      {
        grant_type: 'refresh_token',
        refresh_token: tokenStorage.refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: import.meta.env.VITE_CONTAAZUL_CLIENT_ID,
          password: import.meta.env.VITE_CONTAAZUL_CLIENT_SECRET,
        },
      }
    );

    setTokens(response.data);
    return response.data.access_token;
  } catch (error) {
    clearTokens();
    throw new Error('Failed to refresh token');
  }
};

/**
 * Retorna um access token válido (faz refresh se necessário)
 */
const getValidAccessToken = async (): Promise<string> => {
  if (!tokenStorage.accessToken || isTokenExpired()) {
    return await refreshAccessToken();
  }
  return tokenStorage.accessToken;
};

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

export const contaAzulClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR - Adiciona Bearer Token
// ============================================================================

contaAzulClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getValidAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get access token:', error);
      // Deixa a requisição continuar - o servidor retornará 401
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// RESPONSE INTERCEPTOR - Rate Limiting & Error Handling
// ============================================================================

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

const sleep = (ms: number): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));

contaAzulClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ContaAzulAPIError>) => {
    const config = error.config as RetryConfig;

    if (!config) {
      return Promise.reject(error);
    }

    // Rate Limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      const retryCount = config.__retryCount || 0;

      if (retryCount < RATE_LIMIT_CONFIG.MAX_RETRIES) {
        config.__retryCount = retryCount + 1;

        // Exponential backoff: 1s, 2s, 4s
        const delay = RATE_LIMIT_CONFIG.RETRY_DELAY_MS * Math.pow(2, retryCount);
        
        console.warn(
          `Rate limit hit (429). Retry ${retryCount + 1}/${RATE_LIMIT_CONFIG.MAX_RETRIES} after ${delay}ms`
        );

        await sleep(delay);
        return contaAzulClient.request(config);
      }

      return Promise.reject(
        new Error(`Rate limit exceeded after ${RATE_LIMIT_CONFIG.MAX_RETRIES} retries`)
      );
    }

    // Unauthorized (401) - Token inválido
    if (error.response?.status === 401) {
      console.error('Unauthorized (401): Token may be invalid or expired');
      clearTokens();
      // Aqui você pode disparar um evento para redirecionar o usuário para login
    }

    // Outras respostas de erro
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se o cliente está autenticado
 */
export const isAuthenticated = (): boolean => {
  return tokenStorage.accessToken !== null && !isTokenExpired();
};

/**
 * Retorna informações sobre o token atual
 */
export const getTokenInfo = () => {
  return {
    hasToken: tokenStorage.accessToken !== null,
    expiresAt: tokenStorage.expiresAt,
    isExpired: isTokenExpired(),
  };
};

export default contaAzulClient;

/**
 * ContaAzul Integration - useContaAzulAuth Hook
 * 
 * Hook React para gerenciar autenticação OAuth 2.0 com ContaAzul
 * 
 * Features:
 * - Gerencia estado de autenticação
 * - Inicia fluxo OAuth
 * - Processa callback OAuth
 * - Logout
 * - Informações do token
 */

import { useState, useCallback, useEffect } from 'react';
import {
  initiateOAuthFlow,
  handleOAuthCallback,
  validateOAuthConfig,
} from '../lib/contaazul/auth';
import {
  isAuthenticated as checkAuthenticated,
  getTokenInfo,
  clearTokens,
} from '../lib/contaazul/client';
import { ContaAzulOAuthTokenResponse } from '../types/core';

export interface UseContaAzulAuthReturn {
  // Estado
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenInfo: ReturnType<typeof getTokenInfo> | null;

  // Ações
  login: () => void;
  logout: () => void;
  processCallback: () => Promise<void>;

  // Validação
  isConfigValid: boolean;
  configErrors: string[];
}

export const useContaAzulAuth = (): UseContaAzulAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<ReturnType<typeof getTokenInfo> | null>(
    getTokenInfo()
  );

  // Valida configuração OAuth
  const { valid: isConfigValid, errors: configErrors } = validateOAuthConfig();

  /**
   * Atualiza estado de autenticação
   */
  const updateAuthState = useCallback(() => {
    const authenticated = checkAuthenticated();
    setIsAuthenticated(authenticated);
    setTokenInfo(getTokenInfo());
  }, []);

  /**
   * Inicia fluxo OAuth 2.0
   */
  const login = useCallback(() => {
    if (!isConfigValid) {
      setError('OAuth configuration is invalid. Check environment variables.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      initiateOAuthFlow();
      // Usuário será redirecionado para ContaAzul...
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth flow');
    }
  }, [isConfigValid]);

  /**
   * Processa callback OAuth (chamar na rota de callback)
   */
  const processCallback = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const tokens = await handleOAuthCallback();
      
      if (tokens) {
        updateAuthState();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process OAuth callback');
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthState]);

  /**
   * Logout (limpa tokens)
   */
  const logout = useCallback(() => {
    clearTokens();
    updateAuthState();
    setError(null);
  }, [updateAuthState]);

  /**
   * Atualiza estado ao montar o componente
   */
  useEffect(() => {
    updateAuthState();
  }, [updateAuthState]);

  return {
    // Estado
    isAuthenticated,
    isLoading,
    error,
    tokenInfo,

    // Ações
    login,
    logout,
    processCallback,

    // Validação
    isConfigValid,
    configErrors,
  };
};

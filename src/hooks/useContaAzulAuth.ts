// ============================================================================
// useContaAzulAuth - React Hook for ContaAzul OAuth
// Version: 1.0.0
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface OAuthConfig {
  client_id: string | null;
  client_secret: string | null;
  redirect_uri: string | null;
  auth_base_url: string | null;
  scope: string | null;
}

interface Connection {
  id: string;
  name: string;
  status: 'active' | 'expired' | 'revoked';
  is_active: boolean;
  token_expires_at: string | null;
  conta_conectada_cnpj: string | null;
  conta_conectada_nome: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TokenInfo {
  hasToken: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  expiresInMinutes: number | null;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const authKeys = {
  all: ['contaazul', 'auth'] as const,
  config: () => [...authKeys.all, 'config'] as const,
  connection: () => [...authKeys.all, 'connection'] as const,
};

// ============================================================================
// HOOK
// ============================================================================

export function useContaAzulAuth() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // FETCH CONFIG
  // ========================================================================

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: authKeys.config(),
    queryFn: async (): Promise<OAuthConfig> => {
      const { data, error } = await supabase
        .from('contaazul_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ========================================================================
  // FETCH CONNECTION
  // ========================================================================

  const { 
    data: connection, 
    isLoading: connectionLoading,
    refetch: refetchConnection 
  } = useQuery({
    queryKey: authKeys.connection(),
    queryFn: async (): Promise<Connection | null> => {
      const { data, error } = await supabase
        .from('contaazul_connections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // ========================================================================
  // COMPUTED PROPERTIES
  // ========================================================================

  const tokenInfo: TokenInfo = {
    hasToken: !!connection?.token_expires_at,
    expiresAt: connection?.token_expires_at || null,
    isExpired: connection?.token_expires_at 
      ? new Date(connection.token_expires_at) < new Date()
      : true,
    expiresInMinutes: connection?.token_expires_at
      ? Math.floor((new Date(connection.token_expires_at).getTime() - Date.now()) / 60000)
      : null,
  };

  const isAuthenticated = 
    connection?.status === 'active' && 
    connection?.is_active === true &&
    !tokenInfo.isExpired;

  const isLoading = configLoading || connectionLoading;

  // ========================================================================
  // INITIATE OAUTH FLOW
  // ========================================================================

  const login = useCallback(() => {
    if (!config) {
      setError('OAuth config not loaded');
      return;
    }

    if (!config.client_id || !config.redirect_uri || !config.auth_base_url) {
      setError('OAuth config incomplete. Please configure in admin panel.');
      return;
    }

    // Generate state (CSRF protection)
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      state,
      scope: config.scope || 'openid profile',
    });

    const authUrl = `${config.auth_base_url}?${params.toString()}`;

    // Redirect to ContaAzul
    window.location.href = authUrl;
  }, [config]);

  // ========================================================================
  // LOGOUT
  // ========================================================================

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!connection) return;

      const { error } = await supabase
        .from('contaazul_connections')
        .update({ 
          status: 'revoked',
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      if (error) throw error;

      // Log audit event
      await supabase.from('contaazul_audit_log').insert({
        event_type: 'oauth_logout',
        action: 'update',
        metadata: { connection_id: connection.id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.connection() });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Logout failed');
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  // ========================================================================
  // PROCESS OAUTH CALLBACK
  // ========================================================================

  const processCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // Check for OAuth error
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    // Validate state (CSRF protection)
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter (CSRF protection)');
    }

    // Clean up
    sessionStorage.removeItem('oauth_state');

    if (!code) {
      throw new Error('Missing authorization code');
    }

    // Edge Function will handle token exchange
    // We just need to refetch the connection
    await refetchConnection();

    // Clear URL params
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [refetchConnection]);

  // ========================================================================
  // AUTO-REFRESH TOKEN (if expires soon)
  // ========================================================================

  useEffect(() => {
    if (!tokenInfo.expiresInMinutes || tokenInfo.expiresInMinutes > 5) {
      return; // No need to refresh yet
    }

    // Token expires in < 5 minutes - should trigger refresh
    // (In a full implementation, we'd call a refresh endpoint here)
    console.warn('Token expires soon! Implement refresh logic.');

    // For now, just invalidate to show warning
    queryClient.invalidateQueries({ queryKey: authKeys.connection() });
  }, [tokenInfo.expiresInMinutes, queryClient]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // State
    isAuthenticated,
    isLoading,
    error,
    tokenInfo,
    connection,
    config,

    // Actions
    login,
    logout,
    processCallback,
    refetchConnection,

    // Loading states
    isLoggingOut: logoutMutation.isPending,
  };
}

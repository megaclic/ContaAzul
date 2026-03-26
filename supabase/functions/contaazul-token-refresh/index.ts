// ============================================================================
// ContaAzul Token Refresh - Supabase Edge Function
// Version: 1.0.0
// Purpose: Refresh access token with PostgreSQL advisory lock
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// TYPES
// ============================================================================

interface RefreshTokenRequest {
  connection_id?: string; // Optional - will use active connection if not provided
}

interface RefreshTokenResponse {
  success: boolean;
  connection_id?: string;
  token_expires_at?: string;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Encrypt token using AES-GCM
 */
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  const keyMaterial = encoder.encode(Deno.env.get('ENCRYPTION_KEY') || 'default-key-change-in-production');
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt token using AES-GCM
 */
async function decryptToken(encryptedToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const keyMaterial = encoder.encode(Deno.env.get('ENCRYPTION_KEY') || 'default-key-change-in-production');
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

/**
 * Exchange refresh token for new access token
 */
async function refreshAccessToken(
  refreshToken: string,
  config: any
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.client_id,
    client_secret: config.client_secret,
  });

  const response = await fetch(config.token_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return await response.json();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RefreshTokenRequest = await req.json().catch(() => ({}));
    let connectionId = body.connection_id;

    // If no connection_id provided, get the active connection
    if (!connectionId) {
      const { data: activeConnection } = await supabase
        .from('contaazul_connections')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!activeConnection) {
        throw new Error('No active connection found');
      }

      connectionId = activeConnection.id;
    }

    console.log(`Attempting token refresh for connection: ${connectionId}`);

    // ========================================================================
    // CRITICAL: Acquire PostgreSQL advisory lock
    // ========================================================================
    
    const lockKey = `contaazul_refresh_${connectionId}`;
    const lockHash = Array.from(new TextEncoder().encode(lockKey))
      .reduce((acc, byte) => ((acc << 5) - acc + byte) | 0, 0);

    const { data: lockResult } = await supabase.rpc('pg_try_advisory_lock', {
      key: lockHash,
    });

    if (!lockResult) {
      console.warn(`Token refresh already in progress for connection: ${connectionId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token refresh already in progress for this connection',
        }),
        {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Update status to refresh_in_progress
      await supabase
        .from('contaazul_connections')
        .update({ 
          status: 'refresh_in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      // Get current connection with encrypted tokens
      const { data: connection, error: connectionError } = await supabase
        .from('contaazul_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connectionError || !connection) {
        throw new Error('Connection not found');
      }

      // Check if token is actually expired or expiring soon (< 5 minutes)
      const expiresAt = new Date(connection.token_expires_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt > fiveMinutesFromNow) {
        console.log(`Token not expiring soon (expires at ${expiresAt}), skipping refresh`);
        
        // Release lock
        await supabase.rpc('pg_advisory_unlock', { key: lockHash });
        
        return new Response(
          JSON.stringify({
            success: true,
            connection_id: connectionId,
            token_expires_at: connection.token_expires_at,
            message: 'Token still valid, refresh not needed',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Decrypt refresh token
      const refreshToken = await decryptToken(connection.refresh_token_enc);

      // Get OAuth config
      const { data: config, error: configError } = await supabase
        .from('contaazul_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (configError || !config) {
        throw new Error('OAuth config not found');
      }

      // Exchange refresh token for new access token
      console.log('Exchanging refresh token...');
      const tokens = await refreshAccessToken(refreshToken, config);

      // Encrypt new tokens
      const accessTokenEnc = await encryptToken(tokens.access_token);
      const refreshTokenEnc = await encryptToken(tokens.refresh_token);

      // Calculate new expiry
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Update connection with new tokens
      const { error: updateError } = await supabase
        .from('contaazul_connections')
        .update({
          access_token_enc: accessTokenEnc,
          refresh_token_enc: refreshTokenEnc,
          token_expires_at: newExpiresAt,
          status: 'connected',
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (updateError) {
        throw new Error(`Failed to update connection: ${updateError.message}`);
      }

      // Log audit event
      await supabase.from('contaazul_audit_log').insert({
        event_type: 'token_refresh_success',
        action: 'update',
        metadata: {
          connection_id: connectionId,
          old_expires_at: connection.token_expires_at,
          new_expires_at: newExpiresAt,
        },
      });

      console.log('Token refresh completed successfully!');

      return new Response(
        JSON.stringify({
          success: true,
          connection_id: connectionId,
          token_expires_at: newExpiresAt,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } finally {
      // ========================================================================
      // CRITICAL: Always release the lock
      // ========================================================================
      await supabase.rpc('pg_advisory_unlock', { key: lockHash });
    }

  } catch (error) {
    console.error('Token refresh error:', error);

    // Update status to refresh_failed
    if (connectionId) {
      await supabase
        .from('contaazul_connections')
        .update({ 
          status: 'refresh_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      // Log audit event
      await supabase.from('contaazul_audit_log').insert({
        event_type: 'token_refresh_failed',
        action: 'error',
        metadata: {
          connection_id: connectionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

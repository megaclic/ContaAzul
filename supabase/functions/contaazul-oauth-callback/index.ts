// ============================================================================
// ContaAzul OAuth Callback - Supabase Edge Function
// Version: 1.0.0
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// TYPES
// ============================================================================

interface OAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  token_url: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface ContaConectada {
  cnpj: string;
  nome: string;
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
  
  // Get encryption key from environment
  const keyMaterial = encoder.encode(Deno.env.get('ENCRYPTION_KEY') || 'default-key-change-in-production');
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  code: string,
  config: OAuthConfig
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirect_uri,
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
    throw new Error(`Token exchange failed: ${error}`);
  }

  return await response.json();
}

/**
 * Get connected account info (conta conectada)
 */
async function getContaConectada(accessToken: string): Promise<ContaConectada | null> {
  try {
    const response = await fetch('https://api-v2.contaazul.com/v1/pessoas/empresa', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch conta conectada:', await response.text());
      return null;
    }

    const data = await response.json();
    return {
      cnpj: data.documento || '',
      nome: data.nome || data.nome_fantasia || '',
    };
  } catch (error) {
    console.error('Error fetching conta conectada:', error);
    return null;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check for OAuth error
    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `OAuth error: ${error}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required params
    if (!code) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing authorization code' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OAuth config from database
    const { data: config, error: configError } = await supabase
      .from('contaazul_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (configError || !config) {
      throw new Error('OAuth config not found. Please configure in admin panel.');
    }

    // Validate config
    if (!config.client_id || !config.client_secret) {
      throw new Error('OAuth config incomplete. Please set client_id and client_secret.');
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code, {
      client_id: config.client_id,
      client_secret: config.client_secret,
      redirect_uri: config.redirect_uri,
      token_url: config.token_url,
    });

    // Encrypt tokens
    console.log('Encrypting tokens...');
    const accessTokenEnc = await encryptToken(tokens.access_token);
    const refreshTokenEnc = await encryptToken(tokens.refresh_token);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Get conta conectada info
    console.log('Fetching conta conectada...');
    const contaConectada = await getContaConectada(tokens.access_token);

    // Save connection to database
    console.log('Saving connection to database...');
    const { data: connection, error: connectionError } = await supabase
      .from('contaazul_connections')
      .upsert({
        name: 'ContaAzul Connection',
        access_token_enc: accessTokenEnc,
        refresh_token_enc: refreshTokenEnc,
        token_expires_at: expiresAt,
        status: 'active',
        is_active: true,
        conta_conectada_cnpj: contaConectada?.cnpj || null,
        conta_conectada_nome: contaConectada?.nome || null,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (connectionError) {
      throw new Error(`Failed to save connection: ${connectionError.message}`);
    }

    // Log audit event
    await supabase.from('contaazul_audit_log').insert({
      event_type: 'oauth_login',
      action: 'create',
      metadata: {
        conta_conectada_cnpj: contaConectada?.cnpj,
        conta_conectada_nome: contaConectada?.nome,
        state,
      },
    });

    console.log('OAuth flow completed successfully!');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        connection_id: connection.id,
        conta_conectada: contaConectada,
        message: 'OAuth flow completed successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    
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

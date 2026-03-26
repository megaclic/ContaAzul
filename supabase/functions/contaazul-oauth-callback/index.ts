// ============================================================================
// ContaAzul OAuth Callback - Supabase Edge Function
// Version: 2.0.0 - CORREÇÃO CRÍTICA
// Purpose: Handle OAuth callback and exchange code for tokens
//
// BREAKING CHANGE:
// - Endpoint corrigido: /v1/pessoas/conta-conectada (era /v1/pessoas/empresa)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// ENCRYPTION HELPERS
// ============================================================================

async function encryptToken(plaintext: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const keyMaterial = encoder.encode(Deno.env.get('ENCRYPTION_KEY') || 'default-key-change-in-production');
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedText
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    console.log('OAuth callback received', { code: !!code, state });

    if (!code) {
      throw new Error('Authorization code not found');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OAuth config
    const { data: config } = await supabase
      .from('contaazul_config')
      .select('*')
      .single();

    if (!config) {
      throw new Error('ContaAzul config not found');
    }

    console.log('Exchanging code for token...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.contaazul.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: config.redirect_uri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await tokenResponse.json();
    
    console.log('Token received, fetching company info...');

    // ✅ ENDPOINT CORRETO: /v1/pessoas/conta-conectada (não /v1/pessoas/empresa)
    const companyResponse = await fetch(
      'https://api-v2.contaazul.com/v1/pessoas/conta-conectada',
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!companyResponse.ok) {
      const error = await companyResponse.text();
      throw new Error(`Failed to fetch company info: ${error}`);
    }

    const companyInfo = await companyResponse.json();
    
    console.log('Company info received:', {
      cnpj: companyInfo.cnpj,
      nome: companyInfo.nome,
    });

    // Encrypt tokens
    const accessTokenEnc = await encryptToken(tokens.access_token);
    const refreshTokenEnc = await encryptToken(tokens.refresh_token);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    console.log('Saving connection to database...');

    // Deactivate any existing connections
    await supabase
      .from('contaazul_connections')
      .update({ is_active: false })
      .eq('is_active', true);

    // Save new connection
    const { data: connection, error: connectionError } = await supabase
      .from('contaazul_connections')
      .insert({
        conta_cnpj: companyInfo.cnpj,
        conta_nome: companyInfo.nome,
        conta_email: companyInfo.email,
        conta_id: companyInfo.id,
        access_token_enc: accessTokenEnc,
        refresh_token_enc: refreshTokenEnc,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        status: 'active',
        last_token_refresh: new Date().toISOString(),
      })
      .select()
      .single();

    if (connectionError) {
      throw new Error(`Failed to save connection: ${connectionError.message}`);
    }

    console.log('Connection saved successfully', { id: connection.id });

    // Redirect to success page
    const redirectUrl = new URL(Deno.env.get('FRONTEND_URL') || 'http://localhost:5173');
    redirectUrl.pathname = '/admin/contaazul';
    redirectUrl.searchParams.set('status', 'success');
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString(),
      },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);

    // Redirect to error page
    const redirectUrl = new URL(Deno.env.get('FRONTEND_URL') || 'http://localhost:5173');
    redirectUrl.pathname = '/admin/contaazul';
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error');

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl.toString(),
      },
    });
  }
});

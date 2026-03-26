// ============================================================================
// ContaAzul Sync Categorias Financeiras - Supabase Edge Function
// Version: 1.1.0 - CORRIGIDO
// Purpose: Sync categorias financeiras (plano de contas) from ContaAzul API
// FIX: Endpoint corrigido de /v1/financeiro/categorias para /v1/categorias
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts';

// ============================================================================
// TYPES
// ============================================================================

interface SyncRequest {
  operation: 'full' | 'incremental';
  force?: boolean;
}

interface SyncResult {
  success: boolean;
  job_id?: string;
  operation: string;
  total_fetched: number;
  total_upserted: number;
  total_errors: number;
  duration_ms: number;
  errors?: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

function computeHash(obj: any): string {
  const normalized = JSON.stringify(obj, Object.keys(obj).sort());
  const hash = createHash('sha256');
  hash.update(normalized);
  return hash.toString('hex');
}

async function getValidAccessToken(supabase: any): Promise<string> {
  const { data: connection } = await supabase
    .from('contaazul_connections')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!connection) {
    throw new Error('No active connection found');
  }

  const expiresAt = new Date(connection.token_expires_at);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt < fiveMinutesFromNow) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const refreshResponse = await fetch(
      `${supabaseUrl}/functions/v1/contaazul-token-refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ connection_id: connection.id }),
      }
    );

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    const { data: refreshedConnection } = await supabase
      .from('contaazul_connections')
      .select('access_token_enc')
      .eq('id', connection.id)
      .single();

    return await decryptToken(refreshedConnection.access_token_enc);
  }

  return await decryptToken(connection.access_token_enc);
}

/**
 * Fetch categorias financeiras from ContaAzul API
 * FIXED: GET /v1/categorias (não /v1/financeiro/categorias)
 */
async function fetchCategorias(
  accessToken: string
): Promise<any[]> {
  // ✅ ENDPOINT CORRETO: /v1/categorias
  const url = 'https://api-v2.contaazul.com/v1/categorias';

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch categorias: ${error}`);
  }

  const data = await response.json();
  
  // API retorna array direto
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * Upsert categoria to database
 */
async function upsertCategoria(
  supabase: any,
  categoria: any,
  hash: string
): Promise<void> {
  await supabase.from('contaazul_raw_categorias_financeiras').upsert({
    id: categoria.id,
    nome: categoria.nome,
    tipo: categoria.tipo, // RECEITA ou DESPESA
    id_pai: categoria.id_pai, // Para hierarquia
    nivel: categoria.nivel,
    codigo: categoria.codigo,
    ativa: categoria.ativa,
    sistema: categoria.sistema, // Se é categoria do sistema ou custom
    descricao: categoria.descricao,
    raw_payload: categoria,
    payload_hash: hash,
    last_synced_at: new Date().toISOString(),
  }, {
    onConflict: 'id',
  });
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

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SyncRequest = await req.json();
    const operation = body.operation || 'full';

    console.log(`Starting ${operation} sync for categorias financeiras...`);

    const { data: job, error: jobError } = await supabase
      .from('contaazul_sync_jobs')
      .insert({
        entity_type: 'categorias_financeiras',
        operation_type: operation,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    const jobId = job.id;

    try {
      const accessToken = await getValidAccessToken(supabase);

      console.log('Fetching categorias from ContaAzul API...');
      const categorias = await fetchCategorias(accessToken);
      console.log(`Fetched ${categorias.length} categorias`);

      console.log('Upserting categorias to database...');
      let upserted = 0;
      const errors: string[] = [];

      for (const categoria of categorias) {
        try {
          const hash = computeHash(categoria);
          await upsertCategoria(supabase, categoria, hash);
          upserted++;
        } catch (error) {
          console.error(`Error upserting categoria ${categoria.id}:`, error);
          errors.push(`${categoria.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const duration = Date.now() - startTime;

      await supabase
        .from('contaazul_sync_jobs')
        .update({
          status: errors.length > 0 ? 'partial_success' : 'success',
          completed_at: new Date().toISOString(),
          records_processed: categorias.length,
          records_success: upserted,
          records_error: errors.length,
          error_details: errors.length > 0 ? errors : null,
          duration_ms: duration,
        })
        .eq('id', jobId);

      console.log(`Sync completed in ${duration}ms`);

      const result: SyncResult = {
        success: true,
        job_id: jobId,
        operation,
        total_fetched: categorias.length,
        total_upserted: upserted,
        total_errors: errors.length,
        duration_ms: duration,
        errors: errors.length > 0 ? errors : undefined,
      };

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      await supabase
        .from('contaazul_sync_jobs')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          error_details: [error instanceof Error ? error.message : 'Unknown error'],
          duration_ms: Date.now() - startTime,
        })
        .eq('id', jobId);

      throw error;
    }

  } catch (error) {
    console.error('Sync error:', error);

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

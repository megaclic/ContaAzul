// ============================================================================
// ContaAzul Sync Financeiro - Supabase Edge Function
// Version: 1.0.0
// Purpose: Sync contas a pagar e receber from ContaAzul API
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts';

// ============================================================================
// TYPES
// ============================================================================

interface SyncRequest {
  operation: 'full' | 'incremental';
  type?: 'receber' | 'pagar' | 'both'; // What to sync
  force?: boolean;
}

interface SyncResult {
  success: boolean;
  job_id?: string;
  operation: string;
  type: string;
  total_fetched_receber: number;
  total_fetched_pagar: number;
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
 * Fetch contas a receber from ContaAzul API
 * GET /v1/financeiro/contas-a-receber
 */
async function fetchContasReceber(
  accessToken: string,
  lastSyncDate?: string
): Promise<any[]> {
  const baseUrl = 'https://api-v2.contaazul.com/v1/financeiro/contas-a-receber';
  const params = new URLSearchParams();

  if (lastSyncDate) {
    params.append('data_alteracao_de', lastSyncDate);
  }

  const url = `${baseUrl}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch contas a receber: ${error}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * Fetch contas a pagar from ContaAzul API
 * GET /v1/financeiro/contas-a-pagar
 */
async function fetchContasPagar(
  accessToken: string,
  lastSyncDate?: string
): Promise<any[]> {
  const baseUrl = 'https://api-v2.contaazul.com/v1/financeiro/contas-a-pagar';
  const params = new URLSearchParams();

  if (lastSyncDate) {
    params.append('data_alteracao_de', lastSyncDate);
  }

  const url = `${baseUrl}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch contas a pagar: ${error}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * Upsert conta financeira to database
 */
async function upsertContaFinanceira(
  supabase: any,
  conta: any,
  tipo: 'receber' | 'pagar',
  hash: string
): Promise<void> {
  const tableName = tipo === 'receber' 
    ? 'contaazul_raw_contas_receber' 
    : 'contaazul_raw_contas_pagar';

  await supabase.from(tableName).upsert({
    id: conta.id,
    numero_documento: conta.numero_documento,
    valor: conta.valor,
    data_competencia: conta.data_competencia,
    data_vencimento: conta.data_vencimento,
    data_emissao: conta.data_emissao,
    descricao: conta.descricao,
    situacao: conta.situacao,
    id_pessoa: conta.id_pessoa,
    nome_pessoa: conta.nome_pessoa,
    id_categoria: conta.categoria?.id,
    nome_categoria: conta.categoria?.nome,
    forma_pagamento: conta.forma_pagamento,
    data_alteracao: conta.data_alteracao,
    raw_payload: conta,
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
    let operation = body.operation || 'incremental';
    const type = body.type || 'both';

    console.log(`Starting ${operation} sync for financeiro (${type})...`);

    const { data: job, error: jobError } = await supabase
      .from('contaazul_sync_jobs')
      .insert({
        entity_type: 'financeiro',
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
      let lastSyncDate: string | undefined;

      if (operation === 'incremental') {
        const { data: lastJob } = await supabase
          .from('contaazul_sync_jobs')
          .select('completed_at')
          .eq('entity_type', 'financeiro')
          .eq('status', 'success')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (lastJob?.completed_at) {
          lastSyncDate = lastJob.completed_at;
          console.log(`Incremental sync from: ${lastSyncDate}`);
        } else {
          console.log('No previous sync found, falling back to full sync');
          operation = 'full';
        }
      }

      const accessToken = await getValidAccessToken(supabase);

      let contasReceber: any[] = [];
      let contasPagar: any[] = [];

      // Fetch contas a receber
      if (type === 'receber' || type === 'both') {
        console.log('Fetching contas a receber from ContaAzul API...');
        contasReceber = await fetchContasReceber(accessToken, lastSyncDate);
        console.log(`Fetched ${contasReceber.length} contas a receber`);
      }

      // Fetch contas a pagar
      if (type === 'pagar' || type === 'both') {
        console.log('Fetching contas a pagar from ContaAzul API...');
        contasPagar = await fetchContasPagar(accessToken, lastSyncDate);
        console.log(`Fetched ${contasPagar.length} contas a pagar`);
      }

      console.log('Upserting contas to database...');
      let upserted = 0;
      const errors: string[] = [];

      // Upsert contas a receber
      for (const conta of contasReceber) {
        try {
          const hash = computeHash(conta);
          await upsertContaFinanceira(supabase, conta, 'receber', hash);
          upserted++;
        } catch (error) {
          console.error(`Error upserting conta receber ${conta.id}:`, error);
          errors.push(`receber-${conta.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Upsert contas a pagar
      for (const conta of contasPagar) {
        try {
          const hash = computeHash(conta);
          await upsertContaFinanceira(supabase, conta, 'pagar', hash);
          upserted++;
        } catch (error) {
          console.error(`Error upserting conta pagar ${conta.id}:`, error);
          errors.push(`pagar-${conta.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const duration = Date.now() - startTime;
      const totalFetched = contasReceber.length + contasPagar.length;

      await supabase
        .from('contaazul_sync_jobs')
        .update({
          status: errors.length > 0 ? 'partial_success' : 'success',
          completed_at: new Date().toISOString(),
          records_processed: totalFetched,
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
        type,
        total_fetched_receber: contasReceber.length,
        total_fetched_pagar: contasPagar.length,
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

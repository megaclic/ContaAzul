// ============================================================================
// ContaAzul Sync Vendas - Supabase Edge Function
// Version: 1.0.0
// Purpose: Sync vendas from ContaAzul API
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
 * Fetch vendas from ContaAzul API
 * GET /v1/venda/busca
 */
async function fetchVendas(
  accessToken: string,
  operation: 'full' | 'incremental',
  lastSyncDate?: string
): Promise<any[]> {
  const baseUrl = 'https://api-v2.contaazul.com/v1/venda/busca';
  const allVendas: any[] = [];
  
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      pagina: page.toString(),
      tamanho_pagina: '100',
      campo_ordenado_descendente: 'DATA',
    });

    // For incremental sync, filter by data_alteracao
    if (operation === 'incremental' && lastSyncDate) {
      // Convert to São Paulo timezone format (ISO 8601)
      const date = new Date(lastSyncDate);
      const spDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const formattedDate = spDate.toISOString().slice(0, -1); // Remove Z for local time
      
      params.append('data_alteracao_de', formattedDate);
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
      throw new Error(`Failed to fetch vendas: ${error}`);
    }

    const data = await response.json();
    
    if (data?.itens && Array.isArray(data.itens)) {
      allVendas.push(...data.itens);
      
      // Check if we've fetched all items
      const totalItems = data.total_itens || 0;
      const fetchedSoFar = page * 100;
      hasMore = fetchedSoFar < totalItems;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allVendas;
}

/**
 * Upsert venda to database
 */
async function upsertVenda(
  supabase: any,
  venda: any,
  hash: string
): Promise<void> {
  await supabase.from('contaazul_raw_vendas').upsert({
    id: venda.id,
    numero: venda.numero,
    id_legado: venda.id_legado,
    data_venda: venda.data,
    data_criacao: venda.criado_em,
    data_alteracao: venda.data_alteracao,
    tipo: venda.tipo,
    total: venda.total,
    id_cliente: venda.cliente?.id,
    nome_cliente: venda.cliente?.nome,
    email_cliente: venda.cliente?.email,
    situacao: venda.situacao?.nome,
    origem: venda.origem,
    id_contrato: venda.id_contrato,
    versao: venda.versao,
    raw_payload: venda,
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

    console.log(`Starting ${operation} sync for vendas...`);

    const { data: job, error: jobError } = await supabase
      .from('contaazul_sync_jobs')
      .insert({
        entity_type: 'vendas',
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
          .eq('entity_type', 'vendas')
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

      console.log('Fetching vendas from ContaAzul API...');
      const vendas = await fetchVendas(accessToken, operation, lastSyncDate);
      console.log(`Fetched ${vendas.length} vendas`);

      console.log('Upserting vendas to database...');
      let upserted = 0;
      const errors: string[] = [];

      for (const venda of vendas) {
        try {
          const hash = computeHash(venda);
          await upsertVenda(supabase, venda, hash);
          upserted++;
        } catch (error) {
          console.error(`Error upserting venda ${venda.id}:`, error);
          errors.push(`${venda.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const duration = Date.now() - startTime;

      await supabase
        .from('contaazul_sync_jobs')
        .update({
          status: errors.length > 0 ? 'partial_success' : 'success',
          completed_at: new Date().toISOString(),
          records_processed: vendas.length,
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
        total_fetched: vendas.length,
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

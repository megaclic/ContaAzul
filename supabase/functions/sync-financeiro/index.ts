// ============================================================================
// ContaAzul Sync Financeiro - Supabase Edge Function
// Version: 2.0.0 - CORREÇÃO CRÍTICA
// Purpose: Sync contas a pagar e receber from ContaAzul API
// 
// BREAKING CHANGES:
// - Endpoints corrigidos conforme OpenAPI oficial
// - GET: /v1/financeiro/eventos-financeiros/contas-a-receber/buscar
// - GET: /v1/financeiro/eventos-financeiros/contas-a-pagar/buscar
// - Removido paths incorretos: /v1/financeiro/contas-a-receber e contas-a-pagar
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts';

// ============================================================================
// TYPES
// ============================================================================

interface SyncRequest {
  operation: 'full' | 'incremental';
  type: 'receber' | 'pagar' | 'both';
  force?: boolean;
}

interface SyncResult {
  success: boolean;
  job_id?: string;
  operation: string;
  type: string;
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
 * Fetch contas a receber from ContaAzul API
 * ✅ ENDPOINT CORRETO: GET /v1/financeiro/eventos-financeiros/contas-a-receber/buscar
 */
async function fetchContasReceber(
  accessToken: string,
  operation: 'full' | 'incremental',
  lastSyncDate?: string
): Promise<any[]> {
  // ✅ ENDPOINT CORRETO
  const baseUrl = 'https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar';
  const allContas: any[] = [];
  
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      pagina: page.toString(),
      tamanho_pagina: '100',
    });

    // For incremental sync
    if (operation === 'incremental' && lastSyncDate) {
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
    
    if (data?.items && Array.isArray(data.items)) {
      allContas.push(...data.items);
      hasMore = data.items.length === 100;
      page++;
    } else if (Array.isArray(data)) {
      allContas.push(...data);
      hasMore = data.length === 100;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allContas;
}

/**
 * Fetch contas a pagar from ContaAzul API
 * ✅ ENDPOINT CORRETO: GET /v1/financeiro/eventos-financeiros/contas-a-pagar/buscar
 */
async function fetchContasPagar(
  accessToken: string,
  operation: 'full' | 'incremental',
  lastSyncDate?: string
): Promise<any[]> {
  // ✅ ENDPOINT CORRETO
  const baseUrl = 'https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar';
  const allContas: any[] = [];
  
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      pagina: page.toString(),
      tamanho_pagina: '100',
    });

    // For incremental sync
    if (operation === 'incremental' && lastSyncDate) {
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
    
    if (data?.items && Array.isArray(data.items)) {
      allContas.push(...data.items);
      hasMore = data.items.length === 100;
      page++;
    } else if (Array.isArray(data)) {
      allContas.push(...data);
      hasMore = data.length === 100;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allContas;
}

/**
 * Upsert conta a receber to database
 */
async function upsertContaReceber(
  supabase: any,
  conta: any,
  hash: string
): Promise<void> {
  await supabase.from('contaazul_raw_contas_receber').upsert({
    id: conta.id,
    numero: conta.numero,
    id_cliente: conta.cliente?.id,
    nome_cliente: conta.cliente?.nome,
    valor: conta.valor,
    valor_pago: conta.valor_pago,
    data_vencimento: conta.data_vencimento,
    data_emissao: conta.data_emissao,
    data_pagamento: conta.data_pagamento,
    status: conta.status,
    historico: conta.historico,
    id_categoria: conta.categoria?.id,
    nome_categoria: conta.categoria?.nome,
    id_conta_financeira: conta.conta_financeira?.id,
    nome_conta_financeira: conta.conta_financeira?.nome,
    id_centro_custo: conta.centro_custo?.id,
    nome_centro_custo: conta.centro_custo?.nome,
    observacoes: conta.observacoes,
    raw_payload: conta,
    payload_hash: hash,
    last_synced_at: new Date().toISOString(),
  }, {
    onConflict: 'id',
  });
}

/**
 * Upsert conta a pagar to database
 */
async function upsertContaPagar(
  supabase: any,
  conta: any,
  hash: string
): Promise<void> {
  await supabase.from('contaazul_raw_contas_pagar').upsert({
    id: conta.id,
    numero: conta.numero,
    id_fornecedor: conta.fornecedor?.id,
    nome_fornecedor: conta.fornecedor?.nome,
    valor: conta.valor,
    valor_pago: conta.valor_pago,
    data_vencimento: conta.data_vencimento,
    data_emissao: conta.data_emissao,
    data_pagamento: conta.data_pagamento,
    status: conta.status,
    historico: conta.historico,
    id_categoria: conta.categoria?.id,
    nome_categoria: conta.categoria?.nome,
    id_conta_financeira: conta.conta_financeira?.id,
    nome_conta_financeira: conta.conta_financeira?.nome,
    id_centro_custo: conta.centro_custo?.id,
    nome_centro_custo: conta.centro_custo?.nome,
    observacoes: conta.observacoes,
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
        entity_type: `financeiro_${type}`,
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
          .eq('entity_type', `financeiro_${type}`)
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

      let totalFetched = 0;
      let totalUpserted = 0;
      const errors: string[] = [];

      // Sync Contas a Receber
      if (type === 'receber' || type === 'both') {
        console.log('Fetching contas a receber from ContaAzul API...');
        const contasReceber = await fetchContasReceber(accessToken, operation, lastSyncDate);
        console.log(`Fetched ${contasReceber.length} contas a receber`);
        totalFetched += contasReceber.length;

        console.log('Upserting contas a receber to database...');
        for (const conta of contasReceber) {
          try {
            const hash = computeHash(conta);
            await upsertContaReceber(supabase, conta, hash);
            totalUpserted++;
          } catch (error) {
            console.error(`Error upserting conta a receber ${conta.id}:`, error);
            errors.push(`receber_${conta.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Sync Contas a Pagar
      if (type === 'pagar' || type === 'both') {
        console.log('Fetching contas a pagar from ContaAzul API...');
        const contasPagar = await fetchContasPagar(accessToken, operation, lastSyncDate);
        console.log(`Fetched ${contasPagar.length} contas a pagar`);
        totalFetched += contasPagar.length;

        console.log('Upserting contas a pagar to database...');
        for (const conta of contasPagar) {
          try {
            const hash = computeHash(conta);
            await upsertContaPagar(supabase, conta, hash);
            totalUpserted++;
          } catch (error) {
            console.error(`Error upserting conta a pagar ${conta.id}:`, error);
            errors.push(`pagar_${conta.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      const duration = Date.now() - startTime;

      await supabase
        .from('contaazul_sync_jobs')
        .update({
          status: errors.length > 0 ? 'partial_success' : 'success',
          completed_at: new Date().toISOString(),
          records_processed: totalFetched,
          records_success: totalUpserted,
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
        total_fetched: totalFetched,
        total_upserted: totalUpserted,
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

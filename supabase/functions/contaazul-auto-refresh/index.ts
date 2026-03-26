// ============================================================================
// ContaAzul Auto-Refresh - Supabase Edge Function
// Version: 1.0.0
// Purpose: Automatically refresh tokens that are expiring soon (< 5 minutes)
// Scheduled via pg_cron to run every 2 minutes
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// TYPES
// ============================================================================

interface AutoRefreshResult {
  total_checked: number;
  refreshed: number;
  skipped: number;
  failed: number;
  errors: string[];
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

    console.log('Starting auto-refresh check...');

    const result: AutoRefreshResult = {
      total_checked: 0,
      refreshed: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // ========================================================================
    // Find connections with tokens expiring in < 5 minutes
    // ========================================================================

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: expiringConnections, error: fetchError } = await supabase
      .from('contaazul_connections')
      .select('id, token_expires_at, status')
      .eq('is_active', true)
      .in('status', ['connected', 'expired', 'refresh_failed'])
      .lt('token_expires_at', fiveMinutesFromNow)
      .order('token_expires_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch expiring connections: ${fetchError.message}`);
    }

    result.total_checked = expiringConnections?.length || 0;

    if (!expiringConnections || expiringConnections.length === 0) {
      console.log('No tokens expiring soon.');
      
      return new Response(
        JSON.stringify({
          success: true,
          result,
          message: 'No tokens need refresh',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${expiringConnections.length} connection(s) with expiring tokens`);

    // ========================================================================
    // Trigger refresh for each connection
    // ========================================================================

    for (const connection of expiringConnections) {
      const expiresAt = new Date(connection.token_expires_at);
      const now = new Date();
      const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);

      console.log(
        `Connection ${connection.id}: expires in ${minutesUntilExpiry} minutes (${connection.token_expires_at})`
      );

      try {
        // Call token-refresh Edge Function
        const refreshResponse = await fetch(
          `${supabaseUrl}/functions/v1/contaazul-token-refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              connection_id: connection.id,
            }),
          }
        );

        const refreshResult = await refreshResponse.json();

        if (refreshResult.success) {
          console.log(`✓ Successfully refreshed token for connection ${connection.id}`);
          result.refreshed++;
        } else if (refreshResponse.status === 409) {
          // Refresh already in progress
          console.log(`⊘ Refresh already in progress for connection ${connection.id}`);
          result.skipped++;
        } else {
          console.error(`✗ Failed to refresh token for connection ${connection.id}:`, refreshResult.error);
          result.failed++;
          result.errors.push(`${connection.id}: ${refreshResult.error}`);
        }

      } catch (error) {
        console.error(`✗ Error refreshing connection ${connection.id}:`, error);
        result.failed++;
        result.errors.push(
          `${connection.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    console.log('Auto-refresh check completed:', result);

    // Log summary to audit log
    await supabase.from('contaazul_audit_log').insert({
      event_type: 'auto_refresh_check',
      action: 'system',
      metadata: result,
    });

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Auto-refresh error:', error);

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

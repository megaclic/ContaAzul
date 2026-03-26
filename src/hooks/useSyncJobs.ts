// ============================================================================
// useSyncJobs - React Hook for Sync Jobs Management
// Version: 1.0.0
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface SyncJob {
  id: string;
  entity_type: string;
  operation_type: 'full' | 'incremental';
  status: 'running' | 'success' | 'error' | 'partial_success';
  started_at: string;
  completed_at: string | null;
  records_processed: number | null;
  records_success: number | null;
  records_error: number | null;
  error_details: string[] | null;
  duration_ms: number | null;
  created_at: string;
}

interface TriggerSyncParams {
  entity_type: 'produtos' | 'vendas' | 'pessoas' | 'financeiro';
  operation: 'full' | 'incremental';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const syncJobsKeys = {
  all: ['sync-jobs'] as const,
  list: (filters?: any) => [...syncJobsKeys.all, 'list', filters] as const,
  detail: (id: string) => [...syncJobsKeys.all, 'detail', id] as const,
  latest: (entityType: string) => [...syncJobsKeys.all, 'latest', entityType] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * List all sync jobs with optional filters
 */
export function useSyncJobs(filters?: {
  entity_type?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: syncJobsKeys.list(filters),
    queryFn: async (): Promise<SyncJob[]> => {
      let query = supabase
        .from('contaazul_sync_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50); // Default limit
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 1000, // 10 seconds
  });
}

/**
 * Get specific sync job by ID
 */
export function useSyncJob(jobId: string) {
  return useQuery({
    queryKey: syncJobsKeys.detail(jobId),
    queryFn: async (): Promise<SyncJob | null> => {
      const { data, error } = await supabase
        .from('contaazul_sync_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Auto-refetch if job is running
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

/**
 * Get latest sync job for an entity type
 */
export function useLatestSyncJob(entityType: string) {
  return useQuery({
    queryKey: syncJobsKeys.latest(entityType),
    queryFn: async (): Promise<SyncJob | null> => {
      const { data, error } = await supabase
        .from('contaazul_sync_jobs')
        .select('*')
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Trigger a sync job
 */
export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TriggerSyncParams) => {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key not configured');
      }

      const functionName = `sync-${params.entity_type}`;
      const url = `${supabaseUrl}/functions/v1/${functionName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          operation: params.operation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: syncJobsKeys.all });
      queryClient.invalidateQueries({ 
        queryKey: syncJobsKeys.latest(variables.entity_type) 
      });
    },
  });
}

/**
 * Get sync statistics summary
 */
export function useSyncStatistics() {
  return useQuery({
    queryKey: [...syncJobsKeys.all, 'statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contaazul_sync_jobs')
        .select('entity_type, status, records_processed, records_success, records_error, duration_ms')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        total_jobs: data?.length || 0,
        successful_jobs: data?.filter(j => j.status === 'success').length || 0,
        failed_jobs: data?.filter(j => j.status === 'error').length || 0,
        running_jobs: data?.filter(j => j.status === 'running').length || 0,
        total_records_processed: data?.reduce((sum, j) => sum + (j.records_processed || 0), 0) || 0,
        total_errors: data?.reduce((sum, j) => sum + (j.records_error || 0), 0) || 0,
        avg_duration_ms: data && data.length > 0
          ? Math.round(data.reduce((sum, j) => sum + (j.duration_ms || 0), 0) / data.length)
          : 0,
        success_rate: data && data.length > 0
          ? Math.round((data.filter(j => j.status === 'success').length / data.length) * 100)
          : 0,
      };

      return stats;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get jobs grouped by entity type
 */
export function useJobsByEntity() {
  return useQuery({
    queryKey: [...syncJobsKeys.all, 'by-entity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contaazul_sync_jobs')
        .select('entity_type, status, completed_at')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Group by entity_type
      const grouped: Record<string, {
        latest_sync: string | null;
        status: string | null;
        total_jobs: number;
      }> = {};

      data?.forEach(job => {
        if (!grouped[job.entity_type]) {
          grouped[job.entity_type] = {
            latest_sync: job.completed_at,
            status: job.status,
            total_jobs: 0,
          };
        }
        grouped[job.entity_type].total_jobs++;
      });

      return grouped;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * ContaAzul Integration - useProtocolos Hook
 * 
 * Hook React Query para tracking de eventos assíncronos
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import protocolosAPI from '../../lib/contaazul/api/protocolos';
import { Protocolo, StatusProtocolo } from '../../types/protocolos';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const protocolosKeys = {
  all: ['contaazul', 'protocolos'] as const,
  protocolo: (id: string) => [...protocolosKeys.all, id] as const,
};

// ============================================================================
// PROTOCOLOS
// ============================================================================

/**
 * Hook para acompanhar status de processamento de evento assíncrono
 * 
 * Use quando receber um protocolo_id após criar um evento
 * 
 * @example
 * ```tsx
 * function AcompanharEvento({ protocoloId }: { protocoloId: string }) {
 *   const { data: protocolo, isLoading } = useProtocolo(protocoloId, {
 *     refetchInterval: (data) => {
 *       // Continua polling enquanto estiver processando
 *       if (!data) return 5000; // 5 segundos
 *       if (data.status === 'PENDENTE' || data.status === 'EM_PROCESSAMENTO') {
 *         return 3000; // polling a cada 3 segundos
 *       }
 *       return false; // para polling quando finalizar
 *     },
 *   });
 * 
 *   if (isLoading) return <div>Carregando...</div>;
 * 
 *   return (
 *     <div>
 *       <p>Status: {protocolo?.status}</p>
 *       {protocolo?.status === 'PROCESSADO' && (
 *         <p>Evento criado: {protocolo.id_evento_referencia}</p>
 *       )}
 *       {protocolo?.status === 'ERRO' && (
 *         <p className="text-red-600">Erro: {protocolo.mensagem_erro}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useProtocolo = (
  id: string,
  options?: Omit<UseQueryOptions<Protocolo>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: protocolosKeys.protocolo(id),
    queryFn: () => protocolosAPI.protocolos.getById(id),
    enabled: !!id,
    staleTime: 0, // Sempre busca dados frescos (protocolo muda rápido)
    ...options,
  });
};

// ============================================================================
// HELPER: Polling até completar
// ============================================================================

/**
 * Hook com polling automático até o protocolo ser processado ou dar erro
 * 
 * Para quando finalizar automaticamente
 * 
 * @example
 * ```tsx
 * const { data, isProcessing } = useProtocoloComPolling(protocoloId);
 * 
 * if (isProcessing) {
 *   return <Spinner />;
 * }
 * 
 * if (data?.status === 'ERRO') {
 *   return <ErrorAlert message={data.mensagem_erro} />;
 * }
 * 
 * return <SuccessMessage eventoId={data?.id_evento_referencia} />;
 * ```
 */
export const useProtocoloComPolling = (
  id: string,
  options?: Omit<UseQueryOptions<Protocolo>, 'queryKey' | 'queryFn' | 'refetchInterval'>
) => {
  const query = useProtocolo(id, {
    refetchInterval: (data) => {
      if (!data) return 5000; // 5 segundos inicial
      
      const statusEmAndamento: StatusProtocolo[] = ['PENDENTE', 'EM_PROCESSAMENTO'];
      
      if (statusEmAndamento.includes(data.status)) {
        return 3000; // polling a cada 3 segundos
      }
      
      return false; // para quando finalizar
    },
    ...options,
  });

  const isProcessing = 
    query.data?.status === 'PENDENTE' || 
    query.data?.status === 'EM_PROCESSAMENTO';

  return {
    ...query,
    isProcessing,
    isSuccess: query.data?.status === 'PROCESSADO',
    isError: query.data?.status === 'ERRO',
    isCanceled: query.data?.status === 'CANCELADO',
  };
};

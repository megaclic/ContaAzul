// ============================================================================
// HealthDashboard - ContaAzul Integration Health Monitoring
// Version: 1.0.0
// ============================================================================

import { useContaAzulAuth } from '@/hooks/useContaAzulAuth';
import { useSyncStatistics, useJobsByEntity } from '@/hooks/useSyncJobs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function HealthDashboard() {
  const { tokenInfo, connection, isLoading: authLoading } = useContaAzulAuth();
  const { data: stats, isLoading: statsLoading } = useSyncStatistics();
  const { data: jobsByEntity, isLoading: entitiesLoading } = useJobsByEntity();

  const isLoading = authLoading || statsLoading || entitiesLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const connectionHealthy = connection?.status === 'connected' && !tokenInfo.isExpired;
  const successRate = stats?.success_rate || 0;
  const hasRunningJobs = (stats?.running_jobs || 0) > 0;

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* OVERVIEW METRICS */}
      {/* ================================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Connection Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conexão</CardTitle>
            {connectionHealthy ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectionHealthy ? 'Ativa' : 'Inativa'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tokenInfo.expiresInMinutes !== null
                ? `Expira em ${tokenInfo.expiresInMinutes}min`
                : 'Token expirado'}
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.successful_jobs || 0} de {stats?.total_jobs || 0} jobs
            </p>
          </CardContent>
        </Card>

        {/* Total Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registros Processados</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.total_records_processed || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_errors || 0} erros
            </p>
          </CardContent>
        </Card>

        {/* Avg Duration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats?.avg_duration_ms || 0) / 1000)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por job de sincronização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* STATUS SUMMARY */}
      {/* ================================================================ */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status Atual
            </CardTitle>
            <CardDescription>Visão geral do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Connection */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conexão ContaAzul:</span>
              <Badge variant={connectionHealthy ? 'default' : 'destructive'}>
                {connectionHealthy ? 'OK' : 'Erro'}
              </Badge>
            </div>

            {/* Token Expiry */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token válido por:</span>
              <span className="text-sm text-muted-foreground">
                {tokenInfo.expiresInMinutes !== null
                  ? `${tokenInfo.expiresInMinutes} minutos`
                  : 'Expirado'}
              </span>
            </div>

            {/* Running Jobs */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Jobs em execução:</span>
              <Badge variant={hasRunningJobs ? 'default' : 'secondary'}>
                {stats?.running_jobs || 0}
              </Badge>
            </div>

            {/* Failed Jobs */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Jobs com erro:</span>
              <Badge variant={stats?.failed_jobs ? 'destructive' : 'secondary'}>
                {stats?.failed_jobs || 0}
              </Badge>
            </div>

            {/* Conta Conectada */}
            {connection?.conta_conectada_nome && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium">Conta Conectada:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {connection.conta_conectada_nome}
                </p>
                {connection.conta_conectada_cnpj && (
                  <p className="text-xs text-muted-foreground">
                    CNPJ: {connection.conta_conectada_cnpj}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Última Sincronização
            </CardTitle>
            <CardDescription>Por tipo de entidade</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsByEntity && Object.keys(jobsByEntity).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(jobsByEntity).map(([entityType, info]) => (
                  <div key={entityType} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{entityType}</p>
                      <p className="text-xs text-muted-foreground">
                        {info.latest_sync
                          ? new Date(info.latest_sync).toLocaleString('pt-BR')
                          : 'Nunca sincronizado'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        info.status === 'success'
                          ? 'default'
                          : info.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {info.status === 'success' && '✓'}
                      {info.status === 'error' && '✗'}
                      {info.status === 'running' && '⟳'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma sincronização realizada ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* WARNINGS & ALERTS */}
      {/* ================================================================ */}
      {(!connectionHealthy || tokenInfo.shouldRefresh || stats?.failed_jobs > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!connectionHealthy && (
              <p className="text-sm text-yellow-800">
                ⚠️ Conexão com ContaAzul inativa. Reconecte para continuar sincronizando.
              </p>
            )}
            {tokenInfo.shouldRefresh && (
              <p className="text-sm text-yellow-800">
                ⚠️ Token expira em breve. O sistema tentará renovar automaticamente.
              </p>
            )}
            {stats?.failed_jobs > 0 && (
              <p className="text-sm text-yellow-800">
                ⚠️ Existem {stats.failed_jobs} job(s) com erro. Verifique o histórico.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

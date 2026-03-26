// ============================================================================
// ConnectionStatus - Display ContaAzul connection status
// Version: 1.0.0
// ============================================================================

import { useContaAzulAuth } from '@/hooks/useContaAzulAuth';
import { formatExpiryTime, getTokenStatusColor } from '@/lib/contaazul/tokenHelpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  LogOut, 
  RefreshCw,
  Building2 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function ConnectionStatus() {
  const { 
    isAuthenticated, 
    isLoading, 
    connection, 
    tokenInfo,
    logout,
    isLoggingOut,
    refetchConnection 
  } = useContaAzulAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const statusColor = getTokenStatusColor(tokenInfo.expiresAt);
  const expiryText = formatExpiryTime(tokenInfo.expiresAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Status da Conexão
              {isAuthenticated ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </CardTitle>
            <CardDescription>
              Integração com ContaAzul API v2
            </CardDescription>
          </div>
          <Badge 
            variant={isAuthenticated ? 'default' : 'destructive'}
            className="text-sm"
          >
            {isAuthenticated ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Details */}
        {connection && (
          <div className="space-y-3">
            {/* Conta Conectada */}
            {connection.conta_conectada_nome && (
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {connection.conta_conectada_nome}
                  </p>
                  {connection.conta_conectada_cnpj && (
                    <p className="text-xs text-muted-foreground">
                      CNPJ: {connection.conta_conectada_cnpj}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Token Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 text-${statusColor}-600`} />
                <span className="text-sm font-medium">Token expira em:</span>
              </div>
              <Badge variant={statusColor === 'green' ? 'default' : 'destructive'}>
                {expiryText}
              </Badge>
            </div>

            {/* Last Used */}
            {connection.last_used_at && (
              <div className="text-xs text-muted-foreground">
                Último uso: {new Date(connection.last_used_at).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchConnection()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          {isAuthenticated && (
            <Button
              variant="destructive"
              size="sm"
              onClick={logout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Desconectando...' : 'Desconectar'}
            </Button>
          )}
        </div>

        {/* Warning if token expires soon */}
        {tokenInfo.shouldRefresh && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Token expira em breve. Reconecte para evitar interrupções.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

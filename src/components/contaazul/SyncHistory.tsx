// ============================================================================
// SyncHistory - Sync Jobs History Viewer
// Version: 1.0.0
// ============================================================================

import { useState } from 'react';
import { useSyncJobs, useTriggerSync } from '@/hooks/useSyncJobs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  RefreshCw, 
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Play
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function SyncHistory() {
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: jobs, isLoading, refetch } = useSyncJobs({
    entity_type: entityFilter === 'all' ? undefined : entityFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
  });

  const triggerSync = useTriggerSync();

  const toggleRow = (jobId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sucesso
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Erro
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3 animate-spin" />
            Executando
          </Badge>
        );
      case 'partial_success':
        return (
          <Badge variant="secondary" className="gap-1">
            Parcial
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRetry = async (entityType: string) => {
    try {
      await triggerSync.mutateAsync({
        entity_type: entityType as any,
        operation: 'incremental',
      });
    } catch (error) {
      console.error('Failed to retry sync:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Sincronizações</CardTitle>
            <CardDescription>Últimos 50 jobs executados</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Entidade</label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="produtos">Produtos</SelectItem>
                <SelectItem value="vendas">Vendas</SelectItem>
                <SelectItem value="pessoas">Pessoas</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
                <SelectItem value="partial_success">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Processados</TableHead>
                <TableHead className="text-right">Sucessos</TableHead>
                <TableHead className="text-right">Erros</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Conclusão</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <Collapsible
                    key={job.id}
                    open={expandedRows.has(job.id)}
                    onOpenChange={() => toggleRow(job.id)}
                    asChild
                  >
                    <>
                      <TableRow className="cursor-pointer">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedRows.has(job.id) ? 'transform rotate-180' : ''
                                }`}
                              />
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium capitalize">
                          {job.entity_type}
                        </TableCell>
                        <TableCell className="capitalize">{job.operation_type}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-right">
                          {job.records_processed?.toLocaleString('pt-BR') || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {job.records_success?.toLocaleString('pt-BR') || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {job.records_error?.toLocaleString('pt-BR') || '-'}
                        </TableCell>
                        <TableCell>{formatDuration(job.duration_ms)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(job.started_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(job.completed_at)}
                        </TableCell>
                        <TableCell>
                          {job.status === 'error' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(job.entity_type);
                              }}
                              disabled={triggerSync.isPending}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded content */}
                      <TableRow>
                        <TableCell colSpan={11} className="p-0 border-0">
                          <CollapsibleContent>
                            <div className="p-4 bg-muted/50 border-t">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium">Job ID:</span>
                                  <span className="text-sm text-muted-foreground ml-2 font-mono">
                                    {job.id}
                                  </span>
                                </div>

                                {job.error_details && job.error_details.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium">Erros:</span>
                                    <ul className="mt-1 space-y-1">
                                      {job.error_details.map((error, idx) => (
                                        <li
                                          key={idx}
                                          className="text-sm text-red-600 font-mono"
                                        >
                                          • {error}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </TableCell>
                      </TableRow>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Nenhum job encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

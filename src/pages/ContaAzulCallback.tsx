// ============================================================================
// OAuth Callback Page - Handles ContaAzul OAuth redirect
// Version: 1.0.0
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContaAzulAuth } from '@/hooks/useContaAzulAuth';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContaAzulCallback() {
  const navigate = useNavigate();
  const { processCallback } = useContaAzulAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processando autenticação...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        setMessage('Validando credenciais...');

        await processCallback();

        setStatus('success');
        setMessage('Autenticação concluída com sucesso!');

        // Redirect to admin page after 2 seconds
        setTimeout(() => {
          navigate('/admin/contaazul');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'Erro ao processar autenticação'
        );

        // Redirect to config page after 3 seconds
        setTimeout(() => {
          navigate('/admin/contaazul/config');
        }, 3000);
      }
    };

    handleCallback();
  }, [processCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {status === 'processing' && 'Conectando ao ContaAzul'}
            {status === 'success' && 'Sucesso!'}
            {status === 'error' && 'Erro na Autenticação'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <p className="text-sm text-center text-muted-foreground">
              Redirecionando para o painel...
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-center text-muted-foreground">
              Redirecionando para configuração...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

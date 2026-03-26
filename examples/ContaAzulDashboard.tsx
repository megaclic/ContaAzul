/**
 * Exemplo de Componente - Dashboard ContaAzul
 * 
 * Demonstra uso completo da integração:
 * - Autenticação OAuth
 * - Listagem de dados
 * - Criação de registros
 * - Error handling
 */

import { useState } from 'react';
import { useContaAzulAuth } from '../hooks/contaazul/useContaAzulAuth';
import { useProdutos, useCreateProduto } from '../hooks/contaazul/useProdutos';
import { usePessoas } from '../hooks/contaazul/usePessoas';
import { useContasReceber, useCreateContaReceber } from '../hooks/contaazul/useFinanceiro';
import { useEmpresaConectada } from '../hooks/contaazul/usePessoas';

export function ContaAzulDashboard() {
  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================
  
  const { isAuthenticated, login, logout, error: authError } = useContaAzulAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Conectar ContaAzul</h1>
        <p className="text-gray-600">Conecte sua conta ContaAzul para começar</p>
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {authError}
          </div>
        )}
        <button
          onClick={login}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Conectar ContaAzul
        button>
      </div>
    );
  }

  // ============================================================================
  // DASHBOARD AUTENTICADO
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Header onLogout={logout} />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <EmpresaInfo />
        <ProductsSection />
        <CustomersSection />
        <ReceivablesSection />
      </div>
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Dashboard ContaAzul</h1>
      <button
        onClick={onLogout}
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
      >
        Desconectar
      </button>
    </div>
  );
}

// ============================================================================
// EMPRESA CONECTADA
// ============================================================================

function EmpresaInfo() {
  const { data: empresa, isLoading } = useEmpresaConectada();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!empresa) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">{empresa.razao_social}</h2>
      <p className="text-gray-600">CNPJ: {empresa.documento}</p>
      <p className="text-gray-600">Email: {empresa.email}</p>
    </div>
  );
}

// ============================================================================
// PRODUTOS
// ============================================================================

function ProductsSection() {
  const { data, isLoading, error } = useProdutos({
    status: 'ATIVO',
    tamanho_pagina: 10,
  });

  const createMutation = useCreateProduto();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = () => {
    createMutation.mutate(
      {
        nome: 'Produto Teste',
        codigo_sku: 'TEST-001',
        status: 'ATIVO',
        estoque: {
          estoque_disponivel: 100,
          valor_venda: 50.0,
        },
      },
      {
        onSuccess: () => {
          setShowForm(false);
          alert('Produto criado com sucesso!');
        },
      }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Produtos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'Cancelar' : 'Novo Produto'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <p className="mb-2">Criar produto de teste</p>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {createMutation.isPending ? 'Criando...' : 'Criar'}
          </button>
        </div>
      )}

      {isLoading && <p>Carregando produtos...</p>}
      {error && <p className="text-red-600">Erro: {error.message}</p>}

      {data && (
        <div className="space-y-2">
          {data.items.map((produto) => (
            <div key={produto.id} className="border-b pb-2">
              <p className="font-medium">{produto.nome}</p>
              <p className="text-sm text-gray-600">
                SKU: {produto.codigo} | Estoque: {produto.saldo} | R${' '}
                {produto.valor_venda?.toFixed(2)}
              </p>
            </div>
          ))}
          <p className="text-sm text-gray-500 mt-4">
            Total: {data.total_items} produtos
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CLIENTES
// ============================================================================

function CustomersSection() {
  const { data, isLoading } = usePessoas({
    tipo_perfil: 'Cliente',
    tamanho_pagina: 5,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Clientes</h2>

      {isLoading && <p>Carregando clientes...</p>}

      {data && (
        <div className="space-y-2">
          {data.items.map((pessoa) => (
            <div key={pessoa.id} className="border-b pb-2">
              <p className="font-medium">{pessoa.nome}</p>
              <p className="text-sm text-gray-600">
                {pessoa.documento} | {pessoa.email}
              </p>
            </div>
          ))}
          <p className="text-sm text-gray-500 mt-4">
            Total: {data.total_items} clientes
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONTAS A RECEBER
// ============================================================================

function ReceivablesSection() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const { data, isLoading } = useContasReceber({
    data_vencimento_de: today.toISOString().split('T')[0],
    data_vencimento_ate: nextMonth.toISOString().split('T')[0],
    tamanho_pagina: 5,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Contas a Receber</h2>

      {isLoading && <p>Carregando contas...</p>}

      {data && (
        <div className="space-y-2">
          {data.items.map((parcela) => (
            <div key={parcela.id} className="border-b pb-2">
              <p className="font-medium">{parcela.descricao}</p>
              <p className="text-sm text-gray-600">
                Vencimento: {parcela.data_vencimento} | R${' '}
                {parcela.valor_liquido_total.toFixed(2)}
              </p>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  parcela.status === 'EM_ABERTO'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {parcela.status}
              </span>
            </div>
          ))}
          <p className="text-sm text-gray-500 mt-4">
            Total: {data.total_items} contas
          </p>
        </div>
      )}
    </div>
  );
}

export default ContaAzulDashboard;

-- ============================================================================
-- ContaAzul Integration - Migration 003
-- Add tables for: Serviços, Contratos, Categorias Financeiras
-- Date: 2026-03-26
-- ============================================================================

-- ============================================================================
-- TABLE: contaazul_raw_servicos
-- ============================================================================

CREATE TABLE IF NOT EXISTS contaazul_raw_servicos (
  id UUID PRIMARY KEY,
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_venda NUMERIC(15, 2),
  tipo TEXT,
  status TEXT,
  id_categoria UUID,
  nome_categoria TEXT,
  unidade_medida TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE,
  data_alteracao TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raw_servicos_codigo ON contaazul_raw_servicos(codigo);
CREATE INDEX IF NOT EXISTS idx_raw_servicos_nome ON contaazul_raw_servicos(nome);
CREATE INDEX IF NOT EXISTS idx_raw_servicos_status ON contaazul_raw_servicos(status);
CREATE INDEX IF NOT EXISTS idx_raw_servicos_data_alteracao ON contaazul_raw_servicos(data_alteracao);
CREATE INDEX IF NOT EXISTS idx_raw_servicos_last_synced ON contaazul_raw_servicos(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_raw_servicos_hash ON contaazul_raw_servicos(payload_hash);

-- Trigger for updated_at
CREATE TRIGGER update_contaazul_raw_servicos_updated_at
  BEFORE UPDATE ON contaazul_raw_servicos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE contaazul_raw_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON contaazul_raw_servicos FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: contaazul_raw_contratos
-- ============================================================================

CREATE TABLE IF NOT EXISTS contaazul_raw_contratos (
  id UUID PRIMARY KEY,
  numero INTEGER,
  id_cliente UUID,
  nome_cliente TEXT,
  data_inicio DATE,
  data_fim DATE,
  status TEXT,
  tipo TEXT,
  periodicidade TEXT, -- MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
  valor_total NUMERIC(15, 2),
  valor_parcela NUMERIC(15, 2),
  quantidade_parcelas INTEGER,
  dia_vencimento INTEGER,
  descricao TEXT,
  observacoes TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE,
  data_alteracao TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raw_contratos_numero ON contaazul_raw_contratos(numero);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_id_cliente ON contaazul_raw_contratos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_status ON contaazul_raw_contratos(status);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_periodicidade ON contaazul_raw_contratos(periodicidade);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_data_inicio ON contaazul_raw_contratos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_data_fim ON contaazul_raw_contratos(data_fim);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_data_alteracao ON contaazul_raw_contratos(data_alteracao);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_last_synced ON contaazul_raw_contratos(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_raw_contratos_hash ON contaazul_raw_contratos(payload_hash);

-- Trigger for updated_at
CREATE TRIGGER update_contaazul_raw_contratos_updated_at
  BEFORE UPDATE ON contaazul_raw_contratos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE contaazul_raw_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON contaazul_raw_contratos FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: contaazul_raw_categorias_financeiras
-- ============================================================================

CREATE TABLE IF NOT EXISTS contaazul_raw_categorias_financeiras (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT, -- RECEITA ou DESPESA
  id_pai UUID, -- Para hierarquia de categorias
  nivel INTEGER,
  codigo TEXT,
  ativa BOOLEAN DEFAULT true,
  sistema BOOLEAN DEFAULT false, -- Se é categoria do sistema ou custom
  descricao TEXT,
  raw_payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raw_categorias_nome ON contaazul_raw_categorias_financeiras(nome);
CREATE INDEX IF NOT EXISTS idx_raw_categorias_tipo ON contaazul_raw_categorias_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_raw_categorias_id_pai ON contaazul_raw_categorias_financeiras(id_pai);
CREATE INDEX IF NOT EXISTS idx_raw_categorias_nivel ON contaazul_raw_categorias_financeiras(nivel);
CREATE INDEX IF NOT EXISTS idx_raw_categorias_ativa ON contaazul_raw_categorias_financeiras(ativa);
CREATE INDEX IF NOT EXISTS idx_raw_categorias_sistema ON contaazul_raw_categorias_financeiras(sistema);
CREATE INDEX IF NOT EXISTS idx_raw_categorias_last_synced ON contaazul_raw_categorias_financeiras(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_raw_categorias_hash ON contaazul_raw_categorias_financeiras(payload_hash);

-- Trigger for updated_at
CREATE TRIGGER update_contaazul_raw_categorias_financeiras_updated_at
  BEFORE UPDATE ON contaazul_raw_categorias_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE contaazul_raw_categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON contaazul_raw_categorias_financeiras FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE contaazul_raw_servicos IS 'Serviços sincronizados do ContaAzul';
COMMENT ON TABLE contaazul_raw_contratos IS 'Contratos de vendas recorrentes sincronizados do ContaAzul';
COMMENT ON TABLE contaazul_raw_categorias_financeiras IS 'Categorias financeiras (plano de contas) sincronizadas do ContaAzul';

COMMENT ON COLUMN contaazul_raw_categorias_financeiras.id_pai IS 'ID da categoria pai (para hierarquia)';
COMMENT ON COLUMN contaazul_raw_categorias_financeiras.nivel IS 'Nível na hierarquia (1 = raiz, 2 = filho, etc)';
COMMENT ON COLUMN contaazul_raw_categorias_financeiras.sistema IS 'Se true, é categoria padrão do sistema (não pode ser editada)';

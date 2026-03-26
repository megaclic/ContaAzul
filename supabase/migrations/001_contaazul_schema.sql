-- ============================================================================
-- ContaAzul Integration - Database Schema Migration
-- Version: 1.0.0
-- Date: 2026-03-26
-- ============================================================================

-- ============================================================================
-- 1. CONFIGURATION TABLES
-- ============================================================================

-- OAuth Configuration (single row)
CREATE TABLE IF NOT EXISTS contaazul_config (
  id integer PRIMARY KEY DEFAULT 1,
  client_id text,
  client_secret text,
  redirect_uri text,
  auth_base_url text DEFAULT 'https://auth.contaazul.com/login',
  token_url text DEFAULT 'https://auth.contaazul.com/oauth2/token',
  api_base_url text DEFAULT 'https://api-v2.contaazul.com/v1',
  scope text DEFAULT 'openid+profile+aws.cognito.signin.user.admin',
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT single_config CHECK (id = 1)
);

-- OAuth Connections (encrypted tokens)
CREATE TABLE IF NOT EXISTS contaazul_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'ContaAzul Connection',
  access_token_enc text, -- AES-GCM encrypted
  refresh_token_enc text, -- AES-GCM encrypted
  token_expires_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  is_active boolean DEFAULT true,
  
  -- Metadata
  conta_conectada_cnpj text,
  conta_conectada_nome text,
  last_used_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. SYNC CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS contaazul_sync_config (
  id integer PRIMARY KEY DEFAULT 1,
  
  -- Global settings
  auto_sync_enabled boolean DEFAULT true,
  
  -- Per-entity settings
  produtos_sync_enabled boolean DEFAULT true,
  produtos_sync_frequency text DEFAULT '1h', -- '5m', '15m', '1h', '6h', '1d'
  produtos_last_full_sync timestamptz,
  
  vendas_sync_enabled boolean DEFAULT true,
  vendas_sync_frequency text DEFAULT '5m',
  vendas_last_full_sync timestamptz,
  
  pessoas_sync_enabled boolean DEFAULT true,
  pessoas_sync_frequency text DEFAULT '1h',
  pessoas_last_full_sync timestamptz,
  
  servicos_sync_enabled boolean DEFAULT true,
  servicos_sync_frequency text DEFAULT '1h',
  servicos_last_full_sync timestamptz,
  
  contratos_sync_enabled boolean DEFAULT true,
  contratos_sync_frequency text DEFAULT '1h',
  contratos_last_full_sync timestamptz,
  
  categorias_sync_enabled boolean DEFAULT true,
  categorias_sync_frequency text DEFAULT '1d',
  categorias_last_full_sync timestamptz,
  
  centros_custo_sync_enabled boolean DEFAULT true,
  centros_custo_sync_frequency text DEFAULT '1d',
  centros_custo_last_full_sync timestamptz,
  
  contas_receber_sync_enabled boolean DEFAULT true,
  contas_receber_sync_frequency text DEFAULT '15m',
  contas_receber_last_full_sync timestamptz,
  
  contas_pagar_sync_enabled boolean DEFAULT true,
  contas_pagar_sync_frequency text DEFAULT '15m',
  contas_pagar_last_full_sync timestamptz,
  
  baixas_sync_enabled boolean DEFAULT true,
  baixas_sync_frequency text DEFAULT '15m',
  baixas_last_full_sync timestamptz,
  
  cobrancas_sync_enabled boolean DEFAULT true,
  cobrancas_sync_frequency text DEFAULT '15m',
  cobrancas_last_full_sync timestamptz,
  
  nfe_sync_enabled boolean DEFAULT false, -- On-demand
  nfse_sync_enabled boolean DEFAULT false, -- On-demand
  
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT single_sync_config CHECK (id = 1)
);

-- Insert default config
INSERT INTO contaazul_sync_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. SYNC JOBS & QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contaazul_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'produtos', 'vendas', etc
  operation text NOT NULL, -- 'full_sync' | 'incremental'
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'success' | 'error'
  
  -- Execution
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  
  -- Results
  records_synced integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_new integer DEFAULT 0,
  records_deleted integer DEFAULT 0,
  
  -- Error handling
  error_message text,
  error_stack text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  
  -- Metadata
  metadata jsonb, -- { since: ISO date, filters: {...}, ... }
  
  created_at timestamptz DEFAULT now()
);

-- Indexes for job processing
CREATE INDEX IF NOT EXISTS idx_sync_jobs_pending 
  ON contaazul_sync_jobs(status, next_retry_at) 
  WHERE status IN ('pending', 'error');

CREATE INDEX IF NOT EXISTS idx_sync_jobs_entity 
  ON contaazul_sync_jobs(entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status 
  ON contaazul_sync_jobs(status, created_at DESC);

-- Dead Letter Queue
CREATE TABLE IF NOT EXISTS contaazul_sync_dead_letter (
  id uuid PRIMARY KEY,
  job_data jsonb NOT NULL,
  error_message text,
  error_stack text,
  retry_count integer,
  failed_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. RAW DATA TABLES (Data Lake)
-- ============================================================================

-- Produtos
CREATE TABLE IF NOT EXISTS contaazul_raw_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields (for query performance)
  codigo text,
  nome text,
  valor_venda numeric,
  status text,
  tipo text, -- 'PRODUTO' | 'SERVICO' | 'KIT'
  data_alteracao timestamptz, -- Do ContaAzul (para incremental sync)
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON contaazul_raw_produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON contaazul_raw_produtos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_synced ON contaazul_raw_produtos(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_produtos_hash ON contaazul_raw_produtos(hash);
CREATE INDEX IF NOT EXISTS idx_produtos_data_alteracao ON contaazul_raw_produtos(data_alteracao DESC);

-- Pessoas (Clientes, Fornecedores, Transportadoras)
CREATE TABLE IF NOT EXISTS contaazul_raw_pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  nome text,
  documento text,
  tipo_perfil text, -- 'Cliente' | 'Fornecedor' | 'Transportadora'
  status text,
  tipo_pessoa text, -- 'FISICA' | 'JURIDICA'
  email text,
  telefone text,
  data_alteracao timestamptz, -- Do ContaAzul (para incremental sync)
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pessoas_documento ON contaazul_raw_pessoas(documento);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo ON contaazul_raw_pessoas(tipo_perfil);
CREATE INDEX IF NOT EXISTS idx_pessoas_status ON contaazul_raw_pessoas(status);
CREATE INDEX IF NOT EXISTS idx_pessoas_nome ON contaazul_raw_pessoas(nome);
CREATE INDEX IF NOT EXISTS idx_pessoas_data_alteracao ON contaazul_raw_pessoas(data_alteracao DESC);

-- Vendas
CREATE TABLE IF NOT EXISTS contaazul_raw_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero integer,
  data_venda date,
  situacao text, -- 'APROVADO' | 'CANCELADO' | 'ESPERANDO_APROVACAO'
  valor_total numeric,
  id_cliente_contaazul text,
  id_vendedor_contaazul text,
  data_alteracao timestamptz, -- Do ContaAzul (para incremental sync)
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendas_numero ON contaazul_raw_vendas(numero);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON contaazul_raw_vendas(data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON contaazul_raw_vendas(id_cliente_contaazul);
CREATE INDEX IF NOT EXISTS idx_vendas_situacao ON contaazul_raw_vendas(situacao);
CREATE INDEX IF NOT EXISTS idx_vendas_data_alteracao ON contaazul_raw_vendas(data_alteracao DESC);

-- Serviços
CREATE TABLE IF NOT EXISTS contaazul_raw_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  codigo text,
  nome text,
  valor numeric,
  status text,
  codigo_iss text,
  aliquota_iss numeric,
  data_alteracao timestamptz, -- Do ContaAzul (para incremental sync)
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicos_codigo ON contaazul_raw_servicos(codigo);
CREATE INDEX IF NOT EXISTS idx_servicos_status ON contaazul_raw_servicos(status);
CREATE INDEX IF NOT EXISTS idx_servicos_data_alteracao ON contaazul_raw_servicos(data_alteracao DESC);

-- Contratos (Vendas Recorrentes)
CREATE TABLE IF NOT EXISTS contaazul_raw_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero integer,
  data_inicio date,
  periodo text, -- 'MENSAL', 'TRIMESTRAL', etc
  valor_total numeric,
  id_cliente_contaazul text,
  dia_vencimento integer,
  data_alteracao timestamptz, -- Do ContaAzul (para incremental sync)
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratos_numero ON contaazul_raw_contratos(numero);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contaazul_raw_contratos(id_cliente_contaazul);
CREATE INDEX IF NOT EXISTS idx_contratos_data_alteracao ON contaazul_raw_contratos(data_alteracao DESC);

-- Categorias Financeiras
CREATE TABLE IF NOT EXISTS contaazul_raw_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  nome text,
  tipo text, -- 'RECEITA' | 'DESPESA'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON contaazul_raw_categorias(tipo);

-- Centros de Custo
CREATE TABLE IF NOT EXISTS contaazul_raw_centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  nome text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_centros_custo_nome ON contaazul_raw_centros_custo(nome);

-- Contas a Receber
CREATE TABLE IF NOT EXISTS contaazul_raw_contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  descricao text,
  data_competencia date,
  valor numeric,
  status text,
  id_cliente_contaazul text,
  id_categoria_contaazul text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_receber_data ON contaazul_raw_contas_receber(data_competencia DESC);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contaazul_raw_contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON contaazul_raw_contas_receber(id_cliente_contaazul);

-- Contas a Pagar
CREATE TABLE IF NOT EXISTS contaazul_raw_contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  descricao text,
  data_competencia date,
  valor numeric,
  status text,
  id_fornecedor_contaazul text,
  id_categoria_contaazul text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_data ON contaazul_raw_contas_pagar(data_competencia DESC);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contaazul_raw_contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON contaazul_raw_contas_pagar(id_fornecedor_contaazul);

-- Baixas (Pagamentos)
CREATE TABLE IF NOT EXISTS contaazul_raw_baixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  id_parcela_contaazul text,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  data_pagamento date,
  valor numeric,
  forma_pagamento text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_baixas_data ON contaazul_raw_baixas(data_pagamento DESC);
CREATE INDEX IF NOT EXISTS idx_baixas_parcela ON contaazul_raw_baixas(id_parcela_contaazul);

-- Cobranças
CREATE TABLE IF NOT EXISTS contaazul_raw_cobrancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  data_vencimento date,
  valor_bruto numeric,
  status text,
  tipo text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_data ON contaazul_raw_cobrancas(data_vencimento DESC);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON contaazul_raw_cobrancas(status);

-- Notas Fiscais Eletrônicas (NFe)
CREATE TABLE IF NOT EXISTS contaazul_raw_nfe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave_acesso text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero text,
  data_emissao date,
  valor_total numeric,
  status text,
  nome_destinatario text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfe_data ON contaazul_raw_nfe(data_emissao DESC);
CREATE INDEX IF NOT EXISTS idx_nfe_status ON contaazul_raw_nfe(status);

-- Notas Fiscais de Serviço (NFS-e)
CREATE TABLE IF NOT EXISTS contaazul_raw_nfse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_contaazul text UNIQUE NOT NULL,
  dados jsonb NOT NULL,
  hash text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  
  -- Extracted fields
  numero text,
  data_emissao date,
  valor_servicos numeric,
  status text,
  nome_tomador text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfse_data ON contaazul_raw_nfse(data_emissao DESC);
CREATE INDEX IF NOT EXISTS idx_nfse_status ON contaazul_raw_nfse(status);

-- ============================================================================
-- 5. AUDIT & MONITORING TABLES
-- ============================================================================

-- Audit Log
CREATE TABLE IF NOT EXISTS contaazul_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'oauth_login', 'sync_started', 'sync_completed', 'error'
  entity_type text, -- 'produtos', 'vendas', etc
  entity_id text, -- ID do registro afetado
  
  -- Event details
  action text, -- 'create', 'update', 'delete', 'sync'
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  
  -- Context
  user_id uuid,
  ip_address inet,
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_event ON contaazul_audit_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON contaazul_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON contaazul_audit_log(created_at DESC);

-- Health Checks Log
CREATE TABLE IF NOT EXISTS contaazul_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type text NOT NULL, -- 'oauth', 'api_reachability', 'sync_freshness', 'rate_limits'
  status text NOT NULL, -- 'healthy', 'degraded', 'down'
  message text,
  response_time_ms integer,
  metadata jsonb,
  
  checked_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_type ON contaazul_health_checks(check_type, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_status ON contaazul_health_checks(status, checked_at DESC);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get last successful sync time for entity
CREATE OR REPLACE FUNCTION get_last_sync_time(p_entity_type text)
RETURNS timestamptz AS $$
  SELECT completed_at
  FROM contaazul_sync_jobs
  WHERE entity_type = p_entity_type
    AND status = 'success'
  ORDER BY completed_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function: Schedule sync job
CREATE OR REPLACE FUNCTION schedule_sync_job(
  p_entity_type text,
  p_operation text DEFAULT 'incremental'
)
RETURNS uuid AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO contaazul_sync_jobs (entity_type, operation, status)
  VALUES (p_entity_type, p_operation, 'pending')
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update sync job status
CREATE OR REPLACE FUNCTION update_sync_job_status(
  p_job_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL,
  p_records_synced integer DEFAULT 0,
  p_records_updated integer DEFAULT 0,
  p_records_new integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  UPDATE contaazul_sync_jobs
  SET 
    status = p_status,
    completed_at = CASE WHEN p_status IN ('success', 'error') THEN now() ELSE NULL END,
    duration_ms = CASE WHEN p_status IN ('success', 'error') THEN EXTRACT(EPOCH FROM (now() - started_at)) * 1000 ELSE NULL END,
    error_message = p_error_message,
    records_synced = p_records_synced,
    records_updated = p_records_updated,
    records_new = p_records_new
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type text,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO contaazul_audit_log (
    event_type, entity_type, entity_id, action, metadata
  )
  VALUES (
    p_event_type, p_entity_type, p_entity_id, p_action, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE contaazul_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE contaazul_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything
CREATE POLICY "Service role full access on config"
  ON contaazul_config
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access on connections"
  ON contaazul_connections
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Authenticated users can read (but not modify tokens)
CREATE POLICY "Authenticated users can read config"
  ON contaazul_config
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read connection status"
  ON contaazul_connections
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on contaazul_config
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_config_updated_at
  BEFORE UPDATE ON contaazul_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_connections_updated_at
  BEFORE UPDATE ON contaazul_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sync_config_updated_at
  BEFORE UPDATE ON contaazul_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Triggers for raw tables
CREATE TRIGGER trigger_raw_produtos_updated_at
  BEFORE UPDATE ON contaazul_raw_produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_pessoas_updated_at
  BEFORE UPDATE ON contaazul_raw_pessoas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_vendas_updated_at
  BEFORE UPDATE ON contaazul_raw_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_servicos_updated_at
  BEFORE UPDATE ON contaazul_raw_servicos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_contratos_updated_at
  BEFORE UPDATE ON contaazul_raw_contratos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_categorias_updated_at
  BEFORE UPDATE ON contaazul_raw_categorias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_centros_custo_updated_at
  BEFORE UPDATE ON contaazul_raw_centros_custo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_contas_receber_updated_at
  BEFORE UPDATE ON contaazul_raw_contas_receber
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_contas_pagar_updated_at
  BEFORE UPDATE ON contaazul_raw_contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_baixas_updated_at
  BEFORE UPDATE ON contaazul_raw_baixas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_cobrancas_updated_at
  BEFORE UPDATE ON contaazul_raw_cobrancas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_nfe_updated_at
  BEFORE UPDATE ON contaazul_raw_nfe
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_raw_nfse_updated_at
  BEFORE UPDATE ON contaazul_raw_nfse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 9. INITIAL DATA
-- ============================================================================

-- Insert default OAuth config (empty, to be filled by user)
INSERT INTO contaazul_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

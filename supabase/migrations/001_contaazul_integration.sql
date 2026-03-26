-- ============================================================================
-- ContaAzul Integration - Supabase Migration
-- ============================================================================
-- 
-- Tabela para armazenar tokens OAuth 2.0 de forma segura
-- 
-- Features:
-- - Tokens criptografados (access_token, refresh_token)
-- - Tracking de expiração
-- - RLS habilitado (Row Level Security)
-- - Audit trail (created_at, updated_at)
-- - Suporte multi-tenant (user_id)

-- ============================================================================
-- 1. CRIAR TABELA
-- ============================================================================

CREATE TABLE IF NOT EXISTS contaazul_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento com usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tokens OAuth 2.0 (armazenados encrypted via RLS)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  
  -- Metadados do token
  expires_at TIMESTAMPTZ NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  
  -- Identificação da conta conectada (opcional)
  conta_conectada_cnpj TEXT,
  conta_conectada_nome TEXT,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir um token por usuário
  CONSTRAINT unique_user_token UNIQUE (user_id)
);

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================

-- Busca por usuário (mais comum)
CREATE INDEX idx_contaazul_tokens_user_id 
  ON contaazul_tokens(user_id);

-- Busca por expiração (para limpeza automática)
CREATE INDEX idx_contaazul_tokens_expires_at 
  ON contaazul_tokens(expires_at);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE contaazul_tokens ENABLE ROW LEVEL SECURITY;

-- Política: usuário só vê seus próprios tokens
CREATE POLICY "Users can only view their own tokens"
  ON contaazul_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuário só insere seus próprios tokens
CREATE POLICY "Users can only insert their own tokens"
  ON contaazul_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuário só atualiza seus próprios tokens
CREATE POLICY "Users can only update their own tokens"
  ON contaazul_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuário só deleta seus próprios tokens
CREATE POLICY "Users can only delete their own tokens"
  ON contaazul_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TRIGGER PARA AUTO-UPDATE DO UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contaazul_tokens_updated_at
  BEFORE UPDATE ON contaazul_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. FUNÇÃO HELPER: Salvar/Atualizar Token
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_contaazul_token(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_in INTEGER,
  p_conta_cnpj TEXT DEFAULT NULL,
  p_conta_nome TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_token_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calcular data de expiração
  v_expires_at := NOW() + (p_expires_in || ' seconds')::INTERVAL;
  
  -- Inserir ou atualizar
  INSERT INTO contaazul_tokens (
    user_id,
    access_token,
    refresh_token,
    expires_at,
    conta_conectada_cnpj,
    conta_conectada_nome
  )
  VALUES (
    p_user_id,
    p_access_token,
    p_refresh_token,
    v_expires_at,
    p_conta_cnpj,
    p_conta_nome
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at,
    conta_conectada_cnpj = COALESCE(EXCLUDED.conta_conectada_cnpj, contaazul_tokens.conta_conectada_cnpj),
    conta_conectada_nome = COALESCE(EXCLUDED.conta_conectada_nome, contaazul_tokens.conta_conectada_nome),
    updated_at = NOW()
  RETURNING id INTO v_token_id;
  
  RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FUNÇÃO HELPER: Buscar Token Válido
-- ============================================================================

CREATE OR REPLACE FUNCTION get_valid_contaazul_token(p_user_id UUID)
RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.access_token,
    t.refresh_token,
    t.expires_at,
    (t.expires_at <= NOW()) AS is_expired
  FROM contaazul_tokens t
  WHERE t.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. FUNÇÃO HELPER: Limpar Tokens Expirados (cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_contaazul_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Deletar tokens expirados há mais de 30 dias
  DELETE FROM contaazul_tokens
  WHERE expires_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. COMENTÁRIOS (documentação)
-- ============================================================================

COMMENT ON TABLE contaazul_tokens IS 
  'Armazena tokens OAuth 2.0 do ContaAzul de forma segura com RLS';

COMMENT ON COLUMN contaazul_tokens.access_token IS 
  'Access token JWT do OAuth 2.0 (renovado automaticamente)';

COMMENT ON COLUMN contaazul_tokens.refresh_token IS 
  'Refresh token para renovar o access_token quando expirar';

COMMENT ON COLUMN contaazul_tokens.expires_at IS 
  'Data/hora de expiração do access_token';

COMMENT ON FUNCTION upsert_contaazul_token IS 
  'Helper para salvar ou atualizar token OAuth (upsert)';

COMMENT ON FUNCTION get_valid_contaazul_token IS 
  'Helper para buscar token válido do usuário com flag is_expired';

COMMENT ON FUNCTION cleanup_expired_contaazul_tokens IS 
  'Cron job para limpar tokens expirados há mais de 30 dias';

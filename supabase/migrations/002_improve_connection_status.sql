-- ============================================================================
-- Migration 002: Improve Connection Status & Add Helper Functions
-- Version: 1.0.0
-- Date: 2026-03-26
-- ============================================================================

-- ============================================================================
-- 1. UPDATE CONNECTION STATUS CONSTRAINT
-- ============================================================================

-- Drop old constraint
ALTER TABLE contaazul_connections 
  DROP CONSTRAINT IF EXISTS contaazul_connections_status_check;

-- Add new constraint with explicit states
ALTER TABLE contaazul_connections
  ADD CONSTRAINT contaazul_connections_status_check 
  CHECK (status IN (
    'disconnected',
    'connecting',
    'connected',
    'expired',
    'refresh_in_progress',
    'refresh_failed',
    'revoked'
  ));

-- ============================================================================
-- 2. ADD POSTGRESQL ADVISORY LOCK HELPERS
-- ============================================================================

-- Function: Try to acquire advisory lock
CREATE OR REPLACE FUNCTION pg_try_advisory_lock(key integer)
RETURNS boolean AS $$
  SELECT pg_try_advisory_lock(key);
$$ LANGUAGE sql;

-- Function: Release advisory lock
CREATE OR REPLACE FUNCTION pg_advisory_unlock(key integer)
RETURNS boolean AS $$
  SELECT pg_advisory_unlock(key);
$$ LANGUAGE sql;

-- ============================================================================
-- 3. HELPER FUNCTION: Get Active Connection
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_contaazul_connection()
RETURNS TABLE (
  id uuid,
  name text,
  status text,
  token_expires_at timestamptz,
  conta_conectada_cnpj text,
  conta_conectada_nome text,
  last_used_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.status,
    c.token_expires_at,
    c.conta_conectada_cnpj,
    c.conta_conectada_nome,
    c.last_used_at,
    c.created_at,
    c.updated_at
  FROM contaazul_connections c
  WHERE c.is_active = true
  ORDER BY c.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 4. HELPER FUNCTION: Check if Token is Expiring Soon
-- ============================================================================

CREATE OR REPLACE FUNCTION is_token_expiring_soon(
  p_connection_id uuid,
  p_minutes_threshold integer DEFAULT 5
)
RETURNS boolean AS $$
DECLARE
  v_expires_at timestamptz;
  v_threshold timestamptz;
BEGIN
  SELECT token_expires_at INTO v_expires_at
  FROM contaazul_connections
  WHERE id = p_connection_id;
  
  IF v_expires_at IS NULL THEN
    RETURN true; -- Treat null as expired
  END IF;
  
  v_threshold := now() + (p_minutes_threshold || ' minutes')::interval;
  
  RETURN v_expires_at < v_threshold;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 5. HELPER FUNCTION: Get Connections Expiring Soon
-- ============================================================================

CREATE OR REPLACE FUNCTION get_expiring_connections(
  p_minutes_threshold integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  token_expires_at timestamptz,
  minutes_until_expiry integer,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.token_expires_at,
    EXTRACT(EPOCH FROM (c.token_expires_at - now()))::integer / 60 as minutes_until_expiry,
    c.status
  FROM contaazul_connections c
  WHERE 
    c.is_active = true
    AND c.token_expires_at < (now() + (p_minutes_threshold || ' minutes')::interval)
    AND c.status IN ('connected', 'expired', 'refresh_failed')
  ORDER BY c.token_expires_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. HELPER FUNCTION: Update Connection Status
-- ============================================================================

CREATE OR REPLACE FUNCTION update_connection_status(
  p_connection_id uuid,
  p_new_status text
)
RETURNS void AS $$
BEGIN
  -- Validate status
  IF p_new_status NOT IN (
    'disconnected', 'connecting', 'connected', 
    'expired', 'refresh_in_progress', 'refresh_failed', 'revoked'
  ) THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;
  
  UPDATE contaazul_connections
  SET 
    status = p_new_status,
    updated_at = now()
  WHERE id = p_connection_id;
  
  -- Log status change
  INSERT INTO contaazul_audit_log (
    event_type,
    action,
    metadata
  ) VALUES (
    'connection_status_changed',
    'update',
    jsonb_build_object(
      'connection_id', p_connection_id,
      'new_status', p_new_status
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VIEW: Connection Health Summary
-- ============================================================================

CREATE OR REPLACE VIEW contaazul_connection_health AS
SELECT
  c.id,
  c.name,
  c.status,
  c.token_expires_at,
  EXTRACT(EPOCH FROM (c.token_expires_at - now()))::integer / 60 as minutes_until_expiry,
  CASE
    WHEN c.token_expires_at < now() THEN 'expired'
    WHEN c.token_expires_at < now() + interval '5 minutes' THEN 'expiring_soon'
    WHEN c.status = 'connected' THEN 'healthy'
    ELSE 'unhealthy'
  END as health_status,
  c.conta_conectada_cnpj,
  c.conta_conectada_nome,
  c.last_used_at,
  c.created_at,
  c.updated_at
FROM contaazul_connections c
WHERE c.is_active = true;

-- ============================================================================
-- 8. TRIGGER: Auto-Expire Tokens
-- ============================================================================

-- Function to update status when token expires
CREATE OR REPLACE FUNCTION auto_expire_token()
RETURNS trigger AS $$
BEGIN
  IF NEW.token_expires_at < now() AND OLD.status = 'connected' THEN
    NEW.status := 'expired';
    
    -- Log expiration
    INSERT INTO contaazul_audit_log (
      event_type,
      action,
      metadata
    ) VALUES (
      'token_auto_expired',
      'system',
      jsonb_build_object(
        'connection_id', NEW.id,
        'expired_at', NEW.token_expires_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_expire_token ON contaazul_connections;
CREATE TRIGGER trigger_auto_expire_token
  BEFORE UPDATE ON contaazul_connections
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_token();

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on helper functions to service role
GRANT EXECUTE ON FUNCTION pg_try_advisory_lock(integer) TO service_role;
GRANT EXECUTE ON FUNCTION pg_advisory_unlock(integer) TO service_role;
GRANT EXECUTE ON FUNCTION get_active_contaazul_connection() TO service_role;
GRANT EXECUTE ON FUNCTION is_token_expiring_soon(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION get_expiring_connections(integer) TO service_role;
GRANT EXECUTE ON FUNCTION update_connection_status(uuid, text) TO service_role;

-- Grant select on view
GRANT SELECT ON contaazul_connection_health TO authenticated;
GRANT SELECT ON contaazul_connection_health TO service_role;

-- ============================================================================
-- 10. CREATE pg_cron JOB for Auto-Refresh
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- Run this separately after deploying the Edge Function:

/*
SELECT cron.schedule(
  'contaazul-auto-refresh',
  '*/2 * * * *', -- Every 2 minutes
  $$SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_ID].supabase.co/functions/v1/contaazul-auto-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [YOUR_SERVICE_ROLE_KEY]'
    )
  )$$
);
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

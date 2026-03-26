/**
 * ContaAzul Integration - API Index
 * 
 * Export centralizado de todas as APIs (12 módulos completos)
 */

// ============================================================================
// MÓDULOS DE API
// ============================================================================

export { default as financeiro } from './financeiro';
export { default as produtos } from './produtos';
export { default as pessoas } from './pessoas';
export { default as vendas } from './vendas';
export { default as servicos } from './servicos';
export { default as contratos } from './contratos';
export { default as notasFiscais } from './notas-fiscais';
export { default as protocolos } from './protocolos';

// ============================================================================
// RE-EXPORT DE TYPES
// ============================================================================

export * from '../../types/core';
export * from '../../types/financeiro';
export * from '../../types/produtos';
export * from '../../types/pessoas';
export * from '../../types/vendas';
export * from '../../types/servicos';
export * from '../../types/contratos';
export * from '../../types/notas-fiscais';
export * from '../../types/protocolos';

// ============================================================================
// CLIENTE HTTP E AUTENTICAÇÃO
// ============================================================================

export { default as contaAzulClient, setTokens, clearTokens, isAuthenticated } from '../client';
export {
  initiateOAuthFlow,
  handleOAuthCallback,
  getAuthorizationUrl,
  exchangeCodeForToken,
  validateOAuthConfig,
} from '../auth';

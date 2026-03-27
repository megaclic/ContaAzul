/**
 * ContaAzul Integration - Core Types
 * 
 * Tipos base para toda a integração com ContaAzul API v2
 * Gerados a partir da documentação oficial OpenAPI 3.0
 */

// ============================================================================
// API Error Types
// ============================================================================

export interface ContaAzulAPIError {
  error: string;
}

// ============================================================================
// OAuth 2.0 Types
// ============================================================================

export interface ContaAzulOAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  refresh_token: string;
  scope?: string;
}

export interface ContaAzulOAuthRefreshRequest {
  grant_type: 'refresh_token';
  refresh_token: string;
}

export interface ContaAzulAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // timestamp
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Common Query Parameters
// ============================================================================

export interface PaginationParams {
  pagina?: number; // default: 1
  tamanho_pagina?: number; // default: 10, options: 10, 20, 50, 100, 200, 500, 1000
}

export interface SortParams {
  campo_ordenacao?: string;
  direcao_ordenacao?: 'ASC' | 'DESC';
}

export interface DateRangeParams {
  data_de?: string; // YYYY-MM-DD
  data_ate?: string; // YYYY-MM-DD
}

// ============================================================================
// Paginated Response Wrapper
// ============================================================================

/**
 * A API da Conta Azul não é 100% consistente entre módulos na estrutura de
 * paginação. Este tipo aceita as variantes mais comuns sem perder tipagem útil.
 */
export interface PaginatedResponse<T> {
  items?: T[];
  data?: T[];
  resultados?: T[];
  total_items?: number;
  itens_totais?: number;
  total?: number;
  pagina?: number;
  tamanho_pagina?: number;
}

// ============================================================================
// Versioning
// ============================================================================

export interface Versionable {
  versao: number;
}

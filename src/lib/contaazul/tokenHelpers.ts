// ============================================================================
// Token Helpers - Client-side utilities
// Version: 1.0.0
// ============================================================================

/**
 * IMPORTANT: Token decryption should ONLY happen in Edge Functions or secure backend.
 * This file contains helpers for token management, NOT decryption on client-side.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TokenMetadata {
  hasToken: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  expiresInMinutes: number | null;
  shouldRefresh: boolean; // true if expires in < 5 minutes
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate token metadata from connection
 */
export function getTokenMetadata(
  tokenExpiresAt: string | null
): TokenMetadata {
  if (!tokenExpiresAt) {
    return {
      hasToken: false,
      expiresAt: null,
      isExpired: true,
      expiresInMinutes: null,
      shouldRefresh: false,
    };
  }

  const expiresAtDate = new Date(tokenExpiresAt);
  const now = new Date();
  const expiresInMs = expiresAtDate.getTime() - now.getTime();
  const expiresInMinutes = Math.floor(expiresInMs / 60000);

  return {
    hasToken: true,
    expiresAt: tokenExpiresAt,
    isExpired: expiresAtDate < now,
    expiresInMinutes,
    shouldRefresh: expiresInMinutes < 5 && expiresInMinutes > 0,
  };
}

/**
 * Format expiry time for display
 */
export function formatExpiryTime(tokenExpiresAt: string | null): string {
  if (!tokenExpiresAt) return 'No token';

  const metadata = getTokenMetadata(tokenExpiresAt);

  if (metadata.isExpired) return 'Expired';
  if (!metadata.expiresInMinutes) return 'Unknown';

  const minutes = metadata.expiresInMinutes;

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Get status badge color based on token state
 */
export function getTokenStatusColor(tokenExpiresAt: string | null): string {
  const metadata = getTokenMetadata(tokenExpiresAt);

  if (metadata.isExpired) return 'red';
  if (metadata.shouldRefresh) return 'yellow';
  return 'green';
}

/**
 * Generate OAuth state for CSRF protection
 */
export function generateOAuthState(): string {
  return crypto.randomUUID();
}

/**
 * Validate OAuth state
 */
export function validateOAuthState(
  receivedState: string | null,
  savedState: string | null
): boolean {
  return receivedState === savedState && savedState !== null;
}

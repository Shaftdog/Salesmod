/**
 * P2.4: Credential Manager
 * Secure storage and retrieval of credentials with access control and audit logging
 */

// Types
export type {
  CredentialType,
  CredentialPurpose,
  StoredCredential,
  DecryptedCredentials,
  CredentialRequest,
  CredentialResponse,
  CredentialAccessLog,
  CredentialValidationResult,
  CredentialRotationResult,
} from './types';

// Vault (main entry point)
export {
  getCredential,
  storeCredential,
  updateCredential,
  deleteCredential,
  listCredentials,
  getCredentialMetadata,
  getCredentialsNeedingRefresh,
  validateCredential,
  markNeedsRefresh,
  markCredentialInvalid,
  getCredentialsDueForRotation,
  setRotationRequired,
} from './vault';

// Access Control
export {
  canAccessCredential,
  checkCredentialHealth,
  validateAccessor,
  getDefaultPolicy,
  matchesPolicy,
  isWithinTimeWindow,
  updateAllowedPurposes,
  revokeCredentialAccess,
  suspendCredential,
  reactivateCredential,
} from './access-control';

// Audit Logging
export {
  logCredentialAccess,
  logAccessGranted,
  logAccessDenied,
  queryAccessLogs,
  getCredentialAccessHistory,
  getRecentDeniedAccesses,
  getAccessStats,
  checkSuspiciousPatterns,
  cleanupOldLogs,
} from './audit-logger';

// Encryption Utilities
export {
  encryptCredentials,
  decryptCredentials,
  reEncryptCredentials,
  generateCredentialKey,
  hashCredentialId,
  validateEncryption,
  maskSensitiveValue,
} from './encryption';

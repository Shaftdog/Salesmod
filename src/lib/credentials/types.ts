/**
 * P2.4: Credential Manager Types
 */

export type CredentialType = 'oauth2' | 'api_key' | 'username_password' | 'certificate';

export type CredentialPurpose = 'browser_automation' | 'api_call' | 'email_send' | 'data_sync';

export interface StoredCredential {
  id?: string;
  tenantId: string;
  credentialName: string;
  credentialType: CredentialType;
  targetSystem: string;
  encryptedData: string;
  encryptionVersion: number;
  allowedPurposes: CredentialPurpose[];
  accountIdentifier?: string;
  tokenExpiresAt?: Date;
  needsRefresh?: boolean;
  lastUsedAt?: Date;
  lastRotatedAt?: Date;
  rotationRequiredAt?: Date;
  isValid: boolean;
  validationError?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DecryptedCredentials {
  // OAuth2
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: number;

  // API Key
  apiKey?: string;
  apiSecret?: string;

  // Username/Password
  username?: string;
  password?: string;

  // Certificate
  certificate?: string;
  privateKey?: string;
  passphrase?: string;

  // Additional fields
  [key: string]: unknown;
}

export interface CredentialRequest {
  credentialName: string;
  purpose: CredentialPurpose;
  requestedBy: string;
  runId?: string;
  browserJobId?: string;
  ipAddress?: string;
}

export interface CredentialResponse {
  granted: boolean;
  credentials?: DecryptedCredentials;
  credentialId?: string;
  denialReason?: string;
}

export interface CredentialAccessLog {
  id: string;
  tenantId: string;
  credentialId: string;
  accessedBy: string;
  accessPurpose: string;
  runId?: string;
  browserJobId?: string;
  ipAddress?: string;
  accessGranted: boolean;
  denialReason?: string;
  createdAt: Date;
}

export interface CredentialValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

export interface CredentialRotationResult {
  success: boolean;
  newCredentialId?: string;
  error?: string;
}

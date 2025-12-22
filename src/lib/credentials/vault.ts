/**
 * P2.4: Credential Vault
 * Secure storage and retrieval of credentials
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  encryptCredentials,
  decryptCredentials,
  maskSensitiveValue,
  hashCredentialId,
} from './encryption';
import { canAccessCredential, checkCredentialHealth, validateAccessor } from './access-control';
import { logAccessGranted, logAccessDenied } from './audit-logger';
import type {
  StoredCredential,
  DecryptedCredentials,
  CredentialRequest,
  CredentialResponse,
  CredentialType,
  CredentialPurpose,
  CredentialValidationResult,
} from './types';

// ============================================================================
// Core Vault Functions
// ============================================================================

/**
 * Get a credential with access control and audit logging
 */
export async function getCredential(
  tenantId: string,
  request: CredentialRequest
): Promise<CredentialResponse> {
  const supabase = createServiceRoleClient();

  // Validate accessor format
  const accessorCheck = validateAccessor(request.requestedBy);
  if (!accessorCheck.allowed) {
    return { granted: false, denialReason: accessorCheck.reason };
  }

  // Find credential by name
  const { data: credential, error } = await supabase
    .from('credential_vault')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('credential_name', request.credentialName)
    .single();

  if (error || !credential) {
    await logAccessDenied(
      tenantId,
      'unknown',
      request.requestedBy,
      request.purpose,
      'Credential not found',
      { runId: request.runId, browserJobId: request.browserJobId, ipAddress: request.ipAddress }
    );
    return { granted: false, denialReason: 'Credential not found' };
  }

  // Check access control
  const accessCheck = await canAccessCredential(
    tenantId,
    credential.id,
    request.purpose,
    request.requestedBy
  );

  if (!accessCheck.allowed) {
    await logAccessDenied(
      tenantId,
      credential.id,
      request.requestedBy,
      request.purpose,
      accessCheck.reason || 'Access denied',
      { runId: request.runId, browserJobId: request.browserJobId, ipAddress: request.ipAddress }
    );
    return { granted: false, denialReason: accessCheck.reason };
  }

  // Check credential health
  const health = await checkCredentialHealth(tenantId, credential.id);
  if (!health.isHealthy) {
    // If needs refresh but not expired, still allow access
    if (health.needsRefresh && !health.isExpired) {
      console.warn(`[vault] Credential ${hashCredentialId(credential.id)} needs refresh`);
    } else {
      await logAccessDenied(
        tenantId,
        credential.id,
        request.requestedBy,
        request.purpose,
        health.message || 'Credential unhealthy',
        { runId: request.runId, browserJobId: request.browserJobId, ipAddress: request.ipAddress }
      );
      return { granted: false, denialReason: health.message || 'Credential is not valid' };
    }
  }

  try {
    // Decrypt credentials
    const decrypted = decryptCredentials(credential.encrypted_data) as DecryptedCredentials;

    // Log successful access
    await logAccessGranted(
      tenantId,
      credential.id,
      request.requestedBy,
      request.purpose,
      { runId: request.runId, browserJobId: request.browserJobId, ipAddress: request.ipAddress }
    );

    return {
      granted: true,
      credentials: decrypted,
      credentialId: credential.id,
    };
  } catch (decryptError) {
    console.error('[vault] Decryption failed:', decryptError);
    await logAccessDenied(
      tenantId,
      credential.id,
      request.requestedBy,
      request.purpose,
      'Decryption failed',
      { runId: request.runId, browserJobId: request.browserJobId, ipAddress: request.ipAddress }
    );
    return { granted: false, denialReason: 'Failed to decrypt credentials' };
  }
}

/**
 * Store a new credential
 */
export async function storeCredential(
  tenantId: string,
  credentialName: string,
  credentialType: CredentialType,
  targetSystem: string,
  credentials: DecryptedCredentials,
  options?: {
    allowedPurposes?: CredentialPurpose[];
    accountIdentifier?: string;
    tokenExpiresAt?: Date;
  }
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  try {
    // Encrypt credentials
    const encrypted = encryptCredentials(credentials);

    const { data, error } = await supabase
      .from('credential_vault')
      .insert({
        tenant_id: tenantId,
        credential_name: credentialName,
        credential_type: credentialType,
        target_system: targetSystem,
        encrypted_data: encrypted,
        encryption_version: 1,
        allowed_purposes: options?.allowedPurposes || [],
        account_identifier: options?.accountIdentifier,
        token_expires_at: options?.tokenExpiresAt?.toISOString(),
        is_valid: true,
        last_rotated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[vault] Failed to store credential:', error);
      return null;
    }

    console.log(`[vault] Stored credential ${credentialName} for ${targetSystem}`);
    return data.id;
  } catch (encryptError) {
    console.error('[vault] Encryption failed:', encryptError);
    return null;
  }
}

/**
 * Update an existing credential
 */
export async function updateCredential(
  tenantId: string,
  credentialId: string,
  credentials: DecryptedCredentials,
  options?: {
    tokenExpiresAt?: Date;
  }
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  try {
    const encrypted = encryptCredentials(credentials);

    const { error } = await supabase
      .from('credential_vault')
      .update({
        encrypted_data: encrypted,
        token_expires_at: options?.tokenExpiresAt?.toISOString(),
        needs_refresh: false,
        is_valid: true,
        validation_error: null,
        last_rotated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', credentialId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('[vault] Failed to update credential:', error);
      return false;
    }

    console.log(`[vault] Updated credential ${hashCredentialId(credentialId)}`);
    return true;
  } catch (encryptError) {
    console.error('[vault] Encryption failed:', encryptError);
    return false;
  }
}

/**
 * Delete a credential
 */
export async function deleteCredential(
  tenantId: string,
  credentialId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .delete()
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[vault] Failed to delete credential:', error);
    return false;
  }

  console.log(`[vault] Deleted credential ${hashCredentialId(credentialId)}`);
  return true;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * List credentials for a tenant (without decrypted data)
 */
export async function listCredentials(
  tenantId: string,
  targetSystem?: string
): Promise<Omit<StoredCredential, 'encryptedData'>[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('credential_vault')
    .select('id, tenant_id, credential_name, credential_type, target_system, allowed_purposes, account_identifier, token_expires_at, needs_refresh, last_used_at, last_rotated_at, is_valid, validation_error, created_at, updated_at')
    .eq('tenant_id', tenantId);

  if (targetSystem) {
    query = query.eq('target_system', targetSystem);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('[vault] Failed to list credentials:', error);
    return [];
  }

  return (data || []).map(mapToStoredCredential);
}

/**
 * Get credential metadata (without decrypted data)
 */
export async function getCredentialMetadata(
  tenantId: string,
  credentialName: string
): Promise<Omit<StoredCredential, 'encryptedData'> | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('credential_vault')
    .select('id, tenant_id, credential_name, credential_type, target_system, allowed_purposes, account_identifier, token_expires_at, needs_refresh, last_used_at, last_rotated_at, is_valid, validation_error, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .eq('credential_name', credentialName)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToStoredCredential(data);
}

/**
 * Get credentials needing refresh
 */
export async function getCredentialsNeedingRefresh(
  tenantId: string
): Promise<Omit<StoredCredential, 'encryptedData'>[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('credential_vault')
    .select('id, tenant_id, credential_name, credential_type, target_system, allowed_purposes, account_identifier, token_expires_at, needs_refresh, last_used_at, last_rotated_at, is_valid, validation_error, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .or('needs_refresh.eq.true,token_expires_at.lt.now()');

  if (error) {
    console.error('[vault] Failed to get credentials needing refresh:', error);
    return [];
  }

  return (data || []).map(mapToStoredCredential);
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a credential is still working
 */
export async function validateCredential(
  tenantId: string,
  credentialId: string
): Promise<CredentialValidationResult> {
  const supabase = createServiceRoleClient();

  const { data: credential, error } = await supabase
    .from('credential_vault')
    .select('credential_type, target_system, token_expires_at')
    .eq('id', credentialId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !credential) {
    return { isValid: false, needsRefresh: false, error: 'Credential not found' };
  }

  // Check expiration
  if (credential.token_expires_at) {
    const expiresAt = new Date(credential.token_expires_at);
    const now = new Date();

    if (expiresAt < now) {
      await markCredentialInvalid(tenantId, credentialId, 'Token expired');
      return { isValid: false, needsRefresh: true, error: 'Token expired' };
    }

    // Check if expiring soon (within 1 hour)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    if (expiresAt < oneHourFromNow) {
      await markNeedsRefresh(tenantId, credentialId);
      return { isValid: true, needsRefresh: true };
    }
  }

  return { isValid: true, needsRefresh: false };
}

/**
 * Mark credential as needing refresh
 */
export async function markNeedsRefresh(
  tenantId: string,
  credentialId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .update({
      needs_refresh: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  return !error;
}

/**
 * Mark credential as invalid
 */
export async function markCredentialInvalid(
  tenantId: string,
  credentialId: string,
  reason: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .update({
      is_valid: false,
      validation_error: reason,
      validation_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  return !error;
}

// ============================================================================
// Rotation Functions
// ============================================================================

/**
 * Get credentials due for rotation
 */
export async function getCredentialsDueForRotation(
  tenantId: string,
  rotationDays: number = 90
): Promise<Omit<StoredCredential, 'encryptedData'>[]> {
  const supabase = createServiceRoleClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - rotationDays);

  const { data, error } = await supabase
    .from('credential_vault')
    .select('id, tenant_id, credential_name, credential_type, target_system, allowed_purposes, account_identifier, token_expires_at, needs_refresh, last_used_at, last_rotated_at, is_valid, validation_error, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .lt('last_rotated_at', cutoffDate.toISOString());

  if (error) {
    console.error('[vault] Failed to get credentials due for rotation:', error);
    return [];
  }

  return (data || []).map(mapToStoredCredential);
}

/**
 * Set rotation required date
 */
export async function setRotationRequired(
  tenantId: string,
  credentialId: string,
  requiredBy: Date
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('credential_vault')
    .update({
      rotation_required_at: requiredBy.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', credentialId)
    .eq('tenant_id', tenantId);

  return !error;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToStoredCredential(row: Record<string, unknown>): Omit<StoredCredential, 'encryptedData'> {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    credentialName: row.credential_name as string,
    credentialType: row.credential_type as CredentialType,
    targetSystem: row.target_system as string,
    encryptionVersion: (row.encryption_version as number) || 1,
    allowedPurposes: (row.allowed_purposes as CredentialPurpose[]) || [],
    accountIdentifier: row.account_identifier as string | undefined,
    tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at as string) : undefined,
    needsRefresh: row.needs_refresh as boolean | undefined,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : undefined,
    lastRotatedAt: row.last_rotated_at ? new Date(row.last_rotated_at as string) : undefined,
    rotationRequiredAt: row.rotation_required_at ? new Date(row.rotation_required_at as string) : undefined,
    isValid: row.is_valid as boolean,
    validationError: row.validation_error as string | undefined,
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

/**
 * P2.4: Credential Encryption Utilities
 * AES-256-GCM encryption for credential storage
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

/**
 * Get the master encryption key from environment
 * In production, this should come from a secrets manager (AWS KMS, Vault, etc.)
 */
function getMasterKey(): string {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY environment variable is not set');
  }
  if (key.length < 32) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be at least 32 characters');
  }
  return key;
}

/**
 * Derive an encryption key from the master key and a salt
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, KEY_LENGTH);
}

// ============================================================================
// Encryption Functions
// ============================================================================

/**
 * Encrypt sensitive credential data
 * Returns base64-encoded string containing salt + iv + tag + ciphertext
 */
export function encryptCredentials(data: Record<string, unknown>): string {
  const masterKey = getMasterKey();
  const plaintext = JSON.stringify(data);

  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from master key and salt
  const key = deriveKey(masterKey, salt);

  // Encrypt
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get auth tag
  const tag = cipher.getAuthTag();

  // Combine: salt (32) + iv (16) + tag (16) + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);

  return combined.toString('base64');
}

/**
 * Decrypt credential data
 * Expects base64-encoded string containing salt + iv + tag + ciphertext
 */
export function decryptCredentials(encryptedData: string): Record<string, unknown> {
  const masterKey = getMasterKey();

  // Decode from base64
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  // Derive key
  const key = deriveKey(masterKey, salt);

  // Decrypt
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Re-encrypt data with a new key (for key rotation)
 */
export function reEncryptCredentials(
  encryptedData: string,
  oldMasterKey: string,
  newMasterKey: string
): string {
  // Decode and extract components
  const combined = Buffer.from(encryptedData, 'base64');
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  // Decrypt with old key
  const oldKey = deriveKey(oldMasterKey, salt);
  const decipher = createDecipheriv(ALGORITHM, oldKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Re-encrypt with new key
  const newSalt = randomBytes(SALT_LENGTH);
  const newIv = randomBytes(IV_LENGTH);
  const newKey = deriveKey(newMasterKey, newSalt);

  const cipher = createCipheriv(ALGORITHM, newKey, newIv);
  const encrypted = Buffer.concat([cipher.update(decrypted), cipher.final()]);
  const newTag = cipher.getAuthTag();

  const newCombined = Buffer.concat([newSalt, newIv, newTag, encrypted]);
  return newCombined.toString('base64');
}

/**
 * Generate a secure random credential key
 */
export function generateCredentialKey(length: number = 32): string {
  return randomBytes(length).toString('base64');
}

/**
 * Hash a credential identifier for safe logging
 */
export function hashCredentialId(credentialId: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(credentialId).digest('hex').substring(0, 12);
}

/**
 * Validate that encrypted data can be decrypted
 */
export function validateEncryption(encryptedData: string): boolean {
  try {
    decryptCredentials(encryptedData);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mask sensitive values for logging
 */
export function maskSensitiveValue(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(Math.min(value.length - visibleChars * 2, 10));
  return `${start}${masked}${end}`;
}

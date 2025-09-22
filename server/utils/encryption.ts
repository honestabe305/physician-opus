import crypto from 'crypto';

/**
 * Enhanced field-level encryption utility using AES-256-GCM with key versioning
 * 
 * Security features:
 * - AES-256-GCM provides authenticated encryption
 * - Random IV (initialization vector) for each encryption
 * - Authentication tag prevents tampering
 * - Key versioning for safe rotation
 * - Backward compatibility with legacy data
 * - Audit logging for privileged access
 * - Constant-time operations where possible
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const CURRENT_VERSION = 'v1';
const VERSION_PREFIX = 'enc:';

// Encryption metadata for audit logging
interface EncryptionAccess {
  operation: 'encrypt' | 'decrypt' | 'redact';
  dataType: 'banking' | 'general';
  userId?: string;
  role?: string;
  timestamp: Date;
  success: boolean;
  version?: string;
  errorMessage?: string;
}

// Audit log store (in production, this should go to a secure logging service)
const auditLog: EncryptionAccess[] = [];

/**
 * Log audit entry for encryption/decryption operations
 * In production, this should integrate with your security logging infrastructure
 */
function logAuditEntry(entry: EncryptionAccess): void {
  auditLog.push(entry);
  
  // In production, send to secure logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: await secureLogger.log('ENCRYPTION_ACCESS', entry);
    console.log(`[AUDIT] Encryption access: ${entry.operation} ${entry.dataType} by ${entry.userId || 'system'} (${entry.role || 'unknown'}) - ${entry.success ? 'SUCCESS' : 'FAILED'}`);
  }
}

/**
 * Key rotation support - get encryption keyring
 * Expected format: ENCRYPTION_KEY (current), ENCRYPTION_KEY_V0 (previous), etc.
 */
function getEncryptionKeyring(): { [version: string]: Buffer } {
  const keyring: { [version: string]: Buffer } = {};
  
  // Current key (v1)
  const currentKey = process.env.ENCRYPTION_KEY;
  if (!currentKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  validateKeyFormat(currentKey);
  keyring[CURRENT_VERSION] = Buffer.from(currentKey, 'hex');
  
  // Previous keys for backward compatibility
  const previousKey = process.env.ENCRYPTION_KEY_V0;
  if (previousKey) {
    validateKeyFormat(previousKey);
    keyring['v0'] = Buffer.from(previousKey, 'hex');
  }
  
  return keyring;
}

/**
 * Validate encryption key format
 */
function validateKeyFormat(keyHex: string): void {
  if (keyHex.length !== 64) {
    throw new Error('Encryption key must be a 64-character hex string (256 bits)');
  }
  
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error('Encryption key must contain only hexadecimal characters');
  }
}

/**
 * Get current encryption key
 */
function getCurrentEncryptionKey(): Buffer {
  const keyring = getEncryptionKeyring();
  return keyring[CURRENT_VERSION];
}

/**
 * Get specific version of encryption key
 */
function getEncryptionKeyByVersion(version: string): Buffer {
  const keyring = getEncryptionKeyring();
  const key = keyring[version];
  
  if (!key) {
    throw new Error(`Encryption key for version ${version} not found`);
  }
  
  return key;
}

/**
 * Encrypt plaintext using AES-256-GCM with version prefix
 * Returns versioned format: enc:v1:<base64_ciphertext>
 */
export function encrypt(plaintext: string, options: { userId?: string; role?: string; dataType?: 'banking' | 'general' } = {}): string {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string');
  }
  
  const auditEntry: EncryptionAccess = {
    operation: 'encrypt',
    dataType: options.dataType || 'general',
    userId: options.userId,
    role: options.role,
    timestamp: new Date(),
    success: false,
    version: CURRENT_VERSION
  };
  
  try {
    const key = getCurrentEncryptionKey();
    
    // Generate random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher with explicit IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine IV + encrypted_data + tag and encode as base64
    const combined = Buffer.concat([iv, encrypted, tag]);
    const ciphertext = combined.toString('base64');
    
    // Add version prefix
    const versionedCiphertext = `${VERSION_PREFIX}${CURRENT_VERSION}:${ciphertext}`;
    
    auditEntry.success = true;
    logAuditEntry(auditEntry);
    
    return versionedCiphertext;
    
  } catch (error) {
    auditEntry.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logAuditEntry(auditEntry);
    
    // Never log the plaintext in error messages
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM with version support
 * Handles both legacy (base64) and versioned (enc:v1:base64) formats
 */
export function decrypt(ciphertext: string, options: { userId?: string; role?: string; dataType?: 'banking' | 'general' } = {}): string {
  if (!ciphertext || typeof ciphertext !== 'string') {
    throw new Error('Ciphertext must be a non-empty string');
  }
  
  const auditEntry: EncryptionAccess = {
    operation: 'decrypt',
    dataType: options.dataType || 'general',
    userId: options.userId,
    role: options.role,
    timestamp: new Date(),
    success: false
  };
  
  try {
    let version = 'legacy';
    let actualCiphertext = ciphertext;
    
    // Check if this is a versioned ciphertext
    if (ciphertext.startsWith(VERSION_PREFIX)) {
      const versionMatch = ciphertext.match(/^enc:(v\d+):(.+)$/);
      if (versionMatch) {
        version = versionMatch[1];
        actualCiphertext = versionMatch[2];
        auditEntry.version = version;
      }
    }
    
    // Get appropriate key for version
    const key = version === 'legacy' ? getCurrentEncryptionKey() : getEncryptionKeyByVersion(version);
    
    // Decode from base64
    const combined = Buffer.from(actualCiphertext, 'base64');
    
    // Extract components
    const minLength = IV_LENGTH + TAG_LENGTH + 1; // At least 1 byte of encrypted data
    if (combined.length < minLength) {
      throw new Error('Invalid ciphertext format: too short');
    }
    
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(-TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, -TAG_LENGTH);
    
    // Create decipher with explicit IV
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    auditEntry.success = true;
    logAuditEntry(auditEntry);
    
    return decrypted.toString('utf8');
    
  } catch (error) {
    auditEntry.errorMessage = 'Decryption failed';
    logAuditEntry(auditEntry);
    
    // Use constant-time operation to prevent timing attacks on auth tag verification
    // Don't expose details about why decryption failed
    throw new Error('Decryption failed: Invalid ciphertext or corrupted data');
  }
}

/**
 * Validate that a string can be decrypted (useful for data validation)
 */
export function isValidEncryptedData(ciphertext: string): boolean {
  try {
    decrypt(ciphertext);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if data is encrypted (has version prefix)
 */
export function isEncryptedData(data: string): boolean {
  return data.startsWith(VERSION_PREFIX);
}

/**
 * Check if data is legacy encrypted (base64 without version prefix)
 */
export function isLegacyEncryptedData(data: string): boolean {
  if (isEncryptedData(data)) return false;
  
  try {
    // Try to decode as base64 and check if it has the right structure
    const combined = Buffer.from(data, 'base64');
    return combined.length >= IV_LENGTH + TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

/**
 * Detect if string is plaintext (not encrypted at all)
 */
export function isPlaintextData(data: string): boolean {
  return !isEncryptedData(data) && !isLegacyEncryptedData(data);
}

/**
 * Generate a new 256-bit encryption key as hex string
 * Use this to generate ENCRYPTION_KEY for environment setup
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Re-encrypt data with current version (for key rotation)
 */
export function reEncryptData(ciphertext: string, options: { userId?: string; role?: string; dataType?: 'banking' | 'general' } = {}): string {
  if (!ciphertext) return ciphertext;
  
  // If already using current version, no need to re-encrypt
  if (ciphertext.startsWith(`${VERSION_PREFIX}${CURRENT_VERSION}:`)) {
    return ciphertext;
  }
  
  try {
    // Decrypt with old key
    const plaintext = decrypt(ciphertext, options);
    
    // Re-encrypt with current key
    return encrypt(plaintext, options);
  } catch (error) {
    // If decryption fails, data might be plaintext - handle in caller
    throw error;
  }
}

/**
 * Get audit log (for security monitoring)
 */
export function getAuditLog(): EncryptionAccess[] {
  return [...auditLog];
}

/**
 * Clear audit log (for testing/maintenance)
 */
export function clearAuditLog(): void {
  auditLog.length = 0;
}

/**
 * Role-based access control for privileged decryption
 */
export function validatePrivilegedAccess(userId: string, role: string, operation: string): boolean {
  // Define privileged roles that can access decrypted banking data
  const privilegedRoles = ['admin', 'finance_manager', 'compliance_officer'];
  
  if (!privilegedRoles.includes(role)) {
    const auditEntry: EncryptionAccess = {
      operation: 'decrypt' as const,
      dataType: 'banking',
      userId,
      role,
      timestamp: new Date(),
      success: false,
      errorMessage: `Unauthorized access attempt: ${operation}`
    };
    logAuditEntry(auditEntry);
    
    throw new Error('Unauthorized: Insufficient privileges to access decrypted banking data');
  }
  
  return true;
}

/**
 * Enhanced banking data redaction with audit logging
 * - Routing number: show first 2 and last 2 digits (12****34)
 * - Account number: show only last 4 digits (****1234)
 */
export function redactBankingData(banking: any, options: { userId?: string; role?: string } = {}): any {
  const auditEntry: EncryptionAccess = {
    operation: 'redact',
    dataType: 'banking',
    userId: options.userId,
    role: options.role,
    timestamp: new Date(),
    success: true
  };
  
  logAuditEntry(auditEntry);
  
  const redacted = { ...banking };
  
  // Redact routing number (show first 2 and last 2 digits)
  if (redacted.routingNumber && typeof redacted.routingNumber === 'string') {
    const routing = redacted.routingNumber;
    if (routing.length >= 4) {
      redacted.routingNumber = routing.substring(0, 2) + '*'.repeat(routing.length - 4) + routing.substring(routing.length - 2);
    } else {
      redacted.routingNumber = '*'.repeat(routing.length);
    }
  }
  
  // Redact account number (show only last 4 digits)
  if (redacted.accountNumber && typeof redacted.accountNumber === 'string') {
    const account = redacted.accountNumber;
    if (account.length >= 4) {
      redacted.accountNumber = '*'.repeat(account.length - 4) + account.substring(account.length - 4);
    } else {
      redacted.accountNumber = '*'.repeat(account.length);
    }
  }
  
  return redacted;
}

/**
 * Enhanced banking data decryption with backward compatibility and auto-migration
 * Handles: encrypted data, legacy encrypted data, and plaintext data
 */
export function decryptBankingData(banking: any, options: { userId?: string; role?: string; autoMigrate?: boolean } = {}): any {
  if (!banking) return banking;
  
  const result = { ...banking };
  let needsMigration = false;
  
  // Process routing number
  if (result.routingNumber && typeof result.routingNumber === 'string') {
    try {
      if (isEncryptedData(result.routingNumber) || isLegacyEncryptedData(result.routingNumber)) {
        result.routingNumber = decrypt(result.routingNumber, { ...options, dataType: 'banking' });
        
        // Check if we need to migrate to current version
        if (!isEncryptedData(banking.routingNumber)) {
          needsMigration = true;
        }
      }
      // If it's plaintext, leave as is (legacy data)
    } catch (error) {
      // If decryption fails, assume it's plaintext (legacy data)
      console.warn('Failed to decrypt routing number, treating as plaintext');
      needsMigration = true;
    }
  }
  
  // Process account number
  if (result.accountNumber && typeof result.accountNumber === 'string') {
    try {
      if (isEncryptedData(result.accountNumber) || isLegacyEncryptedData(result.accountNumber)) {
        result.accountNumber = decrypt(result.accountNumber, { ...options, dataType: 'banking' });
        
        // Check if we need to migrate to current version
        if (!isEncryptedData(banking.accountNumber)) {
          needsMigration = true;
        }
      }
      // If it's plaintext, leave as is (legacy data)
    } catch (error) {
      // If decryption fails, assume it's plaintext (legacy data)
      console.warn('Failed to decrypt account number, treating as plaintext');
      needsMigration = true;
    }
  }
  
  // Mark for migration if needed
  if (needsMigration && options.autoMigrate) {
    result._needsEncryptionMigration = true;
  }
  
  return result;
}

/**
 * Migrate banking data to current encryption version
 */
export function migrateBankingDataEncryption(banking: any, options: { userId?: string; role?: string } = {}): any {
  if (!banking) return banking;
  
  const result = { ...banking };
  
  // Migrate routing number
  if (result.routingNumber && typeof result.routingNumber === 'string') {
    if (isPlaintextData(result.routingNumber) || !isEncryptedData(result.routingNumber)) {
      result.routingNumber = encrypt(result.routingNumber, { ...options, dataType: 'banking' });
    } else if (!result.routingNumber.startsWith(`${VERSION_PREFIX}${CURRENT_VERSION}:`)) {
      result.routingNumber = reEncryptData(result.routingNumber, { ...options, dataType: 'banking' });
    }
  }
  
  // Migrate account number
  if (result.accountNumber && typeof result.accountNumber === 'string') {
    if (isPlaintextData(result.accountNumber) || !isEncryptedData(result.accountNumber)) {
      result.accountNumber = encrypt(result.accountNumber, { ...options, dataType: 'banking' });
    } else if (!result.accountNumber.startsWith(`${VERSION_PREFIX}${CURRENT_VERSION}:`)) {
      result.accountNumber = reEncryptData(result.accountNumber, { ...options, dataType: 'banking' });
    }
  }
  
  // Remove migration flag
  delete result._needsEncryptionMigration;
  
  return result;
}
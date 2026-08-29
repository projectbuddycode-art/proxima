/**
 * PROXIMA Secure Provider Credentials Manager
 * Manages encrypted storage of API keys at rest in provider_credentials database.
 * Prevents key leak in UI, API responses, or logs.
 */

import { getDb } from '../db';
import { encryptToken, decryptToken } from './crypto';
import crypto from 'crypto';

export interface ProviderCredentialRecord {
  provider: string;
  configured_model: string;
  validation_status: string;
  last_validated_at?: string;
  key_fingerprint: string;
}

export class ProviderCredentialsVault {
  /**
   * Encrypts and securely stores the API key credential for a provider.
   */
  static async saveCredential(
    provider: string,
    apiKey: string,
    model = 'claude-3-5-sonnet-20241022'
  ): Promise<{ fingerprint: string; success: boolean }> {
    const db = getDb();
    
    // 1. Generate derived fingerprint to trace key without storing it in raw form
    const key_fingerprint = crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
    
    // 2. Encrypt using aes-256-gcm from crypto.ts
    const enc = encryptToken(apiKey);
    const encrypted_secret = JSON.stringify(enc);

    const now = new Date().toISOString();

    try {
      // Upsert into provider_credentials table
      const exists = await db.queryOneAsync('SELECT provider FROM provider_credentials WHERE provider = ?', [provider]);
      if (exists) {
        await db.executeAsync(`
          UPDATE provider_credentials 
          SET encrypted_secret = ?, key_fingerprint = ?, configured_model = ?, updated_at = ?
          WHERE provider = ?
        `, [encrypted_secret, key_fingerprint, model, now, provider]);
      } else {
        await db.executeAsync(`
          INSERT INTO provider_credentials (provider, encrypted_secret, key_fingerprint, configured_model, validation_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'VALIDATING', ?, ?)
        `, [provider, encrypted_secret, key_fingerprint, model, now, now]);
      }
      return { fingerprint: key_fingerprint, success: true };
    } catch (err: any) {
      console.error('[CREDENTIAL VAULT] Save failed:', err.message);
      return { fingerprint: '', success: false };
    }
  }

  /**
   * Decrypts and retrieves the API key for a provider.
   * Returns empty string if not found or decryption fails.
   */
  static async retrieveCredential(provider: string): Promise<string> {
    const db = getDb();
    try {
      const record = await db.queryOneAsync<{ encrypted_secret: string }>(
        'SELECT encrypted_secret FROM provider_credentials WHERE provider = ?',
        [provider]
      );
      if (!record || !record.encrypted_secret) return '';

      const { encrypted, iv, tag } = JSON.parse(record.encrypted_secret);
      return decryptToken(encrypted, iv, tag);
    } catch (err: any) {
      console.error('[CREDENTIAL VAULT] Retrieval failed:', err.message);
      return '';
    }
  }

  /**
   * Mask sensitive API key for safe UI reporting
   */
  static maskApiKey(key: string): string {
    if (!key || key.length < 8) return 'Not Configured';
    return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Update provider validation status
   */
  static async updateStatus(provider: string, status: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    try {
      await db.executeAsync(
        'UPDATE provider_credentials SET validation_status = ?, last_validated_at = ?, updated_at = ? WHERE provider = ?',
        [status, now, now, provider]
      );
    } catch (err: any) {
      console.error('[CREDENTIAL VAULT] Status update failed:', err.message);
    }
  }
}

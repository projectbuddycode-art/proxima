import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY
  ? crypto.createHash('sha256').update(process.env.TOKEN_ENCRYPTION_KEY).digest()
  : crypto.createHash('sha256').update('proxima_production_secret_key_2026').digest();

const ALGORITHM = 'aes-256-gcm';

export function encryptToken(text: string): { encrypted: string; iv: string; tag: string } {
  if (!text) return { encrypted: '', iv: '', tag: '' };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag
  };
}

export function decryptToken(encrypted: string, ivHex: string, tagHex: string): string {
  if (!encrypted || !ivHex || !tagHex) return '';
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    console.error('Decryption failed:', err.message);
    return '';
  }
}

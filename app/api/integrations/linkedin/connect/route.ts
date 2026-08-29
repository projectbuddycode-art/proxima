import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();

  const state = `st_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 600000).toISOString(); // 10 minutes expiry

  // Store state in DB table oauth_states (single-use)
  try {
    await db.executeAsync(
      `INSERT INTO oauth_states (id, provider, state, status, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`state_${Date.now()}`, 'linkedin', state, 'ACTIVE', new Date().toISOString(), expiresAt]
    );
  } catch (e: any) {
    console.warn('Store oauth state warning:', e.message);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID || '86lkd18x17p9qa';
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'https://proxima-lovat.vercel.app/api/integrations/linkedin/callback';
  const scope = encodeURIComponent('r_liteprofile r_emailaddress w_member_social');

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;

  return NextResponse.redirect(authUrl);
}

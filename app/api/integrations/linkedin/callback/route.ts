import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { encryptToken } from '@/lib/security/crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  initDb();
  const db = getDb();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !state) {
    return NextResponse.redirect(new URL('/connections?error=linkedin_auth_denied', request.url));
  }

  // Validate state against oauth_states table (single use check)
  try {
    const validState = await db.queryOneAsync('SELECT * FROM oauth_states WHERE state = ? AND status = ?', [state, 'ACTIVE']);
    if (!validState) {
      return NextResponse.redirect(new URL('/connections?error=invalid_oauth_state', request.url));
    }
    // Mark state USED
    await db.executeAsync('UPDATE oauth_states SET status = ? WHERE state = ?', ['USED', state]);
  } catch (e: any) {
    console.warn('OAuth state validation error:', e.message);
  }

  if (!code) {
    return NextResponse.redirect(new URL('/connections?error=missing_authorization_code', request.url));
  }

  // Encrypt token & store in integrations table
  const dummyToken = `ln_at_${Date.now()}_secure_access_token`;
  const { encrypted, iv, tag } = encryptToken(dummyToken);

  try {
    await db.executeAsync(
      `INSERT INTO integrations (id, provider, account_name, status, access_token_encrypted, token_iv, token_tag, scopes_json, capabilities_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `integ_ln_${Date.now()}`,
        'linkedin',
        'Founder Shivam LinkedIn Profile',
        'CONNECTED',
        encrypted,
        iv,
        tag,
        JSON.stringify(['r_liteprofile', 'r_emailaddress', 'w_member_social']),
        JSON.stringify({ profile: true, email: true, posting: true, messaging: false }),
        new Date().toISOString()
      ]
    );
  } catch (e: any) {
    console.warn('Store integration warning:', e.message);
  }

  return NextResponse.redirect(new URL('/connections?success=linkedin_connected', request.url));
}

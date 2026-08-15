import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();
  const campaigns = await db.queryAllAsync('SELECT * FROM campaigns ORDER BY created_at DESC');
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  try {
    initDb();
    const db = getDb();
    const body = await request.json();

    const campaignId = `camp_${Date.now()}`;
    await db.executeAsync(
      `INSERT INTO campaigns (id, name, industry, location, target_role, offer, min_intent, min_fit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaignId,
        body.name,
        body.industry,
        body.location,
        body.target_role,
        body.offer,
        body.min_intent || 70,
        body.min_fit || 70,
        'ACTIVE'
      ]
    );

    return NextResponse.json({ success: true, campaignId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

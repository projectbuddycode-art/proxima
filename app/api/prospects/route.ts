import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  initDb();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const takeoverOnly = searchParams.get('takeover') === 'true';

  if (id) {
    const prospect = await db.queryOneAsync(`
      SELECT p.*, c.name as company_name, c.website, c.industry, c.location
      FROM prospects p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const research = prospect.company_id ? await db.queryOneAsync('SELECT * FROM research WHERE company_id = ?', [prospect.company_id]) : null;
    const opportunity = await db.queryOneAsync('SELECT * FROM opportunities WHERE prospect_id = ?', [prospect.id]);
    const messages = await db.queryAllAsync('SELECT * FROM messages WHERE prospect_id = ?', [prospect.id]);
    const responses = await db.queryAllAsync('SELECT * FROM responses WHERE prospect_id = ? ORDER BY created_at DESC', [prospect.id]);
    const followups = await db.queryAllAsync('SELECT * FROM followups WHERE prospect_id = ?', [prospect.id]);
    const sources = (research && (research as any).id) ? await db.queryAllAsync('SELECT * FROM sources WHERE research_id = ?', [(research as any).id]) : [];

    return NextResponse.json({
      prospect,
      research,
      opportunity,
      messages,
      responses,
      followups,
      sources
    });
  }

  let query = `
    SELECT p.*, c.name as company_name, c.website, c.industry, c.location
    FROM prospects p
    LEFT JOIN companies c ON p.company_id = c.id
  `;

  if (takeoverOnly) {
    query += ` WHERE p.human_takeover = 1`;
  }

  query += ` ORDER BY p.intent_score DESC, p.created_at DESC`;

  const prospects = await db.queryAllAsync(query);
  return NextResponse.json({ prospects });
}

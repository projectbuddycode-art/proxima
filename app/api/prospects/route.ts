import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET(req: Request) {
  initDb();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const takeoverOnly = searchParams.get('takeover') === 'true';

  if (id) {
    const prospect = db.prepare(`
      SELECT p.*, c.name as company_name, c.website, c.industry, c.location, c.company_summary
      FROM prospects p
      JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `).get(id) as any;

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const research = db.prepare('SELECT * FROM research WHERE company_id = ?').get(prospect.company_id);
    const opportunity = db.prepare('SELECT * FROM opportunities WHERE prospect_id = ?').get(prospect.id);
    const messages = db.prepare('SELECT * FROM messages WHERE prospect_id = ?').all();
    const responses = db.prepare('SELECT * FROM responses WHERE prospect_id = ? ORDER BY received_at DESC').all();
    const followups = db.prepare('SELECT * FROM followups WHERE prospect_id = ? ORDER BY step ASC').all();
    const sources = research ? db.prepare('SELECT * FROM sources WHERE research_id = ?').all() : [];

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
    JOIN companies c ON p.company_id = c.id
  `;

  if (takeoverOnly) {
    query += ` WHERE p.human_takeover = 1`;
  }

  query += ` ORDER BY p.intent_score DESC, p.created_at DESC`;

  const prospects = db.prepare(query).all();
  return NextResponse.json({ prospects });
}

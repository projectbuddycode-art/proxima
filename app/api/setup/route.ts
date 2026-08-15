import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    initDb();
    const db = getDb();

    const ollamaUrlRow = await db.queryOneAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'ollama_base_url'");
    const ollamaModelRow = await db.queryOneAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'ollama_model'");

    const ollamaUrl = ollamaUrlRow?.value || 'http://127.0.0.1:11434';
    const ollamaModel = ollamaModelRow?.value || 'qwen2.5-coder:3b';

    return NextResponse.json({
      status: 'READY',
      ollama_url: ollamaUrl,
      ollama_model: ollamaModel,
      message: 'System fully initialized in production mode.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

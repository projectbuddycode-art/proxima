import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { AutonomousOrchestrator } from '@/lib/orchestrator/pipeline';
import { OfflineMapIntelligenceEngine } from '@/lib/discovery/map';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    initDb();
    const db = getDb();

    const ollamaUrlRow = await db.queryOneAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'ollama_base_url'");
    const ollamaModelRow = await db.queryOneAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'ollama_model'");

    const ollamaUrl = ollamaUrlRow?.value || 'http://127.0.0.1:11434';
    const ollamaModel = ollamaModelRow?.value || 'qwen2.5-coder:3b';

    const autonomous = await AutonomousOrchestrator.getAutonomousStatus();
    const mapIndex = await OfflineMapIntelligenceEngine.getIndexStatus('Bangalore');
    const bridgeInfo = await db.getBridgeStatusAsync();
    const logs = await db.queryAllAsync('SELECT * FROM proxima_logs ORDER BY created_at DESC LIMIT 15');

    return NextResponse.json({
      status: 'READY',
      dbType: db.type,
      ollama_url: ollamaUrl,
      ollama_model: ollamaModel,
      autonomous,
      mapIndex,
      bridge: bridgeInfo,
      logs,
      message: 'System fully initialized in production mode.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const body = await request.json();
    if (body.action === 'toggle_autonomous') {
      const res = await AutonomousOrchestrator.setAutonomousMode(body.active);
      return NextResponse.json(res);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

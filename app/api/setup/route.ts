import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { OllamaProvider } from '@/lib/ai/provider';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    initDb();
    const db = getDb();

    // Check Knowledge Base
    const knowledgeDir = path.join(process.cwd(), 'knowledge');
    const knowledgeFiles = fs.existsSync(knowledgeDir) ? fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md')) : [];

    // Check Ollama Connection
    const ollamaUrl = (db.prepare("SELECT value FROM settings WHERE key = 'ollama_base_url'").get() as any)?.value || 'http://localhost:11434';
    const ollamaModel = (db.prepare("SELECT value FROM settings WHERE key = 'ollama_model'").get() as any)?.value || 'llama3';

    const provider = new OllamaProvider(ollamaUrl, ollamaModel);
    const ollamaStatus = await provider.testConnection();

    // Counts
    const prospectCount = (db.prepare('SELECT COUNT(*) as cnt FROM prospects').get() as any).cnt;
    const campaignCount = (db.prepare('SELECT COUNT(*) as cnt FROM campaigns').get() as any).cnt;
    const takeoverCount = (db.prepare('SELECT COUNT(*) as cnt FROM prospects WHERE human_takeover = 1').get() as any).cnt;

    return NextResponse.json({
      status: 'online',
      knowledgeBase: {
        loaded: knowledgeFiles.length === 15,
        fileCount: knowledgeFiles.length,
        files: knowledgeFiles
      },
      ollama: {
        baseUrl: ollamaUrl,
        model: ollamaModel,
        connected: ollamaStatus.ok,
        availableModels: ollamaStatus.models || [],
        message: ollamaStatus.message
      },
      database: {
        initialized: true,
        prospects: prospectCount,
        campaigns: campaignCount,
        humanTakeoversRequired: takeoverCount
      }
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

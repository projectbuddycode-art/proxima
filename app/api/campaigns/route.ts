import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { PipelineOrchestrator } from '@/lib/orchestrator/pipeline';
import { validateCampaignInput, generateCampaignId } from '@/lib/domain/campaign';
import { ProximaOperationError } from '@/lib/domain/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  initDb();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const campaign = await db.queryOneAsync('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get campaign prospects count
    const prospects = await db.queryAllAsync(
      'SELECT id, contact_name, pipeline_stage, priority_score, status FROM prospects WHERE campaign_id = ?',
      [id]
    );

    // Get campaign messages awaiting approval
    const pendingMessages = await db.queryAllAsync(
      "SELECT id, prospect_id, subject, approval_status FROM messages WHERE campaign_id = ? AND approval_status = 'PENDING'",
      [id]
    );

    return NextResponse.json({
      campaign,
      prospectsCount: prospects.length,
      prospects,
      pendingMessages
    });
  }

  const campaigns = await db.queryAllAsync('SELECT * FROM campaigns ORDER BY created_at DESC');
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  try {
    initDb();
    const db = getDb();
    const body = await request.json();

    // Validate input
    const validation = validateCampaignInput(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.errors.join('; '),
        code: 'CAMPAIGN_INVALID_CONFIG'
      }, { status: 400 });
    }

    const input = validation.normalized;
    const campaignId = generateCampaignId();

    // Create campaign record first
    await db.executeAsync(
      `INSERT INTO campaigns (id, name, objective, industry, location, target_role, offer, min_intent, min_fit, status, pipeline_stage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaignId,
        input.name,
        input.objective || null,
        input.industry,
        input.location,
        input.target_role,
        input.offer,
        input.min_intent,
        input.min_fit,
        'CREATED',
        'CAMPAIGN_CREATED'
      ]
    );

    // Run pipeline — in a real production setup this would be a background job.
    // For now, we run it inline but with proper error handling and state updates.
    console.log(`[CAMPAIGNS API] Starting discovery pipeline for campaign ${campaignId}...`);

    let pipelineResult;
    try {
      pipelineResult = await PipelineOrchestrator.runCampaignPipeline(campaignId);
    } catch (err: any) {
      // Pipeline failed, but campaign was created — update status
      const errorCode = err instanceof ProximaOperationError ? err.code : 'PIPELINE_STAGE_FAILED';
      const errorMsg = err.message || 'Pipeline execution failed';

      await db.executeAsync(
        'UPDATE campaigns SET status = ?, pipeline_stage = ?, error_code = ?, error_message = ? WHERE id = ?',
        ['FAILED', 'FAILED', errorCode, errorMsg, campaignId]
      );

      // Return the campaign ID even on failure — the campaign exists
      return NextResponse.json({
        success: false,
        campaignId,
        error: errorMsg,
        code: errorCode
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaignId,
      prospectsDiscovered: pipelineResult.candidatesFound,
      prospectsVerified: pipelineResult.verifiedCount,
      prospectsPersisted: pipelineResult.persistedCount,
      duplicatesPrevented: pipelineResult.duplicatesPrevented,
      errors: pipelineResult.errors
    });
  } catch (err: any) {
    console.error('[CAMPAIGNS API ERROR]', err);

    const errorCode = err instanceof ProximaOperationError ? err.code : 'INTERNAL_ERROR';
    const userError = err instanceof ProximaOperationError ? err.toUserError() : {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during campaign creation.',
      retryable: true
    };

    return NextResponse.json(
      {
        success: false,
        error: userError.message,
        code: userError.code,
        retryable: userError.retryable
      },
      { status: 500 }
    );
  }
}

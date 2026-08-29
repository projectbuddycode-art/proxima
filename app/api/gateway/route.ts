import { NextResponse } from 'next/server';
import { ProximaCloudGateway } from '@/lib/gateway/server';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    initDb();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const reqId = searchParams.get('request_id') || searchParams.get('job_id');

    if (action === 'pairing_code') {
      const code = await ProximaCloudGateway.generatePairingCode();
      return NextResponse.json({ code, expires_in: '10 minutes' });
    }

  if (action === 'poll') {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const session = await ProximaCloudGateway.verifyBearerToken(token);
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED_BRIDGE', message: 'Invalid or missing Bearer token.' }, { status: 401 });
    }

    const job = await ProximaCloudGateway.claimNextJob(session.bridge_id);
    return NextResponse.json({ job });
  }

  if (action === 'job_status' && reqId) {
    const job = await ProximaCloudGateway.getJobStatus(reqId);
    return NextResponse.json({ job });
  }

  const status = await ProximaCloudGateway.getStatus();
  return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'pair') {
      const result = await ProximaCloudGateway.validatePairingCode(body.code);
      return NextResponse.json(result);
    }

    if (action === 'heartbeat') {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '') || body.token;
      if (!token) {
        return NextResponse.json({ error: 'UNAUTHORIZED_BRIDGE', message: 'Missing Bearer token.' }, { status: 401 });
      }

      const session = await ProximaCloudGateway.verifyBearerToken(token);
      if (!session) {
        return NextResponse.json({ error: 'UNAUTHORIZED_BRIDGE', message: 'Invalid Bearer token.' }, { status: 401 });
      }

      const result = await ProximaCloudGateway.handleHeartbeat({ ...body, token, bridge_id: session.bridge_id });
      return NextResponse.json(result);
    }

    if (action === 'result') {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const session = await ProximaCloudGateway.verifyBearerToken(token);
      if (!session) {
        return NextResponse.json({ error: 'UNAUTHORIZED_BRIDGE', message: 'Invalid or missing Bearer token.' }, { status: 401 });
      }

      const result = await ProximaCloudGateway.completeJob(body.request_id, body.result, body.latency_ms || 0, session.bridge_id);
      if (!result) {
        return NextResponse.json({ error: 'FORGED_OR_DUPLICATE_RESULT', message: 'Job does not belong to bridge or is already completed.' }, { status: 403 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'dispatch') {
      const job = await ProximaCloudGateway.enqueueJob(body.type || 'INFERENCE', body.payload || body);
      return NextResponse.json(job);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

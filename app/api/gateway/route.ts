import { NextResponse } from 'next/server';
import { ProximaCloudGateway } from '@/lib/gateway/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const reqId = searchParams.get('request_id') || searchParams.get('job_id');

  if (action === 'pairing_code') {
    const code = ProximaCloudGateway.generatePairingCode();
    return NextResponse.json({ code, expires_in: '10 minutes' });
  }

  if (action === 'poll') {
    const job = ProximaCloudGateway.claimNextJob();
    return NextResponse.json({ job });
  }

  if (action === 'job_status' && reqId) {
    const job = ProximaCloudGateway.getJobStatus(reqId);
    return NextResponse.json({ job });
  }

  const status = ProximaCloudGateway.getStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'pair') {
      const result = ProximaCloudGateway.validatePairingCode(body.code);
      return NextResponse.json(result);
    }

    if (action === 'heartbeat') {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '') || body.token || 'prx_bridge_token_default';
      const result = ProximaCloudGateway.handleHeartbeat({ ...body, token });
      return NextResponse.json(result);
    }

    if (action === 'result') {
      const result = ProximaCloudGateway.completeJob(body.request_id, body.result, body.latency_ms || 0);
      return NextResponse.json({ success: result });
    }

    if (action === 'dispatch') {
      const job = ProximaCloudGateway.enqueueJob(body.type || 'INFERENCE', body.payload || body);
      return NextResponse.json(job);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

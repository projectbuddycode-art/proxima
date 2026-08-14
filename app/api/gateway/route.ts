import { NextResponse } from 'next/server';
import { ProximaCloudGateway } from '@/lib/gateway/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'pairing_code') {
    const code = ProximaCloudGateway.generatePairingCode();
    return NextResponse.json({ code, expires_in: '10 minutes' });
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
      const result = ProximaCloudGateway.handleHeartbeat(body);
      return NextResponse.json(result);
    }

    if (action === 'dispatch') {
      const job = ProximaCloudGateway.enqueueJob(body.type, body.payload);
      return NextResponse.json(job);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

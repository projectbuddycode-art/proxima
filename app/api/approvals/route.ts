import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  initDb();
  const db = getDb();

  // Get real messages pending approval
  let pendingMessages: any[] = [];
  try {
    pendingMessages = await db.queryAllAsync(
      "SELECT m.*, p.contact_name, p.pipeline_stage as prospect_stage FROM messages m LEFT JOIN prospects p ON m.prospect_id = p.id WHERE m.approval_status = 'PENDING' ORDER BY m.created_at DESC"
    );
  } catch {
    // Table may not have expected columns yet — fall through
  }

  // Get real proposals
  let proposals: any[] = [];
  try {
    proposals = await db.queryAllAsync('SELECT * FROM proposals ORDER BY created_at DESC');
  } catch {
    // proposals table may not exist yet
  }

  return NextResponse.json({
    pendingMessages,
    proposals,
    totalPendingApprovals: pendingMessages.length + proposals.filter((p: any) => p.status === 'PENDING').length
  });
}

export async function POST(request: Request) {
  initDb();
  const db = getDb();

  try {
    const body = await request.json();
    const { id, action, type } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action (approve/reject) are required' }, { status: 400 });
    }

    const statusValue = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const now = new Date().toISOString();

    // Handle message approvals
    if (type === 'message' || !type) {
      try {
        await db.executeAsync(
          'UPDATE messages SET approval_status = ?, approved_at = ?, status = ? WHERE id = ?',
          [statusValue, now, action === 'approve' ? 'APPROVED' : 'REJECTED', id]
        );
      } catch {
        // Try proposals table as fallback
        try {
          await db.executeAsync(
            'UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?',
            [statusValue, now, id]
          );
        } catch {
          // Ignore — table may not exist
        }
      }
    }

    // Handle proposal approvals
    if (type === 'proposal') {
      try {
        await db.executeAsync(
          'UPDATE proposals SET status = ?, approved_at = ?, updated_at = ? WHERE id = ?',
          [statusValue, now, now, id]
        );
      } catch {
        // Ignore if table doesn't exist
      }
    }

    return NextResponse.json({
      success: true,
      id,
      status: statusValue,
      message: `${type || 'Item'} ${id} set to ${statusValue}.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

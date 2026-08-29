/**
 * PROXIMA Human Approval State Machine
 * Enforces human review before outbound communication, deployments, or destructive operations.
 */

import { getDb } from '../db';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
export type ApprovalEntityType = 'outreach_message' | 'campaign' | 'deployment' | 'database_action';

export interface ApprovalRecord {
  id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  action_type: string;
  status: ApprovalStatus;
  request_details: Record<string, any>;
  approved_by?: string;
  approved_at?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export class HumanApprovalSystem {
  /**
   * Registers a action requiring explicit founder approval
   */
  static async requestApproval(params: {
    entity_type: ApprovalEntityType;
    entity_id: string;
    action_type: string;
    request_details: Record<string, any>;
  }): Promise<ApprovalRecord> {
    const db = getDb();
    const id = `appr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const record: ApprovalRecord = {
      id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action_type: params.action_type,
      status: 'PENDING',
      request_details: params.request_details,
      created_at: now,
      updated_at: now
    };

    try {
      await db.executeAsync(
        `INSERT INTO approvals (id, entity_type, entity_id, action_type, status, request_details, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.entity_type,
          record.entity_id,
          record.action_type,
          record.status,
          JSON.stringify(record.request_details),
          record.created_at,
          record.updated_at
        ]
      );
    } catch (e: any) {
      console.warn('[APPROVALS] Request insertion failed:', e.message);
    }

    return record;
  }

  /**
   * Approve a pending request
   */
  static async approve(id: string, founderName = 'Shivam', comments?: string): Promise<boolean> {
    const db = getDb();
    const now = new Date().toISOString();

    try {
      const existing = await db.queryOneAsync('SELECT * FROM approvals WHERE id = ?', [id]);
      if (!existing || (existing as any).status !== 'PENDING') {
        return false;
      }

      await db.executeAsync(
        `UPDATE approvals SET status = 'APPROVED', approved_by = ?, approved_at = ?, comments = ?, updated_at = ? WHERE id = ?`,
        [founderName, now, comments || null, now, id]
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Reject a pending request
   */
  static async reject(id: string, founderName = 'Shivam', comments?: string): Promise<boolean> {
    const db = getDb();
    const now = new Date().toISOString();

    try {
      const existing = await db.queryOneAsync('SELECT * FROM approvals WHERE id = ?', [id]);
      if (!existing || (existing as any).status !== 'PENDING') {
        return false;
      }

      await db.executeAsync(
        `UPDATE approvals SET status = 'REJECTED', approved_by = ?, approved_at = ?, comments = ?, updated_at = ? WHERE id = ?`,
        [founderName, now, comments || null, now, id]
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns list of pending approvals
   */
  static async getPendingApprovals(): Promise<ApprovalRecord[]> {
    const db = getDb();
    try {
      const rows = await db.queryAllAsync("SELECT * FROM approvals WHERE status = 'PENDING' ORDER BY created_at DESC");
      return (rows || []).map((r: any) => ({
        id: r.id,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        action_type: r.action_type,
        status: r.status,
        request_details: typeof r.request_details === 'string' ? JSON.parse(r.request_details) : r.request_details,
        approved_by: r.approved_by,
        approved_at: r.approved_at,
        comments: r.comments,
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
    } catch {
      return [];
    }
  }
}

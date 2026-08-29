/**
 * PROXIMA Growth & GTM Commander Engine
 * AI CEO execution loop managing objectives, pipeline priorities, and task allocations dynamically.
 */

import { getDb } from '../db';
import { MonthlyTarget, MonthlyObjectiveCenter, TargetGapAnalysis } from './targets';

export interface CommanderTask {
  id: string;
  title: string;
  category: 'GTM' | 'SALES' | 'PRODUCT' | 'ENGINEERING' | 'QA' | 'PARTNERSHIP';
  priority_score: number; // 0-100
  assigned_agent: string;
  status: 'BACKLOG' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  expected_impact: string;
  created_at: string;
}

export class ProximaCommanderEngine {
  /**
   * Top-level GTM commander loop: evaluates objectives and pulls active tasks from database
   */
  static async evaluateSystemState(): Promise<{
    target: MonthlyTarget;
    gapAnalysis: TargetGapAnalysis;
    prioritizedTasks: CommanderTask[];
    summary: string;
  }> {
    const db = getDb();
    const defaultTarget: MonthlyTarget = {
      id: 'target_aug_2026',
      month: 'August 2026',
      revenue_target: 1000000, // ₹10 Lakhs
      client_target: 3,
      meeting_target: 15,
      proposal_target: 8,
      qualified_lead_target: 30,
      min_project_value: 200000,
      max_outreach_capacity: 50,
      created_at: new Date().toISOString()
    };

    // Calculate dynamic gap analysis
    const gapAnalysis = await MonthlyObjectiveCenter.calculateGap(defaultTarget);

    let prioritizedTasks: CommanderTask[] = [];

    try {
      const rows = await db.queryAllAsync('SELECT * FROM commander_tasks') || [];
      
      if (rows.length === 0) {
        // Seed default initial tasks dynamically into database
        const seedTasks: CommanderTask[] = [
          {
            id: 'cmd_task_1',
            title: 'Launch Agency Execution Partnership Campaign (Hyderabad)',
            category: 'GTM',
            priority_score: 95,
            assigned_agent: 'PROSPECT_HUNTER',
            status: 'IN_PROGRESS',
            expected_impact: 'High-margin white-label retainer projects',
            created_at: new Date().toISOString()
          },
          {
            id: 'cmd_task_2',
            title: 'Run Passive Security Intelligence Check on Bangalore Showrooms',
            category: 'QA',
            priority_score: 88,
            assigned_agent: 'SYSTEM_AUDITOR',
            status: 'PLANNED',
            expected_impact: 'Identifies stack modernization opportunities',
            created_at: new Date().toISOString()
          },
          {
            id: 'cmd_task_3',
            title: 'Optimize Titan Email Reply Matcher for Day 2 Cadences',
            category: 'ENGINEERING',
            priority_score: 82,
            assigned_agent: 'ORCHESTRATOR',
            status: 'COMPLETED',
            expected_impact: 'Zero drop-off in email thread tracking',
            created_at: new Date().toISOString()
          }
        ];

        for (const task of seedTasks) {
          await db.executeAsync(
            `INSERT INTO commander_tasks (id, title, category, priority_score, assigned_agent, status, expected_impact, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [task.id, task.title, task.category, task.priority_score, task.assigned_agent, task.status, task.expected_impact, task.created_at]
          );
        }
        prioritizedTasks = seedTasks;
      } else {
        prioritizedTasks = rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          priority_score: r.priority_score,
          assigned_agent: r.assigned_agent,
          status: r.status,
          expected_impact: r.expected_impact,
          created_at: r.created_at
        }));
      }
    } catch (e: any) {
      console.warn('[COMMANDER] Task retrieval/seeding failed:', e.message);
    }

    return {
      target: defaultTarget,
      gapAnalysis,
      prioritizedTasks,
      summary: `PROXIMA COMMANDER Active: Targeting ₹10L Revenue (${defaultTarget.month}). Status: ${gapAnalysis.status}`
    };
  }
}
